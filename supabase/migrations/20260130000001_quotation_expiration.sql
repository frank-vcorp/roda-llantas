-- IMPL-20260130-V2-FEATURES-01: Quotation Expiration Feature
-- Description: Add valid_until column to quotations table for quote expiration management
-- @author SOFIA - Builder
-- @id IMPL-20260130-V2-FEATURES

-- 1. Add valid_until column to quotations table
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 days');

-- 2. Create index for efficient expiration checks
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON quotations(valid_until);
