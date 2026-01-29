-- Migration: 004_fix_pricing_columns
-- Description: Reparación de columnas faltantes en pricing_rules
-- Date: 2026-01-29
-- FIX REFERENCE: FIX-20260129-05
-- Causa raíz: La tabla pricing_rules existía de un intento previo sin las columnas
--             is_active y priority. CREATE TABLE IF NOT EXISTS no las añadió.

-- ============================================================
-- 1. Añadir columnas faltantes si no existen
-- ============================================================

ALTER TABLE pricing_rules 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE pricing_rules 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Asegurar que margin_percentage existe y tiene valor por defecto
ALTER TABLE pricing_rules 
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 30.00;

ALTER TABLE pricing_rules 
ALTER COLUMN margin_percentage SET DEFAULT 30.00;

-- ============================================================
-- 2. Forzar recarga del caché de PostgREST
-- ============================================================
-- Esto notifica a PostgREST que debe recargar el esquema de la DB
-- para reconocer las nuevas columnas inmediatamente.

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 3. Verificación (comentado, solo para debug manual)
-- ============================================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'pricing_rules';
