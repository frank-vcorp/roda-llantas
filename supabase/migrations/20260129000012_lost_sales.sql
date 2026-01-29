-- Migration: Lost Sales
-- Description: Creates table to track unsatisfied search queries (zero results)
-- Author: SOFIA - Builder
-- ID: IMPL-20260129-LOST-SALES-01

CREATE TABLE lost_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for query analysis
CREATE INDEX lost_sales_profile_id_created_at_idx 
ON lost_sales(profile_id, created_at DESC);

CREATE INDEX lost_sales_query_idx 
ON lost_sales USING GIN(to_tsvector('spanish', query));

-- RLS Policies
ALTER TABLE lost_sales ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own lost sales
CREATE POLICY "Users can insert own lost sales"
ON lost_sales
FOR INSERT
WITH CHECK (profile_id = auth.uid());

-- Policy: Users can view their own lost sales
CREATE POLICY "Users can view own lost sales"
ON lost_sales
FOR SELECT
USING (profile_id = auth.uid());
