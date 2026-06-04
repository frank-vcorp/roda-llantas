/**
 * Servicio de busqueda catalogada para productos y servicios.
 *
 * @author SOFIA - Builder
 * @id FIX-20260604-02
 * @ref context/SPECs/SPEC-ARCH-20260604-01-CATALOGO-SERVICIOS.md
 * @backup context/clientes/DEAC-ARCH-20260604-01.md
 */

import { createClient } from "@/lib/supabase/server";
import { InventoryItem } from "@/lib/types";

export interface CatalogSearchOptions {
  search?: string;
  page?: number;
  limit?: number;
}

type CatalogResultType = "product" | "service";

interface CatalogSearchRpcRow {
  result_type: CatalogResultType;
  result_id: string;
  title: string;
  subtitle: string | null;
  search_text: string;
  price: number | string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
}

export interface CatalogServiceResult {
  id: string;
  title: string;
  subtitle: string;
  searchText: string;
  price: number;
  category: string;
  tierCode: string;
  displayName: string;
  updatedAt: string;
}

export interface CatalogSearchResponse {
  products: InventoryItem[];
  services: CatalogServiceResult[];
  count: number;
}

function toNumber(value: number | string | null): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isInventoryItem(value: unknown): value is InventoryItem {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof (value as { id?: unknown }).id === "string"
  );
}

export async function searchCatalog(
  options: CatalogSearchOptions = {}
): Promise<CatalogSearchResponse> {
  const supabase = await createClient();
  const { search = "", page = 0, limit = 50 } = options;
  const query = search.trim();

  if (!query) {
    return {
      products: [],
      services: [],
      count: 0,
    };
  }

  const { data, error } = await supabase.rpc("search_catalog", {
    p_query: query,
    p_limit: limit,
    p_offset: Math.max(page, 0) * limit,
  });

  if (error) {
    console.error("[searchCatalog] RPC search_catalog error:", error);
    throw new Error(`Catalog search failed: ${error.message}`);
  }

  const rows = ((data as CatalogSearchRpcRow[]) || []).filter(Boolean);
  const products: InventoryItem[] = [];
  const services: CatalogServiceResult[] = [];

  rows.forEach((row) => {
    if (row.result_type === "product" && isInventoryItem(row.metadata)) {
      products.push(row.metadata);
      return;
    }

    if (row.result_type === "service") {
      const metadata = row.metadata || {};
      services.push({
        id: row.result_id,
        title: row.title,
        subtitle: row.subtitle || "Servicio",
        searchText: row.search_text,
        price: toNumber(row.price),
        category: typeof metadata.category === "string" ? metadata.category : "",
        tierCode: typeof metadata.tier_code === "string" ? metadata.tier_code : "",
        displayName: typeof metadata.display_name === "string" ? metadata.display_name : row.title,
        updatedAt: row.updated_at,
      });
    }
  });

  return {
    products,
    services,
    count: rows.length,
  };
}