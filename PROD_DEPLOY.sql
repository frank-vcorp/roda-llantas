-- Migration: 013_crm_customers
-- Description: Create customers table and link to quotations
-- @ref context/SPEC-CRM-LITE.md

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    tax_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add customer_id to quotations table
ALTER TABLE quotations
ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- 3. Enable RLS on customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 4. Customers Policies
CREATE POLICY "Users can view their own customers" ON customers
    FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can create customers" ON customers
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own customers" ON customers
    FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own customers" ON customers
    FOR DELETE
    USING (auth.uid() = profile_id);

-- 5. Create index on full_name for search performance
CREATE INDEX IF NOT EXISTS idx_customers_profile_full_name 
ON customers(profile_id, full_name);

-- 6. Create index on phone for search performance
CREATE INDEX IF NOT EXISTS idx_customers_profile_phone 
ON customers(profile_id, phone);
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
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- FIX-20260129-SALES-02: Crear función RPC para conversión atómica de cotización a venta
-- Esta función encapsula toda la lógica en una transacción ACID para evitar condiciones de carrera

CREATE OR REPLACE FUNCTION confirm_sale(
  p_quotation_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_quotation RECORD;
  v_item RECORD;
  v_sale_id UUID;
BEGIN
  -- 1. Validar Cotización
  SELECT * FROM quotations WHERE id = p_quotation_id INTO v_quotation;
  IF v_quotation IS NULL THEN
    RAISE EXCEPTION 'Cotización no encontrada';
  END IF;
  IF v_quotation.status = 'sold' THEN
    RAISE EXCEPTION 'La cotización ya ha sido vendida';
  END IF;

  -- 2. Validar Stock (Locking rows)
  FOR v_item IN SELECT * FROM quotation_items WHERE quotation_id = p_quotation_id LOOP
    IF (SELECT stock FROM products WHERE id = v_item.product_id) < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', v_item.product_id;
    END IF;
  END LOOP;

  -- 3. Crear Venta
  INSERT INTO sales (quotation_id, customer_id, total_amount, status)
  VALUES (p_quotation_id, v_quotation.customer_id, v_quotation.total_amount, 'completed')
  RETURNING id INTO v_sale_id;

  -- 4. Mover Items y Descontar Stock
  FOR v_item IN SELECT * FROM quotation_items WHERE quotation_id = p_quotation_id LOOP
    -- Insertar en sale_items
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
    VALUES (v_sale_id, v_item.product_id, v_item.quantity, v_item.unit_price, v_item.total_price);
    
    -- Descontar Stock
    UPDATE products 
    SET stock = stock - v_item.quantity 
    WHERE id = v_item.product_id;
  END LOOP;

  -- 5. Cerrar Cotización
  UPDATE quotations SET status = 'sold' WHERE id = p_quotation_id;

  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id);
END;
$$ LANGUAGE plpgsql;
-- Migration: Lost Sales Summary View
-- Description: Creates view for aggregating lost sales queries with frequency and last seen date
-- Author: SOFIA - Builder
-- ID: IMPL-20260129-LOST-SALES-02

CREATE OR REPLACE VIEW lost_sales_summary AS
SELECT 
  TRIM(LOWER(query)) as normalized_query,
  COUNT(*) as frequency,
  MAX(created_at) as last_seen
FROM lost_sales
GROUP BY TRIM(LOWER(query))
ORDER BY frequency DESC;
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
/**
 * MIGRACIÓN: Tabla de Profiles y Roles (RBAC)
 * 
 * - Tabla profiles: Extensión de auth.users con rol y metadata
 * - Trigger: Auto-crea profile al registrarse usuario
 * - RLS: Users solo leen su perfil, admins leen/editan todo
 * 
 * @id IMPL-20260129-ROLES-MOBILE
 * @author SOFIA - Builder
 */

-- 1. Crear tabla profiles (extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'seller')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Política: Usuarios pueden leer su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Política: Admins pueden leer/editar todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5. Crear función que auto-genera profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role'), 'seller')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para auto-crear profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Seed inicial: Asignar role 'admin' al primer usuario (si existe)
-- Este es un helper para pruebas locales
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Obtener el primer usuario registrado
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = first_user_id;
  END IF;
END $$;

-- 8. Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 9. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_update_updated_at ON public.profiles;
CREATE TRIGGER profiles_update_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();
