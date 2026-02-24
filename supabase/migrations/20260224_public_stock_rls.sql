-- FIX-20260224: Allow anonymous (public) users to read product_stock and warehouses
-- This is required so that the public-facing inventory page can display
-- per-warehouse stock indicators (A1: 5, A2: 3) without authentication.

-- Enable RLS if not already enabled
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Drop existing anon read policies if they exist (safe to retry)
DROP POLICY IF EXISTS "Public read product_stock" ON product_stock;
DROP POLICY IF EXISTS "Public read warehouses" ON warehouses;

-- Allow anonymous users to read product_stock
CREATE POLICY "Public read product_stock"
  ON product_stock
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous users to read warehouses
CREATE POLICY "Public read warehouses"
  ON warehouses
  FOR SELECT
  TO anon, authenticated
  USING (true);
