/**
 * Server Actions para administración de reglas de precios
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-PRICING-UI
 * @ref context/SPEC-PRICING-ENGINE.md
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PricingRule } from "@/lib/types";

/**
 * Crear una nueva regla de precio
 */
export async function createPricingRule(
  data: Omit<PricingRule, "id" | "profile_id">
): Promise<{ success: boolean; error?: string; rule?: PricingRule }> {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "No autenticado" };
    }

    const { data: rule, error } = await supabase
      .from("pricing_rules")
      .insert([
        {
          profile_id: user.id,
          name: data.name,
          brand_pattern: data.brand_pattern,
          margin_percentage: data.margin_percentage,
          is_active: data.is_active !== false,
          priority: data.priority || 1,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creando regla:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings/pricing");
    return { success: true, rule };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Actualizar una regla de precio
 */
export async function updatePricingRule(
  id: string,
  data: Partial<Omit<PricingRule, "id" | "profile_id">>
): Promise<{ success: boolean; error?: string; rule?: PricingRule }> {
  try {
    const supabase = await createClient();

    const { data: rule, error } = await supabase
      .from("pricing_rules")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando regla:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings/pricing");
    return { success: true, rule };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Eliminar una regla de precio
 */
export async function deletePricingRule(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("pricing_rules").delete().eq("id", id);

    if (error) {
      console.error("Error eliminando regla:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/settings/pricing");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Obtener todas las reglas de precio del usuario
 */
export async function getPricingRules(): Promise<{
  success: boolean;
  error?: string;
  rules?: PricingRule[];
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "No autenticado" };
    }

    const { data: rules, error } = await supabase
      .from("pricing_rules")
      .select("*")
      .eq("profile_id", user.id)
      .order("priority", { ascending: false });

    if (error) {
      console.error("Error obteniendo reglas:", error);
      return { success: false, error: error.message };
    }

    return { success: true, rules };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}
