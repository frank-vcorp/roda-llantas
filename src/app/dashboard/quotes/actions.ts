/**
 * Server Actions para Cotizaciones
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-QUOTES-05 (Historial)
 * @id IMPL-20260129-QUOTES-03 (Descuento)
 * @id IMPL-20260129-QUOTES-02 (Base)
 * @id IMPL-20260129-CRM-02 (Customer ID support)
 * @ref context/SPEC-QUOTATIONS.md
 * @modified 2026-01-29: Agregado soporte para customer_id desde CRM Lite
 * @modified 2026-01-29: Agregado getQuotations() y deleteQuotation() para historial
 * @modified 2026-01-29: Agregado soporte para descuentos (percentage/amount)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Quotation {
  id: string;
  profile_id: string;
  customer_name: string;
  customer_phone: string | null;
  discount_type: string | null;
  discount_value: number;
  total_amount: number;
  status: string;
  created_at: string;
  valid_until: string; // IMPL-20260130-V2-FEATURES: Fecha de expiración de cotización
}

interface CreateQuotationInput {
  customer_name: string;
  customer_phone?: string;
  customer_id?: string; // FK -> customers (optional, para CRM Lite)
  items: Array<{
    id: string; // inventory_id
    quantity: number;
    unit_price: number;
  }>;
  discount_type?: 'percentage' | 'amount';
  discount_value?: number;
}

interface CreateQuotationResponse {
  success: boolean;
  quotation_id?: string;
  error?: string;
}

/**
 * Crear una nueva cotización con sus items
 */
export async function createQuotation(
  data: CreateQuotationInput
): Promise<CreateQuotationResponse> {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Calcular subtotal
    const subtotal = data.items.reduce((acc, item) => {
      return acc + item.unit_price * item.quantity;
    }, 0);

    // Calcular descuento
    let discountAmount = 0;
    if (data.discount_type && data.discount_value) {
      if (data.discount_type === 'percentage') {
        discountAmount = subtotal * (data.discount_value / 100);
      } else if (data.discount_type === 'amount') {
        discountAmount = data.discount_value;
      }
    }

    // Validar que el descuento no sea mayor al subtotal
    if (discountAmount > subtotal) {
      return {
        success: false,
        error: "El descuento no puede ser mayor al subtotal",
      };
    }

    // Calcular total final
    const totalAmount = Math.max(0, subtotal - discountAmount);

    // 1. Insertar la cotización (header)
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .insert([
        {
          profile_id: user.id,
          customer_id: data.customer_id || null,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone || null,
          discount_type: data.discount_type || null,
          discount_value: data.discount_value || 0,
          total_amount: totalAmount,
          status: "completed",
        },
      ])
      .select()
      .single();

    if (quotationError || !quotation) {
      console.error("Error creando cotización:", quotationError);
      return {
        success: false,
        error: `Error al crear cotización: ${quotationError?.message || "Desconocido"}`,
      };
    }

    // 2. Insertar los items de la cotización
    const quotationItems = data.items.map((item) => ({
      quotation_id: quotation.id,
      inventory_id: item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from("quotation_items")
      .insert(quotationItems);

    if (itemsError) {
      console.error("Error insertando items de cotización:", itemsError);
      // Intentar eliminar la cotización si fallan los items
      await supabase.from("quotations").delete().eq("id", quotation.id);
      return {
        success: false,
        error: `Error al crear items: ${itemsError.message}`,
      };
    }

    // Revalidar rutas
    revalidatePath("/dashboard/quotes");

    return {
      success: true,
      quotation_id: quotation.id,
    };
  } catch (error) {
    console.error("Error en createQuotation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
/**
 * Obtener todas las cotizaciones del usuario ordenadas por fecha descendente
 */
export async function getQuotations(limit: number = 50) {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Usuario no autenticado", quotations: [] };
    }

    // Obtener cotizaciones ordenadas por fecha descendente
    const { data: quotations, error } = await supabase
      .from("quotations")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error obteniendo cotizaciones:", error);
      return { success: false, error: error.message, quotations: [] };
    }

    return {
      success: true,
      quotations: (quotations as Quotation[]) || [],
    };
  } catch (error) {
    console.error("Error en getQuotations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      quotations: [],
    };
  }
}

/**
 * Obtener cotizaciones del día actual para KPIs
 */
export async function getTodayQuotations() {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Usuario no autenticado", quotations: [] };
    }

    // Obtener el inicio y fin del día actual (UTC)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Obtener cotizaciones del día
    const { data: quotations, error } = await supabase
      .from("quotations")
      .select("*")
      .eq("profile_id", user.id)
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString());

    if (error) {
      console.error("Error obteniendo cotizaciones del día:", error);
      return { success: false, error: error.message, quotations: [] };
    }

    return {
      success: true,
      quotations: (quotations as Quotation[]) || [],
    };
  } catch (error) {
    console.error("Error en getTodayQuotations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      quotations: [],
    };
  }
}

/**
 * Eliminar una cotización y sus items asociados
 */
export async function deleteQuotation(quotationId: string) {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Verificar que la cotización pertenece al usuario
    const { data: quotation, error: fetchError } = await supabase
      .from("quotations")
      .select("id, profile_id")
      .eq("id", quotationId)
      .single();

    if (fetchError || !quotation) {
      return { success: false, error: "Cotización no encontrada" };
    }

    if (quotation.profile_id !== user.id) {
      return { success: false, error: "No tienes permiso para eliminar esta cotización" };
    }

    // Eliminar la cotización (cascade eliminará los items)
    const { error: deleteError } = await supabase
      .from("quotations")
      .delete()
      .eq("id", quotationId);

    if (deleteError) {
      console.error("Error eliminando cotización:", deleteError);
      return {
        success: false,
        error: `Error al eliminar cotización: ${deleteError.message}`,
      };
    }

    // Revalidar rutas
    revalidatePath("/dashboard/quotes");

    return { success: true };
  } catch (error) {
    console.error("Error en deleteQuotation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}