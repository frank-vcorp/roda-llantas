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

    const items = result.data || [];
    const suggestions = result.suggestions || [];

    // IMPL-20260130-V2-FEATURES: Fetch pricing rules to enrich items
    const { getPricingRules, enrichInventoryWithPrices } = await import("@/lib/services/pricing");
    const rules = await getPricingRules();

    const enrichedItems = enrichInventoryWithPrices(items, rules);
    const enrichedSuggestions = enrichInventoryWithPrices(suggestions, rules);

    if (enrichedItems.length === 0 && enrichedSuggestions.length > 0) {
      return enrichedSuggestions;
    }

    return enrichedItems;
  } catch (error) {
    console.error("[searchInventoryAction] Error:", error);
    return [];
  }
}
