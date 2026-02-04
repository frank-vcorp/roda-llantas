
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configurar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const migrationFile = path.resolve(__dirname, '../supabase/migrations/20260204000001_fix_search_sorting.sql');

    console.log(`Leyendo migración: ${migrationFile}`);

    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('Aplicando migración...');

        // Usar RPC exec_sql
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('Error al aplicar la migración:', error);
            process.exit(1);
        }

        console.log('✅ Migración aplicada exitosamente.');

    } catch (err) {
        console.error('Error inesperado:', err);
        process.exit(1);
    }
}

runMigration();
