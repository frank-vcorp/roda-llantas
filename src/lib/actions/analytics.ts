/**
 * Server Actions para Analytics (Dashboard)
 * 
 * Incluye funciones para obtener estadísticas de:
 * - Ventas perdidas (búsquedas sin resultados)
 * - Resumen de cotizaciones y ventas
 * 
 * @author SOFIA - Builder
 * @date 2026-01-29
 * @id IMPL-20260129-LOST-SALES-02
 */

'use server';

import { createAdminClient } from '@/lib/supabase/server';

/**
 * Tipos para respuestas de analytics
 */
export interface LostSalesSummary {
  normalized_query: string;
  frequency: number;
  last_seen: string;
}

export interface LostSalesStats {
  totalQueries: number;
  topTerm: string | null;
  data: LostSalesSummary[];
}

/**
 * Obtiene estadísticas de ventas perdidas (búsquedas sin resultados)
 * 
 * @returns Estadísticas de ventas perdidas con tabla completa
 */
export async function getLostSalesStats(): Promise<LostSalesStats> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('lost_sales_summary')
      .select('*')
      .order('frequency', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Failed to fetch lost sales: ${error.message}`);
    }

    const typedData: LostSalesSummary[] = (data || []).map((row) => ({
      normalized_query: row.normalized_query || '',
      frequency: row.frequency || 0,
      last_seen: row.last_seen || new Date().toISOString(),
    }));

    // Calcular KPIs
    const totalQueries = typedData.reduce((sum, item) => sum + item.frequency, 0);
    const topTerm = typedData.length > 0 ? typedData[0].normalized_query : null;

    return {
      totalQueries,
      topTerm,
      data: typedData,
    };
  } catch (error) {
    console.error('Error fetching lost sales stats:', error);
    throw error;
  }
}
