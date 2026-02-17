'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type Warehouse = {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
};

export async function getWarehouses(): Promise<Warehouse[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching warehouses:', error);
        return [];
    }

    return data || [];
}

export async function createWarehouse(name: string, code: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('warehouses')
        .insert({ name, code });

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/inventory');
}
