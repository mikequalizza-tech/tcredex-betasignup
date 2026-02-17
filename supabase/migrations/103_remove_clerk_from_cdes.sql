-- =============================================================================
-- Remove Clerk references from cdes_merged table
-- Migration: 103_remove_clerk_from_cdes.sql
-- Created: 2026-01-31
-- =============================================================================

-- Drop the Clerk index
DROP INDEX IF EXISTS idx_cdes_merged_clerk_id;

-- Drop the unique constraint
ALTER TABLE cdes_merged DROP CONSTRAINT IF EXISTS cdes_merged_clerk_id_key;

-- Drop the clerk_id column
ALTER TABLE cdes_merged DROP COLUMN IF EXISTS clerk_id;

-- =============================================================================
-- While we're here, add missing AutoMatch qualifier columns
-- =============================================================================

-- Sector preferences (array of sectors CDE focuses on)
ALTER TABLE cdes_merged ADD COLUMN IF NOT EXISTS target_sectors text[] DEFAULT '{}';

-- Distress requirements
ALTER TABLE cdes_merged ADD COLUMN IF NOT EXISTS require_severely_distressed boolean DEFAULT false;
ALTER TABLE cdes_merged ADD COLUMN IF NOT EXISTS min_distress_percentile integer DEFAULT 0;

-- Community focus
ALTER TABLE cdes_merged ADD COLUMN IF NOT EXISTS minority_focus boolean DEFAULT false;
ALTER TABLE cdes_merged ADD COLUMN IF NOT EXISTS uts_focus boolean DEFAULT false;

-- Entity type preference
ALTER TABLE cdes_merged ADD COLUMN IF NOT EXISTS nonprofit_preferred boolean DEFAULT false;
ALTER TABLE cdes_merged ADD COLUMN IF NOT EXISTS forprofit_accepted boolean DEFAULT true;

-- Owner occupied preference
ALTER TABLE cdes_merged ADD COLUMN IF NOT EXISTS owner_occupied_preferred boolean DEFAULT false;

-- Add index for sector matching
CREATE INDEX IF NOT EXISTS idx_cdes_merged_sectors ON cdes_merged USING gin(target_sectors);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON COLUMN cdes_merged.target_sectors IS 'Array of sector preferences: healthcare, education, manufacturing, community_facility, housing, etc.';
COMMENT ON COLUMN cdes_merged.require_severely_distressed IS 'CDE only considers severely distressed census tracts';
COMMENT ON COLUMN cdes_merged.min_distress_percentile IS 'Minimum distress percentile required (0-100)';
COMMENT ON COLUMN cdes_merged.minority_focus IS 'CDE focuses on minority communities';
COMMENT ON COLUMN cdes_merged.uts_focus IS 'CDE targets Underserved Targeted States';
COMMENT ON COLUMN cdes_merged.nonprofit_preferred IS 'CDE prefers non-profit borrowers';
COMMENT ON COLUMN cdes_merged.owner_occupied_preferred IS 'CDE prefers owner-occupied projects';
