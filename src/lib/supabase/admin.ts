import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con privilegios de Admin (Service Role)
 * Úsalo SOLO en el servidor para operaciones que requieren saltarse el RLS
 * (ej. acceso público a inventario si RLS bloquea, o tareas de mantenimiento)
 */
export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
