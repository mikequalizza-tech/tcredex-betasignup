-- ============================================================================
-- tCredex v1.7 Database Schema
-- Complete schema for tax credit marketplace platform
-- Generated: 2024-12-23
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE org_type AS ENUM ('sponsor', 'cde', 'investor', 'admin');
CREATE TYPE deal_status AS ENUM ('draft', 'intake', 'matched', 'term_sheet', 'commitment', 'closing_room', 'closed', 'compliance');
CREATE TYPE program_type AS ENUM ('NMTC', 'HTC', 'LIHTC', 'OZ', 'Brownfield', 'STATE_NMTC', 'STATE_HTC');
CREATE TYPE loi_status AS ENUM ('draft', 'issued', 'pending_sponsor', 'sponsor_accepted', 'sponsor_rejected', 'sponsor_countered', 'expired', 'withdrawn', 'superseded');
CREATE TYPE commitment_status AS ENUM ('draft', 'issued', 'pending_sponsor', 'pending_cde', 'sponsor_accepted', 'cde_accepted', 'all_accepted', 'rejected', 'expired', 'withdrawn', 'superseded');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');
CREATE TYPE allocation_type AS ENUM ('federal', 'state');
CREATE TYPE score_tier AS ENUM ('TIER_1_GREENLIGHT', 'TIER_2_WATCHLIST', 'TIER_3_DEFER');
CREATE TYPE site_control_status AS ENUM ('Owned', 'Under Contract', 'LOI', 'Negotiations', 'Sale to Related', 'None');
CREATE TYPE leverage_structure AS ENUM ('standard', 'self-leverage', 'hybrid');
CREATE TYPE service_area_type AS ENUM ('national', 'regional', 'state', 'local');
CREATE TYPE related_party_policy AS ENUM ('prohibited', 'case-by-case', 'allowed-with-disclosure');

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type org_type NOT NULL,
  logo_url TEXT,
  website VARCHAR(255),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_type ON organizations(type);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Links to Supabase Auth
  organization_id UUID REFERENCES organizations(id),
  
  -- Profile
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  title VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Role
  role VARCHAR(50) DEFAULT 'member', -- admin, member, viewer
  is_primary_contact BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth ON users(auth_id);


-- ============================================================================
-- CDE PROFILES
-- ============================================================================

CREATE TABLE cde_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Certification
  certification_number VARCHAR(50),
  parent_organization VARCHAR(255),
  year_established INTEGER,
  
  -- Mission
  mission_statement TEXT,
  impact_priorities TEXT[], -- Array of CDEImpactPriority values
  target_sectors TEXT[],
  special_focus TEXT[],
  
  -- Geographic Focus
  service_area_type service_area_type DEFAULT 'national',
  primary_states TEXT[],
  target_regions TEXT[],
  excluded_states TEXT[],
  rural_focus BOOLEAN DEFAULT FALSE,
  urban_focus BOOLEAN DEFAULT TRUE,
  native_american_focus BOOLEAN DEFAULT FALSE,
  underserved_states_focus BOOLEAN DEFAULT FALSE,
  
  -- Deal Preferences
  preferred_project_types TEXT[],
  require_severely_distressed BOOLEAN DEFAULT FALSE,
  require_qct BOOLEAN DEFAULT FALSE,
  min_distress_score INTEGER,
  min_project_cost NUMERIC(15,2),
  max_project_cost NUMERIC(15,2),
  min_qlici_request NUMERIC(15,2),
  max_qlici_request NUMERIC(15,2),
  min_jobs_created INTEGER,
  min_jobs_retained INTEGER,
  require_community_benefits BOOLEAN DEFAULT TRUE,
  require_shovel_ready BOOLEAN DEFAULT FALSE,
  max_time_to_close INTEGER, -- months
  leverage_requirements TEXT,
  related_party_policy related_party_policy DEFAULT 'case-by-case',
  
  -- Experience
  nmtc_experience BOOLEAN DEFAULT TRUE,
  htc_experience BOOLEAN DEFAULT FALSE,
  lihtc_experience BOOLEAN DEFAULT FALSE,
  oz_experience BOOLEAN DEFAULT FALSE,
  stacked_deals_preferred BOOLEAN DEFAULT FALSE,
  
  -- Track Record
  total_deals_completed INTEGER DEFAULT 0,
  total_qlici_deployed NUMERIC(15,2) DEFAULT 0,
  average_close_time INTEGER, -- days
  sectors_served TEXT[],
  states_served TEXT[],
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cde_profiles_org ON cde_profiles(organization_id);
CREATE INDEX idx_cde_profiles_status ON cde_profiles(status);
CREATE INDEX idx_cde_profiles_states ON cde_profiles USING GIN(primary_states);

-- ============================================================================
-- CDE ALLOCATIONS (Multi-allocation support)
-- ============================================================================

CREATE TABLE cde_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cde_profile_id UUID REFERENCES cde_profiles(id) ON DELETE CASCADE,
  
  allocation_type allocation_type NOT NULL,
  year VARCHAR(4) NOT NULL,
  state VARCHAR(2), -- For state allocations
  
  awarded_amount NUMERIC(15,2) NOT NULL,
  available_on_platform NUMERIC(15,2) NOT NULL,
  deployed_amount NUMERIC(15,2) DEFAULT 0,
  
  percentage_won NUMERIC(5,2), -- For partial federal awards
  deployment_deadline DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cde_allocations_profile ON cde_allocations(cde_profile_id);
CREATE INDEX idx_cde_allocations_year ON cde_allocations(year);
CREATE INDEX idx_cde_allocations_type ON cde_allocations(allocation_type);


-- ============================================================================
-- INVESTOR PROFILES
-- ============================================================================

CREATE TABLE investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Type
  investor_type VARCHAR(50), -- bank, insurance, corporate, fund
  
  -- CRA Focus
  assessment_areas TEXT[], -- CRA geographies
  cra_pressure NUMERIC(3,2) DEFAULT 0.5, -- 0-1 scale
  
  -- Investment Criteria
  yield_target NUMERIC(5,4) DEFAULT 0.05, -- e.g., 0.05 = 5%
  optics_weight NUMERIC(3,2) DEFAULT 0.5, -- 0-1 scale
  min_investment NUMERIC(15,2),
  max_investment NUMERIC(15,2),
  
  -- Programs
  programs program_type[],
  
  -- Preferences
  preferred_sectors TEXT[],
  preferred_states TEXT[],
  require_cra_eligible BOOLEAN DEFAULT FALSE,
  
  -- Track Record
  total_investments INTEGER DEFAULT 0,
  total_invested NUMERIC(15,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investor_profiles_org ON investor_profiles(organization_id);
CREATE INDEX idx_investor_profiles_type ON investor_profiles(investor_type);

-- ============================================================================
-- DEALS (Main intake data)
-- ============================================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES organizations(id),
  assigned_cde_id UUID REFERENCES organizations(id),
  
  -- Basic Info
  project_name VARCHAR(255) NOT NULL,
  project_description TEXT,
  project_type VARCHAR(100),
  venture_type VARCHAR(50), -- Real Estate, Business
  
  -- Status
  status deal_status DEFAULT 'draft',
  tier INTEGER DEFAULT 1, -- 1, 2, 3
  readiness_score INTEGER DEFAULT 0,
  
  -- Programs
  programs program_type[],
  program_level TEXT[], -- federal, state
  state_program VARCHAR(100),
  
  -- Location
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  county VARCHAR(100),
  census_tract VARCHAR(15),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  
  -- Tract Data (cached from lookup)
  tract_type TEXT[],
  tract_poverty_rate NUMERIC(5,2),
  tract_median_income NUMERIC(10,2),
  tract_unemployment NUMERIC(5,2),
  tract_eligible BOOLEAN,
  tract_severely_distressed BOOLEAN,
  tract_classification VARCHAR(50),
  in_tif_ez_district VARCHAR(20),
  
  -- Financials
  total_project_cost NUMERIC(15,2),
  nmtc_financing_requested NUMERIC(15,2),
  financing_gap NUMERIC(15,2),
  land_cost NUMERIC(15,2),
  acquisition_cost NUMERIC(15,2),
  construction_cost NUMERIC(15,2),
  soft_costs NUMERIC(15,2),
  contingency NUMERIC(15,2),
  developer_fee NUMERIC(15,2),
  financing_costs NUMERIC(15,2),
  reserves NUMERIC(15,2),
  equity_amount NUMERIC(15,2),
  debt_amount NUMERIC(15,2),
  grant_amount NUMERIC(15,2),
  committed_capital_pct NUMERIC(5,2),
  leverage_structure leverage_structure,
  
  -- Jobs & Impact
  permanent_jobs_fte INTEGER,
  construction_jobs_fte INTEGER,
  jobs_created INTEGER,
  jobs_retained INTEGER,
  commercial_sqft INTEGER,
  housing_units INTEGER,
  affordable_housing_units INTEGER,
  community_impact TEXT,
  community_benefit TEXT,
  
  -- Readiness
  site_control site_control_status,
  site_control_date DATE,
  phase_i_environmental VARCHAR(50),
  phase_ii_environmental VARCHAR(50),
  zoning_approval VARCHAR(50),
  building_permits VARCHAR(50),
  construction_drawings VARCHAR(50),
  construction_contract VARCHAR(20),
  construction_start_date DATE,
  projected_completion_date DATE,
  projected_closing_date DATE,
  
  -- QALICB (NMTC-specific)
  qalicb_gross_income NUMERIC(5,2),
  qalicb_tangible_property NUMERIC(5,2),
  qalicb_employee_services NUMERIC(5,2),
  is_prohibited_business BOOLEAN,
  
  -- HTC-specific
  htc_types TEXT[],
  historic_status VARCHAR(50),
  part1_status VARCHAR(50),
  part2_status VARCHAR(50),
  qre_amount NUMERIC(15,2),
  
  -- LIHTC-specific
  total_units INTEGER,
  affordable_units INTEGER,
  lihtc_type VARCHAR(10),
  
  -- OZ-specific
  oz_investment_date DATE,
  substantial_improvement BOOLEAN,
  holding_period INTEGER,
  
  -- Agreements
  exclusivity_agreed BOOLEAN DEFAULT FALSE,
  exclusivity_agreed_at TIMESTAMPTZ,
  terms_agreed BOOLEAN DEFAULT FALSE,
  terms_agreed_at TIMESTAMPTZ,
  
  -- Metadata
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_sponsor ON deals(sponsor_id);
CREATE INDEX idx_deals_cde ON deals(assigned_cde_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_tract ON deals(census_tract);
CREATE INDEX idx_deals_state ON deals(state);
CREATE INDEX idx_deals_programs ON deals USING GIN(programs);


-- ============================================================================
-- DEAL TEAM MEMBERS
-- ============================================================================

CREATE TABLE deal_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  
  role VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'TBD', -- Confirmed, TBD, N/A
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_team_deal ON deal_team_members(deal_id);

-- ============================================================================
-- DEAL FINANCING SOURCES
-- ============================================================================

CREATE TABLE deal_financing_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  
  source_type VARCHAR(50) NOT NULL, -- Equity, Debt, Grant, Tax Credit, Other
  source_name VARCHAR(255),
  amount NUMERIC(15,2) NOT NULL,
  status VARCHAR(50), -- Committed, Pending, Applied, Anticipated
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_financing_deal ON deal_financing_sources(deal_id);

-- ============================================================================
-- DEAL IMAGES
-- ============================================================================

CREATE TABLE deal_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  
  name VARCHAR(255),
  url TEXT NOT NULL,
  storage_path TEXT,
  size INTEGER,
  mime_type VARCHAR(100),
  
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_images_deal ON deal_images(deal_id);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- legal, financial, environmental, etc.
  url TEXT,
  storage_path TEXT,
  size INTEGER,
  mime_type VARCHAR(100),
  
  tags TEXT[],
  status document_status DEFAULT 'pending',
  notes TEXT,
  
  -- Access control
  visible_to_sponsor BOOLEAN DEFAULT TRUE,
  visible_to_cde BOOLEAN DEFAULT TRUE,
  visible_to_investor BOOLEAN DEFAULT FALSE,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_documents_deal ON documents(deal_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);

-- ============================================================================
-- CDE MATCHES
-- ============================================================================

CREATE TABLE cde_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  cde_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  match_score INTEGER, -- 0-100
  match_reasons TEXT[],
  
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, expired
  
  -- Response
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id),
  decline_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_cde_matches_deal ON cde_matches(deal_id);
CREATE INDEX idx_cde_matches_cde ON cde_matches(cde_id);
CREATE INDEX idx_cde_matches_status ON cde_matches(status);


-- ============================================================================
-- LOIs (Letters of Intent)
-- ============================================================================

CREATE TABLE lois (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  cde_id UUID REFERENCES organizations(id),
  sponsor_id UUID REFERENCES organizations(id),
  
  loi_number VARCHAR(50) UNIQUE,
  status loi_status DEFAULT 'draft',
  
  -- Financial Terms
  allocation_amount NUMERIC(15,2) NOT NULL,
  qlici_rate NUMERIC(5,4),
  leverage_structure leverage_structure,
  term_years INTEGER DEFAULT 7,
  
  -- Dates
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  sponsor_response_deadline TIMESTAMPTZ,
  expected_closing_date DATE,
  
  -- Document
  document_id UUID REFERENCES documents(id),
  document_url TEXT,
  
  -- Response
  sponsor_response_at TIMESTAMPTZ,
  sponsor_response_notes TEXT,
  counter_terms JSONB,
  
  -- Special Terms
  special_terms TEXT,
  cde_requirements JSONB,
  
  -- Workflow
  issued_by UUID REFERENCES users(id),
  withdrawn_by UUID REFERENCES users(id),
  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lois_deal ON lois(deal_id);
CREATE INDEX idx_lois_cde ON lois(cde_id);
CREATE INDEX idx_lois_status ON lois(status);

-- ============================================================================
-- LOI CONDITIONS
-- ============================================================================

CREATE TABLE loi_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loi_id UUID REFERENCES lois(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, satisfied, waived
  due_date DATE,
  satisfied_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loi_conditions_loi ON loi_conditions(loi_id);

-- ============================================================================
-- LOI HISTORY
-- ============================================================================

CREATE TABLE loi_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loi_id UUID REFERENCES lois(id) ON DELETE CASCADE,
  
  from_status loi_status,
  to_status loi_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loi_history_loi ON loi_history(loi_id);

-- ============================================================================
-- COMMITMENTS
-- ============================================================================

CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  loi_id UUID REFERENCES lois(id),
  investor_id UUID REFERENCES organizations(id),
  cde_id UUID REFERENCES organizations(id),
  sponsor_id UUID REFERENCES organizations(id),
  
  commitment_number VARCHAR(50) UNIQUE,
  status commitment_status DEFAULT 'draft',
  
  -- Financial Terms
  investment_amount NUMERIC(15,2) NOT NULL,
  credit_type program_type,
  credit_rate NUMERIC(5,4),
  expected_credits NUMERIC(15,2),
  pricing_cents_per_credit NUMERIC(10,4),
  net_benefit_to_project NUMERIC(15,2),
  
  -- Dates
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  target_closing_date DATE,
  
  -- Acceptance Tracking
  sponsor_accepted_at TIMESTAMPTZ,
  sponsor_accepted_by UUID REFERENCES users(id),
  cde_accepted_at TIMESTAMPTZ,
  cde_accepted_by UUID REFERENCES users(id),
  all_accepted_at TIMESTAMPTZ,
  
  -- CRA
  cra_eligible BOOLEAN DEFAULT FALSE,
  
  -- Document
  document_id UUID REFERENCES documents(id),
  document_url TEXT,
  
  -- Special Terms
  special_terms TEXT,
  investor_requirements JSONB,
  
  -- Workflow
  issued_by UUID REFERENCES users(id),
  withdrawn_by UUID REFERENCES users(id),
  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commitments_deal ON commitments(deal_id);
CREATE INDEX idx_commitments_investor ON commitments(investor_id);
CREATE INDEX idx_commitments_status ON commitments(status);

-- ============================================================================
-- COMMITMENT CONDITIONS
-- ============================================================================

CREATE TABLE commitment_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID REFERENCES commitments(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  responsible_party VARCHAR(50), -- sponsor, cde, investor
  due_date DATE,
  satisfied_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commitment_conditions_commitment ON commitment_conditions(commitment_id);

-- ============================================================================
-- COMMITMENT HISTORY
-- ============================================================================

CREATE TABLE commitment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID REFERENCES commitments(id) ON DELETE CASCADE,
  
  from_status commitment_status,
  to_status commitment_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commitment_history_commitment ON commitment_history(commitment_id);


-- ============================================================================
-- DEAL SCORES
-- ============================================================================

CREATE TABLE deal_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  cde_id UUID REFERENCES organizations(id), -- For mission fit scoring
  
  -- Individual Pillar Scores
  distress_score INTEGER, -- 0-40
  distress_breakdown JSONB,
  
  impact_score INTEGER, -- 0-35
  impact_breakdown JSONB,
  
  readiness_score INTEGER, -- 0-15
  readiness_breakdown JSONB,
  
  mission_fit_score INTEGER, -- 0-10
  mission_fit_breakdown JSONB,
  
  -- Totals
  total_score INTEGER, -- 0-100
  tier score_tier,
  
  -- Eligibility Flags
  nmtc_eligible BOOLEAN,
  severely_distressed BOOLEAN,
  is_qct BOOLEAN,
  is_opportunity_zone BOOLEAN,
  is_persistent_poverty_county BOOLEAN,
  is_non_metro BOOLEAN,
  
  -- Explainability
  reason_codes TEXT[],
  score_explanation TEXT,
  
  -- Metadata
  model_version VARCHAR(20),
  input_snapshot JSONB,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_scores_deal ON deal_scores(deal_id);
CREATE INDEX idx_deal_scores_tier ON deal_scores(tier);

-- ============================================================================
-- SCORE OVERRIDES
-- ============================================================================

CREATE TABLE score_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_score_id UUID REFERENCES deal_scores(id) ON DELETE CASCADE,
  
  original_tier score_tier,
  new_tier score_tier,
  reason_code VARCHAR(50),
  justification TEXT NOT NULL,
  
  overridden_by UUID REFERENCES users(id),
  overridden_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_overrides_score ON score_overrides(deal_score_id);

-- ============================================================================
-- CENSUS TRACTS (for fast lookup)
-- ============================================================================

CREATE TABLE census_tracts (
  geoid VARCHAR(15) PRIMARY KEY, -- 11-char FIPS code
  
  state_name VARCHAR(100),
  state_fips VARCHAR(2),
  county_name VARCHAR(100),
  county_fips VARCHAR(3),
  
  -- NMTC Eligibility
  nmtc_eligible BOOLEAN,
  poverty_rate NUMERIC(5,2),
  mfi_ratio NUMERIC(6,4),
  mfi_percent NUMERIC(5,1),
  unemployment_rate NUMERIC(5,2),
  
  -- Qualification Flags
  poverty_qualified BOOLEAN,
  mfi_qualified BOOLEAN,
  unemployment_high BOOLEAN,
  
  -- Distress Level
  distress_level VARCHAR(20), -- Severe, Distressed, Not Eligible
  
  -- Other Credits
  state_nmtc BOOLEAN DEFAULT FALSE,
  state_htc BOOLEAN DEFAULT FALSE,
  brownfield BOOLEAN DEFAULT FALSE,
  
  -- Classification
  classification VARCHAR(50), -- Sellable, Refundable, Both, Neither
  stack_score INTEGER, -- 0-4
  
  -- Geometry (for spatial queries)
  geom GEOMETRY(MultiPolygon, 4326),
  
  -- Metadata
  data_year INTEGER DEFAULT 2020,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_census_tracts_state ON census_tracts(state_fips);
CREATE INDEX idx_census_tracts_eligible ON census_tracts(nmtc_eligible);
CREATE INDEX idx_census_tracts_distress ON census_tracts(distress_level);
CREATE INDEX idx_census_tracts_geom ON census_tracts USING GIST(geom);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- What
  action VARCHAR(50) NOT NULL, -- create, update, delete, view, export
  entity_type VARCHAR(50) NOT NULL, -- deal, loi, commitment, document, etc.
  entity_id UUID,
  
  -- Details
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  
  -- Where
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================================================
-- LEDGER (Immutable transaction record)
-- ============================================================================

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  entry_type VARCHAR(50) NOT NULL, -- score, loi, commitment, status_change, etc.
  deal_id UUID REFERENCES deals(id),
  
  -- Content (immutable snapshot)
  payload JSONB NOT NULL,
  hash VARCHAR(64), -- SHA256 of payload
  previous_hash VARCHAR(64),
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_deal ON ledger_entries(deal_id);
CREATE INDEX idx_ledger_type ON ledger_entries(entry_type);
CREATE INDEX idx_ledger_created ON ledger_entries(created_at);


-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cde_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cde_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lois ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

-- Users can view their own organization's data
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- Users can view/edit their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- Deals: Sponsors see their own, CDEs see matched, Investors see committed
CREATE POLICY "Sponsors can view own deals" ON deals
  FOR SELECT USING (
    sponsor_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Sponsors can insert deals" ON deals
  FOR INSERT WITH CHECK (
    sponsor_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Sponsors can update own deals" ON deals
  FOR UPDATE USING (
    sponsor_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
  );

-- CDEs can view deals matched to them
CREATE POLICY "CDEs can view matched deals" ON deals
  FOR SELECT USING (
    assigned_cde_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())
    OR id IN (SELECT deal_id FROM cde_matches WHERE cde_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid()))
  );

-- Documents: Based on visibility flags
CREATE POLICY "Document visibility" ON documents
  FOR SELECT USING (
    (visible_to_sponsor AND deal_id IN (SELECT id FROM deals WHERE sponsor_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())))
    OR (visible_to_cde AND deal_id IN (SELECT id FROM deals WHERE assigned_cde_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())))
    OR (visible_to_investor AND deal_id IN (SELECT deal_id FROM commitments WHERE investor_id IN (SELECT organization_id FROM users WHERE auth_id = auth.uid())))
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cde_profiles_updated_at BEFORE UPDATE ON cde_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cde_allocations_updated_at BEFORE UPDATE ON cde_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_investor_profiles_updated_at BEFORE UPDATE ON investor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lois_updated_at BEFORE UPDATE ON lois
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_commitments_updated_at BEFORE UPDATE ON commitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCTIONS: LOI Number Generation
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_loi_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loi_number IS NULL THEN
    NEW.loi_number := 'LOI-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                      LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_loi_number_trigger BEFORE INSERT ON lois
  FOR EACH ROW EXECUTE FUNCTION generate_loi_number();

-- ============================================================================
-- FUNCTIONS: Commitment Number Generation
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_commitment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commitment_number IS NULL THEN
    NEW.commitment_number := 'CMT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                             LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_commitment_number_trigger BEFORE INSERT ON commitments
  FOR EACH ROW EXECUTE FUNCTION generate_commitment_number();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

COMMENT ON TABLE organizations IS 'Parent entities: CDEs, Sponsors, Investors';
COMMENT ON TABLE users IS 'Individual users belonging to organizations';
COMMENT ON TABLE deals IS 'Main intake form data for projects seeking financing';
COMMENT ON TABLE cde_profiles IS 'CDE allocation and preference profiles';
COMMENT ON TABLE cde_allocations IS 'Individual federal/state allocations for CDEs';
COMMENT ON TABLE investor_profiles IS 'Investor criteria and preferences';
COMMENT ON TABLE lois IS 'Letters of Intent from CDEs to Sponsors';
COMMENT ON TABLE commitments IS 'Investment commitments from Investors';
COMMENT ON TABLE census_tracts IS 'NMTC eligibility data by census tract';
COMMENT ON TABLE deal_scores IS 'Section C scoring results';
COMMENT ON TABLE ledger_entries IS 'Immutable transaction audit trail';

