/**
 * Server Actions para administración de clientes (CRM)
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-CRM-01
 * @ref context/SPEC-CRM-LITE.md
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Customer } from "@/lib/types";

/**
 * Crear un nuevo cliente
 *
 * @param data Datos del cliente (sin id ni profile_id)
 * @returns Resultado con el cliente creado o error
 */
export async function createCustomer(
  data: Omit<Customer, "id" | "profile_id" | "created_at">
): Promise<{ success: boolean; error?: string; customer?: Customer }> {
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

    // Validar que al menos el nombre esté presente
    if (!data.full_name || data.full_name.trim().length === 0) {
      return { success: false, error: "El nombre del cliente es requerido" };
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .insert([
        {
          profile_id: user.id,
          full_name: data.full_name.trim(),
          phone: data.phone || null,
          email: data.email || null,
          tax_id: data.tax_id || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creando cliente:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/customers");
    return { success: true, customer };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Buscar clientes por término (nombre o teléfono)
 *
 * @param term Término de búsqueda (busca en nombre y teléfono)
 * @returns Array de clientes encontrados
 */
export async function searchCustomers(
  term: string
): Promise<{ success: boolean; error?: string; customers?: Customer[] }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "No autenticado" };
    }

    if (!term || term.trim().length === 0) {
      return { success: true, customers: [] };
    }

    const searchTerm = `%${term.trim()}%`;

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .eq("profile_id", user.id)
      .or(`full_name.ilike.${searchTerm},phone.ilike.${searchTerm}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error buscando clientes:", error);
      return { success: false, error: error.message };
    }

    return { success: true, customers };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Obtener un cliente específico por ID
 *
 * @param id ID del cliente
 * @returns El cliente encontrado o error
 */
export async function getCustomer(
  id: string
): Promise<{ success: boolean; error?: string; customer?: Customer }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "No autenticado" };
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("profile_id", user.id)
      .single();

    if (error) {
      console.error("Error obteniendo cliente:", error);
      return { success: false, error: error.message };
    }

    return { success: true, customer };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Actualizar un cliente existente
 *
 * @param id ID del cliente
 * @param data Datos a actualizar
 * @returns El cliente actualizado o error
 */
export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, "id" | "profile_id" | "created_at">>
): Promise<{ success: boolean; error?: string; customer?: Customer }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "No autenticado" };
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .update(data)
      .eq("id", id)
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando cliente:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/customers");
    return { success: true, customer };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Obtener todos los clientes del usuario
 *
 * @returns Array de clientes
 */
export async function getAllCustomers(): Promise<{
  success: boolean;
  error?: string;
  customers?: Customer[];
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

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo clientes:", error);
      return { success: false, error: error.message };
    }

    return { success: true, customers };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Eliminar un cliente
 *
 * @param id ID del cliente
 * @returns Resultado de la eliminación
 */
export async function deleteCustomer(id: string): Promise<{
  success: boolean;
  error?: string;
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

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("profile_id", user.id);

    if (error) {
      console.error("Error eliminando cliente:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/customers");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}
