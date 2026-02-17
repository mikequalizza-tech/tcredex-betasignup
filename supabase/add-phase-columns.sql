-- =============================================================================
-- TCREDEX PHASE WIRING SQL
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- 1. Add phase column to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'investor';

-- 2. Add visibility_level column to deals  
ALTER TABLE deals ADD COLUMN IF NOT EXISTS visibility_level TEXT DEFAULT 'market';

-- 3. Add constraint for phase values
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_phase_check;
ALTER TABLE deals ADD CONSTRAINT deals_phase_check 
  CHECK (phase IN ('investor', 'cde', 'closed'));

-- 4. Add constraint for visibility_level values
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_visibility_check;
ALTER TABLE deals ADD CONSTRAINT deals_visibility_check 
  CHECK (visibility_level IN ('private', 'market', 'invited'));

-- 5. Update existing deals based on current state
UPDATE deals 
SET phase = CASE 
  WHEN status = 'closed' THEN 'closed'
  WHEN assigned_cde_id IS NOT NULL THEN 'cde'
  ELSE 'investor'
END;

-- 6. Verify
SELECT id, project_name, programs, status, phase, visibility_level, assigned_cde_id 
FROM deals;
