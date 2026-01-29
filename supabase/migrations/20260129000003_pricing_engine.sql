-- Migration: 003_pricing_engine
-- Description: Create pricing_rules table and add manual_price to inventory
-- Date: 2026-01-29

-- 1. Add manual_price to inventory
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS manual_price NUMERIC(10, 2) DEFAULT NULL;

-- 2. Create pricing_rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional: link to user who created it
    name TEXT NOT NULL,
    brand_pattern TEXT, -- e.g., 'Michelin' or '%' for all
    margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 30.00, -- e.g. 30.00 for 30%
    priority INTEGER DEFAULT 1, -- Higher number = higher priority
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Enable RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Allow read/write for authenticated users (assuming single tenant or shared for now from context)
-- Adjusting to match inventory policies seen previously (likely profile_id based or public for this app)

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON pricing_rules;
CREATE POLICY "Enable read access for authenticated users" ON pricing_rules
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON pricing_rules;
CREATE POLICY "Enable insert for authenticated users" ON pricing_rules
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON pricing_rules;
CREATE POLICY "Enable update for authenticated users" ON pricing_rules
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON pricing_rules;
CREATE POLICY "Enable delete for authenticated users" ON pricing_rules
    FOR DELETE
    TO authenticated
    USING (true);
