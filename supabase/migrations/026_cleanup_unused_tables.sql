-- =============================================================================
-- Migration 026: Cleanup Unused/Temp Tables
-- =============================================================================
-- Run this AFTER confirming you have backups if needed
-- These tables are not referenced in the codebase
-- =============================================================================

-- Temp/staging tables (safe to delete)
DROP TABLE IF EXISTS lihtc_qct_temp CASCADE;
DROP TABLE IF EXISTS oz_temp CASCADE;
DROP TABLE IF EXISTS state_stackability_temp CASCADE;
DROP TABLE IF EXISTS opportunity_zones_staging CASCADE;

-- Backup tables (safe to delete)
DROP TABLE IF EXISTS census_tracts_geom_backup CASCADE;

-- Old/replaced tables (data merged into master_tax_credit_sot)
DROP TABLE IF EXISTS nmtc_census_tracts CASCADE;
DROP TABLE IF EXISTS census_tracts CASCADE;

-- =============================================================================
-- KEEP these (DO NOT DELETE):
-- =============================================================================
-- tract_geometries          - Geometry SOT
-- master_tax_credit_sot     - Eligibility SOT
-- tract_map_layer           - Map view
-- dda_2025, dda_2026        - DDA SOT
-- lihtc_qct_2025, lihtc_qct_2026 - QCT SOT
-- nmtc_high_migration       - High migration SOT
-- state_tax_credit_programs_staging - State credits SOT
-- state_fips_lookup         - Reference
-- zip_tract_crosswalk       - ZIP lookup
-- spatial_ref_sys           - PostGIS (system)
-- geometry_columns          - PostGIS (system)
-- geography_columns         - PostGIS (system)
--
-- FUTURE USE (not wired yet but needed):
-- cde_summary               - CDE analytics
-- deal_cards                - Generated deal cards
-- project_assignments       - Deal-to-user assignments
-- team_members              - Org team members
-- =============================================================================

-- Verify cleanup
DO $$
BEGIN
  RAISE NOTICE 'Cleanup complete. Removed temp/unused tables.';
END $$;
