-- Migration: Add Unique Constraint to SKU
-- Description: Ensures SKUs are unique to allow UPSERT operations.

-- 1. Optional: Clean up duplicates (keeping the latest one)
-- This subquery keeps the row with the most recent updated_at/created_at for each SKU
/*
DELETE FROM inventory a USING inventory b
WHERE a.id < b.id
AND a.sku = b.sku;
*/

-- 2. Add Unique Constraint
ALTER TABLE inventory ADD CONSTRAINT inventory_sku_key UNIQUE (sku);
