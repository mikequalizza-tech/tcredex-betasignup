-- =============================================================================
-- Migration 034: Fix Vector Tiles - Use working query logic
-- =============================================================================
-- The get_vector_tile function was returning empty tiles
-- This migration fixes it to use the same query logic as get_map_tracts_in_bbox
-- which is known to work
-- =============================================================================

-- =============================================================================
-- Migration 034: Fix Vector Tiles - Restore working query with correct columns
-- =============================================================================
-- Use migration 022's optimized logic (pre-simplified geometries + && operator)
-- but with migration 033's corrected column names
-- =============================================================================

DROP FUNCTION IF EXISTS get_vector_tile(INTEGER, INTEGER, INTEGER) CASCADE;

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
COMMENT ON FUNCTION get_vector_tile IS 'Generate MVT tile using ST_Intersects (same logic as working polygon query)';
