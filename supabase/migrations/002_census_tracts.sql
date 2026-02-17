-- Census Tracts Table - NMTC LIC Data from 2016-2020 ACS
-- 85,395 census tracts
-- Run this SQL in Supabase SQL Editor, then import census_tracts_clean.csv

DROP TABLE IF EXISTS census_tracts CASCADE;

CREATE TABLE census_tracts (
    id SERIAL PRIMARY KEY,
    geoid VARCHAR(11) NOT NULL UNIQUE,
    state_name VARCHAR(100),
    county_name VARCHAR(100),
    county_fips VARCHAR(5),
    metro_status VARCHAR(20),
    is_nmtc_lic BOOLEAN DEFAULT FALSE,
    poverty_rate DECIMAL(5,2),
    poverty_qualifies BOOLEAN DEFAULT FALSE,
    mfi_pct DECIMAL(6,2),
    mfi_qualifies BOOLEAN DEFAULT FALSE,
    unemployment_rate DECIMAL(5,2),
    unemployment_ratio DECIMAL(5,2),
    unemployment_qualifies BOOLEAN DEFAULT FALSE,
    poverty_population INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_census_tracts_geoid ON census_tracts(geoid);
CREATE INDEX idx_census_tracts_state ON census_tracts(state_name);
CREATE INDEX idx_census_tracts_county_fips ON census_tracts(county_fips);
CREATE INDEX idx_census_tracts_eligible ON census_tracts(is_nmtc_lic);
CREATE INDEX idx_census_tracts_state_county ON census_tracts(state_name, county_name);

-- Enable Row Level Security
ALTER TABLE census_tracts ENABLE ROW LEVEL SECURITY;

-- Public read access (census data is public)
CREATE POLICY "Census tracts are publicly readable"
    ON census_tracts FOR SELECT
    USING (true);

COMMENT ON TABLE census_tracts IS 'NMTC Low-Income Community eligibility by census tract (2016-2020 ACS)';
COMMENT ON COLUMN census_tracts.geoid IS '11-digit FIPS code for census tract';
COMMENT ON COLUMN census_tracts.is_nmtc_lic IS 'Qualifies as NMTC Low-Income Community';
COMMENT ON COLUMN census_tracts.mfi_pct IS 'Median Family Income as % of area median';
COMMENT ON COLUMN census_tracts.metro_status IS 'OMB Metro or Non-Metro designation';
