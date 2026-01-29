/**
 * Script para aplicar migración: lost_sales_summary view
 * IMPL-20260129-LOST-SALES-02
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migration = `
CREATE OR REPLACE VIEW lost_sales_summary AS
SELECT 
  TRIM(LOWER(query)) as normalized_query,
  COUNT(*) as frequency,
  MAX(created_at) as last_seen
FROM lost_sales
GROUP BY TRIM(LOWER(query))
ORDER BY frequency DESC;
`;

async function applyMigration() {
  try {
    console.log('Aplicando migración: lost_sales_summary view...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: migration,
    }).catch(async () => {
      // Si no existe exec_sql, intentar directamente con SQL
      const { data, error } = await supabase
        .from('lost_sales')
        .select('count')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      // Usar el cliente para ejecutar SQL directamente
      return await supabase.query(migration);
    });

    if (error) {
      throw error;
    }

    console.log('✓ Migración aplicada exitosamente: lost_sales_summary view creada');
  } catch (error) {
    console.error('✗ Error al aplicar migración:', error);
    process.exit(1);
  }
}

applyMigration();
