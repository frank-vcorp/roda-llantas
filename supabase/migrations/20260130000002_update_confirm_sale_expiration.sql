-- IMPL-20260130-V2-FEATURES-02: Update confirm_sale RPC with expiration validation
-- Description: Add validation to prevent converting expired quotations to sales
-- @author SOFIA - Builder
-- @id IMPL-20260130-V2-FEATURES

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

  -- IMPL-20260130-V2-FEATURES: Validar que la cotización no haya expirado
  IF NOW() > v_quotation.valid_until THEN
    RAISE EXCEPTION 'Cotización expirada';
  END IF;

  -- 2. Validar Stock (Locking rows)
  FOR v_item IN SELECT * FROM quotation_items WHERE quotation_id = p_quotation_id LOOP
    IF (SELECT stock FROM inventory WHERE id = v_item.inventory_id) < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', v_item.inventory_id;
    END IF;
  END LOOP;

  -- 3. Crear Venta
  INSERT INTO sales (quotation_id, customer_id, total_amount, status, profile_id)
  VALUES (p_quotation_id, v_quotation.customer_id, v_quotation.total_amount, 'completed', v_quotation.profile_id)
  RETURNING id INTO v_sale_id;

  -- 4. Mover Items y Descontar Stock
  FOR v_item IN SELECT * FROM quotation_items WHERE quotation_id = p_quotation_id LOOP
    -- Insertar en sale_items
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
    VALUES (v_sale_id, v_item.inventory_id, v_item.quantity, v_item.unit_price, v_item.subtotal);
    
    -- Descontar Stock
    UPDATE inventory 
    SET stock = stock - v_item.quantity 
    WHERE id = v_item.inventory_id;
  END LOOP;

  -- 5. Cerrar Cotización
  UPDATE quotations SET status = 'sold' WHERE id = p_quotation_id;

  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id);
END;
$$ LANGUAGE plpgsql;
