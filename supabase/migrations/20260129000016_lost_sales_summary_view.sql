-- Migration: Lost Sales Summary View
-- Description: Creates view for aggregating lost sales queries with frequency and last seen date
-- Author: SOFIA - Builder
-- ID: IMPL-20260129-LOST-SALES-02

CREATE OR REPLACE VIEW lost_sales_summary AS
SELECT 
  TRIM(LOWER(query)) as normalized_query,
  COUNT(*) as frequency,
  MAX(created_at) as last_seen
FROM lost_sales
GROUP BY TRIM(LOWER(query))
ORDER BY frequency DESC;
