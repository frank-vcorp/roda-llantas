/**
 * Parser dedicado para el catalogo de servicios desde Excel.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260604-01
 * @ref context/SPECs/SPEC-ARCH-20260604-01-CATALOGO-SERVICIOS.md
 * @fix FIX-20260604-03
 * @backup context/clientes/DEAC-ARCH-20260604-01.md
 */

import * as XLSX from "xlsx";

export type ServiceTierCode = "A" | "AA" | "AAA";

export interface ParsedServiceImportRow {
  sku: string;
  category: string;
  displayName: string;
  baseName: string;
  tierCode: ServiceTierCode;
  basePrice: number;
  alias: string;
  aliasNormalized: string;
  metadata: {
    sku: string;
  };
}

const EXACT_HEADERS = {
  sku: "SKU",
  name: "Nombre del producto",
  category: "Categoría",
  price: "Precio de venta",
} as const;

const HEADER_FALLBACKS: Record<keyof typeof EXACT_HEADERS, string[]> = {
  sku: ["sku", "codigo", "código"],
  name: ["nombre del producto", "producto", "nombre"],
  category: ["categoría", "categoria"],
  price: ["precio de venta", "precio", "venta"],
};

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAlias(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function resolveHeaderMap(headers: string[]) {
  const byNormalized = new Map(headers.map((header) => [normalizeHeader(header), header]));

  return {
    sku:
      byNormalized.get(normalizeHeader(EXACT_HEADERS.sku))
      ?? HEADER_FALLBACKS.sku.map(key => byNormalized.get(key)).find(Boolean),
    name:
      byNormalized.get(normalizeHeader(EXACT_HEADERS.name))
      ?? HEADER_FALLBACKS.name.map(key => byNormalized.get(key)).find(Boolean),
    category:
      byNormalized.get(normalizeHeader(EXACT_HEADERS.category))
      ?? HEADER_FALLBACKS.category.map(key => byNormalized.get(key)).find(Boolean),
    price:
      byNormalized.get(normalizeHeader(EXACT_HEADERS.price))
      ?? HEADER_FALLBACKS.price.map(key => byNormalized.get(key)).find(Boolean),
  };
}

function parsePrice(rawValue: unknown): number {
  if (typeof rawValue === "number") {
    return rawValue;
  }

  if (typeof rawValue !== "string") {
    throw new Error("Precio de venta invalido.");
  }

  const normalized = rawValue.replace(/[$,\s]/g, "").trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Precio de venta invalido: ${rawValue}`);
  }

  return parsed;
}

function splitDisplayName(displayName: string): { baseName: string; tierCode: ServiceTierCode } {
  const trimmedName = displayName.trim();
  const match = trimmedName.match(/^(.*?)(?:\s+)(AAA|AA|A)\s*$/i);

  if (!match) {
    return {
      baseName: trimmedName,
      tierCode: "A",
    };
  }

  return {
    baseName: match[1].trimEnd(),
    tierCode: match[2].toUpperCase() as ServiceTierCode,
  };
}

export function parseServiceExcel(fileBuffer: Buffer | ArrayBuffer): ParsedServiceImportRow[] {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("El archivo de servicios no contiene hojas.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rows.length) {
    return [];
  }

  const headerMap = resolveHeaderMap(Object.keys(rows[0]));

  if (!headerMap.sku || !headerMap.name || !headerMap.category || !headerMap.price) {
    throw new Error("No se pudieron resolver las columnas requeridas del Excel de servicios.");
  }

  const skuHeader = headerMap.sku;
  const nameHeader = headerMap.name;
  const categoryHeader = headerMap.category;
  const priceHeader = headerMap.price;

  return rows.map((row, index) => {
    const rawSku = String(row[skuHeader] ?? "").trim();
    const rawDisplayName = String(row[nameHeader] ?? "").trim();
    const rawCategory = String(row[categoryHeader] ?? "").trim();

    if (!rawSku || !rawDisplayName || !rawCategory) {
      throw new Error(`Fila ${index + 2}: faltan datos obligatorios para importar servicios.`);
    }

    const { baseName, tierCode } = splitDisplayName(rawDisplayName);

    return {
      sku: rawSku,
      category: rawCategory,
      displayName: rawDisplayName,
      baseName,
      tierCode,
      basePrice: parsePrice(row[priceHeader]),
      alias: baseName,
      aliasNormalized: normalizeAlias(baseName),
      metadata: {
        sku: rawSku,
      },
    };
  });
}