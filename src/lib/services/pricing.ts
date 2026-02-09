/**
 * Servicio de Precios - Motor de Cálculo
 * Calcula precio de venta basado en reglas de margen dinámicas
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-PRICING-01
 * @ref context/SPEC-PRICING-ENGINE.md
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InventoryItem, PricingRule } from "@/lib/types";

/**
 * Resultado del cálculo de precio con desglose
 */
export interface PriceCalculationResult {
  public_price: number;
  is_manual: boolean;
  rule_applied?: string;
  margin_percentage?: number;
  volume_tiers?: { min_qty: number; price: number; margin: number }[];
}

/**
 * Obtiene todas las reglas de precios activas del usuario
 * 
 * @returns Array de reglas de precios ordenadas por prioridad
 * @id FIX-20260129-04 - Defensivo ante columnas faltantes
 */
export async function getPricingRules(): Promise<PricingRule[]> {
  const supabase = await createClient();

  // FIX-20260207: Manejo de acceso público
  const { data: { user } } = await supabase.auth.getUser();

  // Si NO hay usuario, usar Cliente Admin para saltar RLS y obtener reglas globales
  // Si HAY usuario, usar Cliente Normal
  const client = user ? supabase : createAdminClient();

  // Consulta defensiva: si las columnas is_active/priority no existen,
  // la consulta falla. En ese caso, hacemos fallback a consulta básica.
  try {
    const { data, error } = await client
      .from("pricing_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (error) {
      // Si el error es por columna inexistente, usar fallback
      if (error.code === "42703") {
        console.warn("[getPricingRules] Columnas is_active/priority no existen, usando fallback");
        return await getPricingRulesFallback();
      }
      console.error("[getPricingRules] Error:", error);
      // En vez de throw, retornamos array vacío para no tumbar la página entera
      return [];
    }

    return (data as PricingRule[]) || [];
  } catch (err) {
    console.error("[getPricingRules] Excepción:", err);
    // Intentar fallback como última opción
    return await getPricingRulesFallback();
  }
}

/**
 * Fallback para obtener reglas sin filtrar por is_active/priority
 * Usado cuando las columnas aún no existen en la DB
 */
async function getPricingRulesFallback(): Promise<PricingRule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*");

  if (error) {
    console.error("[getPricingRulesFallback] Error:", error);
    // Retornar array vacío para que el sistema siga funcionando
    return [];
  }

  // Aplicar defaults manualmente
  return (data || []).map(rule => ({
    ...rule,
    is_active: rule.is_active ?? true,
    priority: rule.priority ?? 50,
  })) as PricingRule[];
}

import { calculateItemPrice } from "@/lib/logic/pricing-engine";

/**
 * Encuentra la regla más aplicable para un item (por marca y prioridad)
 * 
 * @param item - Item del inventario
 * @param rules - Array de reglas disponibles
 * @returns Regla aplicable o null si no hay match
 */
function findApplicableRule(
  item: InventoryItem,
  rules: PricingRule[]
): PricingRule | null {
  // Las reglas ya vienen ordenadas por prioridad del servidor
  // Buscar primera regla que coincida con la marca
  for (const rule of rules) {
    if (!rule.brand_pattern || rule.brand_pattern === "*") {
      // Regla por defecto
      return rule;
    }

    // Comparación case-insensitive ILIKE
    const pattern = rule.brand_pattern.toLowerCase();
    const brand = item.brand.toLowerCase();

    if (brand.includes(pattern) || pattern.includes(brand)) {
      return rule;
    }
  }

  return null;
}

/**
 * Calcula el precio público basado en reglas de margen
 * 
 * Jerarquía:
 * 1. Si existe manual_price, retornar ese (OFERTA)
 * 2. Si existe regla para la marca, aplicar su margen
 * 3. Caso contrario, retornar costo (sin margen)
 * 
 * @param item - Item del inventario
 * @param rules - Array de reglas de precios
 * @returns Objeto con precio calculado y metadata
 */
export function calculatePublicPrice(
  item: InventoryItem,
  rules: PricingRule[],
  quantity: number = 1 // FIX-20260204: Soporte para cantidad
): PriceCalculationResult {
  const result = calculateItemPrice(item, rules, quantity);

  return {
    public_price: result.price,
    is_manual: result.method === 'manual',
    rule_applied: result.ruleName,
    margin_percentage: result.margin_percentage,
    volume_tiers: result.volume_tiers
  };
}

/**
 * Extiende items de inventario con precio público calculado
 * 
 * @param items - Array de items del inventario
 * @param rules - Array de reglas de precios
 * @returns Array de items con propiedad _publicPrice
 */
export function enrichInventoryWithPrices(
  items: InventoryItem[],
  rules: PricingRule[]
): any[] {
  return items.map((item) => ({
    ...item,
    _publicPrice: calculatePublicPrice(item, rules),
  }));
}
