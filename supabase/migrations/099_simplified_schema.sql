-- =============================================================================
-- tCredex SIMPLIFIED Database Schema v2.0
-- =============================================================================
-- 5 SIMPLE TABLES - NO "organizations" table needed!
--
-- Tables:
--   1. cdes       - Each row = 1 CDE + 1 allocation year (same CDE appears multiple times)
--   2. investors  - All investor data in one place
--   3. sponsors   - All sponsor data in one place
--   4. users      - All users, linked via organization_id + organization_type
--   5. deals      - All deals, linked to sponsor_id
--
-- Key insight:
--   - organization_id GROUPS related records (cdes with same org, or users to their entity)
--   - organization_type tells you WHICH table to look in ('cde', 'sponsor', 'investor')
--   - NO need for a parent "organizations" table - that was the problem!
--
-- Each table is self-contained and queryable by PRIMARY KEY 'id'
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- DROP OLD COMPLEX TABLES (if they exist)
-- =============================================================================
-- Order matters due to FK dependencies in old schema
DROP TABLE IF EXISTS cde_allocations CASCADE;
DROP TABLE IF EXISTS cde_summary CASCADE;
DROP TABLE IF EXISTS cdes CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS investors CASCADE;
-- The old "organizations" table is NO LONGER NEEDED
DROP TABLE IF EXISTS organizations CASCADE;

-- =============================================================================
-- ENUMS (keep existing ones)
-- =============================================================================
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE program_type AS ENUM ('NMTC', 'HTC', 'LIHTC', 'OZ', 'Brownfield');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- TABLE 1: CDES
-- =============================================================================
-- Each row = 1 CDE + 1 allocation year
-- Same CDE appears multiple times with different years (grouped by organization_id)
--
-- Example: "Capital Impact Partners" has 2023 and 2024 allocations
--   Row 1: id=uuid-1, organization_id=abc, year=2023, amount_remaining=16500000
--   Row 2: id=uuid-2, organization_id=abc, year=2024, amount_remaining=85000000
-- =============================================================================
CREATE TABLE cdes (
  -- Primary Key (unique per row)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Organization ID (groups same CDE across multiple years)
  organization_id UUID NOT NULL,

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,

  -- Allocation Year (this makes each row unique)
  year INTEGER NOT NULL,

  -- Allocation Amounts (all in dollars)
  total_allocation DECIMAL(15,2) DEFAULT 0,
  amount_finalized DECIMAL(15,2) DEFAULT 0,
  amount_remaining DECIMAL(15,2) DEFAULT 0,
  non_metro_commitment DECIMAL(5,2) DEFAULT 0, -- percentage

  -- Service Area
  service_area VARCHAR(255),
  service_area_type VARCHAR(50), -- 'national', 'statewide', 'multi-state', 'local'
  target_states TEXT[], -- Array of state codes

  -- Parent/Controlling Entity
  controlling_entity VARCHAR(255),

  -- Financing Focus
  predominant_financing VARCHAR(255),
  predominant_market VARCHAR(255),
  innovative_activities TEXT,

  -- Contact Info
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'active',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique: same CDE can't have duplicate years
  UNIQUE(organization_id, year)
);

-- Indexes for fast queries
CREATE INDEX idx_cdes_organization_id ON cdes(organization_id);
CREATE INDEX idx_cdes_year ON cdes(year);
CREATE INDEX idx_cdes_slug ON cdes(slug);
CREATE INDEX idx_cdes_amount_remaining ON cdes(amount_remaining);
CREATE INDEX idx_cdes_status ON cdes(status);

-- =============================================================================
-- TABLE 2: INVESTORS
-- =============================================================================
CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE, -- Groups user records

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
  min_investment DECIMAL(15,2),
  max_investment DECIMAL(15,2),
  target_states TEXT[],
  target_sectors TEXT[],

  -- Track Record
  total_investments INTEGER DEFAULT 0,
  total_invested DECIMAL(15,2) DEFAULT 0,

  -- Status
  accredited BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investors_organization_id ON investors(organization_id);
CREATE INDEX idx_investors_type ON investors(investor_type);

-- =============================================================================
-- TABLE 3: SPONSORS
-- =============================================================================
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE, -- Groups user records

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
  organization_type VARCHAR(50), -- 'For-profit', 'Non-profit'
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

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sponsors_organization_id ON sponsors(organization_id);
CREATE INDEX idx_sponsors_slug ON sponsors(slug);

-- =============================================================================
-- TABLE 4: USERS
-- =============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  title VARCHAR(100),

  -- Organization link (NOT an FK - just groups users)
  -- Points to cdes.organization_id, investors.organization_id, or sponsors.organization_id
  organization_id UUID,
  organization_type VARCHAR(20), -- 'cde', 'investor', 'sponsor'

  -- Role within organization
  role user_role DEFAULT 'MEMBER',

  -- Auth (Clerk handles actual auth)
  clerk_id VARCHAR(255) UNIQUE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);

-- =============================================================================
-- TABLE 5: DEALS
-- =============================================================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to Sponsor (who created this deal)
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,

  -- Project Identity
  project_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,

  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  county VARCHAR(100),
  census_tract VARCHAR(20),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Financials
  total_project_cost DECIMAL(15,2),
  nmtc_request DECIMAL(15,2),
  other_financing DECIMAL(15,2),

  -- Project Details
  project_type VARCHAR(100),
  sector VARCHAR(100),
  project_description TEXT,

  -- Eligibility (from scoring)
  is_qalicb BOOLEAN DEFAULT FALSE,
  section_c_score DECIMAL(5,2),
  distress_factors TEXT[],

  -- Timeline
  estimated_start DATE,
  estimated_completion DATE,

  -- Status
  status deal_status DEFAULT 'draft',

  -- Matched CDE (when deal is matched)
  matched_cde_id UUID, -- Points to cdes.id of the winning match
  matched_at TIMESTAMPTZ,

  -- Contact (may differ from sponsor contact)
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_sponsor_id ON deals(sponsor_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_state ON deals(state);
CREATE INDEX idx_deals_matched_cde_id ON deals(matched_cde_id);
CREATE INDEX idx_deals_slug ON deals(slug);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View: CDE summary (aggregates all years for each CDE)
CREATE OR REPLACE VIEW cde_summary AS
SELECT
  organization_id,
  MAX(name) as name,
  MAX(slug) as slug,
  SUM(total_allocation) as total_allocation_all_years,
  SUM(amount_finalized) as total_finalized_all_years,
  SUM(amount_remaining) as total_remaining_all_years,
  AVG(non_metro_commitment) as avg_non_metro_commitment,
  array_agg(DISTINCT year ORDER BY year DESC) as allocation_years,
  COUNT(*) as year_count,
  MAX(service_area) as service_area,
  MAX(controlling_entity) as controlling_entity,
  MAX(contact_name) as contact_name,
  MAX(contact_email) as contact_email,
  MAX(contact_phone) as contact_phone,
  MAX(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM cdes
WHERE status = 'active'
GROUP BY organization_id;

-- View: CDEs with available allocation
CREATE OR REPLACE VIEW cdes_with_allocation AS
SELECT * FROM cdes
WHERE amount_remaining > 0
ORDER BY amount_remaining DESC;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE cdes IS 'CDEs with one row per allocation year. Same CDE appears multiple times, grouped by organization_id.';
COMMENT ON TABLE investors IS 'Investor organizations. organization_id links to users.';
COMMENT ON TABLE sponsors IS 'Sponsor organizations that create deals. organization_id links to users.';
COMMENT ON TABLE users IS 'All platform users. organization_id links to their CDE/Investor/Sponsor.';
COMMENT ON TABLE deals IS 'All deals/projects. sponsor_id links to the creating sponsor.';

COMMENT ON COLUMN cdes.organization_id IS 'Groups the same CDE across multiple allocation years. Not a foreign key.';
COMMENT ON COLUMN cdes.year IS 'Allocation year. Combined with organization_id forms a unique constraint.';
COMMENT ON COLUMN users.organization_id IS 'Links user to their organization (CDE, Investor, or Sponsor). Not a foreign key.';
