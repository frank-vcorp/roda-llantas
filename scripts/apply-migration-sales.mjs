/**
 * Script para aplicar migración de sales manualmente
 * IMPL-20260129-SALES-01
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
-- Tabla sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.profiles(id) ON DELETE CASCADE,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC'::text, NOW())
);

-- Tabla sale_items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC'::text, NOW())
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sales_profile_id ON sales(profile_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotation_id ON sales(quotation_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Actualizar cotizaciones para agregar status 'sold' si no existe
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sold', 'cancelled'));
`;

async function runMigration() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migration });
    if (error) {
      console.error('Error en migración:', error);
      process.exit(1);
    }
    console.log('Migración aplicada exitosamente');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runMigration();
