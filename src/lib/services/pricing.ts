/**
 * Servicio de Precios - Motor de Cálculo
 * Calcula precio de venta basado en reglas de margen dinámicas
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-PRICING-01
 * @ref context/SPEC-PRICING-ENGINE.md
 */

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { InventoryItem, PricingRule } from "@/lib/types";

// ...

export async function getPricingRules(): Promise<PricingRule[]> {
  // FIX: Usar admin client para que el portal público (anon) pueda leer las reglas
  // y calcular precios correctamente.
  const supabase = await createAdminClient();

  // FIX-20260223: Permitir lectura de reglas para usuarios anonimos (portal publico)
  // de lo contrario, el precio devuelto caía en el fallback de costo = precio.
  const { data: { user } } = await supabase.auth.getUser();

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
  const supabase = await createAdminClient();

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



