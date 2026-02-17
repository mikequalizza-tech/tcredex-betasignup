-- =============================================================================
-- Migration 027: Historic Buildings (National Register of Historic Places)
-- =============================================================================
-- 100K+ properties from NRHP for Federal HTC eligibility lookups
-- =============================================================================

DROP TABLE IF EXISTS historic_buildings CASCADE;

CREATE TABLE historic_buildings (
    id SERIAL PRIMARY KEY,
    ref_number VARCHAR(20) UNIQUE,             -- "Ref#" - NRHP reference number (unique for upsert)
    prefix VARCHAR(50),                        -- "Prefix"
    property_name VARCHAR(500) NOT NULL,       -- "Property Name"
    state VARCHAR(100),                        -- "State"
    state_abbr VARCHAR(2),                     -- Derived from state
    county VARCHAR(100),                       -- "County"
    city VARCHAR(100),                         -- "City"
    street_address VARCHAR(500),               -- "Street & Number"
    address TEXT,                              -- Full address combined
    zip_code VARCHAR(10),                      -- Derived/geocoded if available
    status VARCHAR(50),                        -- "Status" (Listed, Delisted, etc.)
    request_type VARCHAR(50),                  -- "Request Type"
    restricted_address BOOLEAN DEFAULT FALSE,  -- "Restricted Address"
    acreage DECIMAL(10,2),                     -- "Acreage of Property"
    area_of_significance TEXT,                 -- "Area of Significance"
    category VARCHAR(50),                      -- "Category of Property" (BUILDING, DISTRICT, SITE, etc.)
    external_link TEXT,                        -- "External Link" to archives.gov
    significance_international BOOLEAN DEFAULT FALSE,
    significance_local BOOLEAN DEFAULT FALSE,
    significance_national BOOLEAN DEFAULT FALSE,
    significance_not_indicated BOOLEAN DEFAULT FALSE,
    significance_state BOOLEAN DEFAULT FALSE,
    listed_date DATE,                          -- "Listed Date"
    multiple_property_listing VARCHAR(500),    -- "Name of Multiple Property Listing"
    nhl_designated_date DATE,                  -- "NHL Designated Date" (National Historic Landmark)
    other_names TEXT,                          -- "Other Names"
    park_name VARCHAR(500),                    -- "Park Name"
    periods_of_significance VARCHAR(200),     -- "Periods of Significance" (e.g., "1875 AD - 1924 AD")
    property_id VARCHAR(20),                   -- "Property ID"

    -- Geocoded coordinates (can be populated later)
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    -- HTC eligibility flags
    is_htc_eligible BOOLEAN DEFAULT TRUE,      -- Listed = eligible for Federal HTC
    is_nhl BOOLEAN DEFAULT FALSE,              -- National Historic Landmark

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_historic_buildings_state ON historic_buildings(state);
CREATE INDEX idx_historic_buildings_state_abbr ON historic_buildings(state_abbr);
CREATE INDEX idx_historic_buildings_city ON historic_buildings(city);
CREATE INDEX idx_historic_buildings_county ON historic_buildings(county);
CREATE INDEX idx_historic_buildings_zip ON historic_buildings(zip_code);
CREATE INDEX idx_historic_buildings_status ON historic_buildings(status);
CREATE INDEX idx_historic_buildings_category ON historic_buildings(category);
CREATE INDEX idx_historic_buildings_property_name ON historic_buildings USING gin(to_tsvector('english', property_name));
CREATE INDEX idx_historic_buildings_address ON historic_buildings USING gin(to_tsvector('english', street_address));
CREATE INDEX idx_historic_buildings_ref ON historic_buildings(ref_number);
CREATE INDEX idx_historic_buildings_property_id ON historic_buildings(property_id);

-- Spatial index if coordinates populated
CREATE INDEX idx_historic_buildings_coords ON historic_buildings(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Enable RLS
ALTER TABLE historic_buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Historic buildings are publicly readable" ON historic_buildings FOR SELECT USING (true);

-- Grant access
GRANT SELECT ON historic_buildings TO anon, authenticated;

COMMENT ON TABLE historic_buildings IS 'National Register of Historic Places - 100K+ properties for Federal HTC eligibility';

-- Note: state_fips_lookup table already exists for state abbreviation lookups

-- =============================================================================
-- RPC function for coordinate-based search
-- =============================================================================
CREATE OR REPLACE FUNCTION get_historic_buildings_near_point(
    p_lat DECIMAL,
    p_lng DECIMAL,
    p_radius_miles DECIMAL DEFAULT 1,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id INTEGER,
    property_name VARCHAR(500),
    street_address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    category VARCHAR(50),
    status VARCHAR(50),
    listed_date DATE,
    distance_miles DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.id,
        h.property_name,
        h.street_address,
        h.city,
        h.state,
        h.category,
        h.status,
        h.listed_date,
        (
            3959 * acos(
                cos(radians(p_lat)) * cos(radians(h.latitude)) *
                cos(radians(h.longitude) - radians(p_lng)) +
                sin(radians(p_lat)) * sin(radians(h.latitude))
            )
        )::DECIMAL AS distance_miles
    FROM historic_buildings h
    WHERE h.latitude IS NOT NULL
      AND h.longitude IS NOT NULL
      AND (
            3959 * acos(
                cos(radians(p_lat)) * cos(radians(h.latitude)) *
                cos(radians(h.longitude) - radians(p_lng)) +
                sin(radians(p_lat)) * sin(radians(h.latitude))
            )
        ) <= p_radius_miles
    ORDER BY distance_miles
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_historic_buildings_near_point TO anon, authenticated;

COMMENT ON FUNCTION get_historic_buildings_near_point IS 'Find historic buildings within radius of a point';
