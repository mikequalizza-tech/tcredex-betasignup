-- =============================================================================
-- MASTER SOURCE OF TRUTH TABLE FOR TCREDEX
-- =============================================================================
-- This is the SINGLE migration that creates the complete census_tracts table
-- with ALL tax credit eligibility data needed for Maps, Deal Cards, and Profiles
--
-- GEOMETRY: Must be loaded separately (shapefile or GeoJSON import)
--
-- After running this:
-- 1. Import geometry data via Supabase dashboard or script
-- 2. Import tract data from nmtc_master_for_mapbox.csv
-- 3. Run the update queries at the bottom to merge OZ and QCT data
-- =============================================================================

-- =============================================================================
-- STEP 1: Drop and recreate the master table
-- =============================================================================

DROP TABLE IF EXISTS census_tracts CASCADE;

CREATE TABLE census_tracts (
    -- Primary Key: 11-digit Census Tract GEOID
    geoid VARCHAR(11) PRIMARY KEY,

    -- ===========================================
    -- GEOMETRY (for Map polygons/vector tiles)
    -- ===========================================
    geom GEOMETRY(MultiPolygon, 4326),
    geom_simplified GEOMETRY(MultiPolygon, 4326),  -- For fast zoomed-out rendering
    centroid_lat DECIMAL(9,6),
    centroid_lng DECIMAL(10,6),

    -- ===========================================
    -- LOCATION
    -- ===========================================
    state_fips VARCHAR(2) GENERATED ALWAYS AS (SUBSTRING(geoid, 1, 2)) STORED,
    county_fips VARCHAR(3) GENERATED ALWAYS AS (SUBSTRING(geoid, 3, 3)) STORED,
    tract_fips VARCHAR(6) GENERATED ALWAYS AS (SUBSTRING(geoid, 6, 6)) STORED,
    state_name VARCHAR(100),
    county_name VARCHAR(100),

    -- ===========================================
    -- FEDERAL TAX CREDITS
    -- ===========================================

    -- Federal NMTC Eligibility (from CDFI Fund criteria)
    is_nmtc_eligible BOOLEAN DEFAULT FALSE,
    nmtc_poverty_rate DECIMAL(5,2),          -- Poverty rate %
    nmtc_mfi_percent DECIMAL(6,2),           -- Median Family Income as % of area MFI
    nmtc_unemployment_rate DECIMAL(5,2),     -- Unemployment rate %
    nmtc_poverty_qualified BOOLEAN DEFAULT FALSE,   -- Meets poverty threshold
    nmtc_mfi_qualified BOOLEAN DEFAULT FALSE,       -- Meets MFI threshold
    nmtc_unemployment_high BOOLEAN DEFAULT FALSE,   -- High unemployment
    nmtc_classification VARCHAR(50),          -- Neither, Low-Income, Severely Distressed
    nmtc_distress_level VARCHAR(50),          -- Not Eligible, Distressed, Severe

    -- Federal LIHTC Qualified Census Tract (HUD designated)
    is_lihtc_qct BOOLEAN DEFAULT FALSE,
    lihtc_designation_year INTEGER DEFAULT 2026,

    -- Federal Opportunity Zone (Treasury designated 2018)
    is_oz_designated BOOLEAN DEFAULT FALSE,
    oz_designation_year INTEGER DEFAULT 2018,

    -- Federal Historic Tax Credit (tract-level flag, actual buildings need NPS listing)
    -- Note: Historic sites are point/building based, not tract-based
    -- This flag indicates tract contains registered historic properties
    has_historic_properties BOOLEAN DEFAULT FALSE,

    -- ===========================================
    -- STATE TAX CREDITS (applied at tract level based on state)
    -- ===========================================

    -- State NMTC Program
    has_state_nmtc BOOLEAN DEFAULT FALSE,
    state_nmtc_transferable BOOLEAN DEFAULT FALSE,
    state_nmtc_program_name TEXT,

    -- State LIHTC Program
    has_state_lihtc BOOLEAN DEFAULT FALSE,
    state_lihtc_transferable BOOLEAN DEFAULT FALSE,

    -- State Historic Tax Credit
    has_state_htc BOOLEAN DEFAULT FALSE,
    state_htc_credit_pct VARCHAR(20),
    state_htc_transferable BOOLEAN DEFAULT FALSE,
    state_htc_refundable BOOLEAN DEFAULT FALSE,

    -- State Opportunity Zone Conformity
    has_state_oz_conformity BOOLEAN DEFAULT FALSE,
    state_oz_program_type TEXT,

    -- State Brownfield Credit
    has_brownfield_credit BOOLEAN DEFAULT FALSE,
    brownfield_credit_pct VARCHAR(50),
    brownfield_transferable BOOLEAN DEFAULT FALSE,
    brownfield_refundable BOOLEAN DEFAULT FALSE,

    -- ===========================================
    -- COMPUTED FLAGS (for map display)
    -- ===========================================

    -- TRUE if ANY tax credit applies (purple on map)
    has_any_tax_credit BOOLEAN GENERATED ALWAYS AS (
        is_nmtc_eligible OR
        is_lihtc_qct OR
        is_oz_designated OR
        has_state_nmtc OR
        has_state_htc OR
        has_brownfield_credit
    ) STORED,

    -- Severely distressed for NMTC (higher allocation priority)
    severely_distressed BOOLEAN GENERATED ALWAYS AS (
        nmtc_distress_level = 'Severe'
    ) STORED,

    -- Stack score (how many programs available)
    stack_score INTEGER DEFAULT 0,

    -- ===========================================
    -- METADATA
    -- ===========================================
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: Create Indexes for Performance
-- =============================================================================

-- Geometry index (CRITICAL for map queries)
CREATE INDEX idx_census_tracts_geom ON census_tracts USING GIST(geom);
CREATE INDEX idx_census_tracts_geom_simplified ON census_tracts USING GIST(geom_simplified);

-- Location indexes
CREATE INDEX idx_census_tracts_state ON census_tracts(state_fips);
CREATE INDEX idx_census_tracts_state_name ON census_tracts(state_name);
CREATE INDEX idx_census_tracts_county ON census_tracts(state_fips, county_fips);

-- Tax credit indexes (partial for efficient filtering)
CREATE INDEX idx_census_tracts_nmtc ON census_tracts(is_nmtc_eligible) WHERE is_nmtc_eligible = TRUE;
CREATE INDEX idx_census_tracts_lihtc ON census_tracts(is_lihtc_qct) WHERE is_lihtc_qct = TRUE;
CREATE INDEX idx_census_tracts_oz ON census_tracts(is_oz_designated) WHERE is_oz_designated = TRUE;
CREATE INDEX idx_census_tracts_state_nmtc ON census_tracts(has_state_nmtc) WHERE has_state_nmtc = TRUE;
CREATE INDEX idx_census_tracts_state_htc ON census_tracts(has_state_htc) WHERE has_state_htc = TRUE;
CREATE INDEX idx_census_tracts_brownfield ON census_tracts(has_brownfield_credit) WHERE has_brownfield_credit = TRUE;
CREATE INDEX idx_census_tracts_any_credit ON census_tracts(has_any_tax_credit) WHERE has_any_tax_credit = TRUE;
CREATE INDEX idx_census_tracts_distressed ON census_tracts(severely_distressed) WHERE severely_distressed = TRUE;

-- =============================================================================
-- STEP 3: Enable Row Level Security
-- =============================================================================

ALTER TABLE census_tracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Census tracts are publicly readable"
    ON census_tracts
    FOR SELECT
    USING (true);

-- =============================================================================
-- STEP 4: Grant Permissions
-- =============================================================================

GRANT SELECT ON census_tracts TO anon, authenticated;

-- =============================================================================
-- STEP 5: State FIPS Lookup Table
-- =============================================================================

DROP TABLE IF EXISTS state_fips_lookup CASCADE;

CREATE TABLE state_fips_lookup (
    fips VARCHAR(2) PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    state_abbrev VARCHAR(2) NOT NULL
);

INSERT INTO state_fips_lookup (fips, state_name, state_abbrev) VALUES
('01', 'Alabama', 'AL'),
('02', 'Alaska', 'AK'),
('04', 'Arizona', 'AZ'),
('05', 'Arkansas', 'AR'),
('06', 'California', 'CA'),
('08', 'Colorado', 'CO'),
('09', 'Connecticut', 'CT'),
('10', 'Delaware', 'DE'),
('11', 'District of Columbia', 'DC'),
('12', 'Florida', 'FL'),
('13', 'Georgia', 'GA'),
('15', 'Hawaii', 'HI'),
('16', 'Idaho', 'ID'),
('17', 'Illinois', 'IL'),
('18', 'Indiana', 'IN'),
('19', 'Iowa', 'IA'),
('20', 'Kansas', 'KS'),
('21', 'Kentucky', 'KY'),
('22', 'Louisiana', 'LA'),
('23', 'Maine', 'ME'),
('24', 'Maryland', 'MD'),
('25', 'Massachusetts', 'MA'),
('26', 'Michigan', 'MI'),
('27', 'Minnesota', 'MN'),
('28', 'Mississippi', 'MS'),
('29', 'Missouri', 'MO'),
('30', 'Montana', 'MT'),
('31', 'Nebraska', 'NE'),
('32', 'Nevada', 'NV'),
('33', 'New Hampshire', 'NH'),
('34', 'New Jersey', 'NJ'),
('35', 'New Mexico', 'NM'),
('36', 'New York', 'NY'),
('37', 'North Carolina', 'NC'),
('38', 'North Dakota', 'ND'),
('39', 'Ohio', 'OH'),
('40', 'Oklahoma', 'OK'),
('41', 'Oregon', 'OR'),
('42', 'Pennsylvania', 'PA'),
('44', 'Rhode Island', 'RI'),
('45', 'South Carolina', 'SC'),
('46', 'South Dakota', 'SD'),
('47', 'Tennessee', 'TN'),
('48', 'Texas', 'TX'),
('49', 'Utah', 'UT'),
('50', 'Vermont', 'VT'),
('51', 'Virginia', 'VA'),
('53', 'Washington', 'WA'),
('54', 'West Virginia', 'WV'),
('55', 'Wisconsin', 'WI'),
('56', 'Wyoming', 'WY'),
('72', 'Puerto Rico', 'PR');

GRANT SELECT ON state_fips_lookup TO anon, authenticated;

-- =============================================================================
-- STEP 6: State Tax Credit Programs Reference Table
-- =============================================================================
-- This stores state-level program info (not per-tract)

DROP TABLE IF EXISTS state_tax_credit_programs CASCADE;

CREATE TABLE state_tax_credit_programs (
    state_name VARCHAR(100) PRIMARY KEY,
    state_abbrev VARCHAR(2),

    -- State NMTC
    has_state_nmtc BOOLEAN DEFAULT FALSE,
    state_nmtc_program_name TEXT,
    state_nmtc_admin_agency TEXT,
    state_nmtc_transferable BOOLEAN DEFAULT FALSE,

    -- State LIHTC
    has_state_lihtc BOOLEAN DEFAULT FALSE,
    state_lihtc_program_size TEXT,
    state_lihtc_transferable BOOLEAN DEFAULT FALSE,

    -- State HTC
    has_state_htc BOOLEAN DEFAULT FALSE,
    state_htc_credit_pct VARCHAR(20),
    state_htc_annual_cap TEXT,
    state_htc_transferable BOOLEAN DEFAULT FALSE,
    state_htc_refundable BOOLEAN DEFAULT FALSE,

    -- State OZ
    has_state_oz_conformity BOOLEAN DEFAULT FALSE,
    state_oz_program_type TEXT,

    -- Brownfield
    has_brownfield_credit BOOLEAN DEFAULT FALSE,
    brownfield_credit_type TEXT,
    brownfield_credit_pct VARCHAR(50),
    brownfield_transferable BOOLEAN DEFAULT FALSE,
    brownfield_refundable BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE state_tax_credit_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "State programs are publicly readable" ON state_tax_credit_programs FOR SELECT USING (true);
GRANT SELECT ON state_tax_credit_programs TO anon, authenticated;

-- =============================================================================
-- STEP 7: RPC Functions for Map Queries
-- =============================================================================

-- Get tracts in bounding box (NO LIMIT - return all in viewport)
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
    is_nmtc_eligible BOOLEAN,
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
    has_any_tax_credit BOOLEAN,
    severely_distressed BOOLEAN,
    nmtc_poverty_rate DECIMAL(5,2),
    nmtc_mfi_percent DECIMAL(6,2),
    nmtc_unemployment_rate DECIMAL(5,2),
    stack_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(ct.geom)::TEXT as geom_json,
        ct.state_name,
        ct.county_name,
        ct.is_nmtc_eligible,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.has_state_htc,
        ct.has_brownfield_credit,
        ct.has_any_tax_credit,
        ct.severely_distressed,
        ct.nmtc_poverty_rate,
        ct.nmtc_mfi_percent,
        ct.nmtc_unemployment_rate,
        ct.stack_score
    FROM census_tracts ct
    WHERE ct.geom IS NOT NULL
      AND ct.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326);
    -- NO LIMIT - return all tracts in viewport
END;
$$ LANGUAGE plpgsql STABLE;

-- Get simplified tracts for zoomed-out view
CREATE OR REPLACE FUNCTION get_simplified_tracts_in_bbox(
    p_min_lng DECIMAL,
    p_min_lat DECIMAL,
    p_max_lng DECIMAL,
    p_max_lat DECIMAL
)
RETURNS TABLE (
    geoid VARCHAR(11),
    geom_json TEXT,
    has_any_tax_credit BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(COALESCE(ct.geom_simplified, ct.geom))::TEXT as geom_json,
        ct.has_any_tax_credit
    FROM census_tracts ct
    WHERE ct.geom IS NOT NULL
      AND ct.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get single tract by GEOID
CREATE OR REPLACE FUNCTION get_tract_by_geoid(p_geoid VARCHAR(11))
RETURNS TABLE (
    geoid VARCHAR(11),
    geom_json TEXT,
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    is_nmtc_eligible BOOLEAN,
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
    has_any_tax_credit BOOLEAN,
    severely_distressed BOOLEAN,
    nmtc_poverty_rate DECIMAL(5,2),
    nmtc_mfi_percent DECIMAL(6,2),
    nmtc_unemployment_rate DECIMAL(5,2),
    stack_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(ct.geom)::TEXT as geom_json,
        ct.state_name,
        ct.county_name,
        ct.is_nmtc_eligible,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.has_state_htc,
        ct.has_brownfield_credit,
        ct.has_any_tax_credit,
        ct.severely_distressed,
        ct.nmtc_poverty_rate,
        ct.nmtc_mfi_percent,
        ct.nmtc_unemployment_rate,
        ct.stack_score
    FROM census_tracts ct
    WHERE ct.geoid = p_geoid
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get tract at coordinates
CREATE OR REPLACE FUNCTION get_tract_from_coordinates(
    p_lat DECIMAL,
    p_lng DECIMAL
)
RETURNS TABLE (
    geoid VARCHAR(11),
    geom_json TEXT,
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    is_nmtc_eligible BOOLEAN,
    is_lihtc_qct BOOLEAN,
    is_oz_designated BOOLEAN,
    has_state_nmtc BOOLEAN,
    has_state_htc BOOLEAN,
    has_brownfield_credit BOOLEAN,
    has_any_tax_credit BOOLEAN,
    severely_distressed BOOLEAN,
    stack_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.geoid,
        ST_AsGeoJSON(ct.geom)::TEXT as geom_json,
        ct.state_name,
        ct.county_name,
        ct.is_nmtc_eligible,
        ct.is_lihtc_qct,
        ct.is_oz_designated,
        ct.has_state_nmtc,
        ct.has_state_htc,
        ct.has_brownfield_credit,
        ct.has_any_tax_credit,
        ct.severely_distressed,
        ct.stack_score
    FROM census_tracts ct
    WHERE ct.geom IS NOT NULL
      AND ST_Contains(ct.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_map_tracts_in_bbox TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_simplified_tracts_in_bbox TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_by_geoid TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_from_coordinates TO anon, authenticated;

-- =============================================================================
-- STEP 8: Comments
-- =============================================================================

COMMENT ON TABLE census_tracts IS 'MASTER SOURCE OF TRUTH - All 85,396 US census tracts with geometry and tax credit eligibility for NMTC, LIHTC QCT, OZ, State NMTC/HTC/Brownfield';
COMMENT ON COLUMN census_tracts.has_any_tax_credit IS 'TRUE = Purple on map (eligible for at least one tax credit), FALSE = Grey on map';
COMMENT ON COLUMN census_tracts.geom IS 'Full resolution MultiPolygon geometry for zoomed-in view';
COMMENT ON COLUMN census_tracts.geom_simplified IS 'Simplified geometry (~95% smaller) for zoomed-out US view';

-- =============================================================================
-- DONE!
-- =============================================================================
-- Next steps:
-- 1. Import geometry from shapefile (see separate script)
-- 2. Import tract data from nmtc_master_for_mapbox.csv
-- 3. Mark OZ tracts (from Opportunity_Zones_TC.csv)
-- 4. Mark QCT tracts (from QCT2026.csv)
-- 5. Apply state-level tax credit flags
-- =============================================================================
