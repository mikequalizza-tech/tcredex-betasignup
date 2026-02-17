-- =============================================================================
-- Migration 025: Data Integrity Constraints
-- =============================================================================
-- 1. Add NOT NULL constraint on deals.sponsor_id (prevent orphan deals)
-- 2. Add unique constraint to prevent duplicate deals
-- 3. Create optimized vector tile function
-- 4. Add spatial indexes for tile performance
-- =============================================================================

-- =============================================================================
-- STEP 1: Clean up and add sponsor_id constraint
-- =============================================================================

-- First, delete any orphan deals (no sponsor)
DELETE FROM deals WHERE sponsor_id IS NULL;

-- Add NOT NULL constraint to prevent future orphan deals
ALTER TABLE deals ALTER COLUMN sponsor_id SET NOT NULL;

-- =============================================================================
-- STEP 2: Add unique constraint for deals
-- =============================================================================
-- A deal should be unique by: project_name + census_tract + sponsor_id
-- This prevents the same sponsor from submitting duplicate projects

-- First drop if exists (idempotent)
ALTER TABLE deals DROP CONSTRAINT IF EXISTS unique_deal_per_sponsor;

-- Add unique constraint
ALTER TABLE deals ADD CONSTRAINT unique_deal_per_sponsor
  UNIQUE (project_name, census_tract, sponsor_id);

-- =============================================================================
-- STEP 3: Create optimized vector tile RPC function
-- =============================================================================
-- Uses pre-calculated stack_score from master_tax_credit_sot
-- Returns MVT protobuf for Mapbox GL JS consumption

CREATE OR REPLACE FUNCTION get_vector_tile(z integer, x integer, y integer)
RETURNS bytea AS $$
DECLARE
  result bytea;
  simplify_factor float;
BEGIN
  -- Adjust simplification based on zoom level
  IF z < 6 THEN
    simplify_factor := 0.01;
  ELSIF z < 10 THEN
    simplify_factor := 0.001;
  ELSE
    simplify_factor := 0.0001;
  END IF;

  -- Generate MVT tile
  SELECT ST_AsMVT(tile, 'tracts', 4096, 'geom') INTO result
  FROM (
    SELECT
      g.geoid,
      -- e = eligible (has any tax credit program)
      CASE WHEN (
        COALESCE(s.is_nmtc_eligible, false) OR
        COALESCE(s.is_nmtc_high_migration, false) OR
        COALESCE(s.is_lihtc_qct_2025, false) OR
        COALESCE(s.is_lihtc_qct_2026, false) OR
        COALESCE(s.is_oz_designated, false)
      ) THEN 1 ELSE 0 END AS e,
      -- s = stack score (number of programs)
      COALESCE(s.stack_score, 0) AS s,
      ST_AsMVTGeom(
        ST_Transform(
          COALESCE(g.geometry_simplified, ST_Simplify(g.geometry, simplify_factor)),
          3857
        ),
        ST_TileEnvelope(z, x, y),
        4096, 64, true
      ) AS geom
    FROM tract_geometries g
    LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid
    WHERE g.geometry && ST_Transform(ST_TileEnvelope(z, x, y), 4326)
  ) AS tile
  WHERE geom IS NOT NULL;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_vector_tile(integer, integer, integer) TO anon, authenticated;

COMMENT ON FUNCTION get_vector_tile IS 'Generate MVT vector tiles for census tract eligibility map';

-- =============================================================================
-- STEP 4: Ensure spatial indexes exist for tract_geometries
-- =============================================================================

-- Create spatial index if not exists (will skip if already exists)
CREATE INDEX IF NOT EXISTS idx_tract_geometries_geom_gist
  ON tract_geometries USING GIST(geometry);

-- Index on state for filtering
CREATE INDEX IF NOT EXISTS idx_tract_geometries_state_fips
  ON tract_geometries(state_fips);

-- Composite index for tile queries
CREATE INDEX IF NOT EXISTS idx_tract_geom_state
  ON tract_geometries USING GIST(geometry)
  INCLUDE (geoid, state_fips);

-- =============================================================================
-- STEP 5: Add pre-simplified geometry column for faster tiles
-- =============================================================================

-- Add column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tract_geometries' AND column_name = 'geometry_simplified'
  ) THEN
    ALTER TABLE tract_geometries ADD COLUMN geometry_simplified geometry(MultiPolygon, 4326);
  END IF;
END $$;

-- Create index on simplified geometry
CREATE INDEX IF NOT EXISTS idx_tract_geometries_simplified_gist
  ON tract_geometries USING GIST(geometry_simplified);

-- Populate simplified geometries (run separately if table is large)
-- This query can be run in batches for very large tables:
-- UPDATE tract_geometries
-- SET geometry_simplified = ST_Simplify(geometry, 0.001)
-- WHERE geometry_simplified IS NULL;

-- =============================================================================
-- STEP 6: Create deal_matches table if not exists
-- =============================================================================
-- AutoMatch engine saves matches to this table

CREATE TABLE IF NOT EXISTS deal_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  cde_id UUID NOT NULL REFERENCES cdes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  match_strength VARCHAR(20) NOT NULL DEFAULT 'weak',
  breakdown JSONB,
  reasons TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_deal_cde_match UNIQUE (deal_id, cde_id)
);

-- Indexes for deal_matches
CREATE INDEX IF NOT EXISTS idx_deal_matches_deal ON deal_matches(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_cde ON deal_matches(cde_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_score ON deal_matches(score DESC);

-- Enable RLS
ALTER TABLE deal_matches ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read matches
CREATE POLICY IF NOT EXISTS "Deal matches are readable by authenticated users"
  ON deal_matches FOR SELECT TO authenticated USING (true);

-- Allow service role to insert/update
CREATE POLICY IF NOT EXISTS "Service role can manage deal matches"
  ON deal_matches FOR ALL TO service_role USING (true);

GRANT SELECT ON deal_matches TO authenticated;
GRANT ALL ON deal_matches TO service_role;

COMMENT ON TABLE deal_matches IS 'AutoMatch results linking deals to CDEs with scores';

-- =============================================================================
-- Done
-- =============================================================================
