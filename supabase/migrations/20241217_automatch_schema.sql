-- tCredex Database Schema: AutoMatch AI + Organizations
-- Run this in Supabase SQL Editor AFTER the mobile schema

-- ============================================
-- ORGANIZATIONS TABLE UPDATES
-- ============================================
-- Add columns for CDE matching criteria

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS service_states TEXT[] DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sectors TEXT[] DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS min_allocation BIGINT DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_allocation BIGINT DEFAULT 100000000;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS available_allocation BIGINT DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS prefers_qct BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS prefers_distressed BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS historical_sectors TEXT[] DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS claim_token VARCHAR(100);


-- ============================================
-- DEAL_MATCHES TABLE
-- Stores AutoMatch AI results
-- ============================================
CREATE TABLE IF NOT EXISTS deal_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  cde_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  match_strength VARCHAR(20), -- excellent, good, fair, weak
  breakdown JSONB, -- { geographic: 80, sector: 90, allocation: 70, ... }
  reasons TEXT[],
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, cde_id)
);

CREATE INDEX IF NOT EXISTS idx_deal_matches_deal_id ON deal_matches(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_cde_id ON deal_matches(cde_id);
CREATE INDEX IF NOT EXISTS idx_deal_matches_score ON deal_matches(score DESC);


-- ============================================
-- DEALS TABLE UPDATES
-- Add fields for matching and lifecycle
-- ============================================
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_qct BOOLEAN DEFAULT FALSE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_severely_distressed BOOLEAN DEFAULT FALSE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS distress_score INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS project_type VARCHAR(100); -- Sector
ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_matched_at TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS admin_notes TEXT;


-- ============================================
-- PROFILES TABLE UPDATES
-- Ensure role column exists
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'sponsor';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);


-- ============================================
-- DEAL TIMELINE UPDATES
-- Add notes field
-- ============================================
ALTER TABLE deal_timeline ADD COLUMN IF NOT EXISTS notes TEXT;


-- ============================================
-- ORGANIZATION CLAIM TOKENS
-- For profile claim flow
-- ============================================
CREATE TABLE IF NOT EXISTS organization_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_claims_token ON organization_claims(token);
CREATE INDEX IF NOT EXISTS idx_org_claims_org_id ON organization_claims(organization_id);


-- ============================================
-- CDE ALLOCATION HISTORY
-- Track allocation announcements over years
-- ============================================
CREATE TABLE IF NOT EXISTS cde_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  allocation_year INTEGER NOT NULL,
  allocation_amount BIGINT NOT NULL,
  deployed_amount BIGINT DEFAULT 0,
  source VARCHAR(100), -- CDFI Fund, State, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, allocation_year, source)
);

CREATE INDEX IF NOT EXISTS idx_cde_allocations_org ON cde_allocations(organization_id);
CREATE INDEX IF NOT EXISTS idx_cde_allocations_year ON cde_allocations(allocation_year DESC);


-- ============================================
-- Success message
-- ============================================
SELECT 'tCredex AutoMatch Schema Created Successfully!' AS status;
