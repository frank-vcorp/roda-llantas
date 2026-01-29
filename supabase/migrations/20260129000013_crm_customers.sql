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
