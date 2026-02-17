-- =============================================================================
-- Migration 030: Build master_tax_credit_sot from SOT tables
-- =============================================================================
-- Merges all SOT data into ONE unified table
-- =============================================================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop if exists (start fresh)
DROP TABLE IF EXISTS master_tax_credit_sot CASCADE;

-- =============================================================================
-- Create the unified table by joining all SOT sources
-- =============================================================================

CREATE TABLE master_tax_credit_sot AS
SELECT
    -- Primary Key
    g.geoid,

    -- GEOMETRY (from tract_geometries)
    g.geometry AS geom,
    g.geometry_simplified AS geom_simplified,
    ST_Y(ST_Centroid(g.geometry)) AS centroid_lat,
    ST_X(ST_Centroid(g.geometry)) AS centroid_lng,

    -- LOCATION
    SUBSTRING(g.geoid, 1, 2) AS state_fips,
    SUBSTRING(g.geoid, 3, 3) AS county_fips,
    SUBSTRING(g.geoid, 6, 6) AS tract_fips,
    TRIM(n.state_name) AS state_name,
    n.county_name,
    n.metro_status,

    -- FEDERAL NMTC (from nmtc_ct_data_2025)
    COALESCE(n.is_lic_eligible, FALSE) AS is_nmtc_eligible,
    COALESCE(n.is_high_migration, FALSE) AS is_nmtc_high_migration,
    n.poverty_rate AS nmtc_poverty_rate,
    n.mfi_pct AS nmtc_mfi_percent,
    n.unemployment_rate AS nmtc_unemployment_rate,
    COALESCE(n.is_severely_distressed, FALSE) AS is_severely_distressed,

    -- FEDERAL LIHTC QCT (from lihtc_qct tables)
    COALESCE(q25.qct = '1' OR UPPER(q25.qct) = 'YES' OR q25.qct = 'true', FALSE) AS is_lihtc_qct_2025,
    COALESCE(q26.is_qct, FALSE) AS is_lihtc_qct_2026,

    -- FEDERAL OPPORTUNITY ZONE (from opportunity_zones_staging)
    CASE WHEN oz."GEOID" IS NOT NULL THEN TRUE ELSE FALSE END AS is_oz_designated,

    -- STATE PROGRAMS (from state_tax_credit_programs_staging)
    -- These are text fields like 'Yes'/'No', convert to boolean
    CASE WHEN UPPER(TRIM(sp.state_nmtc)) = 'YES' THEN TRUE ELSE FALSE END AS has_state_nmtc,
    CASE WHEN UPPER(TRIM(sp.state_lihtc)) = 'YES' THEN TRUE ELSE FALSE END AS has_state_lihtc,
    CASE WHEN UPPER(TRIM(sp.state_htc)) = 'YES' THEN TRUE ELSE FALSE END AS has_state_htc,
    CASE WHEN UPPER(TRIM(sp.oz_to_fed)) = 'YES' THEN TRUE ELSE FALSE END AS has_state_oz_conformity,
    CASE WHEN UPPER(TRIM(sp.brownfield_credit)) = 'YES' THEN TRUE ELSE FALSE END AS has_brownfield_credit,

    -- STACK SCORE (count of federal programs)
    (
        CASE WHEN COALESCE(n.is_lic_eligible, FALSE) THEN 1 ELSE 0 END +
        CASE WHEN COALESCE(n.is_high_migration, FALSE) THEN 1 ELSE 0 END +
        CASE WHEN COALESCE(q25.qct = '1' OR UPPER(q25.qct) = 'YES' OR q25.qct = 'true', FALSE) THEN 1 ELSE 0 END +
        CASE WHEN COALESCE(q26.is_qct, FALSE) THEN 1 ELSE 0 END +
        CASE WHEN oz."GEOID" IS NOT NULL THEN 1 ELSE 0 END
    ) AS stack_score,

    -- METADATA
    NOW() AS created_at,
    NOW() AS updated_at

FROM tract_geometries g
LEFT JOIN nmtc_ct_data_2025 n ON g.geoid = n.geoid
LEFT JOIN lihtc_qct_2025 q25 ON g.geoid = q25.geoid
LEFT JOIN lihtc_qct_2026 q26 ON g.geoid = q26.geoid
LEFT JOIN opportunity_zones_staging oz ON g.geoid = oz."GEOID"
LEFT JOIN state_tax_credit_programs_staging sp ON TRIM(n.state_name) = TRIM(sp.state_name);

-- =============================================================================
-- Add Primary Key constraint
-- =============================================================================

ALTER TABLE master_tax_credit_sot ADD PRIMARY KEY (geoid);

-- =============================================================================
-- Create Indexes
-- =============================================================================

CREATE INDEX idx_master_sot_geom ON master_tax_credit_sot USING GIST(geom);
CREATE INDEX idx_master_sot_geom_simp ON master_tax_credit_sot USING GIST(geom_simplified);
CREATE INDEX idx_master_sot_state ON master_tax_credit_sot(state_fips);
CREATE INDEX idx_master_sot_state_name ON master_tax_credit_sot(state_name);
CREATE INDEX idx_master_sot_nmtc ON master_tax_credit_sot(is_nmtc_eligible) WHERE is_nmtc_eligible = TRUE;
CREATE INDEX idx_master_sot_qct_2025 ON master_tax_credit_sot(is_lihtc_qct_2025) WHERE is_lihtc_qct_2025 = TRUE;
CREATE INDEX idx_master_sot_qct_2026 ON master_tax_credit_sot(is_lihtc_qct_2026) WHERE is_lihtc_qct_2026 = TRUE;
CREATE INDEX idx_master_sot_oz ON master_tax_credit_sot(is_oz_designated) WHERE is_oz_designated = TRUE;
CREATE INDEX idx_master_sot_distressed ON master_tax_credit_sot(is_severely_distressed) WHERE is_severely_distressed = TRUE;
CREATE INDEX idx_master_sot_state_nmtc ON master_tax_credit_sot(has_state_nmtc) WHERE has_state_nmtc = TRUE;
CREATE INDEX idx_master_sot_state_htc ON master_tax_credit_sot(has_state_htc) WHERE has_state_htc = TRUE;

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE master_tax_credit_sot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Census tract data is publicly readable"
    ON master_tax_credit_sot FOR SELECT USING (true);

-- =============================================================================
-- Grants
-- =============================================================================

GRANT SELECT ON master_tax_credit_sot TO anon, authenticated;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE master_tax_credit_sot IS 'MASTER SOURCE OF TRUTH - Unified table with geometry + all tax credit eligibility for 85K+ census tracts';
