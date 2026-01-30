/**
 * Server Actions: Configuración de Organización
 *
 * Funciones de servidor para leer y actualizar configuración global
 * de la organización (logo, nombre, dirección, etc.).
 *
 * @id IMPL-20260130-WHITELABEL
 * @author SOFIA - Builder
 * @ref context/SPEC-MOBILE-WHITELABEL.md
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { OrganizationSettings } from "@/lib/types";

/**
 * Obtiene los settings de organización del usuario autenticado
 * @returns OrganizationSettings o null si no existe
 */
export async function getOrganizationSettings(): Promise<OrganizationSettings | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[getOrganizationSettings] No authenticated user");
      return null;
    }

    const { data, error } = await supabase
      .from("organization_settings")
      .select("*")
      // .eq("profile_id", user.id) // DEBY FIX: Allow reading global settings not just own
      .limit(1)
      .single();

    if (error) {
      console.warn("[getOrganizationSettings] Error:", error);
      // Si no existe, retornar settings por defecto
      return {
        id: "",
        profile_id: user.id,
        name: "Roda Llantas",
        address: null,
        phone: null,
        website: null,
        logo_url: null,
        ticket_footer_message: "¡Gracias por su compra!",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data as OrganizationSettings;
  } catch (error) {
    console.error("[getOrganizationSettings] Unexpected error:", error);
    return null;
  }
}

/**
 * Actualiza los settings de organización
 * @param updates - Campos a actualizar
 * @returns Objeto con success/error
 */
export async function updateOrganizationSettings(
  updates: Partial<OrganizationSettings>
): Promise<{ success: boolean; error?: string; data?: OrganizationSettings }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No authenticated user" };
    }

    // Validaciones básicas
    if (updates.name !== undefined && !updates.name.trim()) {
      return { success: false, error: "Name cannot be empty" };
    }

    // Intentar actualizar
    const { data, error } = await supabase
      .from("organization_settings")
      .update({
        name: updates.name,
        address: updates.address || null,
        phone: updates.phone || null,
        website: updates.website || null,
        logo_url: updates.logo_url || null,
        ticket_footer_message: updates.ticket_footer_message,
      })
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) {
      // Si no existe, intentar crear
      if (error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("organization_settings")
          .insert({
            profile_id: user.id,
            name: updates.name || "Mi Llantera",
            address: updates.address || null,
            phone: updates.phone || null,
            website: updates.website || null,
            logo_url: updates.logo_url || null,
            ticket_footer_message:
              updates.ticket_footer_message || "¡Gracias por su compra!",
          })
          .select()
          .single();

        if (insertError) {
          return { success: false, error: insertError.message };
        }

        return { success: true, data: newData as OrganizationSettings };
      }

      return { success: false, error: error.message };
    }

    return { success: true, data: data as OrganizationSettings };
  } catch (error) {
    console.error("[updateOrganizationSettings] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
