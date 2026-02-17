-- =============================================================================
-- tCredex MERGED CDEs Table
-- =============================================================================
-- Combines: cdes + cde_allocations + cde_summary into ONE table
-- Each row = 1 CDE + 1 allocation year
-- Same CDE appears multiple times (grouped by organization_id)
--
-- NOTE: This creates a NEW table alongside old ones (doesn't drop anything)
-- Old tables kept for testing until migration is complete
-- =============================================================================

-- =============================================================================
-- THE ONE CDE TABLE TO RULE THEM ALL
-- =============================================================================
DROP TABLE IF EXISTS cdes_merged CASCADE;

CREATE TABLE cdes_merged (
  -- ===========================================
  -- PRIMARY IDENTIFIERS
  -- ===========================================
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,  -- Groups same CDE across years (NOT an FK!)

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,

  -- ===========================================
  -- ALLOCATION YEAR (makes each row unique)
  -- ===========================================
  year INTEGER NOT NULL,
  allocation_type VARCHAR(20) DEFAULT 'federal', -- 'federal' or 'state'

  -- ===========================================
  -- ALLOCATION AMOUNTS (per year)
  -- ===========================================
  total_allocation DECIMAL(15,2) DEFAULT 0,      -- Awarded that year
  amount_finalized DECIMAL(15,2) DEFAULT 0,      -- Deployed/committed
  amount_remaining DECIMAL(15,2) DEFAULT 0,      -- Still available
  non_metro_commitment DECIMAL(5,2) DEFAULT 0,   -- Percentage for non-metro
  deployment_deadline DATE,

  -- ===========================================
  -- FROM CSV IMPORT
  -- ===========================================
  service_area VARCHAR(255),                     -- "National service area", etc.
  service_area_type VARCHAR(50),                 -- 'national', 'statewide', 'multi-state', 'local'
  controlling_entity VARCHAR(255),               -- Parent organization
  predominant_financing VARCHAR(255),            -- "Real Estate Financing", etc.
  predominant_market TEXT,                       -- Target states/markets
  innovative_activities TEXT,                    -- Special programs

  -- ===========================================
  -- CONTACT INFO
  -- ===========================================
  contact_name VARCHAR(255),
  contact_title VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),

  -- ===========================================
  -- CERTIFICATION & HISTORY
  -- ===========================================
  certification_number VARCHAR(50),
  year_established INTEGER,

  -- ===========================================
  -- DEAL SIZE PREFERENCES
  -- ===========================================
  min_deal_size DECIMAL(15,2) DEFAULT 1000000,
  max_deal_size DECIMAL(15,2) DEFAULT 15000000,
  small_deal_fund BOOLEAN DEFAULT FALSE,

  -- ===========================================
  -- GEOGRAPHIC FOCUS
  -- ===========================================
  primary_states TEXT[],           -- Array of state codes
  target_regions TEXT[],
  excluded_states TEXT[],
  rural_focus BOOLEAN DEFAULT FALSE,
  urban_focus BOOLEAN DEFAULT TRUE,
  native_american_focus BOOLEAN DEFAULT FALSE,
  underserved_states_focus BOOLEAN DEFAULT FALSE,

  -- ===========================================
  -- MISSION & IMPACT
  -- ===========================================
  mission_statement TEXT,
  impact_priorities TEXT[],        -- Array of priority codes
  target_sectors TEXT[],
  special_focus TEXT[],

  -- ===========================================
  -- DEAL MATCHING PREFERENCES
  -- ===========================================
  preferred_project_types TEXT[],
  require_severely_distressed BOOLEAN DEFAULT FALSE,
  require_qct BOOLEAN DEFAULT FALSE,
  min_distress_score INTEGER,
  min_project_cost DECIMAL(15,2),
  max_project_cost DECIMAL(15,2),
  min_jobs_created INTEGER,
  require_community_benefits BOOLEAN DEFAULT TRUE,
  require_shovel_ready BOOLEAN DEFAULT FALSE,
  max_time_to_close INTEGER,       -- months
  related_party_policy VARCHAR(50) DEFAULT 'case-by-case',

  -- ===========================================
  -- EXPERIENCE FLAGS
  -- ===========================================
  nmtc_experience BOOLEAN DEFAULT TRUE,
  htc_experience BOOLEAN DEFAULT FALSE,
  lihtc_experience BOOLEAN DEFAULT FALSE,
  oz_experience BOOLEAN DEFAULT FALSE,
  stacked_deals_preferred BOOLEAN DEFAULT FALSE,

  -- ===========================================
  -- TRACK RECORD
  -- ===========================================
  total_deals_completed INTEGER DEFAULT 0,
  total_qlici_deployed DECIMAL(15,2) DEFAULT 0,
  average_close_time INTEGER,      -- days

  -- ===========================================
  -- STATUS & METADATA
  -- ===========================================
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ===========================================
  -- CONSTRAINTS
  -- ===========================================
  -- Same CDE can't have duplicate allocation years
  UNIQUE(organization_id, year)
);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_cdes_merged_org_id ON cdes_merged(organization_id);
CREATE INDEX idx_cdes_merged_year ON cdes_merged(year);
CREATE INDEX idx_cdes_merged_slug ON cdes_merged(slug);
CREATE INDEX idx_cdes_merged_remaining ON cdes_merged(amount_remaining);
CREATE INDEX idx_cdes_merged_status ON cdes_merged(status);
CREATE INDEX idx_cdes_merged_states ON cdes_merged USING GIN(primary_states);

-- ===========================================
-- VIEW: Aggregated CDE Summary (one row per CDE)
-- ===========================================
CREATE OR REPLACE VIEW cde_totals AS
SELECT
  organization_id,
  MAX(name) as name,
  MAX(slug) as slug,
  -- Totals across all years
  SUM(total_allocation) as total_allocation_all_years,
  SUM(amount_finalized) as total_finalized_all_years,
  SUM(amount_remaining) as total_remaining_all_years,
  AVG(non_metro_commitment) as avg_non_metro_commitment,
  -- Year info
  array_agg(DISTINCT year ORDER BY year DESC) as allocation_years,
  COUNT(DISTINCT year) as year_count,
  MIN(year) as first_allocation_year,
  MAX(year) as latest_allocation_year,
  -- Latest metadata (from most recent year)
  MAX(service_area) as service_area,
  MAX(service_area_type) as service_area_type,
  MAX(controlling_entity) as controlling_entity,
  MAX(contact_name) as contact_name,
  MAX(contact_email) as contact_email,
  MAX(contact_phone) as contact_phone,
  -- Preferences (from any row, they should be same)
  MAX(min_deal_size) as min_deal_size,
  MAX(max_deal_size) as max_deal_size,
  BOOL_OR(small_deal_fund) as small_deal_fund,
  BOOL_OR(rural_focus) as rural_focus,
  BOOL_OR(urban_focus) as urban_focus,
  MAX(status) as status,
  MAX(updated_at) as updated_at
FROM cdes_merged
WHERE status = 'active'
GROUP BY organization_id;

-- ===========================================
-- COMMENTS
-- ===========================================
COMMENT ON TABLE cdes_merged IS 'Merged CDE table: each row = 1 CDE + 1 allocation year. Same CDE appears multiple times, grouped by organization_id.';
COMMENT ON COLUMN cdes_merged.organization_id IS 'Groups the same CDE across multiple allocation years. NOT a foreign key to any other table.';
COMMENT ON COLUMN cdes_merged.year IS 'Allocation year. Combined with organization_id forms a unique constraint.';
COMMENT ON VIEW cde_totals IS 'Aggregated view showing one row per CDE with totals across all years.';
