-- Migration: 007_quotation_discount
-- Description: Add discount fields to quotations
-- @id IMPL-20260129-QUOTES-DISCOUNT

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'amount')) DEFAULT 'amount';

ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2) DEFAULT 0;
