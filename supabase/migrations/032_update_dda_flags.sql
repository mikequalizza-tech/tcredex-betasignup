-- =============================================================================
-- Migration 032: Update master_tax_credit_sot with DDA flags
-- =============================================================================
-- This migration populates is_dda_2025 and is_dda_2026 by:
--   1. Non-Metro: Match County FIPS (first 5 digits of GEOID)
--   2. Metro: Match ZIP via zip_tract_crosswalk table
--
-- IMPORTANT: Run this AFTER loading data into dda_metro_* and dda_nonmetro_* tables
-- =============================================================================

-- =============================================================================
-- STEP 1: Update 2025 DDA flags
-- =============================================================================

-- First, reset all DDA flags to FALSE
UPDATE master_tax_credit_sot SET is_dda_2025 = FALSE;

-- Non-Metro DDA 2025: Match by County FIPS (first 5 digits of GEOID)
-- GEOID format: SS CCC TTTTTT (2 state + 3 county + 6 tract)
-- County FIPS = first 5 digits
UPDATE master_tax_credit_sot m
SET is_dda_2025 = TRUE
FROM dda_nonmetro_2025 d
WHERE SUBSTRING(m.geoid, 1, 5) = d.county_fips;

-- Metro DDA 2025: Match by ZIP via crosswalk
-- Uses zip_tract_crosswalk to map tract (GEOID) → ZIP → DDA
UPDATE master_tax_credit_sot m
SET is_dda_2025 = TRUE
FROM zip_tract_crosswalk z
JOIN dda_metro_2025 d ON z.zip = d.zcta
WHERE m.geoid = z.tract
  AND m.is_dda_2025 = FALSE;  -- Don't overwrite if already TRUE from NMDDA

-- =============================================================================
-- STEP 2: Update 2026 DDA flags
-- =============================================================================

-- Reset 2026 flags
UPDATE master_tax_credit_sot SET is_dda_2026 = FALSE;

-- Non-Metro DDA 2026: Match by County FIPS
UPDATE master_tax_credit_sot m
SET is_dda_2026 = TRUE
FROM dda_nonmetro_2026 d
WHERE SUBSTRING(m.geoid, 1, 5) = d.county_fips;

-- Metro DDA 2026: Match by ZIP via crosswalk
UPDATE master_tax_credit_sot m
SET is_dda_2026 = TRUE
FROM zip_tract_crosswalk z
JOIN dda_metro_2026 d ON z.zip = d.zcta
WHERE m.geoid = z.tract
  AND m.is_dda_2026 = FALSE;

-- =============================================================================
-- STEP 3: Verification queries
-- =============================================================================

-- Run these to verify the update worked correctly:

-- Count DDAs by year
-- SELECT
--     COUNT(*) FILTER (WHERE is_dda_2025) as dda_2025_tracts,
--     COUNT(*) FILTER (WHERE is_dda_2026) as dda_2026_tracts,
--     COUNT(*) FILTER (WHERE is_dda_2025 AND is_lihtc_qct_2025) as qct_plus_dda_2025,
--     COUNT(*) FILTER (WHERE is_dda_2026 AND is_lihtc_qct_2026) as qct_plus_dda_2026
-- FROM master_tax_credit_sot;

-- Sample of QCT + DDA combos (these get the 30% boost)
-- SELECT geoid, state_name, county_name, is_lihtc_qct_2025, is_dda_2025
-- FROM master_tax_credit_sot
-- WHERE is_lihtc_qct_2025 = TRUE AND is_dda_2025 = TRUE
-- LIMIT 20;

-- =============================================================================
-- STEP 4: Update stack_score to include DDA
-- =============================================================================

-- Recalculate stack_score to include DDA (counts as additional program benefit)
UPDATE master_tax_credit_sot
SET stack_score = (
    CASE WHEN is_nmtc_eligible THEN 1 ELSE 0 END +
    CASE WHEN is_nmtc_high_migration THEN 1 ELSE 0 END +
    CASE WHEN is_lihtc_qct_2025 THEN 1 ELSE 0 END +
    CASE WHEN is_lihtc_qct_2026 THEN 1 ELSE 0 END +
    CASE WHEN is_oz_designated THEN 1 ELSE 0 END +
    CASE WHEN is_dda_2025 AND is_lihtc_qct_2025 THEN 1 ELSE 0 END +  -- DDA only counts if QCT
    CASE WHEN is_dda_2026 AND is_lihtc_qct_2026 THEN 1 ELSE 0 END    -- DDA only counts if QCT
);

-- =============================================================================
-- DONE
-- =============================================================================
-- DDA flags are now populated in master_tax_credit_sot
--
-- Display logic in UI:
--   IF is_lihtc_qct_2025 AND is_dda_2025 THEN show "LIHTC QCT + DDA 30% Boost"
--   IF is_lihtc_qct_2026 AND is_dda_2026 THEN show "LIHTC QCT + DDA 30% Boost"
-- =============================================================================
