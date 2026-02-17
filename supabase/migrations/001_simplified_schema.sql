-- =============================================================================
-- tCredex SIMPLIFIED Database Schema v2.0
-- =============================================================================
-- CLEAN ARCHITECTURE: No complex FK chains
--
-- Core tables:
--   - cdes (each row = 1 CDE + 1 allocation year)
--   - sponsors (standalone)
--   - investors (standalone)
--   - users (links via organization_id + organization_type)
--   - deals (links to sponsor_id)
--
-- NO "organizations" parent table needed!
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER');

CREATE TYPE deal_status AS ENUM (
  'draft', 'submitted', 'under_review', 'available', 'seeking_capital',
  'matched', 'closing', 'closed', 'withdrawn'
);

CREATE TYPE program_type AS ENUM ('NMTC', 'HTC', 'LIHTC', 'OZ', 'Brownfield');

CREATE TYPE loi_status AS ENUM (
  'draft', 'issued', 'pending_sponsor', 'sponsor_accepted', 'sponsor_rejected',
  'sponsor_countered', 'withdrawn', 'expired', 'superseded'
);

CREATE TYPE commitment_status AS ENUM (
  'draft', 'issued', 'pending_sponsor', 'pending_cde', 'all_accepted',
  'rejected', 'withdrawn', 'expired', 'closing', 'closed'
);

CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');
CREATE TYPE ledger_actor_type AS ENUM ('system', 'human', 'api_key');

-- =============================================================================
-- CDEs (Community Development Entities)
-- =============================================================================
-- Each row = 1 CDE + 1 allocation year
-- Same CDE appears multiple times (grouped by organization_id)
-- =============================================================================

CREATE TABLE cdes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,  -- Groups same CDE across years

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,

  -- Allocation (per year)
  year INTEGER NOT NULL,
  allocation_type VARCHAR(20) DEFAULT 'federal',
  total_allocation DECIMAL(15,2) DEFAULT 0,
  amount_finalized DECIMAL(15,2) DEFAULT 0,
  amount_remaining DECIMAL(15,2) DEFAULT 0,
  non_metro_commitment DECIMAL(5,2) DEFAULT 0,
  deployment_deadline DATE,

  -- Service Area
  service_area VARCHAR(255),
  service_area_type VARCHAR(50),
  controlling_entity VARCHAR(255),
  predominant_financing VARCHAR(255),
  predominant_market TEXT,
  innovative_activities TEXT,

  -- Contact
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),

  -- Preferences
  primary_states TEXT[],
  min_deal_size DECIMAL(15,2) DEFAULT 1000000,
  max_deal_size DECIMAL(15,2) DEFAULT 15000000,
  small_deal_fund BOOLEAN DEFAULT FALSE,
  rural_focus BOOLEAN DEFAULT FALSE,
  urban_focus BOOLEAN DEFAULT TRUE,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, year)
);

CREATE INDEX idx_cdes_org ON cdes(organization_id);
CREATE INDEX idx_cdes_year ON cdes(year);
CREATE INDEX idx_cdes_remaining ON cdes(amount_remaining);
CREATE INDEX idx_cdes_status ON cdes(status);

-- =============================================================================
-- SPONSORS
-- =============================================================================

CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE,  -- Links users to this sponsor

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,

  -- Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),

  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  website VARCHAR(255),
  logo_url TEXT,

  -- Classification
  organization_type VARCHAR(50),
  woman_owned BOOLEAN DEFAULT FALSE,
  minority_owned BOOLEAN DEFAULT FALSE,
  veteran_owned BOOLEAN DEFAULT FALSE,

  -- Track Record
  total_projects_completed INTEGER DEFAULT 0,
  total_project_value DECIMAL(15,2) DEFAULT 0,

  -- Status
  verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sponsors_org ON sponsors(organization_id);
CREATE INDEX idx_sponsors_status ON sponsors(status);

-- =============================================================================
-- INVESTORS
-- =============================================================================

CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  website VARCHAR(255),
  logo_url TEXT,

  -- Investment Profile
  investor_type VARCHAR(50),
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
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investors_org ON investors(organization_id);
CREATE INDEX idx_investors_status ON investors(status);

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  title VARCHAR(100),

  -- Organization link (NOT an FK - just a grouping key)
  organization_id UUID,
  organization_type VARCHAR(20),  -- 'cde', 'sponsor', 'investor'

  -- Role
  role user_role DEFAULT 'MEMBER',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_clerk ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);

-- =============================================================================
-- DEALS
-- =============================================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Sponsor link (direct!)
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
  sponsor_name VARCHAR(255),

  -- Project Info
  project_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  programs program_type[] DEFAULT '{NMTC}',

  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  county VARCHAR(100),
  census_tract VARCHAR(20),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Tract eligibility
  tract_eligible BOOLEAN,
  tract_severely_distressed BOOLEAN,
  tract_poverty_rate DECIMAL(5,2),
  tract_median_income DECIMAL(12,2),
  tract_unemployment DECIMAL(5,2),

  -- Financials
  total_project_cost DECIMAL(15,2),
  nmtc_financing_requested DECIMAL(15,2),
  financing_gap DECIMAL(15,2),

  -- Project details
  project_type VARCHAR(100),
  venture_type VARCHAR(50),
  project_description TEXT,
  community_benefit TEXT,

  -- Jobs
  jobs_created INTEGER,
  jobs_retained INTEGER,
  permanent_jobs_fte INTEGER,
  construction_jobs_fte INTEGER,

  -- Timeline
  construction_start_date DATE,
  projected_closing_date DATE,
  projected_completion_date DATE,

  -- Readiness
  site_control BOOLEAN,
  phase_i_environmental BOOLEAN,
  zoning_approval BOOLEAN,
  readiness_score INTEGER,
  tier INTEGER,

  -- Scoring
  qalicb_eligible BOOLEAN,
  section_c_score DECIMAL(5,2),

  -- Status
  status deal_status DEFAULT 'draft',
  visible BOOLEAN DEFAULT FALSE,

  -- Matched CDE
  matched_cde_id UUID,
  matched_at TIMESTAMPTZ,

  -- Metadata
  intake_data JSONB,
  submitted_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_sponsor ON deals(sponsor_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_state ON deals(state);
CREATE INDEX idx_deals_visible ON deals(visible);

-- =============================================================================
-- DEAL MATCHES (CDE matching results)
-- =============================================================================

CREATE TABLE deal_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  cde_organization_id UUID NOT NULL,  -- References cdes.organization_id

  match_score DECIMAL(5,2),
  match_reasons TEXT[],
  status VARCHAR(50) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(deal_id, cde_organization_id)
);

CREATE INDEX idx_deal_matches_deal ON deal_matches(deal_id);
CREATE INDEX idx_deal_matches_cde ON deal_matches(cde_organization_id);

-- =============================================================================
-- LETTERS OF INTENT
-- =============================================================================

CREATE TABLE letters_of_intent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loi_number VARCHAR(50) UNIQUE,

  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  cde_organization_id UUID NOT NULL,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id),

  status loi_status DEFAULT 'draft',

  nmtc_amount DECIMAL(15,2),
  interest_rate DECIMAL(5,4),
  term_years INTEGER,

  expires_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  terms_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loi_deal ON letters_of_intent(deal_id);
CREATE INDEX idx_loi_status ON letters_of_intent(status);

-- =============================================================================
-- COMMITMENTS
-- =============================================================================

CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_number VARCHAR(50) UNIQUE,

  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  loi_id UUID REFERENCES letters_of_intent(id),
  investor_id UUID NOT NULL REFERENCES investors(id),
  cde_organization_id UUID,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id),

  status commitment_status DEFAULT 'draft',

  investment_amount DECIMAL(15,2),
  credit_type program_type,

  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commitments_deal ON commitments(deal_id);
CREATE INDEX idx_commitments_status ON commitments(status);

-- =============================================================================
-- DOCUMENTS
-- =============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),

  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  category VARCHAR(100),
  file_url TEXT NOT NULL,
  file_size INTEGER,

  status document_status DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_deal ON documents(deal_id);

-- =============================================================================
-- LEDGER (Audit trail)
-- =============================================================================

CREATE TABLE ledger_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  actor_type ledger_actor_type NOT NULL,
  actor_id VARCHAR(255),

  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,

  action VARCHAR(100) NOT NULL,
  payload_json JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_entity ON ledger_events(entity_type, entity_id);
CREATE INDEX idx_ledger_created ON ledger_events(created_at);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Aggregated CDE view (one row per CDE)
CREATE OR REPLACE VIEW cde_summary AS
SELECT
  organization_id,
  MAX(name) as name,
  MAX(slug) as slug,
  SUM(total_allocation) as total_allocation,
  SUM(amount_remaining) as total_remaining,
  array_agg(DISTINCT year ORDER BY year DESC) as years,
  MAX(contact_name) as contact_name,
  MAX(contact_email) as contact_email,
  MAX(status) as status
FROM cdes
GROUP BY organization_id;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE cdes IS 'CDEs with one row per allocation year. organization_id groups same CDE.';
COMMENT ON TABLE sponsors IS 'Sponsors. organization_id links users to this sponsor.';
COMMENT ON TABLE investors IS 'Investors. organization_id links users to this investor.';
COMMENT ON TABLE users IS 'Users. organization_id + organization_type links to their entity.';
COMMENT ON TABLE deals IS 'Deals. sponsor_id links directly to sponsors.id.';
