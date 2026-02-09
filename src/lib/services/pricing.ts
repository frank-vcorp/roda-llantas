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

  if (!user) {
    // Si no hay usuario, retornamos reglas vacías (o reglas públicas si existieran)
    // para evitar fallos por RLS o acceso no autorizado.
    return [];
  }

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



