-- Migration: Lost Sales Summary View
-- Description: Creates view for aggregating lost sales queries with frequency and last seen date
-- Author: SOFIA - Builder
-- ID: IMPL-20260129-LOST-SALES-02
-- FIX REFERENCE: FIX-20260129-05 - Columna es search_term (de init_schema), no query

CREATE OR REPLACE VIEW lost_sales_summary AS
SELECT 
  TRIM(LOWER(search_term)) as normalized_query,
  COUNT(*) as frequency,
  MAX(created_at) as last_seen
FROM lost_sales
GROUP BY TRIM(LOWER(search_term))
ORDER BY frequency DESC;
