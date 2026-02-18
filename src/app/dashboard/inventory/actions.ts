'use server';

import { createClient } from '@/lib/supabase/server';
import { InventoryItem } from '@/lib/logic/excel-parser';
import { InventoryItem as DbInventoryItem } from '@/lib/types';
import { revalidatePath } from 'next/cache';

/**
 * @fileoverview Server Action - Insertar items de inventario en Supabase
 * @author SOFIA - Builder
 * @id IMPL-20260129-SPRINT2
 */

export async function insertInventoryItems(
  items: InventoryItem[],
  warehouseId?: string,
  updatePricesOnly: boolean = false
): Promise<{
  success: boolean;
  message: string;
  insertedCount?: number;
  errors?: Array<{ index: number; error: string }>;
}> {
  try {
    const supabase = await createClient();

    // Obtener user_id del contexto autenticado
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

    // Preparar items para insertar con profile_id
    // Si updatePricesOnly es true, eliminamos 'stock' del objeto para que upsert no lo toque
    const itemsToInsert = items.map((item) => {
      const payload: any = {
        ...item,
        profile_id,
      };

      if (updatePricesOnly) {
        delete payload.stock;
        // También podríamos querer preservar el nombre/descripción si solo son precios, 
        // pero usualmente la lista maestra trae todo. 
        // Lo importante es NO tocar el stock.
      }
      return payload;
    });

    // Insertar/Actualizar en Inventario base (productos)
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

    // Si se seleccionó un almacén Y NO estamos en modo "Solo Precios", insertar el stock específico
    if (warehouseId && insertedProducts && !updatePricesOnly) {
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
    } else {
      // Si estamos en updatePricesOnly, no tocamos product_stock.
    }

    return {
      success: true,
      message: `✅ ${insertedProducts?.length || items.length} items procesados exitosamente ${updatePricesOnly ? '(Solo Precios Actualizados)' : ''}`,
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
