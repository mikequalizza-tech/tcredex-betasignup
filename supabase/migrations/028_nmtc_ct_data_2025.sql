-- =============================================================================
-- Migration 028: NMTC Census Tract Data 2025 - SOURCE OF TRUTH
-- =============================================================================
-- Official CDFI Fund data from NMTC_2016-2020_ACS_LIC_2025.csv
-- 85,395 census tracts with all NMTC eligibility and distress metrics
--
-- This table replaces:
--   - nmtc_census_tracts (2023 data)
--   - nmtc_high_migration (now a column here)
--   - census_tracts (fragmented, being deprecated)
-- =============================================================================

-- Create the new SOT table
CREATE TABLE IF NOT EXISTS nmtc_ct_data_2025 (
    -- Primary key: 11-digit FIPS GEOID
    geoid VARCHAR(11) PRIMARY KEY,

    -- Geographic classification
    metro_status VARCHAR(20),                    -- 'Metro' or 'Non-metro'
    is_non_metro BOOLEAN DEFAULT FALSE,

    -- NMTC LIC Eligibility (the gate)
    is_lic_eligible BOOLEAN DEFAULT FALSE,       -- Does tract qualify for NMTC?

    -- Poverty metrics
    poverty_rate DECIMAL(5,2),                   -- Census Tract Poverty Rate %
    qualifies_poverty BOOLEAN DEFAULT FALSE,     -- Poverty >= 20%?

    -- Median Family Income metrics
    mfi_pct DECIMAL(6,2),                        -- MFI as % of benchmark (e.g., 74 = 74%)
    qualifies_mfi BOOLEAN DEFAULT FALSE,         -- MFI <= 80%?

    -- Unemployment metrics
    unemployment_rate DECIMAL(5,2),              -- Census Tract Unemployment Rate %
    unemployment_ratio DECIMAL(5,2),             -- Ratio to national unemployment

    -- Geographic identifiers
    county_fips VARCHAR(5),                      -- 5-digit county FIPS
    state_name VARCHAR(50),
    county_name VARCHAR(100),

    -- Population
    population INTEGER,                          -- Population for poverty determination

    -- Special designations (for Scoring Engine)
    is_high_migration BOOLEAN DEFAULT FALSE,     -- High Migration County LIC tract
    is_severely_distressed BOOLEAN DEFAULT FALSE, -- LIC + (Poverty>30% OR MFI<=60% OR Unemp>=1.5x)
    is_deeply_distressed BOOLEAN DEFAULT FALSE,   -- LIC + (Poverty>40% AND MFI<=40% AND Unemp>=2.5x)

    -- Derived fields for Scoring Engine
    state_fips VARCHAR(2) GENERATED ALWAYS AS (SUBSTRING(geoid, 1, 2)) STORED,
    tract_fips VARCHAR(6) GENERATED ALWAYS AS (SUBSTRING(geoid, 6, 6)) STORED,

    -- Metadata
    data_source VARCHAR(100) DEFAULT 'CDFI Fund NMTC 2016-2020 ACS LIC 2025',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES for fast lookups
-- =============================================================================

-- Primary lookups
CREATE INDEX IF NOT EXISTS idx_nmtc_2025_state_fips ON nmtc_ct_data_2025(state_fips);
CREATE INDEX IF NOT EXISTS idx_nmtc_2025_county_fips ON nmtc_ct_data_2025(county_fips);
CREATE INDEX IF NOT EXISTS idx_nmtc_2025_state_name ON nmtc_ct_data_2025(state_name);

-- Eligibility filters (for Matching Engine)
CREATE INDEX IF NOT EXISTS idx_nmtc_2025_lic ON nmtc_ct_data_2025(is_lic_eligible)
    WHERE is_lic_eligible = TRUE;
CREATE INDEX IF NOT EXISTS idx_nmtc_2025_severely_distressed ON nmtc_ct_data_2025(is_severely_distressed)
    WHERE is_severely_distressed = TRUE;
CREATE INDEX IF NOT EXISTS idx_nmtc_2025_high_migration ON nmtc_ct_data_2025(is_high_migration)
    WHERE is_high_migration = TRUE;
CREATE INDEX IF NOT EXISTS idx_nmtc_2025_non_metro ON nmtc_ct_data_2025(is_non_metro)
    WHERE is_non_metro = TRUE;

-- Scoring lookups (compound for common queries)
CREATE INDEX IF NOT EXISTS idx_nmtc_2025_scoring ON nmtc_ct_data_2025(
    is_lic_eligible,
    is_severely_distressed,
    is_non_metro,
    is_high_migration
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE nmtc_ct_data_2025 ENABLE ROW LEVEL SECURITY;

-- Public read access (this is public census data)
CREATE POLICY "NMTC 2025 data is publicly readable"
    ON nmtc_ct_data_2025 FOR SELECT USING (true);

-- Service role full access for data loading
CREATE POLICY "Service role full access on nmtc_ct_data_2025"
    ON nmtc_ct_data_2025 FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON nmtc_ct_data_2025 TO anon, authenticated;

-- =============================================================================
-- RPC FUNCTION: Get tract data for scoring
-- =============================================================================

CREATE OR REPLACE FUNCTION get_nmtc_tract_for_scoring(p_geoid VARCHAR(11))
RETURNS TABLE (
    geoid VARCHAR(11),
    is_lic_eligible BOOLEAN,
    poverty_rate DECIMAL(5,2),
    mfi_pct DECIMAL(6,2),
    unemployment_rate DECIMAL(5,2),
    is_severely_distressed BOOLEAN,
    is_high_migration BOOLEAN,
    is_non_metro BOOLEAN,
    state_name VARCHAR(50),
    county_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.geoid,
        t.is_lic_eligible,
        t.poverty_rate,
        t.mfi_pct,
        t.unemployment_rate,
        t.is_severely_distressed,
        t.is_high_migration,
        t.is_non_metro,
        t.state_name,
        t.county_name
    FROM nmtc_ct_data_2025 t
    WHERE t.geoid = p_geoid;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_nmtc_tract_for_scoring TO anon, authenticated;

-- =============================================================================
-- RPC FUNCTION: Get eligible tracts by state (for Matching Engine)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_lic_tracts_by_state(
    p_state_name VARCHAR(50),
    p_severely_distressed_only BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    geoid VARCHAR(11),
    county_name VARCHAR(100),
    poverty_rate DECIMAL(5,2),
    mfi_pct DECIMAL(6,2),
    is_severely_distressed BOOLEAN,
    is_high_migration BOOLEAN,
    is_non_metro BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.geoid,
        t.county_name,
        t.poverty_rate,
        t.mfi_pct,
        t.is_severely_distressed,
        t.is_high_migration,
        t.is_non_metro
    FROM nmtc_ct_data_2025 t
    WHERE t.is_lic_eligible = TRUE
      AND TRIM(t.state_name) = p_state_name
      AND (NOT p_severely_distressed_only OR t.is_severely_distressed = TRUE)
    ORDER BY t.poverty_rate DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_lic_tracts_by_state TO anon, authenticated;

-- =============================================================================
-- VIEW: Summary statistics
-- =============================================================================

CREATE OR REPLACE VIEW nmtc_2025_summary AS
SELECT
    TRIM(state_name) as state,
    COUNT(*) as total_tracts,
    COUNT(*) FILTER (WHERE is_lic_eligible) as lic_eligible,
    COUNT(*) FILTER (WHERE is_severely_distressed) as severely_distressed,
    COUNT(*) FILTER (WHERE is_high_migration) as high_migration,
    COUNT(*) FILTER (WHERE is_non_metro) as non_metro,
    ROUND(AVG(poverty_rate), 1) as avg_poverty_rate,
    ROUND(AVG(mfi_pct), 1) as avg_mfi_pct
FROM nmtc_ct_data_2025
GROUP BY TRIM(state_name)
ORDER BY state;

GRANT SELECT ON nmtc_2025_summary TO anon, authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE nmtc_ct_data_2025 IS 'NMTC Census Tract Data 2025 - Official CDFI Fund SOT for LIC eligibility and distress scoring';
COMMENT ON COLUMN nmtc_ct_data_2025.geoid IS '11-digit FIPS code (2020 Census Tract)';
COMMENT ON COLUMN nmtc_ct_data_2025.is_lic_eligible IS 'Qualifies as NMTC Low-Income Community on poverty OR income criteria';
COMMENT ON COLUMN nmtc_ct_data_2025.is_severely_distressed IS 'LIC + (Poverty>30% OR MFI<=60% OR Unemployment>=1.5x national)';
COMMENT ON COLUMN nmtc_ct_data_2025.is_high_migration IS 'High Migration Rural County LIC tract per American Jobs Creation Act 2004';
COMMENT ON COLUMN nmtc_ct_data_2025.mfi_pct IS 'Median Family Income as percentage of area benchmark (74 = 74% of benchmark)';

COMMENT ON FUNCTION get_nmtc_tract_for_scoring IS 'Get tract data for Section C Scoring Engine';
COMMENT ON FUNCTION get_lic_tracts_by_state IS 'Get LIC-eligible tracts by state for CDE Matching Engine';
