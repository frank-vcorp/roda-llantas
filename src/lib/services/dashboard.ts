/**
 * Dashboard Service
 * Gestiona métricas y datos de resumen para el panel de control
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-DASH-01
 * @ref context/SPEC-DASHBOARD-ANALYTICS.md
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Interfaz para métricas de cotizaciones del día
 */
export interface QuotationsMetrics {
  count: number;
  total_amount: number;
}

/**
 * Interfaz para registro reciente de cotización
 */
export interface RecentQuotation {
  id: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}

/**
 * Interfaz para búsqueda fallida reciente
 */
export interface LostSaleRecord {
  search_term: string;
  count: number;
  created_at: string;
}

/**
 * Interfaz completa de métricas del dashboard
 */
export interface DashboardMetrics {
  quotations: {
    count: number;
    total_amount: number;
  };
  lost_sales_count: number;
  low_stock_count: number;
  recent_quotations: RecentQuotation[];
  top_lost_searches: LostSaleRecord[];
}

/**
 * Obtiene todas las métricas del dashboard en paralelo
 *
 * Ejecuta 5 queries simultáneamente usando Promise.all:
 * 1. Cotizaciones de hoy (suma y count)
 * 2. Búsquedas sin resultado (lost_sales count)
 * 3. Stock crítico (inventory <= 4)
 * 4. Últimas 5 cotizaciones
 * 5. Top 5 búsquedas sin resultado (agrupadas)
 *
 * @returns Objeto con todas las métricas del dashboard
 * @throws Error si hay fallos en las queries
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No authenticated user");
  }

  const profile_id = user.id;

  // Obtener inicio y fin del día (UTC)
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  endOfDay.setUTCHours(23, 59, 59, 999);

  const startOfDayIso = startOfDay.toISOString();
  const endOfDayIso = endOfDay.toISOString();

  // Ejecutar todas las queries en paralelo
  const [quotationsRes, lostSalesRes, lowStockRes, recentQuotationsRes, topLostSearchesRes] =
    await Promise.all([
      // Query 1: Suma y cuenta de cotizaciones de hoy
      supabase
        .from("quotations")
        .select("id, total_amount")
        .eq("profile_id", profile_id)
        .gte("created_at", startOfDayIso)
        .lte("created_at", endOfDayIso),

      // Query 2: Cuenta de lost_sales de hoy
      supabase
        .from("lost_sales")
        .select("id", { count: "exact" })
        .eq("profile_id", profile_id)
        .gte("created_at", startOfDayIso)
        .lte("created_at", endOfDayIso),

      // Query 3: Cuenta de inventario con stock <= 4
      supabase
        .from("inventory")
        .select("id", { count: "exact" })
        .eq("profile_id", profile_id)
        .lte("stock", 4),

      // Query 4: Últimas 5 cotizaciones
      supabase
        .from("quotations")
        .select("id, customer_name, total_amount, created_at")
        .eq("profile_id", profile_id)
        .order("created_at", { ascending: false })
        .limit(5),

      // Query 5: Top 5 búsquedas sin resultado (agrupadas)
      supabase
        .from("lost_sales")
        .select("search_term, created_at")
        .eq("profile_id", profile_id)
        .gte("created_at", startOfDayIso)
        .lte("created_at", endOfDayIso)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Procesar resultados
  let quotationsCount = 0;
  let quotationsTotalAmount = 0;

  if (!quotationsRes.error && quotationsRes.data) {
    quotationsCount = quotationsRes.data.length;
    quotationsTotalAmount = quotationsRes.data.reduce(
      (sum: number, q: any) => sum + (q.total_amount || 0),
      0
    );
  }

  const lostSalesCount = lostSalesRes.count || 0;
  const lowStockCount = lowStockRes.count || 0;

  const recentQuotations: RecentQuotation[] = recentQuotationsRes.data || [];
  const topLostSearches: LostSaleRecord[] = (topLostSearchesRes.data || []).map((record: any) => ({
    search_term: record.search_term,
    count: 1, // En una lista de registros individuales, cada uno cuenta como 1
    created_at: record.created_at,
  }));

  return {
    quotations: {
      count: quotationsCount,
      total_amount: quotationsTotalAmount,
    },
    lost_sales_count: lostSalesCount,
    low_stock_count: lowStockCount,
    recent_quotations: recentQuotations,
    top_lost_searches: topLostSearches,
  };
}
