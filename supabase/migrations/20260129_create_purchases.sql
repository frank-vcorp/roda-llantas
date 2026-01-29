-- Migration: Create Purchases and Purchase Items tables with RPC
-- ID: IMPL-20260129-PURCHASES-01
-- Author: SOFIA - Builder
-- Date: 2026-01-29

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(profile_id, invoice_number)
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10, 2) NOT NULL CHECK (unit_cost > 0),
  total_cost NUMERIC(10, 2) NOT NULL CHECK (total_cost > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchases
CREATE POLICY "purchases_select_own" ON purchases
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "purchases_insert_own" ON purchases
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "purchases_update_own" ON purchases
  FOR UPDATE USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- RLS Policies for purchase_items
CREATE POLICY "purchase_items_select_own" ON purchase_items
  FOR SELECT USING (
    purchase_id IN (SELECT id FROM purchases WHERE profile_id = auth.uid())
  );

CREATE POLICY "purchase_items_insert_own" ON purchase_items
  FOR INSERT WITH CHECK (
    purchase_id IN (SELECT id FROM purchases WHERE profile_id = auth.uid())
  );

-- Create transactional RPC function to register purchase
CREATE OR REPLACE FUNCTION register_purchase(
  p_profile_id UUID,
  p_provider_name TEXT,
  p_invoice_number TEXT,
  p_purchase_date DATE,
  p_total_amount NUMERIC,
  p_items JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  purchase_id UUID,
  message TEXT
) AS $$
DECLARE
  v_purchase_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_unit_cost NUMERIC;
  v_total_cost NUMERIC;
BEGIN
  -- Check auth
  IF auth.uid() != p_profile_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Unauthorized'::TEXT;
    RETURN;
  END IF;

  -- Insert purchase
  INSERT INTO purchases (profile_id, provider_name, invoice_number, purchase_date, total_amount)
  VALUES (p_profile_id, p_provider_name, p_invoice_number, p_purchase_date, p_total_amount)
  RETURNING purchases.id INTO v_purchase_id;

  -- Process items
  FOR v_item IN SELECT jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_unit_cost := (v_item->>'unitCost')::NUMERIC;
    v_total_cost := v_quantity * v_unit_cost;

    -- Insert purchase item
    INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, total_cost)
    VALUES (v_purchase_id, v_product_id, v_quantity, v_unit_cost, v_total_cost);

    -- Update product stock and cost_price
    UPDATE inventory
    SET 
      stock = stock + v_quantity,
      cost_price = v_unit_cost,
      updated_at = now()
    WHERE id = v_product_id;
  END LOOP;

  RETURN QUERY SELECT TRUE, v_purchase_id, 'Purchase registered successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_profile_id ON purchases(profile_id);
CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(profile_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
