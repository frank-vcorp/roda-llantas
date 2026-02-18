-- Fix duplicate volume tiers in PUBLICO rule
-- Current state (observed): x3 (30%), x3 (25%), x4 (20%)
-- New state (corrected): x3 (30%), x4 (25%), x8 (20%)

UPDATE pricing_rules
SET volume_rules = '[
  {"min_qty": 3, "margin_percentage": 30},
  {"min_qty": 4, "margin_percentage": 25},
  {"min_qty": 8, "margin_percentage": 20}
]'::jsonb
WHERE name = 'PUBLICO';
