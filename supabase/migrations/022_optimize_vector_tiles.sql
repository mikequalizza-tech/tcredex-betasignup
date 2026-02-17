-- =============================================================================
-- OPTIMIZE VECTOR TILES - Pre-compute simplified geometries
-- =============================================================================
-- This dramatically speeds up tile generation by avoiding ST_Simplify on every request
-- =============================================================================

-- Drop any existing get_vector_tile function versions
DROP FUNCTION IF EXISTS get_vector_tile(INTEGER, INTEGER, INTEGER) CASCADE;

-- Add simplified geometry column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tract_geometries'
        AND column_name = 'geometry_simplified'
    ) THEN
        ALTER TABLE tract_geometries ADD COLUMN geometry_simplified geometry(Geometry, 4326);
    END IF;
END $$;

-- Populate simplified geometries (tolerance 0.01 = ~1km at equator, good for zoom < 8)
UPDATE tract_geometries
SET geometry_simplified = ST_Simplify(geometry, 0.01)
WHERE geometry_simplified IS NULL
  AND geometry IS NOT NULL;

-- Create spatial index on simplified geometry
CREATE INDEX IF NOT EXISTS idx_tract_geometries_simplified
ON tract_geometries USING GIST(geometry_simplified);

-- Also ensure main geometry has an index
CREATE INDEX IF NOT EXISTS idx_tract_geometries_geometry
ON tract_geometries USING GIST(geometry);

-- =============================================================================
-- Optimized tile function using pre-simplified geometry
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
            CASE WHEN COALESCE(s.has_any_tax_credit, false) THEN 1 ELSE 0 END as e,
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
COMMENT ON FUNCTION get_vector_tile IS 'Generate MVT tile using pre-simplified geometries for speed';

-- =============================================================================
-- Analyze tables for query planner
-- =============================================================================
ANALYZE tract_geometries;
ANALYZE master_tax_credit_sot;
