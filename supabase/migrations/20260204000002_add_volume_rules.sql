-- Migration: 20260204000002_add_volume_rules.sql
-- ID: FIX-20260204-PRICING-VOL
-- Descripción: Agrega columna para reglas de descuento por volumen (Escalas).

ALTER TABLE pricing_rules 
ADD COLUMN IF NOT EXISTS volume_rules JSONB DEFAULT '[]'::jsonb;

-- Comentario para documentación
COMMENT ON COLUMN pricing_rules.volume_rules IS 'Array de escalas: [{ "min_qty": 4, "margin_percentage": 25 }]';
