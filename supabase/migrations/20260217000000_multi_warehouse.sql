-- Migration: Multi-Warehouse Support
-- Description: Adds warehouses and product_stock tables. Updates inventory stock calculation.
-- @ref context/SPECS/SPEC-MULTI-WAREHOUSE.md

-- 1. Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE, -- e.g., 'A1', 'A2', 'A3'
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial warehouses
INSERT INTO warehouses (name, code) VALUES 
('Almacen Queretaro', 'A1'),
('Almacen Romerillal', 'A2'),
('Rodallantas', 'A3')
ON CONFLICT DO NOTHING;

-- 2. Create product_stock table (1:N relationship)
CREATE TABLE IF NOT EXISTS product_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id)
);

-- 3. Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;

-- Policies for warehouses (Public read for authenticated users, Admin write)
CREATE POLICY "Enable read access for authenticated users" ON warehouses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for admins" ON warehouses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Policies for product_stock (Same as inventory: Read all, Write Admin/Seller?)
-- Allowing sellers to read stock is critical. 
-- Writing should probably be restricted to System/Admin or specific actions.
CREATE POLICY "Enable read access for authenticated users" ON product_stock
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for admins and sellers" ON product_stock
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'seller'))
    );

-- 4. Trigger to synchronize inventory.stock (Virtual Field Simulation)
-- When product_stock changes, update the total stock in the parent product record
CREATE OR REPLACE FUNCTION sync_product_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory
    SET stock = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM product_stock
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_stock_change
AFTER INSERT OR UPDATE OR DELETE ON product_stock
FOR EACH ROW EXECUTE FUNCTION sync_product_total_stock();

-- 5. Backfill/Migration Script (Important!)
-- If there is existing inventory, we assume it belongs to 'A1' (Principal)
DO $$
DECLARE
    v_a1_id UUID;
BEGIN
    SELECT id INTO v_a1_id FROM warehouses WHERE code = 'A1';

    -- Insert existing stock into product_stock linking to A1
    INSERT INTO product_stock (product_id, warehouse_id, quantity)
    SELECT id, v_a1_id, stock
    FROM inventory
    WHERE stock > 0
    ON CONFLICT (product_id, warehouse_id) 
    DO UPDATE SET quantity = EXCLUDED.quantity;
    
END $$;

-- 6. Update decrement_product_stock to use product_stock table
-- Strategy: Decrement from the warehouse with the MOST stock first (to avoid going negative easily in small warehouses)
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_profile_id UUID, -- Deprecated/Unused in V2 logic but kept for signature compatibility
  p_quantity INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_stock INT;
  v_remaining_qty INT;
  v_stock_record RECORD;
BEGIN
  -- 1. Check Global Stock
  SELECT stock INTO v_total_stock FROM inventory WHERE id = p_product_id;
  
  IF v_total_stock IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Producto no encontrado');
  END IF;

  IF v_total_stock < p_quantity THEN
    RETURN json_build_object('success', false, 'error', 'Stock insuficiente global');
  END IF;

  v_remaining_qty := p_quantity;

  -- 2. Iterate over warehouses with stock, ordering by quantity DESC (Greedy approach)
  FOR v_stock_record IN 
    SELECT id, quantity 
    FROM product_stock 
    WHERE product_id = p_product_id AND quantity > 0
    ORDER BY quantity DESC
    FOR UPDATE
  LOOP
    IF v_remaining_qty <= 0 THEN
      EXIT;
    END IF;

    IF v_stock_record.quantity >= v_remaining_qty THEN
      -- This warehouse has enough to cover the rest
      UPDATE product_stock 
      SET quantity = quantity - v_remaining_qty,
          updated_at = NOW()
      WHERE id = v_stock_record.id;
      
      v_remaining_qty := 0;
    ELSE
      -- Take all from this warehouse and continue
      UPDATE product_stock 
      SET quantity = 0,
          updated_at = NOW()
      WHERE id = v_stock_record.id;
      
      v_remaining_qty := v_remaining_qty - v_stock_record.quantity;
    END IF;
  END LOOP;

  -- 3. Final Check (Should be 0 if logic is correct and global stock check passed)
  IF v_remaining_qty > 0 THEN
    -- This ideally shouldn't happen if sum(product_stock) == inventory.stock
    -- But if it does, we must rollback or force an error
    RAISE EXCEPTION 'Inconsistencia de stock: Global dice SI, pero almacenes dicen NO.';
  END IF;

  RETURN json_build_object('success', true, 'new_stock', v_total_stock - p_quantity);
END;
$$;
