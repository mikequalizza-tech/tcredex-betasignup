-- ============================================
-- DEAL PIPELINE ENHANCEMENT
-- Creates deal_relationships table for unified pipeline tracking
-- ============================================

-- NOTE: outreach_requests table is optional (was Supabase-only)
-- The deal_relationships table replaces it as the unified source of truth

-- ============================================
-- 2. CREATE relationship_status enum type
-- ============================================

DO $$ BEGIN
  CREATE TYPE relationship_status AS ENUM (
    'contacted',        -- Initial outreach sent
    'viewed',           -- Recipient viewed/opened
    'in_review',        -- Under consideration
    'interested',       -- Expressed interest
    'verbal_approval',  -- Verbal commitment
    'loi_issued',       -- LOI sent
    'loi_accepted',     -- LOI signed by all parties
    'committed',        -- Commitment letter signed
    'closing',          -- In closing process
    'closed',           -- Deal closed
    'denied',           -- Declined at any stage
    'withdrawn',        -- Sponsor withdrew
    'expired'           -- Timed out
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. CREATE deal_relationships table
-- Single source of truth for all CDE/Investor relationships
-- ============================================

CREATE TABLE IF NOT EXISTS deal_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identifiers
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('cde', 'investor')),
  target_id UUID NOT NULL,
  target_org_id UUID,
  target_name VARCHAR(255) NOT NULL,

  -- Pipeline status (unified across all stages)
  status relationship_status NOT NULL DEFAULT 'contacted',
  status_note TEXT,

  -- Match data (from AutoMatch)
  match_score INT,
  match_strength VARCHAR(20),
  match_reasons TEXT[],

  -- Linked records (for detailed data, no FK - tables may not exist)
  outreach_id UUID,  -- Optional link to match_requests if needed later
  loi_id UUID,       -- Optional link to letters_of_intent
  commitment_id UUID, -- Optional link to commitments

  -- Communication tracking
  last_message TEXT,
  last_contact_at TIMESTAMPTZ,
  next_action TEXT,
  next_action_due TIMESTAMPTZ,

  -- Allocation tracking
  requested_amount DECIMAL(15,2),
  committed_amount DECIMAL(15,2),

  -- Timestamps
  contacted_at TIMESTAMPTZ DEFAULT NOW(),
  interested_at TIMESTAMPTZ,
  verbal_approval_at TIMESTAMPTZ,
  loi_issued_at TIMESTAMPTZ,
  loi_accepted_at TIMESTAMPTZ,
  committed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  denied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_deal_target UNIQUE (deal_id, target_type, target_id)
);

-- ============================================
-- 4. CREATE deal_relationship_history table
-- Audit trail for status changes
-- ============================================

CREATE TABLE IF NOT EXISTS deal_relationship_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES deal_relationships(id) ON DELETE CASCADE,
  from_status relationship_status,
  to_status relationship_status NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_deal_rel_deal_id ON deal_relationships(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_rel_target ON deal_relationships(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_deal_rel_status ON deal_relationships(status);
CREATE INDEX IF NOT EXISTS idx_deal_rel_org ON deal_relationships(target_org_id);
CREATE INDEX IF NOT EXISTS idx_deal_rel_history_rel ON deal_relationship_history(relationship_id);

-- ============================================
-- 6. ROW LEVEL SECURITY (simplified - add policies later based on your auth setup)
-- ============================================

-- NOTE: RLS policies commented out - they depend on organizations/users tables
-- that may not exist or have different structure. Add custom policies as needed.

-- ALTER TABLE deal_relationships ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deal_relationship_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. TRIGGER for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_deal_relationship_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deal_relationship_updated ON deal_relationships;
CREATE TRIGGER deal_relationship_updated
  BEFORE UPDATE ON deal_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_relationship_timestamp();

-- ============================================
-- 8. TRIGGER for status history logging
-- ============================================

CREATE OR REPLACE FUNCTION log_deal_relationship_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO deal_relationship_history (relationship_id, from_status, to_status, notes)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.status_note);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deal_relationship_status_changed ON deal_relationships;
CREATE TRIGGER deal_relationship_status_changed
  AFTER UPDATE ON deal_relationships
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_relationship_status_change();

-- ============================================
-- 9. VIEW for pipeline summary
-- ============================================

CREATE OR REPLACE VIEW deal_pipeline_summary AS
SELECT
  deal_id,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted_count,
  COUNT(*) FILTER (WHERE status IN ('viewed', 'in_review')) as reviewing_count,
  COUNT(*) FILTER (WHERE status = 'interested') as interested_count,
  COUNT(*) FILTER (WHERE status = 'verbal_approval') as verbal_count,
  COUNT(*) FILTER (WHERE status IN ('loi_issued', 'loi_accepted')) as loi_count,
  COUNT(*) FILTER (WHERE status IN ('committed', 'closing')) as committed_count,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
  COUNT(*) FILTER (WHERE status = 'denied') as denied_count,
  COUNT(*) FILTER (WHERE target_type = 'cde') as cde_count,
  COUNT(*) FILTER (WHERE target_type = 'investor') as investor_count,
  COALESCE(SUM(committed_amount), 0) as total_committed
FROM deal_relationships
GROUP BY deal_id;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE deal_relationships IS 'Unified tracking of all CDE/Investor relationships for each deal through the full pipeline';
COMMENT ON TABLE deal_relationship_history IS 'Audit trail of status changes for deal relationships';
COMMENT ON VIEW deal_pipeline_summary IS 'Aggregated pipeline metrics per deal';
COMMENT ON COLUMN deal_relationships.status IS 'Current pipeline stage: contacted → interested → verbal_approval → loi_issued → loi_accepted → committed → closing → closed';
