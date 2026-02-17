-- Remove artificial limits from tract query functions
-- The database is fast enough to return all tracts in viewport
-- This enables the full US Source of Truth map view

-- =============================================================================
-- Update: get_map_tracts_in_bbox - Remove limit for full polygon view
-- =============================================================================
DROP FUNCTION IF EXISTS get_map_tracts_in_bbox(DECIMAL, DECIMAL, DECIMAL, DECIMAL, INTEGER);

CREATE OR REPLACE FUNCTION get_map_tracts_in_bbox(
    p_min_lng DECIMAL,
    p_min_lat DECIMAL,
    p_max_lng DECIMAL,
    p_max_lat DECIMAL
)
RETURNS TABLE (
    geoid VARCHAR(11),
    geom_json TEXT,
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
    severely_distressed BOOLEAN,
    poverty_rate DECIMAL(5,2),
    median_family_income_pct DECIMAL(5,2),
    unemployment_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(ct.geom)::TEXT as geom_json,
        ct.state_name,
        ct.county_name,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.has_state_htc,
        ct.has_brownfield_credit,
        ct.severely_distressed,
        ct.poverty_rate,
        ct.median_family_income_pct,
        ct.unemployment_rate
    FROM census_tracts ct
    WHERE ct.geom IS NOT NULL
      AND ct.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326);
    -- NO LIMIT - return all tracts in viewport
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_map_tracts_in_bbox IS 'Returns ALL tracts in bbox with full geometry - no artificial limit';

-- =============================================================================
-- Update: get_simplified_tracts_in_bbox - Ensure it works
-- =============================================================================
DROP FUNCTION IF EXISTS get_simplified_tracts_in_bbox(double precision, double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION get_simplified_tracts_in_bbox(
    p_min_lng double precision,
    p_min_lat double precision,
    p_max_lng double precision,
    p_max_lat double precision
)
RETURNS TABLE (
    geoid text,
    geom_json text,
    state_name text,
    county_name text,
    is_lihtc_qct boolean,
    is_oz_designated boolean,
    has_state_nmtc boolean,
    has_state_htc boolean,
    has_brownfield_credit boolean,
    severely_distressed boolean,
    poverty_rate numeric,
    median_family_income_pct numeric,
    unemployment_rate numeric
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid::text,
        ST_AsGeoJSON(ct.geom_simplified)::text as geom_json,
        ct.state_name::text,
        ct.county_name::text,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.has_state_htc,
        ct.has_brownfield_credit,
        ct.severely_distressed,
        ct.poverty_rate,
        ct.median_family_income_pct,
        ct.unemployment_rate
    FROM census_tracts ct
    WHERE ct.geom_simplified IS NOT NULL
      AND ct.geom_simplified && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326);
    -- NO LIMIT - return all simplified tracts in viewport
END;
$$;

COMMENT ON FUNCTION get_simplified_tracts_in_bbox IS 'Returns ALL tracts in bbox with simplified geometry for fast full-US rendering';

-- =============================================================================
-- Verify geom_simplified column exists and is populated
-- =============================================================================
DO $$
DECLARE
    simplified_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'census_tracts' AND column_name = 'geom_simplified'
    ) THEN
        -- Add column if missing
        ALTER TABLE census_tracts ADD COLUMN geom_simplified geometry(MultiPolygon, 4326);
        RAISE NOTICE 'Added geom_simplified column';
    END IF;

    -- Count how many have simplified geom
    SELECT COUNT(*) INTO simplified_count FROM census_tracts WHERE geom_simplified IS NOT NULL;
    SELECT COUNT(*) INTO total_count FROM census_tracts WHERE geom IS NOT NULL;

    RAISE NOTICE 'Simplified: % / Total: %', simplified_count, total_count;

    -- Populate if empty
    IF simplified_count = 0 AND total_count > 0 THEN
        RAISE NOTICE 'Populating geom_simplified column...';
        UPDATE census_tracts
        SET geom_simplified = ST_Simplify(geom, 0.01)
        WHERE geom IS NOT NULL AND geom_simplified IS NULL;
        RAISE NOTICE 'Done populating geom_simplified';
    END IF;
END $$;

-- Create spatial index if not exists
CREATE INDEX IF NOT EXISTS idx_census_tracts_geom_simplified
ON census_tracts USING GIST (geom_simplified);
