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
