/**
 * Server Actions: Búsqueda de Inventario
 *
 * Funciones de servidor para búsqueda de inventario que pueden ser
 * llamadas desde componentes cliente.
 *
 * @id IMPL-20260129-ROLES-MOBILE
 * @author SOFIA - Builder
 * @ref context/SPEC-ROLES-MOBILE.md
 */

"use server";

import { getInventoryItems } from "@/lib/services/inventory";
import { InventoryItem } from "@/lib/types";

/**
 * Busca items de inventario por término
 * @param query - Término de búsqueda
 * @param limit - Máximo número de resultados (default: 50)
 * @returns Array de items encontrados
 */
export async function searchInventoryAction(
  query: string,
  limit: number = 50
): Promise<InventoryItem[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const result = await getInventoryItems({
      search: query.trim(),
      page: 0,
      limit,
    });

    // IMPL-20260130-V2-FEATURES: Smart Fallback logic
    if ((result.data?.length || 0) === 0 && (result.suggestions?.length || 0) > 0) {
       return result.suggestions!;
    }

    return result.data || [];
  } catch (error) {
    console.error("[searchInventoryAction] Error:", error);
    return [];
  }
}
