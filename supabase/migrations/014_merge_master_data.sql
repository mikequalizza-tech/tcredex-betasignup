-- =============================================================================
-- MERGE DATA INTO MASTER CENSUS_TRACTS TABLE
-- =============================================================================
-- Run this AFTER:
--   1. Running 013_master_census_tracts.sql
--   2. Importing State_Tax_Credit_Programs_Combined_2025_With_Stacking.csv
--   3. Importing Opportunity_Zones_TC.csv
-- =============================================================================

-- =============================================================================
-- STEP 1: Update state_name from FIPS lookup
-- =============================================================================

UPDATE census_tracts ct
SET state_name = sl.state_name
FROM state_fips_lookup sl
WHERE ct.state_fips = sl.fips
  AND ct.state_name IS NULL;

-- Verify
SELECT state_fips, state_name, COUNT(*) as tract_count
FROM census_tracts
GROUP BY state_fips, state_name
ORDER BY state_fips
LIMIT 10;

-- =============================================================================
-- STEP 2: Merge LIHTC QCT data from lihtc_qct_2025 table
-- =============================================================================

UPDATE census_tracts ct
SET
    is_lihtc_qct = TRUE,
    lihtc_designation_year = 2025
FROM lihtc_qct_2025 lq
WHERE ct.geoid = lq.geoid;

-- Verify
SELECT COUNT(*) as lihtc_qct_count FROM census_tracts WHERE is_lihtc_qct = TRUE;

-- =============================================================================
-- STEP 3: Merge Opportunity Zone data from staging
-- =============================================================================

UPDATE census_tracts ct
SET
    is_oz_designated = TRUE,
    oz_designation_year = 2018
FROM opportunity_zones_staging oz
WHERE ct.geoid = oz.geoid;

-- Verify
SELECT COUNT(*) as oz_count FROM census_tracts WHERE is_oz_designated = TRUE;

-- =============================================================================
-- STEP 4: Merge State Tax Credit Programs (expanded by state)
-- =============================================================================
-- This expands state-level data to ALL tracts in that state

UPDATE census_tracts ct
SET
    has_state_nmtc = COALESCE(stp.state_nmtc, FALSE),
    state_nmtc_transferable = COALESCE(stp.state_nmtc_transferable, FALSE),
    has_state_lihtc = COALESCE(stp.state_lihtc, FALSE),
    has_state_htc = COALESCE(stp.state_htc, FALSE),
    state_htc_transferable = COALESCE(stp.state_htc_transferable, FALSE),
    state_htc_refundable = COALESCE(stp.state_htc_refundable, FALSE),
    has_state_oz_conformity = COALESCE(stp.oz_federal_conformity, FALSE),
    has_brownfield_credit = COALESCE(stp.brownfield_credit, FALSE)
FROM state_tax_credit_programs_staging stp
WHERE ct.state_name = stp.state_name;

-- Verify
SELECT
    state_name,
    COUNT(*) as tract_count,
    SUM(CASE WHEN has_state_nmtc THEN 1 ELSE 0 END) as with_state_nmtc,
    SUM(CASE WHEN has_state_htc THEN 1 ELSE 0 END) as with_state_htc,
    SUM(CASE WHEN has_brownfield_credit THEN 1 ELSE 0 END) as with_brownfield
FROM census_tracts
WHERE state_name IN ('Illinois', 'Louisiana', 'New York', 'California')
GROUP BY state_name;

-- =============================================================================
-- STEP 5: Update timestamps
-- =============================================================================

UPDATE census_tracts SET updated_at = NOW();

-- =============================================================================
-- STEP 6: Create summary view for quick stats
-- =============================================================================

DROP VIEW IF EXISTS census_tracts_summary;

CREATE VIEW census_tracts_summary AS
SELECT
    state_name,
    COUNT(*) as total_tracts,
    SUM(CASE WHEN is_lihtc_qct THEN 1 ELSE 0 END) as lihtc_qct_tracts,
    SUM(CASE WHEN is_oz_designated THEN 1 ELSE 0 END) as oz_tracts,
    SUM(CASE WHEN has_state_nmtc THEN 1 ELSE 0 END) as state_nmtc_tracts,
    SUM(CASE WHEN has_state_htc THEN 1 ELSE 0 END) as state_htc_tracts,
    SUM(CASE WHEN has_brownfield_credit THEN 1 ELSE 0 END) as brownfield_tracts
FROM census_tracts
GROUP BY state_name
ORDER BY state_name;

GRANT SELECT ON census_tracts_summary TO anon, authenticated;

-- =============================================================================
-- STEP 7: Final verification
-- =============================================================================

SELECT
    'Total Tracts' as metric, COUNT(*)::text as value FROM census_tracts
UNION ALL
SELECT
    'Tracts with Geometry', COUNT(*)::text FROM census_tracts WHERE geom IS NOT NULL
UNION ALL
SELECT
    'LIHTC QCT Tracts', COUNT(*)::text FROM census_tracts WHERE is_lihtc_qct = TRUE
UNION ALL
SELECT
    'Opportunity Zone Tracts', COUNT(*)::text FROM census_tracts WHERE is_oz_designated = TRUE
UNION ALL
SELECT
    'State NMTC Tracts', COUNT(*)::text FROM census_tracts WHERE has_state_nmtc = TRUE
UNION ALL
SELECT
    'State HTC Tracts', COUNT(*)::text FROM census_tracts WHERE has_state_htc = TRUE
UNION ALL
SELECT
    'Brownfield Credit Tracts', COUNT(*)::text FROM census_tracts WHERE has_brownfield_credit = TRUE;

-- =============================================================================
-- DONE!
-- =============================================================================
-- The census_tracts table is now the MASTER SOURCE OF TRUTH with:
--   - geoid (Primary Key)
--   - geom (PostGIS geometry)
--   - is_lihtc_qct (from lihtc_qct_2025)
--   - is_oz_designated (from Opportunity_Zones_TC.csv)
--   - has_state_nmtc, has_state_htc, has_brownfield_credit (from State_Tax_Credit_Programs CSV)
--
-- Use this single table for ALL map rendering and eligibility lookups!
-- =============================================================================
