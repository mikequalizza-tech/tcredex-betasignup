-- =============================================================================
-- tCredex CANONICAL DATABASE SCHEMA
-- =============================================================================
-- Version: 2.0
-- Date: 2025-02-06
-- Purpose: Single Source of Truth - No cached fields, proper FKs, PostGIS enabled
-- 
-- THIS IS THE CANONICAL SCHEMA. All code must reference these tables.
-- There are NO other authoritative data sources.
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE org_type AS ENUM ('cde', 'sponsor', 'investor', 'admin');
CREATE TYPE user_role AS ENUM ('ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE deal_status AS ENUM (
  'draft', 
  'submitted', 
  'under_review', 
  'available', 
  'seeking_capital',
  'matched', 
  'closing', 
  'closed',
  'withdrawn'
);
CREATE TYPE program_type AS ENUM ('NMTC', 'HTC', 'LIHTC', 'OZ', 'Brownfield');
CREATE TYPE loi_status AS ENUM (
  'draft',
  'issued',
  'pending_sponsor',
  'sponsor_accepted',
  'sponsor_rejected',
  'sponsor_countered',
  'withdrawn',
  'expired',
  'superseded'
);
CREATE TYPE commitment_status AS ENUM (
  'draft',
  'issued',
  'pending_sponsor',
  'pending_cde',
  'all_accepted',
  'rejected',
  'withdrawn',
  'expired',
  'closing',
  'closed'
);
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');

-- =============================================================================
-- SPATIAL FOUNDATION: TRACT GEOMETRIES
-- =============================================================================
-- This is the SPATIAL SPINE of the entire system.
-- All tract-based data references this table via GEOID.
-- Geometries stored locally for map rendering - NO external API calls.
-- =============================================================================

CREATE TABLE tract_geometries (
  geoid VARCHAR(11) PRIMARY KEY,
  state_fips VARCHAR(2) NOT NULL,
  county_fips VARCHAR(3) NOT NULL,
  tract_fips VARCHAR(6) NOT NULL,
  geom GEOMETRY(MultiPolygon, 4326),
  centroid_lat DECIMAL(10, 7),
  centroid_lng DECIMAL(10, 7),
  area_sq_meters DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tract_geom ON tract_geometries USING GIST(geom);
CREATE INDEX idx_tract_state ON tract_geometries(state_fips);
CREATE INDEX idx_tract_county ON tract_geometries(state_fips, county_fips);

COMMENT ON TABLE tract_geometries IS 'SOURCE OF TRUTH for census tract spatial data. 85,395 tracts. All map rendering uses local geometry - NO API calls.';

-- =============================================================================
-- FEDERAL TRACT ELIGIBILITY
-- =============================================================================
-- Federal program eligibility by census tract.
-- NMTC LIC, LIHTC QCT, Severely Distressed determinations.
-- Source: 2016-2020 ACS data via CDFI Fund
-- =============================================================================

CREATE TABLE federal_tract_eligibility (
  geoid VARCHAR(11) PRIMARY KEY REFERENCES tract_geometries(geoid) ON DELETE CASCADE,
  state_name VARCHAR(100) NOT NULL,
  county_name VARCHAR(100),
  
  -- NMTC Low-Income Community (LIC)
  is_nmtc_lic BOOLEAN DEFAULT FALSE,
  poverty_rate_pct DECIMAL(5, 2),
  poverty_qualifies BOOLEAN DEFAULT FALSE,
  mfi_pct DECIMAL(6, 2),
  mfi_qualifies BOOLEAN DEFAULT FALSE,
  unemployment_rate_pct DECIMAL(5, 2),
  unemployment_ratio DECIMAL(5, 2),
  unemployment_qualifies BOOLEAN DEFAULT FALSE,
  
  -- LIHTC Qualified Census Tract
  is_lihtc_qct BOOLEAN DEFAULT FALSE,
  
  -- Opportunity Zone (Federal)
  is_oz_designated BOOLEAN DEFAULT FALSE,
  oz_designation_year INTEGER,
  
  -- Distress Indicators
  is_severely_distressed BOOLEAN DEFAULT FALSE,
  distress_score INTEGER DEFAULT 0,
  
  -- Metro Status
  metro_status VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_federal_nmtc ON federal_tract_eligibility(is_nmtc_lic) WHERE is_nmtc_lic = TRUE;
CREATE INDEX idx_federal_qct ON federal_tract_eligibility(is_lihtc_qct) WHERE is_lihtc_qct = TRUE;
CREATE INDEX idx_federal_oz ON federal_tract_eligibility(is_oz_designated) WHERE is_oz_designated = TRUE;
CREATE INDEX idx_federal_distressed ON federal_tract_eligibility(is_severely_distressed) WHERE is_severely_distressed = TRUE;
CREATE INDEX idx_federal_state ON federal_tract_eligibility(state_name);

COMMENT ON TABLE federal_tract_eligibility IS 'Federal program eligibility (NMTC LIC, LIHTC QCT, OZ) by census tract. Source: 2016-2020 ACS.';

-- =============================================================================
-- STATE TAX CREDIT PROGRAMS (Reference Table)
-- =============================================================================
-- Master reference for state-level tax credit programs.
-- 50 states with program details.
-- =============================================================================

CREATE TABLE state_tax_credit_programs (
  id SERIAL PRIMARY KEY,
  state_name VARCHAR(100) UNIQUE NOT NULL,
  state_abbrev VARCHAR(2),
  
  -- State NMTC
  has_state_nmtc BOOLEAN DEFAULT FALSE,
  state_nmtc_name VARCHAR(255),
  state_nmtc_agency VARCHAR(255),
  state_nmtc_transferable BOOLEAN DEFAULT FALSE,
  state_nmtc_refundable BOOLEAN DEFAULT FALSE,
  state_nmtc_notes TEXT,
  
  -- State LIHTC
  has_state_lihtc BOOLEAN DEFAULT FALSE,
  state_lihtc_name VARCHAR(255),
  state_lihtc_agency VARCHAR(255),
  state_lihtc_transferable BOOLEAN DEFAULT FALSE,
  state_lihtc_refundable BOOLEAN DEFAULT FALSE,
  
  -- State HTC
  has_state_htc BOOLEAN DEFAULT FALSE,
  state_htc_name VARCHAR(255),
  state_htc_credit_pct DECIMAL(5, 2),
  state_htc_agency VARCHAR(255),
  state_htc_transferable BOOLEAN DEFAULT FALSE,
  state_htc_refundable BOOLEAN DEFAULT FALSE,
  
  -- State OZ
  has_state_oz BOOLEAN DEFAULT FALSE,
  state_oz_name VARCHAR(255),
  state_oz_type VARCHAR(100),
  
  -- Brownfield
  has_brownfield_credit BOOLEAN DEFAULT FALSE,
  brownfield_name VARCHAR(255),
  brownfield_agency VARCHAR(255),
  brownfield_transferable BOOLEAN DEFAULT FALSE,
  brownfield_refundable BOOLEAN DEFAULT FALSE,
  
  -- Stacking Notes
  stacking_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_programs_name ON state_tax_credit_programs(state_name);
CREATE INDEX idx_state_has_nmtc ON state_tax_credit_programs(has_state_nmtc) WHERE has_state_nmtc = TRUE;
CREATE INDEX idx_state_has_htc ON state_tax_credit_programs(has_state_htc) WHERE has_state_htc = TRUE;

COMMENT ON TABLE state_tax_credit_programs IS 'Master reference for state tax credit programs. 50 states.';

-- =============================================================================
-- STATE TRACT ELIGIBILITY (Expanded by GEOID)
-- =============================================================================
-- State program flags expanded to all 85K tracts.
-- JOINs state_tax_credit_programs on state_name to inherit program details.
-- =============================================================================

CREATE TABLE state_tract_eligibility (
  geoid VARCHAR(11) PRIMARY KEY REFERENCES tract_geometries(geoid) ON DELETE CASCADE,
  state_name VARCHAR(100) NOT NULL,
  
  -- State Program Flags (expanded from state_tax_credit_programs)
  has_state_nmtc BOOLEAN DEFAULT FALSE,
  state_nmtc_transferable BOOLEAN DEFAULT FALSE,
  state_nmtc_refundable BOOLEAN DEFAULT FALSE,
  
  has_state_htc BOOLEAN DEFAULT FALSE,
  state_htc_transferable BOOLEAN DEFAULT FALSE,
  state_htc_refundable BOOLEAN DEFAULT FALSE,
  
  has_brownfield_credit BOOLEAN DEFAULT FALSE,
  brownfield_transferable BOOLEAN DEFAULT FALSE,
  brownfield_refundable BOOLEAN DEFAULT FALSE,
  
  -- Classification
  credit_classification VARCHAR(50), -- 'Neither', 'Sellable', 'Refundable', 'Both'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_tract_state ON state_tract_eligibility(state_name);
CREATE INDEX idx_state_tract_nmtc ON state_tract_eligibility(has_state_nmtc) WHERE has_state_nmtc = TRUE;
CREATE INDEX idx_state_tract_htc ON state_tract_eligibility(has_state_htc) WHERE has_state_htc = TRUE;

COMMENT ON TABLE state_tract_eligibility IS 'State program eligibility expanded to all 85K census tracts.';

-- =============================================================================
-- OPPORTUNITY ZONES (Federal Designations)
-- =============================================================================
-- 8,765 designated Opportunity Zone tracts.
-- =============================================================================

CREATE TABLE opportunity_zones (
  geoid VARCHAR(11) PRIMARY KEY,
  state_fips VARCHAR(2),
  county_fips VARCHAR(3),
  tract_fips VARCHAR(6),
  state_name VARCHAR(100),
  state_abbrev VARCHAR(2),
  designation_year INTEGER DEFAULT 2018,
  shape_area DECIMAL(20, 10),
  shape_length DECIMAL(20, 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oz_state ON opportunity_zones(state_name);

COMMENT ON TABLE opportunity_zones IS 'Federal Opportunity Zone designations. 8,765 tracts designated in 2018.';

-- =============================================================================
-- MASTER TAX CREDIT VIEW
-- =============================================================================
-- UNIFIED VIEW: This is what the map and AutoMatch query.
-- JOINs all tract data into single queryable interface.
-- =============================================================================

CREATE OR REPLACE VIEW master_tc_view AS
SELECT 
  tg.geoid,
  tg.geom,
  tg.centroid_lat,
  tg.centroid_lng,
  tg.state_fips,
  tg.county_fips,
  
  -- Names
  fe.state_name,
  fe.county_name,
  
  -- Federal Eligibility
  COALESCE(fe.is_nmtc_lic, FALSE) AS is_fed_nmtc_eligible,
  fe.poverty_rate_pct,
  fe.mfi_pct,
  fe.unemployment_rate_pct,
  COALESCE(fe.is_lihtc_qct, FALSE) AS is_fed_lihtc_qct,
  COALESCE(fe.is_severely_distressed, FALSE) AS is_severely_distressed,
  fe.distress_score,
  fe.metro_status,
  
  -- Federal OZ
  COALESCE(oz.geoid IS NOT NULL, FALSE) AS is_fed_oz_designated,
  oz.designation_year AS oz_designation_year,
  
  -- State Programs
  COALESCE(se.has_state_nmtc, FALSE) AS has_state_nmtc,
  COALESCE(se.state_nmtc_transferable, FALSE) AS state_nmtc_transferable,
  COALESCE(se.state_nmtc_refundable, FALSE) AS state_nmtc_refundable,
  
  COALESCE(se.has_state_htc, FALSE) AS has_state_htc,
  COALESCE(se.state_htc_transferable, FALSE) AS state_htc_transferable,
  COALESCE(se.state_htc_refundable, FALSE) AS state_htc_refundable,
  
  COALESCE(se.has_brownfield_credit, FALSE) AS has_brownfield_credit,
  COALESCE(se.brownfield_transferable, FALSE) AS brownfield_transferable,
  COALESCE(se.brownfield_refundable, FALSE) AS brownfield_refundable,
  
  se.credit_classification,
  
  -- Computed Stacking Flags
  (COALESCE(fe.is_nmtc_lic, FALSE) OR COALESCE(se.has_state_nmtc, FALSE)) AS can_stack_nmtc,
  (COALESCE(fe.is_lihtc_qct, FALSE)) AS can_stack_lihtc,
  (COALESCE(oz.geoid IS NOT NULL, FALSE)) AS can_stack_oz

FROM tract_geometries tg
LEFT JOIN federal_tract_eligibility fe ON tg.geoid = fe.geoid
LEFT JOIN state_tract_eligibility se ON tg.geoid = se.geoid
LEFT JOIN opportunity_zones oz ON tg.geoid = oz.geoid;

COMMENT ON VIEW master_tc_view IS 'UNIFIED VIEW: Single query interface for all tract eligibility data. Map and AutoMatch use this.';

-- =============================================================================
-- SPATIAL QUERY FUNCTIONS
-- =============================================================================

-- Point-in-polygon lookup for address resolution
CREATE OR REPLACE FUNCTION get_tract_from_point(
  lat DECIMAL,
  lng DECIMAL
)
RETURNS TABLE (
  geoid VARCHAR(11),
  state_name VARCHAR(100),
  county_name VARCHAR(100),
  is_fed_nmtc_eligible BOOLEAN,
  is_fed_lihtc_qct BOOLEAN,
  is_fed_oz_designated BOOLEAN,
  is_severely_distressed BOOLEAN
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
    m.is_severely_distressed
  FROM master_tc_view m
  WHERE ST_Contains(m.geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_tract_from_point IS 'Address resolution: lat/lng → census tract with eligibility data.';

-- Bounding box query for map viewport
CREATE OR REPLACE FUNCTION get_tracts_in_bbox(
  min_lng DECIMAL,
  min_lat DECIMAL,
  max_lng DECIMAL,
  max_lat DECIMAL,
  filter_program VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  geoid VARCHAR(11),
  geom GEOMETRY,
  centroid_lat DECIMAL,
  centroid_lng DECIMAL,
  state_name VARCHAR(100),
  is_fed_nmtc_eligible BOOLEAN,
  is_fed_lihtc_qct BOOLEAN,
  is_fed_oz_designated BOOLEAN,
  is_severely_distressed BOOLEAN,
  has_state_nmtc BOOLEAN,
  has_state_htc BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.geoid,
    m.geom,
    m.centroid_lat,
    m.centroid_lng,
    m.state_name,
    m.is_fed_nmtc_eligible,
    m.is_fed_lihtc_qct,
    m.is_fed_oz_designated,
    m.is_severely_distressed,
    m.has_state_nmtc,
    m.has_state_htc
  FROM master_tc_view m
  WHERE m.geom && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    AND (
      filter_program IS NULL
      OR (filter_program = 'NMTC' AND m.is_fed_nmtc_eligible = TRUE)
      OR (filter_program = 'LIHTC' AND m.is_fed_lihtc_qct = TRUE)
      OR (filter_program = 'OZ' AND m.is_fed_oz_designated = TRUE)
      OR (filter_program = 'HTC' AND m.has_state_htc = TRUE)
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_tracts_in_bbox IS 'Map viewport query: returns tracts within bounding box with optional program filter.';

-- GeoJSON export for single tract
CREATE OR REPLACE FUNCTION get_tract_geojson(tract_geoid VARCHAR(11))
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'type', 'Feature',
    'geometry', ST_AsGeoJSON(m.geom)::jsonb,
    'properties', jsonb_build_object(
      'geoid', m.geoid,
      'state_name', m.state_name,
      'county_name', m.county_name,
      'is_fed_nmtc_eligible', m.is_fed_nmtc_eligible,
      'is_fed_lihtc_qct', m.is_fed_lihtc_qct,
      'is_fed_oz_designated', m.is_fed_oz_designated,
      'is_severely_distressed', m.is_severely_distressed,
      'poverty_rate_pct', m.poverty_rate_pct,
      'mfi_pct', m.mfi_pct,
      'has_state_nmtc', m.has_state_nmtc,
      'has_state_htc', m.has_state_htc,
      'can_stack_nmtc', m.can_stack_nmtc,
      'can_stack_oz', m.can_stack_oz
    )
  ) INTO result
  FROM master_tc_view m
  WHERE m.geoid = tract_geoid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_tract_geojson IS 'Returns GeoJSON Feature for a single tract with all eligibility properties.';

-- =============================================================================
-- USERS
-- =============================================================================
-- NOTE: organizations table was REMOVED to simplify onboarding.
-- Users link to sponsors/cdes/investors via organization_id + role_type.
-- The role_type tells you WHICH table to query for org details.
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'MEMBER',

  -- Organization link (NOT an FK - just groups users)
  -- Points to cdes.organization_id, investors.organization_id, or sponsors.organization_id
  organization_id UUID,
  role_type VARCHAR(20), -- 'cde', 'sponsor', 'investor', 'admin'
  organization_name VARCHAR(255), -- Cached for quick display

  phone VARCHAR(50),
  title VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role_type ON users(role_type);

COMMENT ON TABLE users IS 'All platform users. organization_id + role_type links to their entity (sponsors/cdes/investors).';
COMMENT ON COLUMN users.organization_id IS 'Groups users to an org. NOT an FK - just a matching value to look up in sponsors/cdes/investors.';
COMMENT ON COLUMN users.role_type IS 'Which table to query for org details: sponsor, cde, investor, or admin.';

-- =============================================================================
-- CDEs (Community Development Entities)
-- =============================================================================
-- Each row = 1 CDE + 1 allocation year
-- Same CDE appears multiple times with different years (grouped by organization_id)
-- NOTE: organization_id is NOT an FK - it just groups related CDE records
-- =============================================================================

CREATE TABLE cdes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Organization ID (groups same CDE across multiple allocation years)
  -- NOT an FK - just a grouping identifier that users.organization_id can match
  organization_id UUID NOT NULL,

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,

  -- Allocation Year (makes each row unique for same CDE)
  year INTEGER NOT NULL,

  -- Certification
  certification_number VARCHAR(50),
  parent_organization VARCHAR(255),
  year_established INTEGER,

  -- Primary Contact
  primary_contact_name VARCHAR(255),
  primary_contact_title VARCHAR(100),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),

  -- Allocation Amounts (per year)
  total_allocation DECIMAL(15,2) DEFAULT 0,
  amount_finalized DECIMAL(15,2) DEFAULT 0,
  amount_remaining DECIMAL(15,2) DEFAULT 0,
  non_metro_commitment DECIMAL(5,2) DEFAULT 0,
  deployment_deadline DATE,

  -- Deal Size
  min_deal_size DECIMAL(15,2) DEFAULT 1000000,
  max_deal_size DECIMAL(15,2) DEFAULT 15000000,
  small_deal_fund BOOLEAN DEFAULT FALSE,

  -- Geographic Focus
  service_area VARCHAR(255),
  service_area_type VARCHAR(50) DEFAULT 'national',
  primary_states TEXT[],
  target_regions TEXT[],
  excluded_states TEXT[],
  rural_focus BOOLEAN DEFAULT FALSE,
  urban_focus BOOLEAN DEFAULT TRUE,
  native_american_focus BOOLEAN DEFAULT FALSE,
  underserved_states_focus BOOLEAN DEFAULT FALSE,

  -- Mission
  mission_statement TEXT,
  impact_priorities TEXT[],
  target_sectors TEXT[],
  special_focus TEXT[],
  
  -- Deal Preferences
  preferred_project_types TEXT[],
  require_severely_distressed BOOLEAN DEFAULT FALSE,
  require_qct BOOLEAN DEFAULT FALSE,
  min_distress_score INTEGER,
  min_project_cost DECIMAL(15,2),
  max_project_cost DECIMAL(15,2),
  min_jobs_created INTEGER,
  require_community_benefits BOOLEAN DEFAULT TRUE,
  require_shovel_ready BOOLEAN DEFAULT FALSE,
  max_time_to_close INTEGER,
  related_party_policy VARCHAR(50) DEFAULT 'case-by-case',
  
  -- Experience
  nmtc_experience BOOLEAN DEFAULT TRUE,
  htc_experience BOOLEAN DEFAULT FALSE,
  lihtc_experience BOOLEAN DEFAULT FALSE,
  oz_experience BOOLEAN DEFAULT FALSE,
  stacked_deals_preferred BOOLEAN DEFAULT FALSE,
  
  -- Track Record
  total_deals_completed INTEGER DEFAULT 0,
  total_qlici_deployed DECIMAL(15,2) DEFAULT 0,
  average_close_time INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cdes_organization ON cdes(organization_id);
CREATE INDEX idx_cdes_year ON cdes(year);
CREATE INDEX idx_cdes_slug ON cdes(slug);
CREATE INDEX idx_cdes_status ON cdes(status);
CREATE INDEX idx_cdes_amount_remaining ON cdes(amount_remaining);
CREATE INDEX idx_cdes_primary_states ON cdes USING GIN(primary_states);

-- Composite unique: same CDE can't have duplicate allocation years
ALTER TABLE cdes ADD CONSTRAINT cdes_org_year_unique UNIQUE(organization_id, year);

COMMENT ON TABLE cdes IS 'CDEs with per-year allocation data. Same CDE appears multiple times (grouped by organization_id).';
COMMENT ON COLUMN cdes.organization_id IS 'Groups the same CDE across multiple allocation years. NOT an FK.';
COMMENT ON COLUMN cdes.year IS 'Allocation year. Combined with organization_id forms a unique constraint.';

-- =============================================================================
-- CDE ALLOCATIONS (LEGACY - DEPRECATED)
-- =============================================================================
-- NOTE: Allocation data is now directly in cdes table (one row per year).
-- This table is kept for backwards compatibility but should not be used.
-- =============================================================================

CREATE TABLE cde_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cde_id UUID NOT NULL REFERENCES cdes(id) ON DELETE CASCADE,

  type VARCHAR(20) NOT NULL, -- 'federal' or 'state'
  year VARCHAR(4) NOT NULL,
  state_code VARCHAR(2),
  
  awarded_amount DECIMAL(15,2) NOT NULL,
  available_on_platform DECIMAL(15,2) NOT NULL,
  deployed_amount DECIMAL(15,2) DEFAULT 0,
  
  percentage_won DECIMAL(5,2),
  deployment_deadline DATE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cde_allocations_cde ON cde_allocations(cde_id);
CREATE INDEX idx_cde_allocations_type ON cde_allocations(type);
CREATE INDEX idx_cde_allocations_year ON cde_allocations(year);

-- =============================================================================
-- SPONSORS
-- =============================================================================
-- Self-contained sponsor table with all org info.
-- NOTE: organization_id is NOT an FK - it just groups related records.
-- =============================================================================

CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Organization ID (groups users to this sponsor)
  -- NOT an FK - just a matching value that users.organization_id can reference
  organization_id UUID NOT NULL UNIQUE,

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,

  -- Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),

  -- Location
  city VARCHAR(100),
  state VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  logo_url TEXT,

  -- Classification
  sponsor_type VARCHAR(50), -- 'For-profit', 'Non-profit'
  low_income_owned BOOLEAN DEFAULT FALSE,
  woman_owned BOOLEAN DEFAULT FALSE,
  minority_owned BOOLEAN DEFAULT FALSE,
  veteran_owned BOOLEAN DEFAULT FALSE,

  -- Track Record
  total_projects_completed INTEGER DEFAULT 0,
  total_project_value DECIMAL(15,2) DEFAULT 0,

  -- Platform Status
  verified BOOLEAN DEFAULT FALSE,
  exclusivity_agreed BOOLEAN DEFAULT FALSE,
  exclusivity_agreed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sponsors_organization ON sponsors(organization_id);
CREATE INDEX idx_sponsors_slug ON sponsors(slug);

COMMENT ON TABLE sponsors IS 'All sponsors (project developers). Self-contained with all org info.';
COMMENT ON COLUMN sponsors.organization_id IS 'Groups users to this sponsor. NOT an FK - just a matching value.';

-- =============================================================================
-- INVESTORS
-- =============================================================================
-- Self-contained investor table with all org info.
-- NOTE: organization_id is NOT an FK - it just groups related records.
-- =============================================================================

CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Organization ID (groups users to this investor)
  -- NOT an FK - just a matching value that users.organization_id can reference
  organization_id UUID NOT NULL UNIQUE,

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,

  -- Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),

  -- Location
  city VARCHAR(100),
  state VARCHAR(50),
  address TEXT,
  website VARCHAR(255),
  logo_url TEXT,

  -- Investment Profile
  investor_type VARCHAR(50), -- 'Bank', 'Insurance', 'Corporate', 'Family Office'
  cra_motivated BOOLEAN DEFAULT FALSE,

  -- Preferences
  min_investment DECIMAL(15,2),
  max_investment DECIMAL(15,2),
  target_credit_types program_type[],
  target_states TEXT[],
  target_sectors TEXT[],

  -- Track Record
  total_investments INTEGER DEFAULT 0,
  total_invested DECIMAL(15,2) DEFAULT 0,

  -- Status
  accredited BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investors_organization ON investors(organization_id);
CREATE INDEX idx_investors_slug ON investors(slug);
CREATE INDEX idx_investors_type ON investors(investor_type);

COMMENT ON TABLE investors IS 'All investors. Self-contained with all org info.';
COMMENT ON COLUMN investors.organization_id IS 'Groups users to this investor. NOT an FK - just a matching value.';

-- =============================================================================
-- DEALS
-- =============================================================================
-- CRITICAL: No cached entity names. Get names via JOINs.
-- census_tract is FK to tract_geometries.geoid - get eligibility via JOIN.
-- =============================================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  project_name VARCHAR(255) NOT NULL,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
  -- Get sponsor organization_id via JOIN: sponsors.organization_id
  
  -- Programs
  programs program_type[] NOT NULL DEFAULT '{}',
  program_level VARCHAR(20) DEFAULT 'federal',
  state_program VARCHAR(100),
  
  -- Location (address for display)
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  county VARCHAR(100),
  
  -- Census Tract - FK to spatial spine
  census_tract VARCHAR(11) REFERENCES tract_geometries(geoid),
  -- NO cached lat/lng - get from tract_geometries
  -- NO cached eligibility - JOIN to master_tc_view
  
  -- Project Details
  project_type VARCHAR(100),
  venture_type VARCHAR(50),
  project_description TEXT,
  tenant_mix TEXT,
  
  -- Financials
  total_project_cost DECIMAL(15,2),
  nmtc_financing_requested DECIMAL(15,2),
  financing_gap DECIMAL(15,2),
  
  -- Cost Breakdown
  land_cost DECIMAL(15,2),
  acquisition_cost DECIMAL(15,2),
  construction_cost DECIMAL(15,2),
  soft_costs DECIMAL(15,2),
  contingency DECIMAL(15,2),
  developer_fee DECIMAL(15,2),
  financing_costs DECIMAL(15,2),
  reserves DECIMAL(15,2),
  
  -- Capital Stack
  equity_amount DECIMAL(15,2),
  debt_amount DECIMAL(15,2),
  grant_amount DECIMAL(15,2),
  other_amount DECIMAL(15,2),
  committed_capital_pct DECIMAL(5,2),
  
  -- Impact
  jobs_created INTEGER,
  jobs_retained INTEGER,
  permanent_jobs_fte DECIMAL(10,2),
  construction_jobs_fte DECIMAL(10,2),
  commercial_sqft INTEGER,
  housing_units INTEGER,
  affordable_housing_units INTEGER,
  community_benefit TEXT,
  
  -- Readiness
  site_control VARCHAR(50),
  site_control_date DATE,
  phase_i_environmental VARCHAR(50),
  zoning_approval VARCHAR(50),
  building_permits VARCHAR(50),
  construction_drawings VARCHAR(50),
  construction_start_date DATE,
  projected_completion_date DATE,
  projected_closing_date DATE,
  
  -- Status & Scoring
  status deal_status DEFAULT 'draft',
  visible BOOLEAN DEFAULT FALSE,
  readiness_score INTEGER DEFAULT 0,
  tier INTEGER DEFAULT 1,
  
  -- Participants (FKs only - get names via JOIN)
  assigned_cde_id UUID REFERENCES cdes(id),
  -- NO assigned_cde_name cache
  investor_id UUID REFERENCES investors(id),
  -- NO investor_name cache
  
  -- Platform Agreements
  exclusivity_agreed BOOLEAN DEFAULT FALSE,
  exclusivity_agreed_at TIMESTAMPTZ,
  
  -- Structured Data (validated JSONB)
  qalicb_data JSONB DEFAULT '{}',
  htc_data JSONB DEFAULT '{}',
  intake_data JSONB DEFAULT '{}',
  checklist JSONB DEFAULT '{}',
  
  -- AI Analysis
  ai_flags TEXT[],
  scoring_breakdown JSONB,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  matched_at TIMESTAMPTZ,
  closing_started_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_sponsor ON deals(sponsor_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_state ON deals(state);
CREATE INDEX idx_deals_census_tract ON deals(census_tract);
CREATE INDEX idx_deals_assigned_cde ON deals(assigned_cde_id);
CREATE INDEX idx_deals_programs ON deals USING GIN(programs);
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);

COMMENT ON TABLE deals IS 'Project deals. NO cached names - use JOINs. census_tract FKs to tract_geometries for eligibility.';

-- =============================================================================
-- DEAL CARDS VIEW (What the marketplace displays)
-- =============================================================================
-- This view JOINs to get all names and eligibility data.
-- Components query this view, not the deals table directly.
-- =============================================================================

CREATE OR REPLACE VIEW deal_cards AS
SELECT 
  d.id,
  d.project_name,
  d.city,
  d.state,
  d.census_tract,
  d.programs,
  d.total_project_cost,
  d.nmtc_financing_requested,
  d.jobs_created,
  d.readiness_score,
  d.tier,
  d.status,
  d.project_type,
  d.created_at,
  
  -- Sponsor name via JOIN (not cached)
  o_sponsor.name AS sponsor_name,
  
  -- CDE name via JOIN (not cached)
  o_cde.name AS assigned_cde_name,
  
  -- Investor name via JOIN (not cached)
  o_investor.name AS investor_name,
  
  -- Tract data via JOIN (not cached)
  tg.centroid_lat AS latitude,
  tg.centroid_lng AS longitude,
  m.is_fed_nmtc_eligible AS tract_eligible,
  m.is_severely_distressed AS tract_severely_distressed,
  m.is_fed_lihtc_qct AS tract_lihtc_qct,
  m.is_fed_oz_designated AS tract_oz_designated,
  m.poverty_rate_pct AS tract_poverty_rate,
  m.mfi_pct AS tract_median_income

FROM deals d
LEFT JOIN sponsors s ON d.sponsor_id = s.id
LEFT JOIN organizations o_sponsor ON s.organization_id = o_sponsor.id
LEFT JOIN cdes c ON d.assigned_cde_id = c.id
LEFT JOIN organizations o_cde ON c.organization_id = o_cde.id
LEFT JOIN investors i ON d.investor_id = i.id
LEFT JOIN organizations o_investor ON i.organization_id = o_investor.id
LEFT JOIN tract_geometries tg ON d.census_tract = tg.geoid
LEFT JOIN master_tc_view m ON d.census_tract = m.geoid
WHERE d.visible = true
AND d.status IN ('available', 'seeking_capital');

COMMENT ON VIEW deal_cards IS 'Marketplace deal cards with all names and tract data from JOINs. No cached fields.';

-- =============================================================================
-- LETTERS OF INTENT
-- =============================================================================

CREATE TABLE letters_of_intent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loi_number VARCHAR(50) UNIQUE,
  
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  cde_id UUID NOT NULL REFERENCES cdes(id),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id),
  
  status loi_status DEFAULT 'draft',
  
  -- Terms
  proposed_allocation DECIMAL(15,2),
  interest_rate DECIMAL(5,2),
  term_months INTEGER,
  fee_structure JSONB DEFAULT '{}',
  
  -- Conditions
  conditions TEXT[],
  notes TEXT,
  
  -- Validity
  valid_until DATE,
  
  -- Counter/Response
  counter_terms JSONB,
  response_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loi_deal ON letters_of_intent(deal_id);
CREATE INDEX idx_loi_cde ON letters_of_intent(cde_id);
CREATE INDEX idx_loi_status ON letters_of_intent(status);

-- =============================================================================
-- COMMITMENTS
-- =============================================================================

CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_number VARCHAR(50) UNIQUE,
  
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  loi_id UUID REFERENCES letters_of_intent(id),
  cde_id UUID NOT NULL REFERENCES cdes(id),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id),
  investor_id UUID REFERENCES investors(id),
  
  status commitment_status DEFAULT 'draft',
  
  -- Commitment Details
  allocation_amount DECIMAL(15,2) NOT NULL,
  qlici_amount DECIMAL(15,2),
  investor_equity DECIMAL(15,2),
  leverage_amount DECIMAL(15,2),
  
  -- Terms
  interest_rate DECIMAL(5,2),
  term_months INTEGER,
  fee_structure JSONB DEFAULT '{}',
  
  -- Conditions
  conditions TEXT[],
  special_requirements TEXT,
  
  -- Timeline
  target_close_date DATE,
  actual_close_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commitments_deal ON commitments(deal_id);
CREATE INDEX idx_commitments_status ON commitments(status);

-- =============================================================================
-- CLOSING ROOMS
-- =============================================================================

CREATE TABLE closing_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID UNIQUE NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES commitments(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'preparing',
  
  -- Participants (access control)
  participants JSONB DEFAULT '[]',
  
  -- Checklist
  checklist JSONB DEFAULT '{}',
  
  -- Milestones
  milestones JSONB DEFAULT '[]',
  
  -- Notes
  notes TEXT,
  
  -- Timeline
  target_close_date DATE,
  actual_close_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_closing_rooms_deal ON closing_rooms(deal_id);
CREATE INDEX idx_closing_rooms_status ON closing_rooms(status);

-- =============================================================================
-- DOCUMENTS
-- =============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  organization_id UUID, -- Not an FK - just groups documents by org
  deal_id UUID REFERENCES deals(id),
  closing_room_id UUID REFERENCES closing_rooms(id),
  
  -- File Info
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  mime_type VARCHAR(100),
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  
  -- Classification
  document_type VARCHAR(100),
  category VARCHAR(100),
  
  -- Status
  status document_status DEFAULT 'pending',
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),
  
  -- Audit
  uploaded_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_deal ON documents(deal_id);
CREATE INDEX idx_documents_closing_room ON documents(closing_room_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  
  -- Reference
  reference_type VARCHAR(50),
  reference_id UUID,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;

-- =============================================================================
-- AUDIT LEDGER
-- =============================================================================

CREATE TABLE audit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  
  -- Who
  actor_type VARCHAR(20) NOT NULL,
  actor_id UUID,
  
  -- Data
  old_data JSONB,
  new_data JSONB,
  
  -- When
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_ledger(table_name, record_id);
CREATE INDEX idx_audit_actor ON audit_ledger(actor_id);
CREATE INDEX idx_audit_created ON audit_ledger(created_at DESC);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cdes_timestamp BEFORE UPDATE ON cdes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cde_allocations_timestamp BEFORE UPDATE ON cde_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sponsors_timestamp BEFORE UPDATE ON sponsors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_investors_timestamp BEFORE UPDATE ON investors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deals_timestamp BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_loi_timestamp BEFORE UPDATE ON letters_of_intent FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_commitments_timestamp BEFORE UPDATE ON commitments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_closing_rooms_timestamp BEFORE UPDATE ON closing_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_documents_timestamp BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- LOI/COMMITMENT NUMBER SEQUENCES
-- =============================================================================

CREATE SEQUENCE loi_number_seq START 1000;
CREATE SEQUENCE commitment_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_loi_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loi_number IS NULL THEN
    NEW.loi_number := 'LOI-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('loi_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_commitment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commitment_number IS NULL THEN
    NEW.commitment_number := 'CMT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('commitment_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_loi_number_trigger BEFORE INSERT ON letters_of_intent FOR EACH ROW EXECUTE FUNCTION generate_loi_number();
CREATE TRIGGER generate_commitment_number_trigger BEFORE INSERT ON commitments FOR EACH ROW EXECUTE FUNCTION generate_commitment_number();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cde_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters_of_intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tract tables are public (census data)
ALTER TABLE tract_geometries ENABLE ROW LEVEL SECURITY;
ALTER TABLE federal_tract_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_tax_credit_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_tract_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_zones ENABLE ROW LEVEL SECURITY;

-- Public read for tract data
CREATE POLICY "Tract geometries are public" ON tract_geometries FOR SELECT USING (true);
CREATE POLICY "Federal eligibility is public" ON federal_tract_eligibility FOR SELECT USING (true);
CREATE POLICY "State programs are public" ON state_tax_credit_programs FOR SELECT USING (true);
CREATE POLICY "State tract eligibility is public" ON state_tract_eligibility FOR SELECT USING (true);
CREATE POLICY "Opportunity zones are public" ON opportunity_zones FOR SELECT USING (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON tract_geometries TO anon, authenticated;
GRANT SELECT ON federal_tract_eligibility TO anon, authenticated;
GRANT SELECT ON state_tax_credit_programs TO anon, authenticated;
GRANT SELECT ON state_tract_eligibility TO anon, authenticated;
GRANT SELECT ON opportunity_zones TO anon, authenticated;
GRANT SELECT ON master_tc_view TO anon, authenticated;
GRANT SELECT ON deal_cards TO anon, authenticated;

GRANT EXECUTE ON FUNCTION get_tract_from_point TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tracts_in_bbox TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_tract_geojson TO anon, authenticated;

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================
-- 
-- CRITICAL RULES FOR ALL CODE:
-- 
-- 1. NEVER cache entity names (sponsor_name, cde_name, etc.) - always JOIN
-- 2. NEVER cache tract eligibility - always JOIN to master_tc_view
-- 3. NEVER call external APIs for tract data - use local tract_geometries
-- 4. deals.census_tract is FK to tract_geometries.geoid
-- 5. Use deal_cards view for marketplace display
-- 6. Use master_tc_view for map and AutoMatch queries
-- 7. Use get_tract_from_point() for address resolution
-- 8. Use get_tracts_in_bbox() for map viewport queries
-- 
-- =============================================================================
