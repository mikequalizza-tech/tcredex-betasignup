-- =============================================================================
-- FIX DDA - DDA is NOT a standalone qualifier, only a 30% boost if LIHTC QCT
-- =============================================================================
-- DDA (Difficult Development Area) should ONLY count toward eligibility
-- if the tract is ALSO eligible for LIHTC QCT.
-- DDA by itself does NOT make a tract eligible - it's just a 30% basis boost.
-- =============================================================================

-- =============================================================================
-- DROP ALL EXISTING FUNCTIONS FIRST (required when changing return types)
-- =============================================================================
DROP FUNCTION IF EXISTS get_vector_tile(INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_tract_with_credits(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_tract_at_point(DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS get_map_tracts_in_bbox(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_map_tracts_in_bbox(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;

-- =============================================================================
-- Recreate tile function WITHOUT DDA as standalone qualifier
-- =============================================================================
CREATE OR REPLACE FUNCTION get_vector_tile(
    p_z INTEGER,
    p_x INTEGER,
    p_y INTEGER
)
RETURNS bytea AS $$
DECLARE
    result bytea;
BEGIN
    WITH bounds AS (
        SELECT
            ST_Transform(ST_TileEnvelope(p_z, p_x, p_y), 4326) as geom_4326,
            ST_TileEnvelope(p_z, p_x, p_y) as geom_3857
    )
    SELECT ST_AsMVT(tile, 'tracts', 4096, 'geom') INTO result
    FROM (
        SELECT
            g.geoid,
            -- Eligibility: NMTC (LIC or High Migration), LIHTC QCT, OZ
            -- NOTE: DDA is NOT standalone - only 30% boost if LIHTC QCT eligible
            CASE WHEN (
                COALESCE(s.is_nmtc_eligible, false) OR
                COALESCE(s.is_nmtc_high_migration, false) OR
                COALESCE(s.is_lihtc_qct_2025, false) OR
                COALESCE(s.is_lihtc_qct_2026, false) OR
                COALESCE(s.is_oz_designated, false)
            ) THEN 1 ELSE 0 END as e,
            COALESCE(s.stack_score, 0) as s,
            ST_AsMVTGeom(
                ST_Transform(
                    CASE
                        WHEN p_z < 8 THEN COALESCE(g.geometry_simplified, ST_Simplify(g.geometry, 0.01))
                        ELSE g.geometry
                    END,
                    3857
                ),
                (SELECT geom_3857 FROM bounds),
                4096, 64, true
            ) as geom
        FROM tract_geometries g
        LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid
        WHERE g.geometry && (SELECT geom_4326 FROM bounds)
    ) as tile
    WHERE geom IS NOT NULL;

    RETURN COALESCE(result, ''::bytea);
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

GRANT EXECUTE ON FUNCTION get_vector_tile TO anon, authenticated;
COMMENT ON FUNCTION get_vector_tile IS 'Generate MVT tile - DDA is NOT standalone (only 30% boost if LIHTC QCT eligible)';

-- =============================================================================
-- Update tract_map_layer view - DDA NOT in has_any_tax_credit calculation
-- =============================================================================
DROP VIEW IF EXISTS tract_map_layer CASCADE;

CREATE VIEW tract_map_layer AS
SELECT
    g.geoid,
    ST_AsGeoJSON(g.geometry)::TEXT as geom_json,
    -- Eligibility: NMTC (LIC or High Migration), LIHTC QCT, OZ
    -- NOTE: DDA is NOT standalone - only 30% boost if LIHTC QCT eligible
    CASE WHEN (
        COALESCE(s.is_nmtc_eligible, false) OR
        COALESCE(s.is_nmtc_high_migration, false) OR
        COALESCE(s.is_lihtc_qct_2025, false) OR
        COALESCE(s.is_lihtc_qct_2026, false) OR
        COALESCE(s.is_oz_designated, false)
    ) THEN true ELSE false END as has_any_tax_credit,
    COALESCE(s.is_lihtc_qct_2025, false) as is_qct,
    COALESCE(s.is_oz_designated, false) as is_oz,
    COALESCE(s.is_dda_2025, false) as is_dda,
    COALESCE(s.is_nmtc_eligible, false) as is_nmtc_eligible,
    COALESCE(s.is_nmtc_high_migration, false) as is_nmtc_high_migration,
    COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
    COALESCE(s.has_state_lihtc, false) as has_state_lihtc,
    -- Keep these columns for backwards compatibility but they should not be used for eligibility
    COALESCE(s.has_state_htc, false) as has_state_htc,
    COALESCE(s.has_brownfield_credit, false) as has_brownfield_credit,
    COALESCE(s.stack_score, 0) as stack_score,
    s.poverty_rate,
    s.mfi_percent as mfi_pct,
    s.unemployment_rate
FROM tract_geometries g
LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid;

GRANT SELECT ON tract_map_layer TO anon, authenticated;
COMMENT ON VIEW tract_map_layer IS 'Tract map layer - DDA is NOT standalone (only 30% boost if LIHTC QCT eligible)';

-- =============================================================================
-- Update RPC functions
-- =============================================================================

-- Fix get_tract_with_credits
CREATE OR REPLACE FUNCTION get_tract_with_credits(p_geoid TEXT)
RETURNS TABLE (
    geoid TEXT,
    geom_json TEXT,
    has_any_tax_credit BOOLEAN,
    is_qct BOOLEAN,
    is_oz BOOLEAN,
    is_dda BOOLEAN,
    is_nmtc_eligible BOOLEAN,
    is_nmtc_high_migration BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_lihtc BOOLEAN,
    stack_score INTEGER,
    poverty_rate DOUBLE PRECISION,
    mfi_pct DOUBLE PRECISION,
    unemployment_rate DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.geoid,
        ST_AsGeoJSON(g.geometry)::TEXT as geom_json,
        -- Eligibility: NMTC (LIC or High Migration), LIHTC QCT, OZ
        -- NOTE: DDA is NOT standalone - only 30% boost if LIHTC QCT eligible
        CASE WHEN (
            COALESCE(s.is_nmtc_eligible, false) OR
            COALESCE(s.is_nmtc_high_migration, false) OR
            COALESCE(s.is_lihtc_qct_2025, false) OR
            COALESCE(s.is_lihtc_qct_2026, false) OR
            COALESCE(s.is_oz_designated, false)
        ) THEN true ELSE false END as has_any_tax_credit,
        COALESCE(s.is_lihtc_qct_2025, false) as is_qct,
        COALESCE(s.is_oz_designated, false) as is_oz,
        COALESCE(s.is_dda_2025, false) as is_dda,
        COALESCE(s.is_nmtc_eligible, false) as is_nmtc_eligible,
        COALESCE(s.is_nmtc_high_migration, false) as is_nmtc_high_migration,
        COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
        COALESCE(s.has_state_lihtc, false) as has_state_lihtc,
        COALESCE(s.stack_score, 0) as stack_score,
        s.poverty_rate,
        s.mfi_percent as mfi_pct,
        s.unemployment_rate
    FROM tract_geometries g
    LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid
    WHERE g.geoid = p_geoid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_tract_with_credits TO anon, authenticated;

-- Fix get_tract_at_point
CREATE OR REPLACE FUNCTION get_tract_at_point(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS TABLE (
    geoid TEXT,
    geom_json TEXT,
    has_any_tax_credit BOOLEAN,
    is_qct BOOLEAN,
    is_oz BOOLEAN,
    is_dda BOOLEAN,
    is_nmtc_eligible BOOLEAN,
    is_nmtc_high_migration BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_lihtc BOOLEAN,
    stack_score INTEGER,
    poverty_rate DOUBLE PRECISION,
    mfi_pct DOUBLE PRECISION,
    unemployment_rate DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.geoid,
        ST_AsGeoJSON(g.geometry)::TEXT as geom_json,
        -- Eligibility: NMTC (LIC or High Migration), LIHTC QCT, OZ
        -- NOTE: DDA is NOT standalone - only 30% boost if LIHTC QCT eligible
        CASE WHEN (
            COALESCE(s.is_nmtc_eligible, false) OR
            COALESCE(s.is_nmtc_high_migration, false) OR
            COALESCE(s.is_lihtc_qct_2025, false) OR
            COALESCE(s.is_lihtc_qct_2026, false) OR
            COALESCE(s.is_oz_designated, false)
        ) THEN true ELSE false END as has_any_tax_credit,
        COALESCE(s.is_lihtc_qct_2025, false) as is_qct,
        COALESCE(s.is_oz_designated, false) as is_oz,
        COALESCE(s.is_dda_2025, false) as is_dda,
        COALESCE(s.is_nmtc_eligible, false) as is_nmtc_eligible,
        COALESCE(s.is_nmtc_high_migration, false) as is_nmtc_high_migration,
        COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
        COALESCE(s.has_state_lihtc, false) as has_state_lihtc,
        COALESCE(s.stack_score, 0) as stack_score,
        s.poverty_rate,
        s.mfi_percent as mfi_pct,
        s.unemployment_rate
    FROM tract_geometries g
    LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid
    WHERE ST_Contains(g.geometry, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_tract_at_point TO anon, authenticated;

-- Fix get_map_tracts_in_bbox
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
    is_dda BOOLEAN,
    is_nmtc_eligible BOOLEAN,
    is_nmtc_high_migration BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_lihtc BOOLEAN,
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
        COALESCE(s.is_dda_2025, false) as is_dda,
        COALESCE(s.is_nmtc_eligible, false) as is_nmtc_eligible,
        COALESCE(s.is_nmtc_high_migration, false) as is_nmtc_high_migration,
        COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
        COALESCE(s.has_state_lihtc, false) as has_state_lihtc,
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
COMMENT ON FUNCTION get_map_tracts_in_bbox IS 'Get tracts in bbox - DDA is NOT standalone (only 30% boost if LIHTC QCT eligible)';
