/**
 * FIX-20260129-SALES-02: Server Actions para Conversión Atómica de Cotización a Venta
 * 
 * Refactorización:
 * - Eliminada lógica manual de TS
 * - Implementada llamada a RPC `confirm_sale`
 * - Transacción ACID en PostgreSQL para evitar condiciones de carrera
 * 
 * @author SOFIA - Builder
 * @date 2026-01-29
 * @id FIX-20260129-SALES-02
 */

'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Tipo para respuesta de conversión
 */
interface ConversionResult {
  success: boolean;
  sale_id?: string;
  error?: string;
}

/**
 * Convierte una cotización en venta usando RPC
 * 
 * La lógica COMPLETA está en la función PostgreSQL `confirm_sale`:
 * 1. Validar que la cotización exista y no haya sido vendida
 * 2. Validar stock disponible para todos los items
 * 3. Crear registro en tabla `sales`
 * 4. Copiar items a `sale_items`
 * 5. Decrementar stock en `products`
 * 6. Actualizar estado de cotización a 'sold'
 * 
 * FIX-20260129-06: userId ahora es opcional (no se usa en el RPC de Supabase)
 * 
 * @param quotationId - ID de la cotización a convertir
 * @param userId - ID del usuario autenticado (opcional, no usado en RPC)
 * @returns Resultado de la conversión
 */
export async function convertQuotationToSale(
  quotationId: string,
  userId?: string
): Promise<ConversionResult> {
  try {
    // Llamar a la función RPC que maneja TODA la transacción de forma atómica
    const { data, error } = await supabase.rpc('confirm_sale', {
      p_quotation_id: quotationId
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Error al convertir cotización a venta'
      };
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: 'La conversión no se completó correctamente'
      };
    }

    // Revalidar rutas afectadas
    revalidatePath('/dashboard/quotations');
    revalidatePath('/dashboard/inventory');
    revalidatePath(`/dashboard/quotations/${quotationId}`);

    return {
      success: true,
      sale_id: data.sale_id
    };
  } catch (error) {
    console.error('Error en convertQuotationToSale:', error);
    return {
      success: false,
      error: 'Error inesperado en la conversión'
    };
  }
}
