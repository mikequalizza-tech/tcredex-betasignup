-- =============================================================================
-- RPC FUNCTIONS FOR MASTER CENSUS_TRACTS TABLE
-- =============================================================================
-- These functions query the unified census_tracts table
-- No joins needed - all data is in one table!
-- =============================================================================

-- =============================================================================
-- Function: Get tracts in bounding box (for map viewport)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_map_tracts_in_bbox(
    p_min_lng DECIMAL,
    p_min_lat DECIMAL,
    p_max_lng DECIMAL,
    p_max_lat DECIMAL,
    p_limit INTEGER DEFAULT 500
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
    median_family_income_pct DECIMAL(5,2)
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
        ct.median_family_income_pct
    FROM census_tracts ct
    WHERE ct.geom IS NOT NULL
      AND ct.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Function: Get single tract by GEOID
-- =============================================================================

CREATE OR REPLACE FUNCTION get_tract_by_geoid(p_geoid VARCHAR(11))
RETURNS TABLE (
    geoid VARCHAR(11),
    geom_json TEXT,
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    state_fips VARCHAR(2),
    county_fips VARCHAR(3),
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    state_nmtc_transferable BOOLEAN,
    has_state_lihtc BOOLEAN,
    has_state_htc BOOLEAN,
    state_htc_transferable BOOLEAN,
    state_htc_refundable BOOLEAN,
    has_state_oz_conformity BOOLEAN,
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
        ct.state_fips,
        ct.county_fips,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.state_nmtc_transferable,
        ct.has_state_lihtc,
        ct.has_state_htc,
        ct.state_htc_transferable,
        ct.state_htc_refundable,
        ct.has_state_oz_conformity,
        ct.has_brownfield_credit,
        ct.severely_distressed,
        ct.poverty_rate,
        ct.median_family_income_pct,
        ct.unemployment_rate
    FROM census_tracts ct
    WHERE ct.geoid = p_geoid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Function: Find tract containing a point (lat/lng)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_tract_from_coordinates(
    p_lat DECIMAL,
    p_lng DECIMAL
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
    median_family_income_pct DECIMAL(5,2)
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
        ct.median_family_income_pct
    FROM census_tracts ct
    WHERE ct.geom IS NOT NULL
      AND ST_Contains(ct.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Function: Get tract centroids for zoomed-out view (lightweight)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_tract_centroids_in_bbox(
    p_min_lng DECIMAL,
    p_min_lat DECIMAL,
    p_max_lng DECIMAL,
    p_max_lat DECIMAL,
    p_limit INTEGER DEFAULT 2000
)
RETURNS TABLE (
    geoid VARCHAR(11),
    lat DECIMAL,
    lng DECIMAL,
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    severely_distressed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_Y(ST_Centroid(ct.geom))::DECIMAL as lat,
        ST_X(ST_Centroid(ct.geom))::DECIMAL as lng,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.has_state_htc,
        ct.severely_distressed
    FROM census_tracts ct
    WHERE ct.geom IS NOT NULL
      AND ct.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Function: Get tracts by state (for state-level views)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_tracts_by_state(
    p_state_name VARCHAR(100),
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    geoid VARCHAR(11),
    geom_json TEXT,
    county_name VARCHAR(100),
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(ct.geom)::TEXT as geom_json,
        ct.county_name,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.has_state_htc,
        ct.has_brownfield_credit
    FROM census_tracts ct
    WHERE ct.state_name = p_state_name
      AND ct.geom IS NOT NULL
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Function: Search eligible tracts (for deal matching)
-- =============================================================================

CREATE OR REPLACE FUNCTION search_eligible_tracts(
    p_min_lng DECIMAL DEFAULT -180,
    p_min_lat DECIMAL DEFAULT -90,
    p_max_lng DECIMAL DEFAULT 180,
    p_max_lat DECIMAL DEFAULT 90,
    p_require_lihtc BOOLEAN DEFAULT FALSE,
    p_require_oz BOOLEAN DEFAULT FALSE,
    p_require_state_nmtc BOOLEAN DEFAULT FALSE,
    p_require_state_htc BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    geoid VARCHAR(11),
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    program_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ct.state_name,
        ct.county_name,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.has_state_htc,
        (
            CASE WHEN ct.is_lihtc_qct THEN 1 ELSE 0 END +
            CASE WHEN ct.is_oz_designated THEN 1 ELSE 0 END +
            CASE WHEN ct.has_state_nmtc THEN 1 ELSE 0 END +
            CASE WHEN ct.has_state_htc THEN 1 ELSE 0 END
        )::INTEGER as program_count
    FROM census_tracts ct
    WHERE ct.geom IS NOT NULL
      AND ct.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
      AND (NOT p_require_lihtc OR ct.is_lihtc_qct = TRUE)
      AND (NOT p_require_oz OR ct.is_oz_designated = TRUE)
      AND (NOT p_require_state_nmtc OR ct.has_state_nmtc = TRUE)
      AND (NOT p_require_state_htc OR ct.has_state_htc = TRUE)
    ORDER BY program_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_map_tracts_in_bbox TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_by_geoid TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_from_coordinates TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_centroids_in_bbox TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tracts_by_state TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_eligible_tracts TO anon, authenticated;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON FUNCTION get_map_tracts_in_bbox IS 'Get tracts with geometry for map viewport rendering';
COMMENT ON FUNCTION get_tract_by_geoid IS 'Get single tract with all eligibility data by GEOID';
COMMENT ON FUNCTION get_tract_from_coordinates IS 'Find tract containing a lat/lng point';
COMMENT ON FUNCTION get_tract_centroids_in_bbox IS 'Get tract centroids for zoomed-out overview (lightweight)';
COMMENT ON FUNCTION get_tracts_by_state IS 'Get all tracts in a state';
COMMENT ON FUNCTION search_eligible_tracts IS 'Search for tracts matching specific program criteria';
