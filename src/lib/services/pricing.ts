/**
 * Servicio de Precios - Motor de Cálculo
 * Calcula precio de venta basado en reglas de margen dinámicas
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-PRICING-01
 * @ref context/SPEC-PRICING-ENGINE.md
 */

import { createClient } from "@/lib/supabase/server";
import { InventoryItem, PricingRule } from "@/lib/types";

/**
 * Resultado del cálculo de precio con desglose
 */
export interface PriceCalculationResult {
  public_price: number;
  is_manual: boolean;
  rule_applied?: string;
  margin_percentage?: number;
}

/**
 * Obtiene todas las reglas de precios activas del usuario
 * 
 * @returns Array de reglas de precios ordenadas por prioridad
 * @id FIX-20260129-04 - Defensivo ante columnas faltantes
 */
export async function getPricingRules(): Promise<PricingRule[]> {
  const supabase = await createClient();

  // Consulta defensiva: si las columnas is_active/priority no existen,
  // la consulta falla. En ese caso, hacemos fallback a consulta básica.
  try {
    const { data, error } = await supabase
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
      throw new Error(`Failed to fetch pricing rules: ${error.message}`);
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
  rules: PricingRule[]
): PriceCalculationResult {
  // 1. Precio manual tiene prioridad absoluta
  if (item.manual_price && item.manual_price > 0) {
    return {
      public_price: item.manual_price,
      is_manual: true,
      rule_applied: "OFERTA (Manual)",
    };
  }

  // 2. Buscar regla aplicable por marca
  const applicableRule = findApplicableRule(item, rules);

  if (applicableRule) {
    // FIX REFERENCE: FIX-20260129-06 - Corregido uso de margin_percentage
    // margin_percentage = 30 significa +30% sobre cost_price
    const marginMultiplier = 1 + (applicableRule.margin_percentage / 100);
    const publicPrice = Math.round(item.cost_price * marginMultiplier);

    return {
      public_price: publicPrice,
      is_manual: false,
      rule_applied:
        applicableRule.brand_pattern === "*"
          ? "Regla Global"
          : `Marca: ${applicableRule.brand_pattern}`,
      margin_percentage: applicableRule.margin_percentage,
    };
  }

  // 3. Default: retornar costo sin margen (sin ganancia)
  return {
    public_price: item.cost_price,
    is_manual: false,
    rule_applied: "Sin margen (Costo)",
    margin_percentage: 0,
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
