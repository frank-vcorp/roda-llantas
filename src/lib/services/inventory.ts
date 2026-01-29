/**
 * Servicio de datos para Inventario
 * Gestiona lecturas de la tabla inventory desde Supabase
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-REFACTOR-01
 * @ref context/SPEC-INVENTORY-VIEW.md
 */

import { createClient } from "@/lib/supabase/server";
import { InventoryItem } from "@/lib/types";

/**
 * Opciones para la búsqueda y paginación de inventario
 */
export interface GetInventoryOptions {
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada con count total
 */
export interface InventoryResponse {
  data: InventoryItem[];
  count: number;
}

/**
 * Obtiene items del inventario del usuario autenticado con búsqueda y paginación
 * 
 * Utiliza dos estrategias:
 * - Si hay término de búsqueda: usa RPC `search_inventory` para búsqueda fuzzy con pg_trgm
 * - Si no hay búsqueda: usa select estándar con count exacto
 * 
 * @param options - Opciones de búsqueda y paginación
 * @param options.search - Término de búsqueda para brand, model, medida_full, sku
 * @param options.page - Número de página (0-indexed, default: 0)
 * @param options.limit - Cantidad de items por página (default: 20)
 * @returns Objeto con data (array de items) y count (total de registros)
 * 
 * @example
 * const result = await getInventoryItems({
 *   search: "175 60",
 *   page: 0,
 *   limit: 20
 * });
 * 
 * @author SOFIA - Builder
 * @id IMPL-20260129-SEARCH-02
 * @ref context/SPEC-SEARCH.md
 */
export async function getInventoryItems(
  options: GetInventoryOptions = {}
): Promise<InventoryResponse> {
  const supabase = await createClient();
  const { search = "", page = 0, limit = 20 } = options;
  const offset = page * limit;

  // Estrategia 1: Búsqueda con RPC (Fuzzy Search)
  if (search.trim()) {
    const searchTerm = search.trim();

    try {
      // Obtener datos de búsqueda paginados usando RPC search_inventory
      const { data, error: searchError } = await supabase.rpc("search_inventory", {
        p_query: searchTerm,
        p_limit: limit,
        p_offset: offset,
      });

      if (searchError) {
        console.error("[getInventoryItems] RPC search_inventory error:", searchError);
        throw new Error(`Search failed: ${searchError.message}`);
      }

      // Obtener el count total usando RPC count_search_inventory
      const { data: countData, error: countError } = await supabase.rpc(
        "count_search_inventory",
        { p_query: searchTerm }
      );

      if (countError) {
        console.error("[getInventoryItems] RPC count_search_inventory error:", countError);
        throw new Error(`Count failed: ${countError.message}`);
      }

      return {
        data: (data as InventoryItem[]) || [],
        count: (countData as number) || 0,
      };
    } catch (error) {
      console.error("[getInventoryItems] Search strategy failed:", error);
      throw error;
    }
  }

  // Estrategia 2: Browse estándar (sin búsqueda)
  try {
    const query = supabase
      .from("inventory")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("updated_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("[getInventoryItems] Browse query error:", error);
      throw new Error(`Failed to fetch inventory items: ${error.message}`);
    }

    return {
      data: (data as InventoryItem[]) || [],
      count: count || 0,
    };
  } catch (error) {
    console.error("[getInventoryItems] Browse strategy failed:", error);
    throw error;
  }
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error in getInventoryItemById:', error);
    }
    return null;
  }
  
  return data;
}
