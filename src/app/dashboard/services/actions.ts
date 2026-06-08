"use server";

/**
 * Server actions del dashboard de servicios.
 *
 * @author SOFIA - Builder
 * @id IMPL-20260604-02
 * @fix FIX-20260604-04
 * @ref context/SPECs/SPEC-ARCH-20260604-02-SLICE2-SERVICIOS-DASHBOARD.md
 * @backup context/clientes/DEAC-ARCH-20260604-01.md
 */

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { ParsedServiceImportRow, ServiceTierCode } from "@/lib/logic/service-excel-parser";

type NumericValue = number | string | null;

interface ServiceTierRow {
  id: string;
  tier_code: ServiceTierCode;
  base_price: NumericValue;
  manual_price: NumericValue;
  is_active: boolean;
}

interface ServiceCatalogRow {
  id: string;
  category: string;
  base_name: string;
  display_name: string;
  updated_at: string;
  service_tiers: ServiceTierRow[] | null;
}

interface ServicePolicyRow {
  tier_code: ServiceTierCode;
  adjustment_percent: NumericValue;
  adjustment_amount: NumericValue;
}

export interface ServiceAdminListItem {
  serviceId: string;
  tierId: string;
  category: string;
  baseName: string;
  displayName: string;
  tierCode: ServiceTierCode;
  basePrice: number;
  manualPrice: number | null;
  finalPrice: number;
  updatedAt: string;
}

export interface ServiceMutationResult {
  success: boolean;
  message: string;
  importedCount?: number;
  createdId?: string;
  errors?: Array<{ index: number; error: string }>;
}

export interface CreateServiceInput {
  category: string;
  displayName: string;
  tierCode: ServiceTierCode;
  basePrice: number;
  manualPrice?: number | null;
}

const VALID_TIERS: ServiceTierCode[] = ["A", "AA", "AAA"];

const COMMERCIAL_TIER_LABELS: Record<ServiceTierCode, string> = {
  A: "Basica",
  AA: "Media",
  AAA: "Premium",
};

function toNumber(value: NumericValue): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toNullableNumber(value: NumericValue): number | null {
  if (value === null) {
    return null;
  }

  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchText(parts: string[]): string {
  return parts
    .map((part) => normalizeText(part))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getCommercialTierLabel(tierCode: ServiceTierCode): string {
  return COMMERCIAL_TIER_LABELS[tierCode];
}

function deriveBaseName(displayName: string, tierCode: ServiceTierCode): string {
  const trimmedName = displayName.trim();
  const match = trimmedName.match(/^(.*?)(?:\s+)(AAA|AA|A)\s*$/i);

  if (!match) {
    return trimmedName;
  }

  const derivedTier = match[2].toUpperCase() as ServiceTierCode;

  if (derivedTier !== tierCode) {
    throw new Error(
      `La gama detectada en el nombre (${getCommercialTierLabel(derivedTier)}) no coincide con la gama seleccionada (${getCommercialTierLabel(tierCode)}).`
    );
  }

  return match[1].trimEnd();
}

function computeFinalPrice(
  tier: ServiceTierRow,
  policyMap: Map<ServiceTierCode, ServicePolicyRow>
): number {
  const manualPrice = toNullableNumber(tier.manual_price);
  if (manualPrice !== null) {
    return manualPrice;
  }

  const basePrice = toNumber(tier.base_price);
  const policy = policyMap.get(tier.tier_code);
  const adjustmentPercent = toNumber(policy?.adjustment_percent ?? 0);
  const adjustmentAmount = toNumber(policy?.adjustment_amount ?? 0);

  return basePrice + (basePrice * adjustmentPercent) / 100 + adjustmentAmount;
}

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Usuario no autenticado.");
  }

  return {
    user,
    adminSupabase,
  };
}

async function getPolicyMap(adminSupabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data, error } = await adminSupabase
    .from("service_tier_policies")
    .select("tier_code, adjustment_percent, adjustment_amount")
    .eq("is_active", true);

  if (error) {
    throw new Error(`No se pudieron cargar las politicas de precio: ${error.message}`);
  }

  return new Map(
    ((data || []) as ServicePolicyRow[]).map((policy) => [policy.tier_code, policy])
  );
}

async function findOrCreateServiceCatalog(
  adminSupabase: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  input: {
    category: string;
    baseName: string;
    displayName: string;
    sourceImportBatch?: string | null;
    alias: string;
  }
): Promise<string> {
  const { data: existingRows, error: lookupError } = await adminSupabase
    .from("service_catalog")
    .select("id")
    .eq("category", input.category)
    .eq("base_name", input.baseName)
    .eq("display_name", input.displayName)
    .limit(1);

  if (lookupError) {
    throw new Error(`No se pudo consultar el catalogo de servicios: ${lookupError.message}`);
  }

  const existingId = existingRows?.[0]?.id;
  if (existingId) {
    return existingId;
  }

  const { data: insertedRow, error: insertError } = await adminSupabase
    .from("service_catalog")
    .insert({
      profile_id: userId,
      category: input.category,
      base_name: input.baseName,
      display_name: input.displayName,
      source_import_batch: input.sourceImportBatch ?? null,
      search_text: buildSearchText([
        input.category,
        input.baseName,
        input.displayName,
        input.alias,
      ]),
    })
    .select("id")
    .single();

  if (insertError || !insertedRow) {
    throw new Error(`No se pudo crear el servicio: ${insertError?.message ?? "sin respuesta"}`);
  }

  return insertedRow.id;
}

async function upsertServiceTier(
  adminSupabase: Awaited<ReturnType<typeof createAdminClient>>,
  input: {
    serviceId: string;
    tierCode: ServiceTierCode;
    basePrice: number;
    manualPrice?: number | null;
  }
) {
  const { error } = await adminSupabase
    .from("service_tiers")
    .upsert(
      {
        service_id: input.serviceId,
        tier_code: input.tierCode,
        base_price: input.basePrice,
        manual_price: input.manualPrice ?? null,
        is_active: true,
      },
      { onConflict: "service_id,tier_code", ignoreDuplicates: false }
    );

  if (error) {
    throw new Error(`No se pudo guardar el tier ${input.tierCode}: ${error.message}`);
  }
}

async function upsertServiceAlias(
  adminSupabase: Awaited<ReturnType<typeof createAdminClient>>,
  input: {
    serviceId: string;
    alias: string;
  }
) {
  const normalizedAlias = normalizeText(input.alias);
  if (!normalizedAlias) {
    return;
  }

  const { error } = await adminSupabase
    .from("service_aliases")
    .upsert(
      {
        service_id: input.serviceId,
        alias: input.alias.trim(),
        alias_normalized: normalizedAlias,
      },
      { onConflict: "service_id,alias_normalized", ignoreDuplicates: false }
    );

  if (error) {
    throw new Error(`No se pudo guardar el alias base del servicio: ${error.message}`);
  }
}

export async function getServicesAdminList(search = ""): Promise<ServiceAdminListItem[]> {
  const { adminSupabase } = await requireAuthenticatedUser();
  const policyMap = await getPolicyMap(adminSupabase);

  const { data, error } = await adminSupabase
    .from("service_catalog")
    .select("id, category, base_name, display_name, updated_at, service_tiers(id, tier_code, base_price, manual_price, is_active)")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(`No se pudo cargar el listado de servicios: ${error.message}`);
  }

  const normalizedQuery = normalizeText(search);

  return ((data || []) as ServiceCatalogRow[])
    .flatMap((service) => {
      const serviceTiers = (service.service_tiers || []).filter((tier) => tier.is_active);

      return serviceTiers.map((tier) => ({
        serviceId: service.id,
        tierId: tier.id,
        category: service.category,
        baseName: service.base_name,
        displayName: service.display_name,
        tierCode: tier.tier_code,
        basePrice: toNumber(tier.base_price),
        manualPrice: toNullableNumber(tier.manual_price),
        finalPrice: computeFinalPrice(tier, policyMap),
        updatedAt: service.updated_at,
      }));
    })
    .filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = buildSearchText([
        item.category,
        item.baseName,
        item.displayName,
        item.tierCode,
        getCommercialTierLabel(item.tierCode),
      ]);

      return haystack.includes(normalizedQuery);
    })
    .sort((left, right) => {
      const categoryCompare = left.category.localeCompare(right.category);
      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      const nameCompare = left.baseName.localeCompare(right.baseName);
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return VALID_TIERS.indexOf(left.tierCode) - VALID_TIERS.indexOf(right.tierCode);
    });
}

export async function importServices(
  rows: ParsedServiceImportRow[]
): Promise<ServiceMutationResult> {
  if (!rows.length) {
    return {
      success: false,
      message: "No hay filas para importar.",
    };
  }

  const { user, adminSupabase } = await requireAuthenticatedUser();
  const sourceImportBatch = `services-${new Date().toISOString()}`;
  const errors: Array<{ index: number; error: string }> = [];
  let importedCount = 0;

  for (const [index, row] of rows.entries()) {
    try {
      if (!VALID_TIERS.includes(row.tierCode)) {
        throw new Error(`Gama invalida detectada en origen: ${row.tierCode}`);
      }

      const category = row.category.trim();
      const displayName = row.displayName.trim();
      const alias = row.alias.trim();

      if (!category || !displayName || !alias) {
        throw new Error("La fila no contiene categoria, nombre o alias validos.");
      }

      const baseName = deriveBaseName(displayName, row.tierCode);
      const serviceId = await findOrCreateServiceCatalog(adminSupabase, user.id, {
        category,
        baseName,
        displayName,
        sourceImportBatch,
        alias,
      });

      await upsertServiceTier(adminSupabase, {
        serviceId,
        tierCode: row.tierCode,
        basePrice: row.basePrice,
        manualPrice: null,
      });

      await upsertServiceAlias(adminSupabase, {
        serviceId,
        alias,
      });

      importedCount += 1;
    } catch (error) {
      errors.push({
        index: index + 2,
        error: error instanceof Error ? error.message : "Error inesperado durante la importacion.",
      });
    }
  }

  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/services/import");

  if (importedCount === 0) {
    return {
      success: false,
      message: "No se pudo importar ninguna fila.",
      importedCount,
      errors,
    };
  }

  if (errors.length > 0) {
    return {
      success: true,
      message: `Importacion parcial completada: ${importedCount} fila(s) guardadas y ${errors.length} con error.`,
      importedCount,
      errors,
    };
  }

  return {
    success: true,
    message: `Importacion completada: ${importedCount} fila(s) guardadas.`,
    importedCount,
  };
}

export async function createService(
  input: CreateServiceInput
): Promise<ServiceMutationResult> {
  const { user, adminSupabase } = await requireAuthenticatedUser();
  const category = input.category.trim();
  const displayName = input.displayName.trim();
  const tierCode = input.tierCode;
  const basePrice = Number(input.basePrice);
  const manualPrice = input.manualPrice ?? null;

  if (!category || !displayName) {
    return {
      success: false,
      message: "Categoria y nombre del servicio son obligatorios.",
    };
  }

  if (!VALID_TIERS.includes(tierCode)) {
    return {
      success: false,
      message: "Debes indicar una gama valida (Basica, Media o Premium).",
    };
  }

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return {
      success: false,
      message: "El precio base debe ser un numero valido mayor o igual a 0.",
    };
  }

  if (manualPrice !== null && (!Number.isFinite(manualPrice) || manualPrice < 0)) {
    return {
      success: false,
      message: "El precio manual debe ser un numero valido mayor o igual a 0.",
    };
  }

  try {
    const baseName = deriveBaseName(displayName, tierCode);
    const serviceId = await findOrCreateServiceCatalog(adminSupabase, user.id, {
      category,
      baseName,
      displayName,
      sourceImportBatch: null,
      alias: baseName,
    });

    await upsertServiceTier(adminSupabase, {
      serviceId,
      tierCode,
      basePrice,
      manualPrice,
    });

    await upsertServiceAlias(adminSupabase, {
      serviceId,
      alias: baseName,
    });

    revalidatePath("/dashboard/services");
    revalidatePath("/dashboard/services/new");

    return {
      success: true,
      message: "Servicio guardado correctamente.",
      createdId: serviceId,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo crear el servicio.",
    };
  }
}

export interface ServiceFormData {
  category: string;
  displayName: string;
  tierCode: ServiceTierCode;
  basePrice: number;
  manualPrice: number | null;
}

export async function getServiceById(tierId: string): Promise<ServiceFormData | null> {
  const { adminSupabase } = await requireAuthenticatedUser();

  const { data, error } = await adminSupabase
    .from("service_tiers")
    .select(`
      id,
      tier_code,
      base_price,
      manual_price,
      service_catalog!inner(category, display_name)
    `)
    .eq("id", tierId)
    .single();

  if (error || !data) {
    return null;
  }

  // El join de Supabase devuelve un array por el !inner
  const catalogData = Array.isArray(data.service_catalog) 
    ? data.service_catalog[0] 
    : data.service_catalog;

  return {
    category: (catalogData as { category: string }).category,
    displayName: (catalogData as { display_name: string }).display_name,
    tierCode: data.tier_code as ServiceTierCode,
    basePrice: toNumber(data.base_price),
    manualPrice: toNullableNumber(data.manual_price),
  };
}

export async function updateService(
  tierId: string,
  input: CreateServiceInput
): Promise<ServiceMutationResult> {
  const { user, adminSupabase } = await requireAuthenticatedUser();
  const category = input.category.trim();
  const displayName = input.displayName.trim();
  const tierCode = input.tierCode;
  const basePrice = Number(input.basePrice);
  const manualPrice = input.manualPrice ?? null;

  if (!category || !displayName) {
    return {
      success: false,
      message: "Categoria y nombre del servicio son obligatorios.",
    };
  }

  if (!VALID_TIERS.includes(tierCode)) {
    return {
      success: false,
      message: "Debes indicar una gama valida (Basica, Media o Premium).",
    };
  }

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return {
      success: false,
      message: "El precio base debe ser un numero valido mayor o igual a 0.",
    };
  }

  if (manualPrice !== null && (!Number.isFinite(manualPrice) || manualPrice < 0)) {
    return {
      success: false,
      message: "El precio manual debe ser un numero valido mayor o igual a 0.",
    };
  }

  try {
    // Primero obtener el service_id del tier actual
    const { data: tierData, error: tierLookupError } = await adminSupabase
      .from("service_tiers")
      .select("service_id")
      .eq("id", tierId)
      .single();

    if (tierLookupError || !tierData) {
      return {
        success: false,
        message: "No se encontro el servicio a editar.",
      };
    }

    const serviceId = tierData.service_id;
    const baseName = deriveBaseName(displayName, tierCode);

    // Actualizar el catalogo del servicio
    await adminSupabase
      .from("service_catalog")
      .update({
        category,
        base_name: baseName,
        display_name: displayName,
        search_text: buildSearchText([category, baseName, displayName]),
      })
      .eq("id", serviceId);

    // Actualizar el tier
    await adminSupabase
      .from("service_tiers")
      .update({
        tier_code: tierCode,
        base_price: basePrice,
        manual_price: manualPrice,
      })
      .eq("id", tierId);

    revalidatePath("/dashboard/services");
    revalidatePath(`/dashboard/services/${tierId}/edit`);

    return {
      success: true,
      message: "Servicio actualizado correctamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo actualizar el servicio.",
    };
  }
}