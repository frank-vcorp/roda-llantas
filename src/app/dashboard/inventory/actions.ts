'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { InventoryItem } from '@/lib/logic/excel-parser';
import { InventoryItem as DbInventoryItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';

/**
 * @fileoverview Server Action - Inventory Management
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT2
 */

export async function insertInventoryItems(
  items: InventoryItem[],
  warehouseId?: string,
  updatePricesOnly: boolean = false,
  replaceStock: boolean = false
): Promise<{
  success: boolean;
  message: string;
  insertedCount?: number;
  errors?: Array<{ index: number; error: string }>;
}> {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      };
    }

    const profile_id = user.id;
    console.log(`SERVER: Starting import for ${items.length} items. Profile: ${profile_id}`);

    // --- BATCH PROCESSING START ---
    const BATCH_SIZE = 50;
    let totalInserted = 0;
    const allInsertedProducts: { id: string; sku: string }[] = [];

    // Pre-clean warehouse stock if replacing (do it once)
    if (warehouseId && !updatePricesOnly && replaceStock) {
      const { error: deleteError } = await adminSupabase
        .from('product_stock')
        .delete()
        .eq('warehouse_id', warehouseId);

      if (deleteError) {
        throw new Error(`Error al limpiar stock para reemplazo: ${deleteError.message}`);
      }
    }

    // Process in batches
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batchItems = items.slice(i, i + BATCH_SIZE);
      console.log(`SERVER: Processing batch ${i / BATCH_SIZE + 1} (${batchItems.length} items)`);

      const inventoryPayload = batchItems.map((item) => {
        const payload: any = { ...item, profile_id };
        if (updatePricesOnly) delete payload.stock;
        return payload;
      });

      // 1. Upsert Inventory Batch
      const { data: batchInserted, error: invError } = await adminSupabase
        .from('inventory')
        .upsert(inventoryPayload, { onConflict: 'sku', ignoreDuplicates: false })
        .select('id, sku');

      if (invError) {
        console.error(`❌ Error en batch ${i}:`, invError);
        throw new Error(`Error en el lote ${i / BATCH_SIZE + 1}: ${invError.message}`);
      }

      if (batchInserted) {
        allInsertedProducts.push(...batchInserted);
        totalInserted += batchInserted.length;

        // 2. Upsert Stock Batch (only if needed)
        if (warehouseId && !updatePricesOnly) {
          const stockPayload = batchInserted.map((product) => {
            const originalItem = batchItems.find(item => item.sku === product.sku);
            return {
              product_id: product.id,
              warehouse_id: warehouseId,
              quantity: originalItem?.stock || 0,
              updated_at: new Date().toISOString()
            };
          });

          const { error: stockError } = await adminSupabase
            .from('product_stock')
            .upsert(stockPayload, { onConflict: 'product_id, warehouse_id' });

          if (stockError) {
            console.error(`❌ Error stock batch ${i}:`, stockError);
            // We continue? Or throw? Let's throw to be safe
            throw new Error(`Error actualizando stock en lote ${i / BATCH_SIZE + 1}`);
          }
        }
      }
    }

    return {
      success: true,
      message: `✅ Importación completada: ${totalInserted} productos procesados en lotes.`,
      insertedCount: totalInserted,
    };

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return {
      success: false,
      message:
        err instanceof Error ? err.message : 'Error desconocido en el servidor',
    };
  }
}

export async function deleteInventoryItem(id: string) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  // Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await adminSupabase
    .from('inventory')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/inventory');
  return { success: true };
}

export async function updateInventoryItem(id: string, data: Partial<DbInventoryItem>) {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  // Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await adminSupabase
    .from('inventory')
    .update(data)
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/inventory');
  return { success: true };
}

export async function getMasterInventory(): Promise<{
  success: boolean;
  data?: any[];
  warehouses?: { id: string; name: string }[];
  message?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Fetch Inventory with Costs
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('id, sku, description, brand, model, medida_full, cost_price, stock')
      .order('brand', { ascending: true });

    if (invError) throw new Error(invError.message);

    // 2. Fetch Warehouses
    const { data: warehouses, error: whError } = await supabase
      .from('warehouses')
      .select('id, name');

    if (whError) throw new Error(whError.message);

    // 3. Fetch Product Stock (breakdown)
    const { data: stocks, error: stockError } = await supabase
      .from('product_stock')
      .select('product_id, warehouse_id, quantity');

    if (stockError) throw new Error(stockError.message);

    // 4. Merge Data
    const mergedData = inventory ? inventory.map(item => {
      const itemStocks = stocks ? stocks.filter(s => s.product_id === item.id) : [];

      // Map warehouse id to name/qty
      const stockBreakdown = warehouses ? warehouses.map(w => {
        const s = itemStocks.find(st => st.warehouse_id === w.id);
        return {
          name: w.name,
          quantity: s ? s.quantity : 0
        };
      }) : [];

      return {
        ...item,
        stock_breakdown: stockBreakdown
      };
    }) : [];

    return {
      success: true,
      data: mergedData,
      warehouses: warehouses || []
    };
  } catch (error) {
    console.error('Error fetching master inventory:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}


/**
 * Elimina todo el stock de un almacén específico.
 * No elimina los productos del catálogo, solo pone su relación de stock a 0 (eliminando filas de product_stock).
 */
export async function clearWarehouseStock(warehouseId: string) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // Validar Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Usuario no autenticado' };

    const { error } = await adminSupabase
      .from('product_stock')
      .delete()
      .eq('warehouse_id', warehouseId);

    if (error) throw new Error(error.message);

    // Opcional: Recalcular stock global o confiar en triggers
    // Si tenemos el trigger sync_product_total_stock, éste se disparará al borrar?
    // Postgres triggers usually fire on DELETE too.

    revalidatePath('/dashboard/inventory');
    return { success: true, message: 'Stock del almacén vaciado correctamente.' };
  } catch (error) {
    console.error('Error clearing warehouse stock:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al vaciar almacén'
    };
  }
}

/**
 * Elimina TODO el inventario (Productos + Stock + Relaciones).
 * PELIGROSO: Solo para uso administrativo/reinicio.
 */
export async function clearAllInventory() {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // Validar Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Usuario no autenticado' };

    // 1. Borrar stock (relaciones) - Usamos neq id null hack para borrar todo
    const { error: stockError } = await adminSupabase
      .from('product_stock')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all

    if (stockError) throw new Error(`Stock: ${stockError.message}`);

    // 2. Borrar inventario (productos)
    const { error: invError } = await adminSupabase
      .from('inventory')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (invError) throw new Error(`Inventario: ${invError.message}`);

    revalidatePath('/dashboard/inventory');
    return { success: true, message: 'Catálogo e inventario eliminados totalmente.' };
  } catch (error) {
    console.error('Error clearing all inventory:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar inventario'
    };
  }
}
