-- ============================================================================
-- CDE Allocations Table
-- ============================================================================
-- Tracks NMTC allocations by year for each CDE organization
-- Primary Key: cde_id (references organizations)
-- One row per CDE per allocation year
-- ============================================================================

-- Add CDE-specific columns to organizations table if they don't exist
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS service_area VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS service_area_description TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS controlling_entity TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS predominant_financing TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS predominant_market TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS innovative_activities TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS nmtc_allocation_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS nmtc_allocation_deployed DECIMAL(15,2) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS nmtc_allocation_remaining DECIMAL(15,2) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS non_metro_commitment DECIMAL(5,2);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS allocation_years INTEGER[];

-- Create CDE allocations table (one row per CDE per year)
CREATE TABLE IF NOT EXISTS cde_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign key to organizations
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Allocation year
  year INTEGER NOT NULL,

  -- Amounts
  total_allocation DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_finalized DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_remaining DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- Commitment
  non_metro_commitment DECIMAL(5,2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one allocation per CDE per year
  UNIQUE(organization_id, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cde_allocations_org ON cde_allocations(organization_id);
CREATE INDEX IF NOT EXISTS idx_cde_allocations_year ON cde_allocations(year);
CREATE INDEX IF NOT EXISTS idx_cde_allocations_remaining ON cde_allocations(amount_remaining DESC);

-- Index on organizations for CDE queries
CREATE INDEX IF NOT EXISTS idx_organizations_allocation_remaining ON organizations(nmtc_allocation_remaining DESC) WHERE type = 'cde';
CREATE INDEX IF NOT EXISTS idx_organizations_service_area ON organizations(service_area) WHERE type = 'cde';

-- RLS Policies
ALTER TABLE cde_allocations ENABLE ROW LEVEL SECURITY;

-- Anyone can read CDE allocations (public data)
CREATE POLICY "CDE allocations are viewable by everyone"
  ON cde_allocations FOR SELECT
  USING (true);

-- Only admins can modify allocations
CREATE POLICY "Only admins can insert CDE allocations"
  ON cde_allocations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Only admins can update CDE allocations"
  ON cde_allocations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Comment
COMMENT ON TABLE cde_allocations IS 'NMTC allocations by year for each CDE organization. Source: CDFI Fund QEI Report.';
