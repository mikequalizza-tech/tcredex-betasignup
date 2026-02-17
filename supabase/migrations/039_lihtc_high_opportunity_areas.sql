-- =============================================================================
-- Migration 039: Add LIHTC High Opportunity Areas (HOA) Data
-- =============================================================================
-- Corrects LIHTC eligibility logic:
-- - LIHTC can be built in ANY census tract in the USA
-- - HIGH_OPP (High Opportunity Areas) is the BASE for where 95% of deals occur
-- - QCT and DDA provide 30% basis boost
-- - HIGH_OPP values: 0=Not HOA, 1=HOA+DDA, 2=HOA only, 3=HOA+QCT
-- =============================================================================

-- Create staging table for HOA import
DROP TABLE IF EXISTS lihtc_hoa_staging CASCADE;

CREATE TABLE lihtc_hoa_staging (
    state_fips TEXT,
    county_fips TEXT,
    tract_fips TEXT,
    geoid TEXT PRIMARY KEY,  -- 11-digit FIPS (FIPS11 from source)
    msa_code TEXT,
    high_opp INTEGER DEFAULT 0,  -- 0=None, 1=HOA+DDA, 2=HOA only, 3=HOA+QCT
    dda_flag INTEGER DEFAULT 0,  -- 1 = DDA eligible (30% basis boost)
    qap_flag INTEGER DEFAULT 0,  -- 1 = Qualified Allocation Plan flag
    ct_duplicate INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on geoid for fast lookups
CREATE INDEX idx_lihtc_hoa_geoid ON lihtc_hoa_staging(geoid);
CREATE INDEX idx_lihtc_hoa_high_opp ON lihtc_hoa_staging(high_opp) WHERE high_opp > 0;
CREATE INDEX idx_lihtc_hoa_dda ON lihtc_hoa_staging(dda_flag) WHERE dda_flag = 1;

-- Enable RLS
ALTER TABLE lihtc_hoa_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HOA data is publicly readable"
    ON lihtc_hoa_staging FOR SELECT USING (true);

GRANT SELECT ON lihtc_hoa_staging TO anon, authenticated;

-- =============================================================================
-- Add HOA columns to master_tax_credit_sot
-- =============================================================================

ALTER TABLE master_tax_credit_sot
ADD COLUMN IF NOT EXISTS is_high_opportunity_area BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS high_opp_category INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_lihtc_dda_eligible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_lihtc_qap_flag BOOLEAN DEFAULT FALSE;

-- Comment on new columns
COMMENT ON COLUMN master_tax_credit_sot.is_high_opportunity_area IS 'TRUE if tract is in High Opportunity Area (high_opp > 0)';
COMMENT ON COLUMN master_tax_credit_sot.high_opp_category IS '0=None, 1=HOA+DDA, 2=HOA only, 3=HOA+QCT';
COMMENT ON COLUMN master_tax_credit_sot.is_lihtc_dda_eligible IS 'TRUE if tract is DDA eligible (30% basis boost)';
COMMENT ON COLUMN master_tax_credit_sot.is_lihtc_qap_flag IS 'TRUE if tract has QAP flag from state';

-- =============================================================================
-- Create index on new columns
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_master_sot_hoa ON master_tax_credit_sot(is_high_opportunity_area) WHERE is_high_opportunity_area = TRUE;
CREATE INDEX IF NOT EXISTS idx_master_sot_dda ON master_tax_credit_sot(is_lihtc_dda_eligible) WHERE is_lihtc_dda_eligible = TRUE;

-- =============================================================================
-- Function to update master table from HOA staging
-- =============================================================================

CREATE OR REPLACE FUNCTION update_master_with_hoa_data()
RETURNS void AS $$
BEGIN
    UPDATE master_tax_credit_sot m
    SET
        is_high_opportunity_area = (h.high_opp > 0),
        high_opp_category = h.high_opp,
        is_lihtc_dda_eligible = (h.dda_flag = 1),
        is_lihtc_qap_flag = (h.qap_flag = 1),
        updated_at = NOW()
    FROM lihtc_hoa_staging h
    WHERE m.geoid = h.geoid;

    RAISE NOTICE 'Updated % rows with HOA data', (SELECT COUNT(*) FROM master_tax_credit_sot WHERE is_high_opportunity_area = TRUE OR is_lihtc_dda_eligible = TRUE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_master_with_hoa_data IS 'Merges HOA staging data into master_tax_credit_sot';
