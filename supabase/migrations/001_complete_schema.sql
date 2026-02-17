-- =============================================================================
-- tCredex Complete Database Schema v1.7
-- =============================================================================
-- This migration creates all tables needed for the tCredex platform
-- Run with: supabase db push
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Organization types
CREATE TYPE org_type AS ENUM ('cde', 'sponsor', 'investor', 'admin');

-- User roles
CREATE TYPE user_role AS ENUM ('ORG_ADMIN', 'PROJECT_ADMIN', 'MEMBER', 'VIEWER');

-- Deal statuses
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

-- Program types
CREATE TYPE program_type AS ENUM ('NMTC', 'HTC', 'LIHTC', 'OZ', 'Brownfield');

-- LOI statuses
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

-- Commitment statuses
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

-- Document statuses
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'needs_review');

-- Ledger actor types
CREATE TYPE ledger_actor_type AS ENUM ('system', 'human', 'api_key');

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Organizations (parent for all org types)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type org_type NOT NULL,
  logo_url TEXT,
  website VARCHAR(255),
  phone VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'MEMBER',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
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


-- =============================================================================
-- CDE-SPECIFIC TABLES
-- =============================================================================

-- CDEs (Community Development Entities)
CREATE TABLE cdes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Certification
  certification_number VARCHAR(50),
  parent_organization VARCHAR(255),
  year_established INTEGER,
  
  -- Primary Contact
  primary_contact_name VARCHAR(255),
  primary_contact_title VARCHAR(100),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  
  -- Allocation Summary (computed)
  total_allocation DECIMAL(15,2) DEFAULT 0,
  remaining_allocation DECIMAL(15,2) DEFAULT 0,
  deployment_deadline DATE,
  
  -- Deal Size
  min_deal_size DECIMAL(15,2) DEFAULT 1000000,
  max_deal_size DECIMAL(15,2) DEFAULT 15000000,
  small_deal_fund BOOLEAN DEFAULT FALSE,
  
  -- Geographic Focus
  service_area_type VARCHAR(20) DEFAULT 'national',
  primary_states TEXT[], -- Array of state codes
  target_regions TEXT[],
  excluded_states TEXT[],
  rural_focus BOOLEAN DEFAULT FALSE,
  urban_focus BOOLEAN DEFAULT TRUE,
  native_american_focus BOOLEAN DEFAULT FALSE,
  underserved_states_focus BOOLEAN DEFAULT FALSE,
  
  -- Mission
  mission_statement TEXT,
  impact_priorities TEXT[], -- Array of priority codes
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
  max_time_to_close INTEGER, -- months
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
  average_close_time INTEGER, -- days
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cdes_organization ON cdes(organization_id);
CREATE INDEX idx_cdes_status ON cdes(status);

-- CDE Allocations (individual federal/state awards)
CREATE TABLE cde_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cde_id UUID NOT NULL REFERENCES cdes(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL, -- 'federal' or 'state'
  year VARCHAR(4) NOT NULL,
  state_code VARCHAR(2), -- For state allocations
  
  awarded_amount DECIMAL(15,2) NOT NULL,
  available_on_platform DECIMAL(15,2) NOT NULL,
  deployed_amount DECIMAL(15,2) DEFAULT 0,
  
  percentage_won DECIMAL(5,2), -- For partial federal awards
  deployment_deadline DATE,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cde_allocations_cde ON cde_allocations(cde_id);
CREATE INDEX idx_cde_allocations_type ON cde_allocations(type);
CREATE INDEX idx_cde_allocations_year ON cde_allocations(year);


-- =============================================================================
-- SPONSOR & INVESTOR TABLES
-- =============================================================================

-- Sponsors
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  
  -- Classification
  organization_type VARCHAR(50), -- 'For-profit', 'Non-profit', etc.
  low_income_owned BOOLEAN,
  woman_owned BOOLEAN DEFAULT FALSE,
  minority_owned BOOLEAN DEFAULT FALSE,
  veteran_owned BOOLEAN DEFAULT FALSE,
  
  -- Track Record
  total_projects_completed INTEGER DEFAULT 0,
  total_project_value DECIMAL(15,2) DEFAULT 0,
  
  -- Platform Status
  exclusivity_agreed BOOLEAN DEFAULT FALSE,
  exclusivity_agreed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sponsors_organization ON sponsors(organization_id);

-- Investors
CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  
  -- Investment Profile
  investor_type VARCHAR(50), -- 'Bank', 'Insurance', 'Corporate', 'Family Office', etc.
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
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investors_organization ON investors(organization_id);
CREATE INDEX idx_investors_type ON investors(investor_type);


-- =============================================================================
-- DEALS TABLE
-- =============================================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  project_name VARCHAR(255) NOT NULL,
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
  sponsor_name VARCHAR(255),
  sponsor_organization_id UUID REFERENCES organizations(id),
  
  -- Programs
  programs program_type[] NOT NULL DEFAULT '{}',
  program_level VARCHAR(20) DEFAULT 'federal',
  state_program VARCHAR(100),
  
  -- Location
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  county VARCHAR(100),
  census_tract VARCHAR(20),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  
  -- Tract Eligibility (cached from lookup)
  tract_types TEXT[],
  tract_poverty_rate DECIMAL(5,2),
  tract_median_income DECIMAL(5,2),
  tract_unemployment DECIMAL(5,2),
  tract_eligible BOOLEAN,
  tract_severely_distressed BOOLEAN,
  tract_classification VARCHAR(50),
  
  -- Project Details
  project_type VARCHAR(100),
  venture_type VARCHAR(50), -- 'Real Estate' or 'Business'
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
  
  -- Participants
  assigned_cde_id UUID REFERENCES cdes(id),
  assigned_cde_name VARCHAR(255),
  investor_id UUID REFERENCES investors(id),
  investor_name VARCHAR(255),
  
  -- Platform Agreements
  exclusivity_agreed BOOLEAN DEFAULT FALSE,
  exclusivity_agreed_at TIMESTAMPTZ,
  
  -- QALICB Data (NMTC specific) - stored as JSONB
  qalicb_data JSONB DEFAULT '{}',
  
  -- HTC Data
  htc_data JSONB DEFAULT '{}',
  
  -- Full Intake Data (complete form)
  intake_data JSONB DEFAULT '{}',
  
  -- Closing Checklist (with docs)
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


-- =============================================================================
-- TRANSACTION TABLES (LOI, COMMITMENT, CLOSING)
-- =============================================================================

-- Letters of Intent
CREATE TABLE letters_of_intent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loi_number VARCHAR(50) UNIQUE,
  
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  cde_id UUID NOT NULL REFERENCES cdes(id),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id),
  
  status loi_status DEFAULT 'draft',
  
  -- Terms
  allocation_amount DECIMAL(15,2) NOT NULL,
  qlici_rate DECIMAL(5,4), -- e.g., 0.039 for 3.9%
  leverage_structure VARCHAR(50) DEFAULT 'standard',
  term_years INTEGER DEFAULT 7,
  
  -- Dates
  expires_at TIMESTAMPTZ,
  expected_closing_date DATE,
  sponsor_response_deadline TIMESTAMPTZ,
  
  -- Conditions (JSONB array)
  conditions JSONB DEFAULT '[]',
  
  -- Terms & Requirements
  special_terms TEXT,
  cde_requirements JSONB DEFAULT '{}',
  
  -- Response tracking
  sponsor_response_at TIMESTAMPTZ,
  sponsor_response_notes TEXT,
  counter_terms JSONB,
  
  -- Issue tracking
  issued_at TIMESTAMPTZ,
  issued_by UUID REFERENCES users(id),
  
  -- Withdrawal
  withdrawn_at TIMESTAMPTZ,
  withdrawn_by UUID REFERENCES users(id),
  withdrawn_reason TEXT,
  
  -- Supersession
  superseded_by UUID REFERENCES letters_of_intent(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loi_deal ON letters_of_intent(deal_id);
CREATE INDEX idx_loi_cde ON letters_of_intent(cde_id);
CREATE INDEX idx_loi_sponsor ON letters_of_intent(sponsor_id);
CREATE INDEX idx_loi_status ON letters_of_intent(status);

-- LOI History
CREATE TABLE loi_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loi_id UUID NOT NULL REFERENCES letters_of_intent(id) ON DELETE CASCADE,
  from_status loi_status,
  to_status loi_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loi_history_loi ON loi_history(loi_id);

-- Commitments (Investor to Deal)
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_number VARCHAR(50) UNIQUE,
  
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  loi_id UUID REFERENCES letters_of_intent(id),
  investor_id UUID NOT NULL REFERENCES investors(id),
  cde_id UUID REFERENCES cdes(id),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id),
  
  status commitment_status DEFAULT 'draft',
  
  -- Investment Terms
  investment_amount DECIMAL(15,2) NOT NULL,
  credit_type program_type NOT NULL,
  credit_rate DECIMAL(5,4),
  expected_credits DECIMAL(15,2),
  pricing_cents_per_credit DECIMAL(10,4),
  net_benefit_to_project DECIMAL(15,2),
  
  -- CRA
  cra_eligible BOOLEAN DEFAULT FALSE,
  
  -- Dates
  expires_at TIMESTAMPTZ,
  target_closing_date DATE,
  response_deadline TIMESTAMPTZ,
  
  -- Conditions (JSONB array)
  conditions JSONB DEFAULT '[]',
  
  -- Terms
  special_terms TEXT,
  investor_requirements JSONB DEFAULT '{}',
  
  -- Acceptance Tracking
  sponsor_accepted_at TIMESTAMPTZ,
  sponsor_accepted_by UUID REFERENCES users(id),
  cde_accepted_at TIMESTAMPTZ,
  cde_accepted_by UUID REFERENCES users(id),
  all_accepted_at TIMESTAMPTZ,
  
  -- Issue tracking
  issued_at TIMESTAMPTZ,
  issued_by UUID REFERENCES users(id),
  
  -- Rejection
  rejection_reason TEXT,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  
  -- Withdrawal
  withdrawn_at TIMESTAMPTZ,
  withdrawn_by UUID REFERENCES users(id),
  withdrawn_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commitments_deal ON commitments(deal_id);
CREATE INDEX idx_commitments_investor ON commitments(investor_id);
CREATE INDEX idx_commitments_cde ON commitments(cde_id);
CREATE INDEX idx_commitments_status ON commitments(status);

-- Commitment History
CREATE TABLE commitment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  from_status commitment_status,
  to_status commitment_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commitment_history ON commitment_history(commitment_id);

-- Closing Rooms
CREATE TABLE closing_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  deal_id UUID UNIQUE NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES commitments(id),
  loi_id UUID REFERENCES letters_of_intent(id),
  
  status VARCHAR(50) DEFAULT 'active',
  target_close_date DATE,
  actual_close_date DATE,
  
  -- Participants
  participants JSONB DEFAULT '[]',
  
  -- Checklist Progress
  checklist_progress JSONB DEFAULT '{}',
  
  -- Notes
  notes TEXT,
  
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_closing_rooms_deal ON closing_rooms(deal_id);
CREATE INDEX idx_closing_rooms_status ON closing_rooms(status);


-- =============================================================================
-- DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  closing_room_id UUID REFERENCES closing_rooms(id),
  uploaded_by UUID REFERENCES users(id),
  
  -- File Info
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Categorization
  category VARCHAR(50), -- 'legal', 'financial', 'environmental', etc.
  tags TEXT[],
  
  -- Status
  status document_status DEFAULT 'pending',
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),
  
  -- AI Analysis
  ai_summary TEXT,
  ai_flags TEXT[],
  
  -- Hash for integrity
  content_hash VARCHAR(64),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_deal ON documents(deal_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);

-- =============================================================================
-- LEDGER TABLES (Audit Trail)
-- =============================================================================

CREATE TABLE ledger_events (
  id BIGSERIAL PRIMARY KEY,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  actor_type ledger_actor_type NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  
  action VARCHAR(100) NOT NULL,
  payload_json JSONB DEFAULT '{}',
  
  model_version VARCHAR(50),
  reason_codes JSONB,
  
  -- Hash chain for tamper evidence
  prev_hash VARCHAR(64),
  hash VARCHAR(64) NOT NULL,
  sig TEXT, -- Optional signature
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_entity ON ledger_events(entity_type, entity_id);
CREATE INDEX idx_ledger_action ON ledger_events(action);
CREATE INDEX idx_ledger_actor ON ledger_events(actor_id);
CREATE INDEX idx_ledger_timestamp ON ledger_events(event_timestamp);

-- Ledger Anchors (External verification)
CREATE TABLE ledger_anchors (
  id BIGSERIAL PRIMARY KEY,
  ledger_event_id BIGINT NOT NULL REFERENCES ledger_events(id),
  
  anchored_hash VARCHAR(64) NOT NULL,
  anchor_type VARCHAR(50) NOT NULL, -- 'github_gist', 'blockchain', etc.
  external_reference TEXT,
  
  anchored_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_ledger_anchors_event ON ledger_anchors(ledger_event_id);

-- Ledger Verifications
CREATE TABLE ledger_verifications (
  id BIGSERIAL PRIMARY KEY,
  start_event_id BIGINT REFERENCES ledger_events(id),
  end_event_id BIGINT REFERENCES ledger_events(id),
  
  events_checked INTEGER NOT NULL,
  chain_valid BOOLEAN NOT NULL,
  signatures_valid BOOLEAN,
  anchor_matched BOOLEAN,
  
  issues JSONB DEFAULT '[]',
  
  requested_by VARCHAR(255),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);


-- =============================================================================
-- TEAM & ACCESS TABLES
-- =============================================================================

-- Team Members (users within organizations)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  role user_role DEFAULT 'MEMBER',
  title VARCHAR(100),
  
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_team_members_org ON team_members(organization_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- Project Assignments (user access to specific deals)
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member', 'viewer'
  
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, deal_id)
);

CREATE INDEX idx_project_assignments_user ON project_assignments(user_id);
CREATE INDEX idx_project_assignments_deal ON project_assignments(deal_id);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  action_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- =============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
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
CREATE TRIGGER update_team_members_timestamp BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- LOI NUMBER SEQUENCE
-- =============================================================================

CREATE SEQUENCE loi_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_loi_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.loi_number IS NULL THEN
    NEW.loi_number := 'LOI-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('loi_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_loi_number_trigger BEFORE INSERT ON letters_of_intent FOR EACH ROW EXECUTE FUNCTION generate_loi_number();

-- =============================================================================
-- COMMITMENT NUMBER SEQUENCE
-- =============================================================================

CREATE SEQUENCE commitment_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_commitment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commitment_number IS NULL THEN
    NEW.commitment_number := 'CMT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('commitment_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_commitment_number_trigger BEFORE INSERT ON commitments FOR EACH ROW EXECUTE FUNCTION generate_commitment_number();


-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
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
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Note: Ledger tables intentionally do NOT have RLS - they're append-only audit logs
-- Access should be controlled at the application layer

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- =============================================================================
-- BASIC POLICIES (Service Role bypasses RLS)
-- =============================================================================

-- Organizations: Users can read orgs they belong to
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = get_user_org_id());

-- Users can view themselves
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can view org members
CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (organization_id = get_user_org_id());

-- Deals: Complex policy based on org type and deal status
CREATE POLICY "Sponsors can view their deals"
  ON deals FOR SELECT
  USING (sponsor_organization_id = get_user_org_id());

CREATE POLICY "CDEs can view available and matched deals"
  ON deals FOR SELECT
  USING (
    status IN ('available', 'seeking_capital', 'matched', 'closing', 'closed')
    OR assigned_cde_id IN (
      SELECT c.id FROM cdes c
      JOIN users u ON u.organization_id = c.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Documents: Users can view docs for their deals/org
CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Get current user's organization type
CREATE OR REPLACE FUNCTION get_user_org_type()
RETURNS org_type AS $$
  SELECT o.type FROM organizations o
  JOIN users u ON u.organization_id = o.id
  WHERE u.id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user has access to a deal
CREATE OR REPLACE FUNCTION user_has_deal_access(deal_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  user_org_type org_type;
  deal_record RECORD;
BEGIN
  SELECT organization_id INTO user_org_id FROM users WHERE id = auth.uid();
  SELECT o.type INTO user_org_type FROM organizations o WHERE o.id = user_org_id;
  SELECT * INTO deal_record FROM deals WHERE id = deal_uuid;
  
  -- Sponsor can always see their own deals
  IF deal_record.sponsor_organization_id = user_org_id THEN
    RETURN TRUE;
  END IF;
  
  -- CDE can see assigned deals or available deals
  IF user_org_type = 'cde' THEN
    IF deal_record.status IN ('available', 'seeking_capital') THEN
      RETURN TRUE;
    END IF;
    -- Check if CDE is assigned
    SELECT 1 INTO deal_record FROM cdes c
    WHERE c.organization_id = user_org_id AND c.id = deal_record.assigned_cde_id;
    IF FOUND THEN RETURN TRUE; END IF;
  END IF;
  
  -- Investor can see deals with commitments
  IF user_org_type = 'investor' THEN
    SELECT 1 INTO deal_record FROM commitments cm
    JOIN investors i ON i.id = cm.investor_id
    WHERE i.organization_id = user_org_id AND cm.deal_id = deal_uuid;
    IF FOUND THEN RETURN TRUE; END IF;
  END IF;
  
  -- Admin can see all
  IF user_org_type = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active CDEs with allocation summary
CREATE OR REPLACE VIEW cde_summary AS
SELECT 
  c.id,
  o.name as organization_name,
  o.slug,
  c.total_allocation,
  c.remaining_allocation,
  c.min_deal_size,
  c.max_deal_size,
  c.primary_states,
  c.target_sectors,
  c.impact_priorities,
  c.status,
  c.rural_focus,
  c.urban_focus,
  c.htc_experience,
  c.small_deal_fund,
  c.require_severely_distressed,
  (SELECT COUNT(*) FROM cde_allocations ca WHERE ca.cde_id = c.id AND ca.type = 'federal') as federal_allocation_count,
  (SELECT COUNT(*) FROM cde_allocations ca WHERE ca.cde_id = c.id AND ca.type = 'state') as state_allocation_count,
  c.updated_at
FROM cdes c
JOIN organizations o ON o.id = c.organization_id
WHERE c.status = 'active';

-- Deal cards for marketplace
CREATE OR REPLACE VIEW deal_cards AS
SELECT 
  d.id,
  d.project_name,
  d.sponsor_name,
  d.city,
  d.state,
  d.census_tract,
  d.programs,
  d.total_project_cost,
  d.nmtc_financing_requested,
  d.jobs_created,
  d.tract_eligible,
  d.tract_severely_distressed,
  d.readiness_score,
  d.tier,
  d.status,
  d.project_type,
  d.created_at
FROM deals d
WHERE d.visible = true
AND d.status IN ('available', 'seeking_capital');

