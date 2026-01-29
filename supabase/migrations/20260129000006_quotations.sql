-- Migration: 006_quotations
-- Description: Create quotations and quotation_items tables
-- @ref context/SPEC-QUOTATIONS.md

-- 1. Quotations Header
CREATE TABLE IF NOT EXISTS quotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed'))
);

-- 2. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
    inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL, -- Keep item even if inventory logic changes
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL, -- Snapshot price
    subtotal NUMERIC(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- 3. RLS Policies
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Quotations Policies
CREATE POLICY "Users can manage their own quotations" ON quotations
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Quotation Items Policies
-- Access is controlled via the parent quotation
CREATE POLICY "Users can manage items of their quotes" ON quotation_items
    USING (
        EXISTS (
            SELECT 1 FROM quotations q 
            WHERE q.id = quotation_items.quotation_id 
            AND q.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quotations q 
            WHERE q.id = quotation_items.quotation_id 
            AND q.profile_id = auth.uid()
        )
    );

-- 4. Indexes
CREATE INDEX idx_quotations_profile ON quotations(profile_id);
CREATE INDEX idx_quotation_items_quote ON quotation_items(quotation_id);
