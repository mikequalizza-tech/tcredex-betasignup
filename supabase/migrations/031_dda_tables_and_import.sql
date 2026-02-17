-- =============================================================================
-- Migration 031: DDA Tables - Difficult Development Areas (SOT from HUD)
-- =============================================================================
-- Two types of DDAs:
--   1. MDDA (Metro Small Area DDA) - by ZIP/ZCTA
--   2. NMDDA (Non-Metro DDA) - by County FIPS (entire county qualifies)
--
-- DDA is NOT a standalone qualifier - it's a 30% basis boost for LIHTC QCT projects
-- Logic: IF is_lihtc_qct AND is_dda THEN show "QCT + DDA 30% Boost"
--
-- Source files:
--   - 2025-DDAs-MDDA.csv (Metro, by ZCTA)
--   - 2025-DDAs-NMDDA.csv (Non-Metro, by County FIPS)
--   - 2026-DDAs-MDDA.csv (Metro, by ZCTA)
--   - 2026-DDAs-NMDDA.csv (Non-Metro, by County FIPS)
-- =============================================================================

-- =============================================================================
-- STEP 1: Metro DDA Tables (by ZIP/ZCTA)
-- =============================================================================

DROP TABLE IF EXISTS dda_metro_2025 CASCADE;
CREATE TABLE dda_metro_2025 (
    zcta VARCHAR(5) PRIMARY KEY,           -- ZIP Code Tabulation Area
    cbsasub VARCHAR(50),                    -- CBSA subdivision code
    area_name VARCHAR(255),                 -- Metro area name
    population_2020 INTEGER,                -- 2020 Census population
    population_in_qct INTEGER,              -- Population also in QCT
    population_not_in_qct INTEGER,          -- Population NOT in QCT
    safmr_2br DECIMAL(10,2),               -- 40th percentile 2-BR SAFMR
    vlil_4person INTEGER,                   -- 4-Person Very Low Income Limit
    lihtc_max_rent DECIMAL(10,2),          -- LIHTC Maximum Rent
    sdda_ratio DECIMAL(6,4),               -- SAFMR/LIHTC Max Rent ratio
    pop_over_100 INTEGER,                   -- Population >= 100 flag
    cumulative_population INTEGER,          -- Cumulative population for ranking
    cumulative_percent DECIMAL(10,7),       -- Cumulative percentage
    is_sdda INTEGER,                        -- 1=SDDA (from CSV)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS dda_metro_2026 CASCADE;
CREATE TABLE dda_metro_2026 (
    zcta VARCHAR(5) PRIMARY KEY,
    cbsasub VARCHAR(50),
    area_name VARCHAR(255),
    population_2020 INTEGER,
    population_in_qct INTEGER,
    population_not_in_qct INTEGER,
    safmr_2br DECIMAL(10,2),
    vlil_4person INTEGER,
    lihtc_max_rent DECIMAL(10,2),
    sdda_ratio DECIMAL(6,4),
    pop_over_100 INTEGER,
    cumulative_population INTEGER,
    cumulative_percent DECIMAL(10,7),
    is_sdda INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Metro DDA
CREATE INDEX idx_dda_metro_2025_zcta ON dda_metro_2025(zcta);
CREATE INDEX idx_dda_metro_2026_zcta ON dda_metro_2026(zcta);

-- =============================================================================
-- STEP 2: Non-Metro DDA Tables (by County FIPS)
-- =============================================================================

DROP TABLE IF EXISTS dda_nonmetro_2025 CASCADE;
CREATE TABLE dda_nonmetro_2025 (
    county_fips VARCHAR(5) PRIMARY KEY,     -- 5-digit County FIPS
    cbsasub VARCHAR(50),
    area_name VARCHAR(255),
    population_2020 DECIMAL(12,4),          -- May have decimal values from source
    population_in_qct DECIMAL(12,4),
    effective_population DECIMAL(12,4),     -- Population NOT in QCT
    fmr_2br DECIMAL(10,2),                 -- 40th percentile 2-BR FMR
    vlil_4person INTEGER,
    lihtc_max_rent DECIMAL(10,2),
    dda_ratio DECIMAL(6,4),
    cumulative_population BIGINT,           -- Large cumulative values (scientific notation)
    cumulative_percent DECIMAL(10,7),
    is_nmdda INTEGER,                       -- 1=NMDDA (from CSV)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS dda_nonmetro_2026 CASCADE;
CREATE TABLE dda_nonmetro_2026 (
    county_fips VARCHAR(5) PRIMARY KEY,
    cbsasub VARCHAR(50),
    area_name VARCHAR(255),
    population_2020 DECIMAL(12,4),
    population_in_qct DECIMAL(12,4),
    effective_population DECIMAL(12,4),
    fmr_2br DECIMAL(10,2),
    vlil_4person INTEGER,
    lihtc_max_rent DECIMAL(10,2),
    dda_ratio DECIMAL(6,4),
    cumulative_population BIGINT,
    cumulative_percent DECIMAL(10,7),
    is_nmdda INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Non-Metro DDA
CREATE INDEX idx_dda_nonmetro_2025_fips ON dda_nonmetro_2025(county_fips);
CREATE INDEX idx_dda_nonmetro_2026_fips ON dda_nonmetro_2026(county_fips);

-- =============================================================================
-- STEP 3: Row Level Security
-- =============================================================================

ALTER TABLE dda_metro_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE dda_metro_2026 ENABLE ROW LEVEL SECURITY;
ALTER TABLE dda_nonmetro_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE dda_nonmetro_2026 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DDA metro 2025 is publicly readable" ON dda_metro_2025 FOR SELECT USING (true);
CREATE POLICY "DDA metro 2026 is publicly readable" ON dda_metro_2026 FOR SELECT USING (true);
CREATE POLICY "DDA nonmetro 2025 is publicly readable" ON dda_nonmetro_2025 FOR SELECT USING (true);
CREATE POLICY "DDA nonmetro 2026 is publicly readable" ON dda_nonmetro_2026 FOR SELECT USING (true);

-- =============================================================================
-- STEP 4: Grants
-- =============================================================================

GRANT SELECT ON dda_metro_2025 TO anon, authenticated;
GRANT SELECT ON dda_metro_2026 TO anon, authenticated;
GRANT SELECT ON dda_nonmetro_2025 TO anon, authenticated;
GRANT SELECT ON dda_nonmetro_2026 TO anon, authenticated;

-- =============================================================================
-- STEP 5: Comments
-- =============================================================================

COMMENT ON TABLE dda_metro_2025 IS 'HUD Metro Small Area DDAs 2025 - by ZIP/ZCTA. 30% basis boost for LIHTC QCT projects.';
COMMENT ON TABLE dda_metro_2026 IS 'HUD Metro Small Area DDAs 2026 - by ZIP/ZCTA. 30% basis boost for LIHTC QCT projects.';
COMMENT ON TABLE dda_nonmetro_2025 IS 'HUD Non-Metro DDAs 2025 - by County FIPS. Entire county qualifies.';
COMMENT ON TABLE dda_nonmetro_2026 IS 'HUD Non-Metro DDAs 2026 - by County FIPS. Entire county qualifies.';

-- =============================================================================
-- STEP 6: Add DDA columns to master_tax_credit_sot
-- =============================================================================

ALTER TABLE master_tax_credit_sot
ADD COLUMN IF NOT EXISTS is_dda_2025 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_dda_2026 BOOLEAN DEFAULT FALSE;

-- Create indexes for DDA lookups
CREATE INDEX IF NOT EXISTS idx_master_sot_dda_2025 ON master_tax_credit_sot(is_dda_2025) WHERE is_dda_2025 = TRUE;
CREATE INDEX IF NOT EXISTS idx_master_sot_dda_2026 ON master_tax_credit_sot(is_dda_2026) WHERE is_dda_2026 = TRUE;

COMMENT ON COLUMN master_tax_credit_sot.is_dda_2025 IS 'HUD Difficult Development Area 2025 (Metro by ZIP or Non-Metro by County)';
COMMENT ON COLUMN master_tax_credit_sot.is_dda_2026 IS 'HUD Difficult Development Area 2026 (Metro by ZIP or Non-Metro by County)';

-- =============================================================================
-- NEXT STEPS:
-- 1. Load CSV data into the 4 DDA tables via Supabase dashboard or COPY command
-- 2. Run migration 032 to update master_tax_credit_sot with DDA flags
-- =============================================================================
