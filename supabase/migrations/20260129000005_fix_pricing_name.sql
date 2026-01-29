-- Fix: Ensure 'name' column exists and reload schema cache
-- @id FIX-SCHEMA-CACHE-02
-- @ref context/SPEC-PRICING-ENGINE.md

-- 1. Ensure 'name' column exists (Idempotent)
ALTER TABLE pricing_rules 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Nueva Regla';

-- 2. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
