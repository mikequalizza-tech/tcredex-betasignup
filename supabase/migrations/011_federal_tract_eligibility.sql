-- Migration: 011_federal_tract_eligibility.sql
-- Populates federal_tract_eligibility table from NMTC Stackability data
-- Source: NMTC_Stackability_by_Tract_and_State_2020_ACS_20251202.xlsx
-- Total records: 85,395
-- NOTE: Due to size (8.77 MB), this file is generated. Run data loader script instead.

-- Data loader script: Use the Python loader or psql COPY command
-- See: scripts/load_federal_tract_eligibility.py

-- Sample INSERT format for reference:
INSERT INTO federal_tract_eligibility (
  geoid, state_name, county_name,
  is_nmtc_lic, poverty_rate_pct, poverty_qualifies, mfi_pct, mfi_qualifies,
  unemployment_rate_pct, unemployment_qualifies
) VALUES
  ('01001020100', 'Alabama', 'Autauga County', FALSE, 13.7, FALSE, 1.037936, FALSE, 2.1, FALSE),
  ('01001020200', 'Alabama', 'Autauga County', TRUE, 17.0, FALSE, 0.736005, TRUE, 4.0, FALSE);
-- ... 85,393 more rows

-- To load full data, use the generated SQL file at:
-- /home/claude/011_federal_tract_eligibility.sql
-- Or run: psql -d your_database -f 011_federal_tract_eligibility_full.sql
