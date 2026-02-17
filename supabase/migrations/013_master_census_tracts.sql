-- =============================================================================
-- MASTER CENSUS TRACTS TABLE REBUILD
-- =============================================================================
-- This migration rebuilds census_tracts as the single SOURCE OF TRUTH
--
-- Data Sources:
--   1. census_tracts.geoid + census_tracts.geom (keep these)
--   2. State_Tax_Credit_Programs_Combined_2025_With_Stacking.csv (state credits)
--   3. Opportunity_Zones_TC.csv (OZ designations by GEOID)
--   4. lihtc_qct_2025 table (LIHTC QCT by GEOID)
--
-- IMPORTANT: Run this AFTER importing the CSV files into staging tables
-- =============================================================================

-- =============================================================================
-- STEP 1: Create staging table for State Tax Credit Programs
-- =============================================================================
-- This will hold data from State_Tax_Credit_Programs_Combined_2025_With_Stacking.csv
-- Import the CSV into this table first, then we'll join by state_name

DROP TABLE IF EXISTS state_tax_credit_programs_staging CASCADE;

CREATE TABLE state_tax_credit_programs_staging (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) UNIQUE NOT NULL,

    -- State NMTC
    state_nmtc BOOLEAN DEFAULT FALSE,
    state_nmtc_program_name TEXT,
    state_nmtc_admin_agency TEXT,
    state_nmtc_credit_structure TEXT,
    state_nmtc_transferable BOOLEAN DEFAULT FALSE,
    state_nmtc_notes TEXT,

    -- State LIHTC
    state_lihtc BOOLEAN DEFAULT FALSE,
    state_lihtc_program_size TEXT,
    state_lihtc_credit_pct_years TEXT,
    state_lihtc_refundable_transferable TEXT,
    state_lihtc_admin_agency TEXT,

    -- State HTC
    state_htc BOOLEAN DEFAULT FALSE,
    state_htc_credit_pct TEXT,
    state_htc_annual_cap TEXT,
    state_htc_transferable BOOLEAN DEFAULT FALSE,
    state_htc_refundable BOOLEAN DEFAULT FALSE,
    state_htc_admin_agency TEXT,

    -- State OZ
    oz_federal_conformity BOOLEAN DEFAULT FALSE,
    state_oz_program BOOLEAN DEFAULT FALSE,
    state_oz_program_type TEXT,
    state_oz_admin_agency TEXT,

    -- Brownfield
    brownfield_credit BOOLEAN DEFAULT FALSE,
    brownfield_credit_type TEXT,
    brownfield_credit_amount TEXT,
    brownfield_transferable BOOLEAN DEFAULT FALSE,
    brownfield_refundable BOOLEAN DEFAULT FALSE,
    brownfield_admin_agency TEXT,
    brownfield_notes TEXT,

    -- Stacking
    stacking_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: Create staging table for Opportunity Zones
-- =============================================================================
-- This will hold data from Opportunity_Zones_TC.csv

DROP TABLE IF EXISTS opportunity_zones_staging CASCADE;

CREATE TABLE opportunity_zones_staging (
    id SERIAL PRIMARY KEY,
    geoid VARCHAR(11) UNIQUE NOT NULL,
    state_fips VARCHAR(2),
    county_fips VARCHAR(3),
    tract_fips VARCHAR(6),
    state_abbrev VARCHAR(2),
    state_name VARCHAR(100),
    shape_area DECIMAL(20,4),
    shape_length DECIMAL(20,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: Backup existing census_tracts geometry data
-- =============================================================================
-- We keep ONLY geoid and geom - everything else gets rebuilt

DROP TABLE IF EXISTS census_tracts_geom_backup CASCADE;

CREATE TABLE census_tracts_geom_backup AS
SELECT
    geoid,
    geom
FROM census_tracts
WHERE geom IS NOT NULL;

-- Create index on backup
CREATE INDEX idx_census_tracts_backup_geoid ON census_tracts_geom_backup(geoid);

-- =============================================================================
-- STEP 4: Rebuild census_tracts as MASTER table
-- =============================================================================

-- Drop the old table
DROP TABLE IF EXISTS census_tracts CASCADE;

-- Create new master table with proper schema
CREATE TABLE census_tracts (
    -- Primary Key
    geoid VARCHAR(11) PRIMARY KEY,

    -- Geometry (from original census_tracts)
    geom GEOMETRY(MultiPolygon, 4326),

    -- Location info (derived from GEOID)
    state_fips VARCHAR(2) GENERATED ALWAYS AS (SUBSTRING(geoid, 1, 2)) STORED,
    county_fips VARCHAR(3) GENERATED ALWAYS AS (SUBSTRING(geoid, 3, 3)) STORED,
    tract_fips VARCHAR(6) GENERATED ALWAYS AS (SUBSTRING(geoid, 6, 6)) STORED,
    state_name VARCHAR(100),
    county_name VARCHAR(100),

    -- LIHTC QCT (from lihtc_qct_2025 table)
    is_lihtc_qct BOOLEAN DEFAULT FALSE,
    lihtc_designation_year INTEGER,

    -- Opportunity Zone (from Opportunity_Zones_TC.csv)
    is_oz_designated BOOLEAN DEFAULT FALSE,
    oz_designation_year INTEGER DEFAULT 2018,

    -- State NMTC (from State_Tax_Credit_Programs CSV, expanded by state)
    has_state_nmtc BOOLEAN DEFAULT FALSE,
    state_nmtc_transferable BOOLEAN DEFAULT FALSE,

    -- State LIHTC (from State_Tax_Credit_Programs CSV, expanded by state)
    has_state_lihtc BOOLEAN DEFAULT FALSE,

    -- State HTC (from State_Tax_Credit_Programs CSV, expanded by state)
    has_state_htc BOOLEAN DEFAULT FALSE,
    state_htc_transferable BOOLEAN DEFAULT FALSE,
    state_htc_refundable BOOLEAN DEFAULT FALSE,

    -- State OZ conformity
    has_state_oz_conformity BOOLEAN DEFAULT FALSE,

    -- Brownfield (from State_Tax_Credit_Programs CSV, expanded by state)
    has_brownfield_credit BOOLEAN DEFAULT FALSE,

    -- NMTC Distress Indicators
    severely_distressed BOOLEAN DEFAULT FALSE,
    poverty_rate DECIMAL(5,2),
    median_family_income_pct DECIMAL(5,2),
    unemployment_rate DECIMAL(5,2),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 5: Restore geometry data from backup
-- =============================================================================

INSERT INTO census_tracts (geoid, geom)
SELECT geoid, geom
FROM census_tracts_geom_backup;

-- =============================================================================
-- STEP 6: Create indexes for performance
-- =============================================================================

CREATE INDEX idx_census_tracts_geom ON census_tracts USING GIST(geom);
CREATE INDEX idx_census_tracts_state ON census_tracts(state_fips);
CREATE INDEX idx_census_tracts_state_name ON census_tracts(state_name);
CREATE INDEX idx_census_tracts_lihtc ON census_tracts(is_lihtc_qct) WHERE is_lihtc_qct = TRUE;
CREATE INDEX idx_census_tracts_oz ON census_tracts(is_oz_designated) WHERE is_oz_designated = TRUE;
CREATE INDEX idx_census_tracts_state_nmtc ON census_tracts(has_state_nmtc) WHERE has_state_nmtc = TRUE;
CREATE INDEX idx_census_tracts_state_htc ON census_tracts(has_state_htc) WHERE has_state_htc = TRUE;
CREATE INDEX idx_census_tracts_severely_distressed ON census_tracts(severely_distressed) WHERE severely_distressed = TRUE;

-- =============================================================================
-- STEP 7: Enable RLS
-- =============================================================================

ALTER TABLE census_tracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Census tracts are publicly readable" ON census_tracts FOR SELECT USING (true);

ALTER TABLE state_tax_credit_programs_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "State programs are publicly readable" ON state_tax_credit_programs_staging FOR SELECT USING (true);

ALTER TABLE opportunity_zones_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "OZ staging is publicly readable" ON opportunity_zones_staging FOR SELECT USING (true);

-- =============================================================================
-- STEP 8: Grant permissions
-- =============================================================================

GRANT SELECT ON census_tracts TO anon, authenticated;
GRANT SELECT ON state_tax_credit_programs_staging TO anon, authenticated;
GRANT SELECT ON opportunity_zones_staging TO anon, authenticated;

-- =============================================================================
-- STEP 9: State FIPS to Name mapping (for joining state data)
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
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE census_tracts IS 'MASTER SOURCE OF TRUTH - All census tract data with geometry and tax credit eligibility';
COMMENT ON TABLE state_tax_credit_programs_staging IS 'State tax credit programs - import State_Tax_Credit_Programs_Combined_2025_With_Stacking.csv here';
COMMENT ON TABLE opportunity_zones_staging IS 'Opportunity Zones - import Opportunity_Zones_TC.csv here';
COMMENT ON TABLE state_fips_lookup IS 'State FIPS code to name/abbreviation mapping';

-- =============================================================================
-- NEXT STEPS (run these after importing CSVs):
-- =============================================================================
--
-- 1. Import State_Tax_Credit_Programs_Combined_2025_With_Stacking.csv into state_tax_credit_programs_staging
-- 2. Import Opportunity_Zones_TC.csv into opportunity_zones_staging
-- 3. Run the update scripts below to merge data into census_tracts
--
-- See: 014_merge_master_data.sql
-- =============================================================================
