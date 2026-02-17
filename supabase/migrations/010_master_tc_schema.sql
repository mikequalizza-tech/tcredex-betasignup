-- =============================================================================
-- tCredex Master Tax Credit Schema v2.0
-- =============================================================================
-- This migration creates the core spatial spine for the tCredex platform
-- tract_geometries is the SOURCE OF TRUTH for all census tract data
-- GEOID (11-char FIPS) is the PRIMARY KEY across all tract tables
-- =============================================================================
-- Run with: supabase db push
-- =============================================================================

-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- STEP 1: TRACT_GEOMETRIES - The Spatial Spine (SOURCE OF TRUTH)
-- =============================================================================
-- This table stores all 85K+ census tract geometries with PostGIS
-- LOCAL geometry lookup - NO API CALLS for polygon rendering

DROP TABLE IF EXISTS tract_geometries CASCADE;

CREATE TABLE tract_geometries (
    geoid VARCHAR(11) PRIMARY KEY,  -- 11-digit FIPS code (e.g., '06077003406')
    state_fips VARCHAR(2) NOT NULL,  -- First 2 digits of GEOID
    county_fips VARCHAR(3) NOT NULL, -- Digits 3-5 of GEOID
    tract_fips VARCHAR(6) NOT NULL,  -- Digits 6-11 of GEOID
    geom GEOMETRY(MultiPolygon, 4326), -- PostGIS geometry, WGS84 coordinate system
    centroid_lat DECIMAL(10,7),
    centroid_lng DECIMAL(10,7),
    area_sq_meters DECIMAL(20,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast polygon lookups
CREATE INDEX idx_tract_geometries_geom ON tract_geometries USING GIST(geom);
CREATE INDEX idx_tract_geometries_state ON tract_geometries(state_fips);
CREATE INDEX idx_tract_geometries_county ON tract_geometries(state_fips, county_fips);

-- Enable RLS
ALTER TABLE tract_geometries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tract geometries are publicly readable" ON tract_geometries FOR SELECT USING (true);

COMMENT ON TABLE tract_geometries IS 'Census tract polygon geometries - SOURCE OF TRUTH for spatial data';
COMMENT ON COLUMN tract_geometries.geoid IS '11-digit FIPS code (state 2 + county 3 + tract 6)';
COMMENT ON COLUMN tract_geometries.geom IS 'PostGIS MultiPolygon geometry in WGS84 (SRID 4326)';

-- =============================================================================
-- STEP 2: FEDERAL_TRACT_ELIGIBILITY - Federal Program Qualification
-- =============================================================================
-- NMTC LIC eligibility from 2016-2020 ACS data

DROP TABLE IF EXISTS federal_tract_eligibility CASCADE;

CREATE TABLE federal_tract_eligibility (
    geoid VARCHAR(11) PRIMARY KEY REFERENCES tract_geometries(geoid),
    state_name VARCHAR(100) NOT NULL,
    county_name VARCHAR(100),
    
    -- NMTC Low-Income Community (LIC) Eligibility
    is_nmtc_lic BOOLEAN DEFAULT FALSE,
    poverty_rate_pct DECIMAL(5,2),      -- Census Tract Poverty Rate %
    poverty_qualifies BOOLEAN DEFAULT FALSE,  -- >= 20%
    mfi_pct DECIMAL(6,2),               -- Median Family Income as % of benchmark
    mfi_qualifies BOOLEAN DEFAULT FALSE,      -- <= 80%
    unemployment_rate_pct DECIMAL(5,2),
    unemployment_ratio DECIMAL(5,2),     -- Ratio to national unemployment
    unemployment_qualifies BOOLEAN DEFAULT FALSE, -- Ratio > 1.5
    
    -- LIHTC Qualified Census Tract (QCT)
    is_lihtc_qct BOOLEAN DEFAULT FALSE,
    
    -- Federal Opportunity Zone
    is_oz_designated BOOLEAN DEFAULT FALSE,
    oz_designation_year INTEGER,
    
    -- Severely Distressed Indicators
    is_severely_distressed BOOLEAN DEFAULT FALSE,
    distress_score INTEGER,  -- Composite distress score 0-100
    
    -- Metro Status
    metro_status VARCHAR(20),  -- 'Metro' or 'Non-Metro'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_federal_tract_state ON federal_tract_eligibility(state_name);
CREATE INDEX idx_federal_tract_nmtc ON federal_tract_eligibility(is_nmtc_lic) WHERE is_nmtc_lic = TRUE;
CREATE INDEX idx_federal_tract_qct ON federal_tract_eligibility(is_lihtc_qct) WHERE is_lihtc_qct = TRUE;
CREATE INDEX idx_federal_tract_oz ON federal_tract_eligibility(is_oz_designated) WHERE is_oz_designated = TRUE;
CREATE INDEX idx_federal_tract_distressed ON federal_tract_eligibility(is_severely_distressed) WHERE is_severely_distressed = TRUE;

ALTER TABLE federal_tract_eligibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Federal eligibility is publicly readable" ON federal_tract_eligibility FOR SELECT USING (true);

COMMENT ON TABLE federal_tract_eligibility IS 'Federal tax credit program eligibility by census tract';

-- =============================================================================
-- STEP 3: STATE_TAX_CREDIT_PROGRAMS - State Program Master Reference
-- =============================================================================
-- 50 states + DC with full program details (from State_Tax_Credit_Programs_Combined_2025)

DROP TABLE IF EXISTS state_tax_credit_programs CASCADE;

CREATE TABLE state_tax_credit_programs (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) UNIQUE NOT NULL,
    
    -- State NMTC Program
    has_state_nmtc BOOLEAN DEFAULT FALSE,
    state_nmtc_program_name VARCHAR(255),
    state_nmtc_admin_agency VARCHAR(255),
    state_nmtc_credit_structure TEXT,
    state_nmtc_transferable BOOLEAN DEFAULT FALSE,
    state_nmtc_refundable BOOLEAN DEFAULT FALSE,
    state_nmtc_notes TEXT,
    
    -- State LIHTC Program
    has_state_lihtc BOOLEAN DEFAULT FALSE,
    state_lihtc_program_size VARCHAR(50),
    state_lihtc_credit_pct_years VARCHAR(100),
    state_lihtc_transferable BOOLEAN DEFAULT FALSE,
    state_lihtc_refundable BOOLEAN DEFAULT FALSE,
    state_lihtc_admin_agency VARCHAR(255),
    
    -- State HTC Program
    has_state_htc BOOLEAN DEFAULT FALSE,
    state_htc_credit_pct INTEGER,
    state_htc_annual_cap VARCHAR(100),
    state_htc_transferable BOOLEAN DEFAULT FALSE,
    state_htc_refundable BOOLEAN DEFAULT FALSE,
    state_htc_admin_agency VARCHAR(255),
    
    -- State OZ Program
    has_state_oz BOOLEAN DEFAULT FALSE,
    state_oz_federal_conformity BOOLEAN DEFAULT FALSE,
    state_oz_program_type VARCHAR(100),
    state_oz_admin_agency VARCHAR(255),
    
    -- State Brownfield Credit
    has_brownfield_credit BOOLEAN DEFAULT FALSE,
    brownfield_credit_type VARCHAR(255),
    brownfield_credit_amount VARCHAR(100),
    brownfield_transferable BOOLEAN DEFAULT FALSE,
    brownfield_refundable BOOLEAN DEFAULT FALSE,
    brownfield_admin_agency VARCHAR(255),
    brownfield_notes TEXT,
    
    -- Stacking Notes
    stacking_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE state_tax_credit_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "State programs are publicly readable" ON state_tax_credit_programs FOR SELECT USING (true);

COMMENT ON TABLE state_tax_credit_programs IS 'State-level tax credit program details (50 states + DC)';

-- =============================================================================
-- STEP 4: STATE_TRACT_ELIGIBILITY - State Programs Expanded by GEOID
-- =============================================================================
-- State program eligibility expanded to 85K+ tracts
-- Extrapolated from state programs using State Name as key

DROP TABLE IF EXISTS state_tract_eligibility CASCADE;

CREATE TABLE state_tract_eligibility (
    geoid VARCHAR(11) PRIMARY KEY REFERENCES tract_geometries(geoid),
    state_name VARCHAR(100) NOT NULL,
    
    -- State NMTC
    is_state_nmtc BOOLEAN DEFAULT FALSE,
    state_nmtc_transferable BOOLEAN DEFAULT FALSE,
    state_nmtc_refundable BOOLEAN DEFAULT FALSE,
    
    -- State LIHTC
    is_state_lihtc BOOLEAN DEFAULT FALSE,
    state_lihtc_transferable BOOLEAN DEFAULT FALSE,
    state_lihtc_refundable BOOLEAN DEFAULT FALSE,
    
    -- State HTC
    is_state_htc BOOLEAN DEFAULT FALSE,
    state_htc_transferable BOOLEAN DEFAULT FALSE,
    state_htc_refundable BOOLEAN DEFAULT FALSE,
    
    -- State OZ
    is_state_oz BOOLEAN DEFAULT FALSE,
    
    -- State Brownfield
    is_state_brownfield BOOLEAN DEFAULT FALSE,
    state_brownfield_transferable BOOLEAN DEFAULT FALSE,
    state_brownfield_refundable BOOLEAN DEFAULT FALSE,
    
    -- At-a-Glance Classification
    credit_classification VARCHAR(50), -- 'Neither', 'Sellable', 'Refundable', 'Both'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_tract_state ON state_tract_eligibility(state_name);
CREATE INDEX idx_state_tract_nmtc ON state_tract_eligibility(is_state_nmtc) WHERE is_state_nmtc = TRUE;
CREATE INDEX idx_state_tract_htc ON state_tract_eligibility(is_state_htc) WHERE is_state_htc = TRUE;
CREATE INDEX idx_state_tract_classification ON state_tract_eligibility(credit_classification);

ALTER TABLE state_tract_eligibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "State tract eligibility is publicly readable" ON state_tract_eligibility FOR SELECT USING (true);

COMMENT ON TABLE state_tract_eligibility IS 'State tax credit eligibility expanded to 85K+ tracts by GEOID';

-- =============================================================================
-- STEP 5: OPPORTUNITY_ZONES - Federal OZ Designations
-- =============================================================================
-- 8,765 designated Opportunity Zones

DROP TABLE IF EXISTS opportunity_zones CASCADE;

CREATE TABLE opportunity_zones (
    geoid VARCHAR(11) PRIMARY KEY,
    state_fips VARCHAR(2) NOT NULL,
    county_fips VARCHAR(3) NOT NULL,
    tract_fips VARCHAR(6) NOT NULL,
    state_name VARCHAR(100),
    state_abbrev VARCHAR(2),
    designation_year INTEGER DEFAULT 2018,
    shape_area DECIMAL(20,4),
    shape_length DECIMAL(20,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oz_state ON opportunity_zones(state_fips);
CREATE INDEX idx_oz_state_name ON opportunity_zones(state_name);

ALTER TABLE opportunity_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Opportunity zones are publicly readable" ON opportunity_zones FOR SELECT USING (true);

COMMENT ON TABLE opportunity_zones IS 'Federal Opportunity Zone census tract designations (2018)';

-- =============================================================================
-- STEP 6: MASTER_TC_TABLE - The Unified View
-- =============================================================================
-- Single table/view that merges ALL tax credit data by GEOID
-- This is what the MAP and DealCards query

CREATE OR REPLACE VIEW master_tc_view AS
SELECT 
    tg.geoid,
    tg.state_fips,
    tg.county_fips,
    tg.tract_fips,
    tg.geom,
    tg.centroid_lat,
    tg.centroid_lng,
    
    -- Federal NMTC
    COALESCE(f.state_name, '') AS state_name,
    COALESCE(f.county_name, '') AS county_name,
    COALESCE(f.is_nmtc_lic, FALSE) AS is_fed_nmtc_eligible,
    f.poverty_rate_pct,
    f.poverty_qualifies,
    f.mfi_pct,
    f.mfi_qualifies,
    f.unemployment_rate_pct,
    f.unemployment_qualifies,
    
    -- Federal LIHTC QCT
    COALESCE(f.is_lihtc_qct, FALSE) AS is_fed_lihtc_qct,
    
    -- Federal OZ
    COALESCE(f.is_oz_designated, oz.geoid IS NOT NULL, FALSE) AS is_fed_oz_designated,
    
    -- Distress
    COALESCE(f.is_severely_distressed, FALSE) AS is_severely_distressed,
    f.distress_score,
    f.metro_status,
    
    -- State NMTC
    COALESCE(s.is_state_nmtc, FALSE) AS is_state_nmtc,
    s.state_nmtc_transferable,
    s.state_nmtc_refundable,
    
    -- State LIHTC
    COALESCE(s.is_state_lihtc, FALSE) AS is_state_lihtc,
    s.state_lihtc_transferable,
    s.state_lihtc_refundable,
    
    -- State HTC
    COALESCE(s.is_state_htc, FALSE) AS is_state_htc,
    s.state_htc_transferable,
    s.state_htc_refundable,
    
    -- State OZ
    COALESCE(s.is_state_oz, FALSE) AS is_state_oz,
    
    -- State Brownfield
    COALESCE(s.is_state_brownfield, FALSE) AS is_state_brownfield,
    s.state_brownfield_transferable,
    s.state_brownfield_refundable,
    
    -- Classification
    COALESCE(s.credit_classification, 'Neither') AS credit_classification,
    
    -- Stacking flags (computed)
    CASE 
        WHEN COALESCE(f.is_nmtc_lic, FALSE) AND COALESCE(s.is_state_nmtc, FALSE) THEN TRUE
        ELSE FALSE
    END AS can_stack_nmtc,
    
    CASE 
        WHEN COALESCE(f.is_lihtc_qct, FALSE) AND COALESCE(s.is_state_lihtc, FALSE) THEN TRUE
        ELSE FALSE
    END AS can_stack_lihtc,
    
    CASE 
        WHEN COALESCE(f.is_oz_designated, oz.geoid IS NOT NULL, FALSE) AND COALESCE(s.is_state_oz, FALSE) THEN TRUE
        ELSE FALSE
    END AS can_stack_oz

FROM tract_geometries tg
LEFT JOIN federal_tract_eligibility f ON tg.geoid = f.geoid
LEFT JOIN state_tract_eligibility s ON tg.geoid = s.geoid
LEFT JOIN opportunity_zones oz ON tg.geoid = oz.geoid;

COMMENT ON VIEW master_tc_view IS 'Unified view of all tax credit eligibility data by census tract';

-- =============================================================================
-- STEP 7: SPATIAL LOOKUP FUNCTIONS
-- =============================================================================
-- Functions for address-to-tract resolution and point-in-polygon queries

-- Function to get tract info from lat/lng point
CREATE OR REPLACE FUNCTION get_tract_from_point(
    p_lat DECIMAL,
    p_lng DECIMAL
)
RETURNS TABLE (
    geoid VARCHAR(11),
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    is_fed_nmtc_eligible BOOLEAN,
    is_fed_lihtc_qct BOOLEAN,
    is_fed_oz_designated BOOLEAN,
    is_state_nmtc BOOLEAN,
    is_state_htc BOOLEAN,
    is_state_brownfield BOOLEAN,
    credit_classification VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.geoid,
        m.state_name,
        m.county_name,
        m.is_fed_nmtc_eligible,
        m.is_fed_lihtc_qct,
        m.is_fed_oz_designated,
        m.is_state_nmtc,
        m.is_state_htc,
        m.is_state_brownfield,
        m.credit_classification
    FROM master_tc_view m
    WHERE ST_Contains(m.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all tracts within a bounding box (for map viewport)
CREATE OR REPLACE FUNCTION get_tracts_in_bbox(
    min_lng DECIMAL,
    min_lat DECIMAL,
    max_lng DECIMAL,
    max_lat DECIMAL,
    filter_program VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    geoid VARCHAR(11),
    geojson TEXT,
    is_fed_nmtc_eligible BOOLEAN,
    is_fed_lihtc_qct BOOLEAN,
    is_fed_oz_designated BOOLEAN,
    is_state_nmtc BOOLEAN,
    credit_classification VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.geoid,
        ST_AsGeoJSON(m.geom)::TEXT as geojson,
        m.is_fed_nmtc_eligible,
        m.is_fed_lihtc_qct,
        m.is_fed_oz_designated,
        m.is_state_nmtc,
        m.credit_classification
    FROM master_tc_view m
    WHERE m.geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    AND (
        filter_program IS NULL
        OR (filter_program = 'NMTC' AND m.is_fed_nmtc_eligible)
        OR (filter_program = 'LIHTC' AND m.is_fed_lihtc_qct)
        OR (filter_program = 'OZ' AND m.is_fed_oz_designated)
        OR (filter_program = 'STATE_NMTC' AND m.is_state_nmtc)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get tract GeoJSON by GEOID
CREATE OR REPLACE FUNCTION get_tract_geojson(p_geoid VARCHAR(11))
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'type', 'Feature',
        'properties', json_build_object(
            'geoid', m.geoid,
            'state_name', m.state_name,
            'county_name', m.county_name,
            'is_fed_nmtc_eligible', m.is_fed_nmtc_eligible,
            'is_fed_lihtc_qct', m.is_fed_lihtc_qct,
            'is_fed_oz_designated', m.is_fed_oz_designated,
            'is_state_nmtc', m.is_state_nmtc,
            'is_state_htc', m.is_state_htc,
            'poverty_rate_pct', m.poverty_rate_pct,
            'mfi_pct', m.mfi_pct,
            'credit_classification', m.credit_classification
        ),
        'geometry', ST_AsGeoJSON(m.geom)::json
    ) INTO result
    FROM master_tc_view m
    WHERE m.geoid = p_geoid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_tract_from_point IS 'Lookup tract eligibility from lat/lng coordinates';
COMMENT ON FUNCTION get_tracts_in_bbox IS 'Get all tracts within map viewport with optional program filter';
COMMENT ON FUNCTION get_tract_geojson IS 'Get full GeoJSON feature for a specific tract';

-- =============================================================================
-- STEP 8: Update projects table to reference tract_geometries
-- =============================================================================
-- Ensure projects table has proper GEOID foreign key

DO $$
BEGIN
    -- Add geoid column to projects if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'geoid'
    ) THEN
        ALTER TABLE projects ADD COLUMN geoid VARCHAR(11);
        CREATE INDEX idx_projects_geoid ON projects(geoid);
    END IF;
END $$;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON tract_geometries TO anon, authenticated;
GRANT SELECT ON federal_tract_eligibility TO anon, authenticated;
GRANT SELECT ON state_tax_credit_programs TO anon, authenticated;
GRANT SELECT ON state_tract_eligibility TO anon, authenticated;
GRANT SELECT ON opportunity_zones TO anon, authenticated;
GRANT SELECT ON master_tc_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_from_point TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tracts_in_bbox TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_geojson TO anon, authenticated;
