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
  items: InventoryItem[]
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
    const itemsToInsert = items.map((item) => ({
      ...item,
      profile_id,
    }));

    // Insertar en Supabase
    const { error, data } = await supabase
      .from('inventory')
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error('❌ Error al insertar inventario:', error);
      return {
        success: false,
        message: `Error en la base de datos: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `✅ ${data?.length || items.length} items insertados exitosamente`,
      insertedCount: data?.length || items.length,
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
