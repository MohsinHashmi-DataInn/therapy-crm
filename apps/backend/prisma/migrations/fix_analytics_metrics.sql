-- Fix the not-null constraint violation for updated_at in analytics_metrics table
-- First, update any existing rows to have an updated_at value
UPDATE analytics_metrics
SET updated_at = NOW()
WHERE updated_at IS NULL;

-- Then add a default value for any future inserts
ALTER TABLE analytics_metrics
ALTER COLUMN updated_at SET DEFAULT NOW();
