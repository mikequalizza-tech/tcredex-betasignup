-- =============================================================================
-- tCredex Section C Scoring Engine - Database Schema
-- Migration: 006_section_c_scoring.sql
-- 
-- Canonical Source: docs/chatgpt-generated/SECTION_C_SCORING_ENGINE_FRAMEWORK.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SCORE TIER ENUM
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'score_tier') THEN
    CREATE TYPE score_tier AS ENUM (
      'TIER_1_GREENLIGHT',
      'TIER_2_WATCHLIST', 
      'TIER_3_DEFER'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. DEAL SCORES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  
  -- Total Score
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  tier score_tier NOT NULL,
  
  -- Pillar 1: Economic Distress (0-40)
  distress_total INTEGER NOT NULL CHECK (distress_total >= 0 AND distress_total <= 40),
  distress_breakdown JSONB NOT NULL DEFAULT '{}',
  distress_percentile DECIMAL(5,2) NOT NULL CHECK (distress_percentile >= 0 AND distress_percentile <= 100),
  
  -- Pillar 2: Impact Potential (0-35)
  impact_total INTEGER NOT NULL CHECK (impact_total >= 0 AND impact_total <= 35),
  impact_breakdown JSONB NOT NULL DEFAULT '{}',
  impact_percentile DECIMAL(5,2) NOT NULL CHECK (impact_percentile >= 0 AND impact_percentile <= 100),
  
  -- Pillar 3: Project Readiness (0-15)
  readiness_total INTEGER NOT NULL CHECK (readiness_total >= 0 AND readiness_total <= 15),
  readiness_breakdown JSONB NOT NULL DEFAULT '{}',
  readiness_percentile DECIMAL(5,2) NOT NULL CHECK (readiness_percentile >= 0 AND readiness_percentile <= 100),
  
  -- Pillar 4: Mission Fit (0-10)
  mission_fit_total INTEGER NOT NULL CHECK (mission_fit_total >= 0 AND mission_fit_total <= 10),
  mission_fit_breakdown JSONB NOT NULL DEFAULT '{}',
  mission_fit_cde_id UUID REFERENCES cdes(id),
  
  -- Eligibility Flags
  eligibility_flags JSONB NOT NULL DEFAULT '{}',
  -- Expected structure:
  -- {
  --   "nmtc_eligible": boolean,
  --   "severely_distressed": boolean,
  --   "qct": boolean,
  --   "opportunity_zone": boolean,
  --   "persistent_poverty_county": boolean,
  --   "non_metro": boolean,
  --   "underserved_state": boolean
  -- }
  
  -- Explainability
  reason_codes TEXT[] NOT NULL DEFAULT '{}',
  score_explanation TEXT,
  
  -- Model Version (for reproducibility)
  model_version VARCHAR(20) NOT NULL,
  
  -- Input Snapshot (for audit)
  input_snapshot JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One score per deal (latest)
  UNIQUE(deal_id)
);

-- -----------------------------------------------------------------------------
-- 3. SCORE HISTORY TABLE (for tracking changes over time)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  score_snapshot JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL,
  model_version VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. SCORE OVERRIDES TABLE (human-in-the-loop)
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'override_reason_code') THEN
    CREATE TYPE override_reason_code AS ENUM (
      'LOCAL_KNOWLEDGE',
      'DATA_ERROR',
      'TIMING_ISSUE',
      'PROGRAM_SPECIFIC',
      'OTHER'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS score_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_score_id UUID NOT NULL REFERENCES deal_scores(id) ON DELETE CASCADE,
  original_tier score_tier NOT NULL,
  new_tier score_tier NOT NULL,
  reason_code override_reason_code NOT NULL,
  justification TEXT NOT NULL,
  overridden_by UUID NOT NULL REFERENCES users(id),
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Approval chain (optional)
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. CDE MATCHING CRITERIA TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cde_match_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cde_id UUID NOT NULL REFERENCES cdes(id) ON DELETE CASCADE,
  
  -- Target sectors (array of project types)
  target_sectors TEXT[] NOT NULL DEFAULT '{}',
  
  -- Target geography
  target_states TEXT[] NOT NULL DEFAULT '{}',
  target_counties TEXT[] DEFAULT NULL,
  is_national BOOLEAN DEFAULT false,
  
  -- Deal size preferences
  min_deal_size INTEGER,
  max_deal_size INTEGER,
  typical_deal_size INTEGER,
  
  -- Priority flags
  priority_severely_distressed BOOLEAN DEFAULT true,
  priority_non_metro BOOLEAN DEFAULT false,
  priority_persistent_poverty BOOLEAN DEFAULT false,
  priority_opportunity_zone BOOLEAN DEFAULT false,
  
  -- Weights (optional customization)
  weight_distress DECIMAL(3,2) DEFAULT 1.0,
  weight_impact DECIMAL(3,2) DEFAULT 1.0,
  weight_readiness DECIMAL(3,2) DEFAULT 1.0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(cde_id)
);

-- -----------------------------------------------------------------------------
-- 6. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_deal_scores_deal_id ON deal_scores(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_scores_tier ON deal_scores(tier);
CREATE INDEX IF NOT EXISTS idx_deal_scores_total_score ON deal_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_deal_scores_computed_at ON deal_scores(computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_scores_eligibility ON deal_scores USING GIN (eligibility_flags);
CREATE INDEX IF NOT EXISTS idx_deal_scores_reason_codes ON deal_scores USING GIN (reason_codes);

CREATE INDEX IF NOT EXISTS idx_deal_score_history_deal_id ON deal_score_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_score_history_computed_at ON deal_score_history(computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_score_overrides_deal_score ON score_overrides(deal_score_id);
CREATE INDEX IF NOT EXISTS idx_score_overrides_overridden_by ON score_overrides(overridden_by);

CREATE INDEX IF NOT EXISTS idx_cde_match_criteria_cde ON cde_match_criteria(cde_id);
CREATE INDEX IF NOT EXISTS idx_cde_match_criteria_states ON cde_match_criteria USING GIN (target_states);
CREATE INDEX IF NOT EXISTS idx_cde_match_criteria_sectors ON cde_match_criteria USING GIN (target_sectors);

-- -----------------------------------------------------------------------------
-- 7. TRIGGERS
-- -----------------------------------------------------------------------------

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_deal_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_scores_updated_at
  BEFORE UPDATE ON deal_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_scores_updated_at();

-- Archive score to history before update
CREATE OR REPLACE FUNCTION archive_score_to_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO deal_score_history (deal_id, score_snapshot, computed_at, model_version)
  VALUES (
    OLD.deal_id,
    jsonb_build_object(
      'total_score', OLD.total_score,
      'tier', OLD.tier,
      'distress_total', OLD.distress_total,
      'distress_breakdown', OLD.distress_breakdown,
      'impact_total', OLD.impact_total,
      'impact_breakdown', OLD.impact_breakdown,
      'readiness_total', OLD.readiness_total,
      'readiness_breakdown', OLD.readiness_breakdown,
      'mission_fit_total', OLD.mission_fit_total,
      'mission_fit_breakdown', OLD.mission_fit_breakdown,
      'eligibility_flags', OLD.eligibility_flags,
      'reason_codes', OLD.reason_codes
    ),
    OLD.computed_at,
    OLD.model_version
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_score_history
  BEFORE UPDATE ON deal_scores
  FOR EACH ROW
  WHEN (OLD.total_score IS DISTINCT FROM NEW.total_score)
  EXECUTE FUNCTION archive_score_to_history();

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE deal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE cde_match_criteria ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service full access on deal_scores"
  ON deal_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service full access on deal_score_history"
  ON deal_score_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service full access on score_overrides"
  ON score_overrides FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service full access on cde_match_criteria"
  ON cde_match_criteria FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read scores
CREATE POLICY "Authenticated can read deal_scores"
  ON deal_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read score_history"
  ON deal_score_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read cde_match_criteria"
  ON cde_match_criteria FOR SELECT
  TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 9. VIEWS
-- -----------------------------------------------------------------------------

-- Tier summary view
CREATE OR REPLACE VIEW tier_summary AS
SELECT 
  tier,
  COUNT(*) as deal_count,
  AVG(total_score) as avg_score,
  MIN(total_score) as min_score,
  MAX(total_score) as max_score,
  AVG(distress_total) as avg_distress,
  AVG(impact_total) as avg_impact,
  AVG(readiness_total) as avg_readiness
FROM deal_scores
GROUP BY tier
ORDER BY 
  CASE tier 
    WHEN 'TIER_1_GREENLIGHT' THEN 1 
    WHEN 'TIER_2_WATCHLIST' THEN 2 
    ELSE 3 
  END;

-- Top deals view
CREATE OR REPLACE VIEW top_scored_deals AS
SELECT 
  ds.deal_id,
  d.project_name,
  d.sponsor_name,
  d.state,
  d.census_tract,
  ds.total_score,
  ds.tier,
  ds.distress_total,
  ds.impact_total,
  ds.readiness_total,
  ds.mission_fit_total,
  ds.reason_codes,
  ds.computed_at
FROM deal_scores ds
JOIN deals d ON ds.deal_id = d.id
ORDER BY 
  CASE ds.tier 
    WHEN 'TIER_1_GREENLIGHT' THEN 1 
    WHEN 'TIER_2_WATCHLIST' THEN 2 
    ELSE 3 
  END,
  ds.total_score DESC
LIMIT 100;

-- -----------------------------------------------------------------------------
-- 10. COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE deal_scores IS 'Section C 4-pillar scoring results for each deal';
COMMENT ON TABLE deal_score_history IS 'Historical score snapshots for audit trail';
COMMENT ON TABLE score_overrides IS 'Human-in-the-loop tier adjustments with justification';
COMMENT ON TABLE cde_match_criteria IS 'CDE-specific matching preferences for Mission Fit scoring';
COMMENT ON COLUMN deal_scores.distress_percentile IS 'Normalized distress score as percentage (0-100)';
COMMENT ON COLUMN deal_scores.impact_percentile IS 'Normalized impact score as percentage (0-100)';
COMMENT ON COLUMN deal_scores.reason_codes IS 'Machine-readable codes explaining score factors';
COMMENT ON COLUMN deal_scores.input_snapshot IS 'Complete input data snapshot for reproducibility';
