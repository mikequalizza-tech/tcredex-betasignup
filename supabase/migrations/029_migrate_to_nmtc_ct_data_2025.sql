-- =============================================================================
-- Migration 029: Migrate to nmtc_ct_data_2025 SOT
-- =============================================================================
-- This migration:
-- 1. Creates new RPC functions that use nmtc_ct_data_2025 for distress data
-- 2. Drops the now-redundant nmtc_high_migration table
--
-- NOTE: master_tax_credit_sot is a VIEW, not a table.
-- We don't modify the view - instead we add new functions that pull
-- NMTC distress data directly from nmtc_ct_data_2025.
--
-- Prerequisites:
--   - Run migration 028 first to create nmtc_ct_data_2025
--   - Run load-nmtc-ct-data-2025.ts to populate the table
-- =============================================================================

-- =============================================================================
-- STEP 1: Create function to get NMTC distress data for scoring
-- =============================================================================
-- This function gets the full distress profile from nmtc_ct_data_2025
-- and enriches it with QCT/OZ data from master_tax_credit_sot

CREATE OR REPLACE FUNCTION get_nmtc_distress_for_scoring(p_geoid VARCHAR(11))
RETURNS TABLE (
    geoid VARCHAR(11),
    is_lic_eligible BOOLEAN,
    is_severely_distressed BOOLEAN,
    is_deeply_distressed BOOLEAN,
    is_high_migration BOOLEAN,
    is_non_metro BOOLEAN,
    poverty_rate DECIMAL(5,2),
    mfi_pct DECIMAL(6,2),
    unemployment_rate DECIMAL(5,2),
    unemployment_ratio DECIMAL(5,2),
    is_oz BOOLEAN,
    is_qct BOOLEAN,
    state_name VARCHAR(50),
    county_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.geoid,
        n.is_lic_eligible,
        n.is_severely_distressed,
        n.is_deeply_distressed,
        n.is_high_migration,
        n.is_non_metro,
        n.poverty_rate,
        n.mfi_pct,
        n.unemployment_rate,
        n.unemployment_ratio,
        COALESCE(m.is_oz_designated, false) as is_oz,
        COALESCE(m.is_lihtc_qct_2025, false) OR COALESCE(m.is_lihtc_qct_2026, false) as is_qct,
        n.state_name,
        n.county_name
    FROM nmtc_ct_data_2025 n
    LEFT JOIN master_tax_credit_sot m ON n.geoid = m.geoid
    WHERE n.geoid = p_geoid;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_nmtc_distress_for_scoring TO anon, authenticated;
COMMENT ON FUNCTION get_nmtc_distress_for_scoring IS 'Get NMTC distress data for Section C Scoring Engine. Source: nmtc_ct_data_2025';

-- =============================================================================
-- STEP 2: Create function to get eligible tracts by state for Matching Engine
-- =============================================================================

CREATE OR REPLACE FUNCTION get_lic_tracts_for_matching(
    p_state_name VARCHAR(50),
    p_severely_distressed_only BOOLEAN DEFAULT FALSE,
    p_high_migration_only BOOLEAN DEFAULT FALSE,
    p_non_metro_only BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    geoid VARCHAR(11),
    county_name VARCHAR(100),
    poverty_rate DECIMAL(5,2),
    mfi_pct DECIMAL(6,2),
    unemployment_rate DECIMAL(5,2),
    is_severely_distressed BOOLEAN,
    is_high_migration BOOLEAN,
    is_non_metro BOOLEAN,
    is_oz BOOLEAN,
    is_qct BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.geoid,
        n.county_name,
        n.poverty_rate,
        n.mfi_pct,
        n.unemployment_rate,
        n.is_severely_distressed,
        n.is_high_migration,
        n.is_non_metro,
        COALESCE(m.is_oz_designated, false) as is_oz,
        COALESCE(m.is_lihtc_qct_2025, false) OR COALESCE(m.is_lihtc_qct_2026, false) as is_qct
    FROM nmtc_ct_data_2025 n
    LEFT JOIN master_tax_credit_sot m ON n.geoid = m.geoid
    WHERE n.is_lic_eligible = TRUE
      AND TRIM(n.state_name) = p_state_name
      AND (NOT p_severely_distressed_only OR n.is_severely_distressed = TRUE)
      AND (NOT p_high_migration_only OR n.is_high_migration = TRUE)
      AND (NOT p_non_metro_only OR n.is_non_metro = TRUE)
    ORDER BY n.poverty_rate DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_lic_tracts_for_matching TO anon, authenticated;
COMMENT ON FUNCTION get_lic_tracts_for_matching IS 'Get LIC-eligible tracts for CDE Matching Engine with filters';

-- =============================================================================
-- STEP 3: Create function to get distress statistics for a list of tracts
-- =============================================================================

CREATE OR REPLACE FUNCTION get_tract_distress_stats(p_geoids VARCHAR(11)[])
RETURNS TABLE (
    total_tracts INTEGER,
    lic_eligible INTEGER,
    severely_distressed INTEGER,
    high_migration INTEGER,
    non_metro INTEGER,
    oz_designated INTEGER,
    qct_designated INTEGER,
    avg_poverty_rate DECIMAL(5,2),
    avg_mfi_pct DECIMAL(6,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_tracts,
        COUNT(*) FILTER (WHERE n.is_lic_eligible)::INTEGER as lic_eligible,
        COUNT(*) FILTER (WHERE n.is_severely_distressed)::INTEGER as severely_distressed,
        COUNT(*) FILTER (WHERE n.is_high_migration)::INTEGER as high_migration,
        COUNT(*) FILTER (WHERE n.is_non_metro)::INTEGER as non_metro,
        COUNT(*) FILTER (WHERE COALESCE(m.is_oz_designated, false))::INTEGER as oz_designated,
        COUNT(*) FILTER (WHERE COALESCE(m.is_lihtc_qct_2025, false) OR COALESCE(m.is_lihtc_qct_2026, false))::INTEGER as qct_designated,
        ROUND(AVG(n.poverty_rate), 2) as avg_poverty_rate,
        ROUND(AVG(n.mfi_pct), 2) as avg_mfi_pct
    FROM nmtc_ct_data_2025 n
    LEFT JOIN master_tax_credit_sot m ON n.geoid = m.geoid
    WHERE n.geoid = ANY(p_geoids);
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_tract_distress_stats TO anon, authenticated;
COMMENT ON FUNCTION get_tract_distress_stats IS 'Get aggregate distress statistics for a list of tracts';

-- =============================================================================
-- STEP 4: Drop nmtc_high_migration table (now redundant)
-- =============================================================================
-- The is_high_migration data is now in nmtc_ct_data_2025 as a column

DO $$
BEGIN
    -- Check if table exists before dropping
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nmtc_high_migration') THEN
        DROP TABLE nmtc_high_migration CASCADE;
        RAISE NOTICE 'Dropped nmtc_high_migration table (data now in nmtc_ct_data_2025.is_high_migration)';
    ELSE
        RAISE NOTICE 'nmtc_high_migration table does not exist, skipping drop';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop nmtc_high_migration: %', SQLERRM;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
    v_nmtc_count INTEGER;
    v_distressed_count INTEGER;
    v_high_migration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_nmtc_count
    FROM nmtc_ct_data_2025
    WHERE is_lic_eligible = true;

    SELECT COUNT(*) INTO v_distressed_count
    FROM nmtc_ct_data_2025
    WHERE is_severely_distressed = true;

    SELECT COUNT(*) INTO v_high_migration_count
    FROM nmtc_ct_data_2025
    WHERE is_high_migration = true;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 029 Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  NMTC LIC Eligible tracts: %', v_nmtc_count;
    RAISE NOTICE '  Severely Distressed tracts: %', v_distressed_count;
    RAISE NOTICE '  High Migration tracts: %', v_high_migration_count;
    RAISE NOTICE '';
    RAISE NOTICE 'New functions available:';
    RAISE NOTICE '  - get_nmtc_distress_for_scoring(geoid)';
    RAISE NOTICE '  - get_lic_tracts_for_matching(state, filters...)';
    RAISE NOTICE '  - get_tract_distress_stats(geoid[])';
END $$;
