-- =============================================================================
-- RPC FUNCTIONS FOR TRACT MAP (SOURCE OF TRUTH)
-- =============================================================================
-- These query tract_geometries + master_tax_credit_sot
-- Column mappings:
--   is_lihtc_qct_2025 → is_qct
--   is_oz_designated → is_oz
--   is_dda_2025 → is_dda
--   mfi_percent → mfi_pct
-- =============================================================================

-- =============================================================================
-- View: tract_map_layer (combines geometry + tax credits)
-- =============================================================================
DROP VIEW IF EXISTS tract_map_layer CASCADE;

CREATE VIEW tract_map_layer AS
SELECT
    g.geoid,
    ST_AsGeoJSON(g.geometry)::TEXT as geom_json,
    COALESCE(s.has_any_tax_credit, false) as has_any_tax_credit,
    COALESCE(s.is_lihtc_qct_2025, false) as is_qct,
    COALESCE(s.is_oz_designated, false) as is_oz,
    COALESCE(s.is_dda_2025, false) as is_dda,
    COALESCE(s.is_nmtc_eligible, false) as is_nmtc_eligible,
    COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
    COALESCE(s.has_state_htc, false) as has_state_htc,
    COALESCE(s.has_brownfield_credit, false) as has_brownfield_credit,
    COALESCE(s.stack_score, 0) as stack_score,
    s.poverty_rate,
    s.mfi_percent as mfi_pct,
    s.unemployment_rate
FROM tract_geometries g
LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid;

GRANT SELECT ON tract_map_layer TO anon, authenticated;
COMMENT ON VIEW tract_map_layer IS 'Combines tract_geometries + master_tax_credit_sot for map rendering';

-- =============================================================================
-- Function: Get single tract with tax credits by GEOID
-- =============================================================================
CREATE OR REPLACE FUNCTION get_tract_with_credits(p_geoid TEXT)
RETURNS TABLE (
    geoid TEXT,
    geom_json TEXT,
    has_any_tax_credit BOOLEAN,
    is_qct BOOLEAN,
    is_oz BOOLEAN,
    is_dda BOOLEAN,
    is_nmtc_eligible BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
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
        COALESCE(s.has_any_tax_credit, false) as has_any_tax_credit,
        COALESCE(s.is_lihtc_qct_2025, false) as is_qct,
        COALESCE(s.is_oz_designated, false) as is_oz,
        COALESCE(s.is_dda_2025, false) as is_dda,
        COALESCE(s.is_nmtc_eligible, false) as is_nmtc_eligible,
        COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
        COALESCE(s.has_state_htc, false) as has_state_htc,
        COALESCE(s.has_brownfield_credit, false) as has_brownfield_credit,
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

-- =============================================================================
-- Function: Get tract at point (lat/lng) - point-in-polygon lookup
-- =============================================================================
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
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
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
        COALESCE(s.has_any_tax_credit, false) as has_any_tax_credit,
        COALESCE(s.is_lihtc_qct_2025, false) as is_qct,
        COALESCE(s.is_oz_designated, false) as is_oz,
        COALESCE(s.is_dda_2025, false) as is_dda,
        COALESCE(s.is_nmtc_eligible, false) as is_nmtc_eligible,
        COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
        COALESCE(s.has_state_htc, false) as has_state_htc,
        COALESCE(s.has_brownfield_credit, false) as has_brownfield_credit,
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

-- =============================================================================
-- Function: Get tracts in bounding box (for map viewport)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_tracts_in_bbox(
    p_min_lng DOUBLE PRECISION,
    p_min_lat DOUBLE PRECISION,
    p_max_lng DOUBLE PRECISION,
    p_max_lat DOUBLE PRECISION
)
RETURNS TABLE (
    geoid TEXT,
    geom_json TEXT,
    has_any_tax_credit BOOLEAN,
    is_qct BOOLEAN,
    is_oz BOOLEAN,
    is_dda BOOLEAN,
    is_nmtc_eligible BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
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
        COALESCE(s.has_any_tax_credit, false) as has_any_tax_credit,
        COALESCE(s.is_lihtc_qct_2025, false) as is_qct,
        COALESCE(s.is_oz_designated, false) as is_oz,
        COALESCE(s.is_dda_2025, false) as is_dda,
        COALESCE(s.is_nmtc_eligible, false) as is_nmtc_eligible,
        COALESCE(s.has_state_nmtc, false) as has_state_nmtc,
        COALESCE(s.has_state_htc, false) as has_state_htc,
        COALESCE(s.has_brownfield_credit, false) as has_brownfield_credit,
        COALESCE(s.stack_score, 0) as stack_score,
        s.poverty_rate,
        s.mfi_percent as mfi_pct,
        s.unemployment_rate
    FROM tract_geometries g
    LEFT JOIN master_tax_credit_sot s ON g.geoid = s.geoid
    WHERE g.geometry && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326);
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_tracts_in_bbox TO anon, authenticated;
