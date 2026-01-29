/**
 * Analytics Service
 * Gestiona eventos de negocio (ventas perdidas, búsquedas, etc.)
 *
 * @author SOFIA - Builder
 * @id IMPL-20260129-LOST-SALES-01
 * @ref context/SPEC-LOST-SALES.md
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Registra una venta perdida (búsqueda sin resultados)
 * 
 * Esta función:
 * 1. Obtiene la sesión autenticada
 * 2. Obtiene el profile_id (auth.uid())
 * 3. Inserta en tabla lost_sales
 * 4. No bloquea la respuesta principal (fire and forget)
 * 
 * @param query - El texto de búsqueda realizado
 * @param resultsCount - Cantidad de resultados obtenidos (generalmente 0)
 * 
 * @returns Promise que resuelve sin bloquear (void)
 * 
 * @example
 * // Desde inventory.ts, sin await
 * logLostSale("agricola 22", 0).catch(() => {
 *   // Silenciar errores para no afectar la búsqueda
 * });
 */
export async function logLostSale(
  query: string,
  resultsCount: number = 0
): Promise<void> {
  try {
    const supabase = await createClient();

    // Verificar sesión
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.debug("[logLostSale] No authenticated user, skipping");
      return;
    }

    // Insertar en lost_sales
    const { error: insertError } = await supabase.from("lost_sales").insert({
      profile_id: user.id,
      query: query.trim(),
      results_count: resultsCount,
    });

    if (insertError) {
      console.error("[logLostSale] Failed to insert lost sale:", insertError);
      // No relanzar error - esto es telemetría transparente
      return;
    }

    console.debug(`[logLostSale] Recorded: "${query.trim()}" (${resultsCount} results)`);
  } catch (error) {
    // Capturar cualquier error no previsto
    console.error("[logLostSale] Unexpected error:", error);
    // No relanzar - mantener transparente
  }
}
