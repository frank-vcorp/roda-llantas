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

import { logLostSale } from "@/lib/services/analytics";

/**
 * Enriches inventory items with warehouse stock breakdown
 */
async function enrichInventoryWithStock(items: InventoryItem[]) {
  if (!items.length) return items;

  const supabase = await createClient();
  const productIds = items.map(i => i.id);

  const { data: stockData } = await supabase
    .from('product_stock')
    .select(`
      product_id,
      quantity,
      warehouses (name, code)
    `)
    .in('product_id', productIds)
    .gt('quantity', 0); // Only showing where there IS stock

  if (!stockData) return items;

  // Map stock to items
  // We explicitly cast to unknown then to the expected type because Supabase types might verify strict relationships
  // that we defined in SQL but TypeScript doesn't know about fully yet for the nested join.
  type StockRecord = {
    product_id: string;
    quantity: number;
    warehouses: { name: string; code: string } | null; // One-to-one from the join perspective of product_stock -> warehouses
  };

  const stocks = stockData as unknown as StockRecord[];

  items.forEach(item => {
    const itemStocks = stocks.filter(s => s.product_id === item.id);
    if (itemStocks.length > 0) {
      item.warehouses = itemStocks.map(s => ({
        name: s.warehouses?.name || 'Desconocido',
        quantity: s.quantity
      }));
    }
  });

  return items;
}

/**
 * Opciones para la búsqueda y paginación de inventario
 */
export interface GetInventoryOptions {
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada con count total y sugerencias opcionales
 */
export interface InventoryResponse {
  data: InventoryItem[];
  count: number;
  suggestions?: InventoryItem[]; // IMPL-20260130-V2-FEATURES: Items sugeridos si no hay resultados exactos
}

/**
 * Extrae el RIN de un string de búsqueda
 * Busca números de 2 dígitos que representen un RIN válido (13-24)
 * 
 * @example
 * extractRimFromSearch("Rin 17 yokohama") => 17
 * extractRimFromSearch("175 60 R17") => 17
 * extractRimFromSearch("no hay rin aqui") => null
 */
function extractRimFromSearch(searchTerm: string): number | null {
  // Regex para encontrar números de 2 dígitos (RIN válido: 13-24)
  const rimMatch = searchTerm.match(/\b(1[3-9]|2[0-4])\b/);
  if (rimMatch) {
    const rim = parseInt(rimMatch[1], 10);
    if (rim >= 13 && rim <= 24) {
      return rim;
    }
  }
  return null;
}

/**
 * Obtiene items del inventario del usuario autenticado con búsqueda y paginación
 * 
 * Utiliza dos estrategias:
 * - Si hay término de búsqueda: usa RPC `search_inventory` para búsqueda fuzzy con pg_trgm
 * - Si no hay búsqueda: usa select estándar con count exacto
 * 
 * IMPL-20260130-V2-FEATURES: Smart Fallback
 * - Si count=0 y hay término de búsqueda:
 *   - Intenta extraer un RIN del texto
 *   - Si se detecta un RIN válido: hace segunda consulta para encontrar items con ese RIN
 *   - Retorna los items en el campo `suggestions`
 * 
 * @param options - Opciones de búsqueda y paginación
 * @param options.search - Término de búsqueda para brand, model, medida_full, sku
 * @param options.page - Número de página (0-indexed, default: 0)
 * @param options.limit - Cantidad de items por página (default: 20)
 * @returns Objeto con data (array de items), count (total de registros), y suggestions opcionales
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
 * @id IMPL-20260130-V2-FEATURES (Smart Fallback)
 * @ref context/SPEC-SEARCH.md, context/SPEC-V2-FEATURES.md
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

      const count = (countData as number) || 0;
      let items = (data as InventoryItem[]) || [];

      // Enrich with stock breakdown
      items = await enrichInventoryWithStock(items);

      const result: InventoryResponse = {
        data: items,
        count,
      };

      // IMPL-20260130-V2-FEATURES: Smart Fallback - Si no hay resultados exactos, buscar por RIN
      if (count === 0) {
        const detectedRim = extractRimFromSearch(searchTerm);

        if (detectedRim !== null) {
          try {
            // Segunda consulta: buscar por RIN detectado
            const { data: suggestedItems, error: rimError } = await supabase
              .from("inventory")
              .select("*")
              .eq("rim", detectedRim)
              .limit(4);

            if (!rimError && suggestedItems && suggestedItems.length > 0) {
              result.suggestions = (suggestedItems as InventoryItem[]);
              console.log(
                `[getInventoryItems] No exact results, found ${suggestedItems.length} suggestions with Rin ${detectedRim}`
              );
            }
          } catch (rimQueryError) {
            console.error("[getInventoryItems] Error executing RIM fallback query:", rimQueryError);
            // No fallar la búsqueda principal si falla el fallback
          }
        }

        // Registrar venta perdida si no hay resultados (fire and forget)
        // IMPL-20260129-LOST-SALES-01
        logLostSale(searchTerm, count).catch(() => {
          // Silenciar errores para no afectar la búsqueda principal
        });
      }

      return result;
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

    const totalCount = count || 0;
    let items = (data as InventoryItem[]) || [];

    // Enrich with stock breakdown
    items = await enrichInventoryWithStock(items);

    const result = {
      data: items,
      count: totalCount,
    };

    // Nota: Sin término de búsqueda, no registramos como venta perdida
    // Las ventas perdidas se registran solo cuando el usuario busca algo específico
    // IMPL-20260129-LOST-SALES-01

    return result;
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
