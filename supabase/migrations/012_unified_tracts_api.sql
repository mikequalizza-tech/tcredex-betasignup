-- =============================================================================
-- Unified Tracts API Functions
-- =============================================================================
-- Single SOURCE OF TRUTH: census_tracts table with geom column
-- Joined with lihtc_qct_2025 for LIHTC data
-- All queries by GEOID - no external APIs needed
-- =============================================================================

-- Function to get tracts in bounding box (for map viewport)
-- Returns GeoJSON with all eligibility data
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
    is_nmtc_lic BOOLEAN,
    poverty_rate DECIMAL(5,2),
    mfi_pct DECIMAL(6,2),
    is_lihtc_qct BOOLEAN,
    is_oz BOOLEAN,
    severely_distressed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(ct.geom)::TEXT as geom_json,
        ct.state_name,
        ct.county_name,
        COALESCE(ct.is_nmtc_lic, FALSE) as is_nmtc_lic,
        ct.poverty_rate,
        ct.mfi_pct,
        COALESCE(lq.is_qct, FALSE) as is_lihtc_qct,
        FALSE as is_oz,  -- Will be joined with OZ table when available
        COALESCE(ct.poverty_rate >= 30 OR (ct.poverty_qualifies AND ct.mfi_qualifies AND ct.unemployment_qualifies), FALSE) as severely_distressed
    FROM census_tracts ct
    LEFT JOIN lihtc_qct_2025 lq ON ct.geoid = lq.geoid
    WHERE ct.geom IS NOT NULL
      AND ct.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get a single tract by GEOID
CREATE OR REPLACE FUNCTION get_tract_by_geoid(p_geoid VARCHAR(11))
RETURNS TABLE (
    geoid VARCHAR(11),
    geom_json TEXT,
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    is_nmtc_lic BOOLEAN,
    poverty_rate DECIMAL(5,2),
    poverty_qualifies BOOLEAN,
    mfi_pct DECIMAL(6,2),
    mfi_qualifies BOOLEAN,
    unemployment_rate DECIMAL(5,2),
    unemployment_qualifies BOOLEAN,
    is_lihtc_qct BOOLEAN,
    is_oz BOOLEAN,
    severely_distressed BOOLEAN,
    metro_status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(ct.geom)::TEXT as geom_json,
        ct.state_name,
        ct.county_name,
        COALESCE(ct.is_nmtc_lic, FALSE),
        ct.poverty_rate,
        ct.poverty_qualifies,
        ct.mfi_pct,
        ct.mfi_qualifies,
        ct.unemployment_rate,
        ct.unemployment_qualifies,
        COALESCE(lq.is_qct, FALSE) as is_lihtc_qct,
        FALSE as is_oz,
        COALESCE(ct.poverty_rate >= 30 OR (ct.poverty_qualifies AND ct.mfi_qualifies AND ct.unemployment_qualifies), FALSE),
        ct.metro_status
    FROM census_tracts ct
    LEFT JOIN lihtc_qct_2025 lq ON ct.geoid = lq.geoid
    WHERE ct.geoid = p_geoid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to find tract containing a point (lat/lng)
CREATE OR REPLACE FUNCTION get_tract_from_coordinates(
    p_lat DECIMAL,
    p_lng DECIMAL
)
RETURNS TABLE (
    geoid VARCHAR(11),
    geom_json TEXT,
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    is_nmtc_lic BOOLEAN,
    poverty_rate DECIMAL(5,2),
    mfi_pct DECIMAL(6,2),
    is_lihtc_qct BOOLEAN,
    is_oz BOOLEAN,
    severely_distressed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(ct.geom)::TEXT as geom_json,
        ct.state_name,
        ct.county_name,
        COALESCE(ct.is_nmtc_lic, FALSE),
        ct.poverty_rate,
        ct.mfi_pct,
        COALESCE(lq.is_qct, FALSE) as is_lihtc_qct,
        FALSE as is_oz,
        COALESCE(ct.poverty_rate >= 30 OR (ct.poverty_qualifies AND ct.mfi_qualifies AND ct.unemployment_qualifies), FALSE)
    FROM census_tracts ct
    LEFT JOIN lihtc_qct_2025 lq ON ct.geoid = lq.geoid
    WHERE ct.geom IS NOT NULL
      AND ST_Contains(ct.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get simplified geometries for vector tile-like rendering (zoomed out)
-- Returns centroids instead of full polygons for performance
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
    is_nmtc_lic BOOLEAN,
    is_lihtc_qct BOOLEAN,
    severely_distressed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_Y(ST_Centroid(ct.geom))::DECIMAL as lat,
        ST_X(ST_Centroid(ct.geom))::DECIMAL as lng,
        COALESCE(ct.is_nmtc_lic, FALSE),
        COALESCE(lq.is_qct, FALSE),
        COALESCE(ct.poverty_rate >= 30, FALSE)
    FROM census_tracts ct
    LEFT JOIN lihtc_qct_2025 lq ON ct.geoid = lq.geoid
    WHERE ct.geom IS NOT NULL
      AND ct.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant access
GRANT EXECUTE ON FUNCTION get_map_tracts_in_bbox TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_by_geoid TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_from_coordinates TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_centroids_in_bbox TO anon, authenticated;

COMMENT ON FUNCTION get_map_tracts_in_bbox IS 'Get tracts with full geometry for map viewport rendering';
COMMENT ON FUNCTION get_tract_by_geoid IS 'Get single tract with all eligibility data by GEOID';
COMMENT ON FUNCTION get_tract_from_coordinates IS 'Find tract containing a lat/lng point';
COMMENT ON FUNCTION get_tract_centroids_in_bbox IS 'Get tract centroids for zoomed-out overview (lightweight)';
