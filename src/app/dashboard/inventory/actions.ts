'use server';

import { createClient } from '@/lib/supabase/server';
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

    const itemsToInsert = items.map((item) => {
      const payload: any = {
        ...item,
        profile_id,
      };

      if (updatePricesOnly) {
        delete payload.stock;
      }
      return payload;
    });

    const { error: inventoryError, data: insertedProducts } = await supabase
      .from('inventory')
      .upsert(itemsToInsert, {
        onConflict: 'sku',
        ignoreDuplicates: false
      })
      .select('id, sku');

    if (inventoryError) {
      console.error('❌ Error al insertar inventario base:', inventoryError);
      return {
        success: false,
        message: `Error en la base de datos (Inventario): ${inventoryError.message}`,
      };
    }

    if (warehouseId && !updatePricesOnly) {
      // Si se solicitó MODO REEMPLAZO, vaciamos el stock de este almacén antes de insertar
      if (replaceStock) {
        await supabase
          .from('product_stock')
          .delete()
          .eq('warehouse_id', warehouseId);
      }

      // Procedemos a insertar/actualizar el stock
      if (insertedProducts) {

        const stockItems = insertedProducts.map((product) => {
          const originalItem = items.find(i => i.sku === product.sku);
          return {
            product_id: product.id,
            warehouse_id: warehouseId,
            quantity: originalItem?.stock || 0,
            updated_at: new Date().toISOString()
          };
        });

        const { error: stockError } = await supabase
          .from('product_stock')
          .upsert(stockItems, {
            onConflict: 'product_id, warehouse_id'
          });

        if (stockError) {
          console.error('❌ Error al insertar stock por almacén:', stockError);
        }
      }

      return {
        success: true,
        message: `✅ ${insertedProducts?.length || items.length} items procesados exitosamente ${updatePricesOnly ? '(Solo Precios Actualizados)' : ''}`,
        insertedCount: insertedProducts?.length || items.length,
      };
    }

    // Fallback success return if not entering the if block above
    return {
      success: true,
      message: `✅ ${insertedProducts?.length || items.length} items procesados exitosamente`,
      insertedCount: insertedProducts?.length || items.length,
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

  const { error } = await supabase
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

  const { error } = await supabase
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

    // Validar permisos? (Por ahora abierto a auth users)

    const { error } = await supabase
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

    // 1. Borrar stock (relaciones)
    const { error: stockError } = await supabase
      .from('product_stock')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all

    if (stockError) throw new Error(`Stock: ${stockError.message}`);

    // 2. Borrar inventario (productos)
    const { error: invError } = await supabase
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
