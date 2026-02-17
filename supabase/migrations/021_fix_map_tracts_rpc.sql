-- =============================================================================
-- FIX: get_map_tracts_in_bbox to use tract_map_layer view
-- =============================================================================
-- The old function referenced census_tracts.is_lihtc_qct which doesn't exist.
-- This version uses the tract_map_layer view (tract_geometries + master_tax_credit_sot)
-- =============================================================================

-- Drop ALL versions by listing known signatures
DROP FUNCTION IF EXISTS get_map_tracts_in_bbox(DECIMAL, DECIMAL, DECIMAL, DECIMAL, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_map_tracts_in_bbox(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_map_tracts_in_bbox(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS get_map_tracts_in_bbox(NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_map_tracts_in_bbox(NUMERIC, NUMERIC, NUMERIC, NUMERIC) CASCADE;

CREATE OR REPLACE FUNCTION get_map_tracts_in_bbox(
    p_min_lng DOUBLE PRECISION,
    p_min_lat DOUBLE PRECISION,
    p_max_lng DOUBLE PRECISION,
    p_max_lat DOUBLE PRECISION,
    p_limit INTEGER DEFAULT 5000
)
RETURNS TABLE (
    geoid TEXT,
    geom_json TEXT,
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
    severely_distressed BOOLEAN,
    poverty_rate DOUBLE PRECISION,
    median_family_income_pct DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.geoid,
        ST_AsGeoJSON(g.geometry)::TEXT as geom_json,
        COALESCE(s.is_lihtc_qct_2025, false) as is_lihtc_qct,
        COALESCE(s.is_oz_designated, false) as is_oz_designated,
        COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
        COALESCE(s.has_state_htc, false) as has_state_htc,
        COALESCE(s.has_brownfield_credit, false) as has_brownfield_credit,
        COALESCE(s.is_nmtc_eligible, false) as severely_distressed,
        s.poverty_rate,
        s.mfi_percent as median_family_income_pct
    FROM tract_geometries g
    LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid
    WHERE g.geometry IS NOT NULL
      AND g.geometry && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_map_tracts_in_bbox TO anon, authenticated;
COMMENT ON FUNCTION get_map_tracts_in_bbox IS 'Get tracts in bbox using tract_geometries + master_tax_credit_sot';

-- =============================================================================
-- Also fix get_simplified_tracts_in_bbox if it exists
-- =============================================================================

-- Drop ALL versions
DROP FUNCTION IF EXISTS get_simplified_tracts_in_bbox(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS get_simplified_tracts_in_bbox(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS get_simplified_tracts_in_bbox(NUMERIC, NUMERIC, NUMERIC, NUMERIC) CASCADE;

CREATE OR REPLACE FUNCTION get_simplified_tracts_in_bbox(
    p_min_lng DOUBLE PRECISION,
    p_min_lat DOUBLE PRECISION,
    p_max_lng DOUBLE PRECISION,
    p_max_lat DOUBLE PRECISION
)
RETURNS TABLE (
    geoid TEXT,
    geom_json TEXT,
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
    severely_distressed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.geoid,
        COALESCE(
            ST_AsGeoJSON(g.geometry_simplified),
            ST_AsGeoJSON(ST_Simplify(g.geometry, 0.01))
        )::TEXT as geom_json,
        COALESCE(s.is_lihtc_qct_2025, false) as is_lihtc_qct,
        COALESCE(s.is_oz_designated, false) as is_oz_designated,
        COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
        COALESCE(s.has_state_htc, false) as has_state_htc,
        COALESCE(s.has_brownfield_credit, false) as has_brownfield_credit,
        COALESCE(s.is_nmtc_eligible, false) as severely_distressed
    FROM tract_geometries g
    LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid
    WHERE g.geometry IS NOT NULL
      AND g.geometry && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326);
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_simplified_tracts_in_bbox TO anon, authenticated;
COMMENT ON FUNCTION get_simplified_tracts_in_bbox IS 'Get simplified tract geometries for zoomed-out map views';
