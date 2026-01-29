/**
 * IMPL-20260129-SALES-01: Migración para tablas sales y sale_items
 * Conversión de Cotización a Venta (Salida de Stock)
 *
 * Autor: SOFIA - Builder
 * Fecha: 2026-01-29
 */

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
CREATE INDEX idx_sales_profile_id ON sales(profile_id);
CREATE INDEX idx_sales_quotation_id ON sales(quotation_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Actualizar cotizaciones para agregar status 'sold' si no existe
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sold', 'cancelled'));

-- RPC Function para decrementar stock de productos de forma atómica
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_profile_id UUID,
  p_quantity INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INT;
  v_result JSON;
BEGIN
  -- Obtener stock actual
  SELECT stock INTO v_current_stock
  FROM products
  WHERE id = p_product_id AND profile_id = p_profile_id
  FOR UPDATE;

  -- Validar stock
  IF v_current_stock IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Producto no encontrado');
  END IF;

  IF v_current_stock < p_quantity THEN
    RETURN json_build_object('success', false, 'error', 'Stock insuficiente');
  END IF;

  -- Decrementar stock
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = TIMEZONE('UTC'::text, NOW())
  WHERE id = p_product_id AND profile_id = p_profile_id;

  RETURN json_build_object('success', true, 'new_stock', v_current_stock - p_quantity);
END;
$$;
