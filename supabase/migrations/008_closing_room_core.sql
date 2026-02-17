-- =============================================================================
-- tCredex Closing Room Core Table
-- Migration: 008_closing_room_core.sql
-- 
-- Creates the closing_rooms table that orchestrates the closing process
-- Triggered when Commitment reaches 'all_accepted' status
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CLOSING ROOM STATUS ENUM
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'closing_room_status') THEN
    CREATE TYPE closing_room_status AS ENUM (
      'pending',      -- Created but not yet active
      'active',       -- In progress
      'on_hold',      -- Paused (issue to resolve)
      'closing',      -- Final docs being executed
      'closed',       -- Successfully closed
      'terminated'    -- Cancelled / fell through
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. CLOSING ROOMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS closing_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Relationships
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES commitments(id),
  loi_id UUID REFERENCES letters_of_intent(id),
  
  -- Status
  status closing_room_status NOT NULL DEFAULT 'pending',
  
  -- Participants
  sponsor_id UUID REFERENCES users(id),
  cde_id UUID REFERENCES cdes(id),
  investor_id UUID REFERENCES investors(id),
  
  -- Key Dates
  opened_at TIMESTAMPTZ,
  target_close_date DATE,
  actual_close_date DATE,
  terminated_at TIMESTAMPTZ,
  
  -- Financial Summary (snapshot at opening)
  allocation_amount DECIMAL(15,2),
  investment_amount DECIMAL(15,2),
  credit_type VARCHAR(20),
  
  -- Progress Tracking
  checklist_total INTEGER DEFAULT 0,
  checklist_complete INTEGER DEFAULT 0,
  checklist_pct DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN checklist_total > 0 
         THEN (checklist_complete::DECIMAL / checklist_total) * 100 
         ELSE 0 
    END
  ) STORED,
  
  -- Issues / Blockers
  has_open_issues BOOLEAN DEFAULT false,
  issue_count INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  termination_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- One closing room per deal
  UNIQUE(deal_id)
);

-- -----------------------------------------------------------------------------
-- 3. CLOSING ROOM PARTICIPANTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS closing_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_room_id UUID NOT NULL REFERENCES closing_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- 'sponsor', 'cde_rep', 'investor_rep', 'counsel', 'auditor'
  organization_name VARCHAR(255),
  permissions JSONB DEFAULT '{"view": true, "upload": false, "approve": false}',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  
  UNIQUE(closing_room_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 4. CLOSING ROOM MILESTONES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS closing_room_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_room_id UUID NOT NULL REFERENCES closing_rooms(id) ON DELETE CASCADE,
  milestone_name VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. CLOSING ROOM ISSUES
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_priority') THEN
    CREATE TYPE issue_priority AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
    CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'wont_fix');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS closing_room_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_room_id UUID NOT NULL REFERENCES closing_rooms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority issue_priority DEFAULT 'medium',
  status issue_status DEFAULT 'open',
  assigned_to UUID REFERENCES users(id),
  reported_by UUID REFERENCES users(id),
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. CLOSING ROOM ACTIVITY LOG
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS closing_room_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_room_id UUID NOT NULL REFERENCES closing_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL, -- 'document_uploaded', 'checklist_completed', 'milestone_reached', etc.
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_closing_rooms_deal ON closing_rooms(deal_id);
CREATE INDEX IF NOT EXISTS idx_closing_rooms_status ON closing_rooms(status);
CREATE INDEX IF NOT EXISTS idx_closing_rooms_target_date ON closing_rooms(target_close_date);
CREATE INDEX IF NOT EXISTS idx_closing_rooms_commitment ON closing_rooms(commitment_id);

CREATE INDEX IF NOT EXISTS idx_cr_participants_room ON closing_room_participants(closing_room_id);
CREATE INDEX IF NOT EXISTS idx_cr_participants_user ON closing_room_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_cr_milestones_room ON closing_room_milestones(closing_room_id);
CREATE INDEX IF NOT EXISTS idx_cr_milestones_target ON closing_room_milestones(target_date);

CREATE INDEX IF NOT EXISTS idx_cr_issues_room ON closing_room_issues(closing_room_id);
CREATE INDEX IF NOT EXISTS idx_cr_issues_status ON closing_room_issues(status);
CREATE INDEX IF NOT EXISTS idx_cr_issues_assigned ON closing_room_issues(assigned_to);

CREATE INDEX IF NOT EXISTS idx_cr_activity_room ON closing_room_activity(closing_room_id);
CREATE INDEX IF NOT EXISTS idx_cr_activity_type ON closing_room_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_cr_activity_created ON closing_room_activity(created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. TRIGGERS
-- -----------------------------------------------------------------------------

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_closing_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_closing_room_updated_at
  BEFORE UPDATE ON closing_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_closing_room_updated_at();

CREATE TRIGGER trigger_cr_issues_updated_at
  BEFORE UPDATE ON closing_room_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_closing_room_updated_at();

-- Track issue count on closing room
CREATE OR REPLACE FUNCTION update_closing_room_issue_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE closing_rooms
  SET 
    issue_count = (
      SELECT COUNT(*) FROM closing_room_issues 
      WHERE closing_room_id = COALESCE(NEW.closing_room_id, OLD.closing_room_id)
    ),
    has_open_issues = EXISTS (
      SELECT 1 FROM closing_room_issues 
      WHERE closing_room_id = COALESCE(NEW.closing_room_id, OLD.closing_room_id)
      AND status IN ('open', 'in_progress')
    )
  WHERE id = COALESCE(NEW.closing_room_id, OLD.closing_room_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cr_issue_count_insert
  AFTER INSERT ON closing_room_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_closing_room_issue_count();

CREATE TRIGGER trigger_cr_issue_count_update
  AFTER UPDATE ON closing_room_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_closing_room_issue_count();

CREATE TRIGGER trigger_cr_issue_count_delete
  AFTER DELETE ON closing_room_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_closing_room_issue_count();

-- Auto-log activity on status change
CREATE OR REPLACE FUNCTION log_closing_room_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO closing_room_activity (closing_room_id, activity_type, description, metadata)
    VALUES (
      NEW.id,
      'status_changed',
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cr_status_activity
  AFTER UPDATE ON closing_rooms
  FOR EACH ROW
  EXECUTE FUNCTION log_closing_room_status_change();

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE closing_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_room_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_room_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_room_activity ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service full access on closing_rooms"
  ON closing_rooms FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service full access on cr_participants"
  ON closing_room_participants FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service full access on cr_milestones"
  ON closing_room_milestones FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service full access on cr_issues"
  ON closing_room_issues FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service full access on cr_activity"
  ON closing_room_activity FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated read via participation
CREATE POLICY "Participants can read closing_rooms"
  ON closing_rooms FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM closing_room_participants
      WHERE closing_room_id = id
      AND user_id = auth.uid()
    )
    OR sponsor_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- 10. VIEWS
-- -----------------------------------------------------------------------------

-- Active closing rooms summary
CREATE OR REPLACE VIEW closing_rooms_summary AS
SELECT 
  cr.id,
  cr.deal_id,
  d.project_name,
  cr.status,
  cr.target_close_date,
  cr.checklist_pct,
  cr.has_open_issues,
  cr.issue_count,
  cr.allocation_amount,
  cr.investment_amount,
  cr.credit_type,
  cr.opened_at,
  EXTRACT(DAY FROM cr.target_close_date - CURRENT_DATE) as days_to_close,
  (SELECT COUNT(*) FROM closing_room_participants WHERE closing_room_id = cr.id) as participant_count
FROM closing_rooms cr
JOIN deals d ON cr.deal_id = d.id
WHERE cr.status NOT IN ('closed', 'terminated');

-- -----------------------------------------------------------------------------
-- 11. COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE closing_rooms IS 'Orchestrates deal closing process, triggered by commitment acceptance';
COMMENT ON TABLE closing_room_participants IS 'Users with access to closing room';
COMMENT ON TABLE closing_room_milestones IS 'Key milestones to track during closing';
COMMENT ON TABLE closing_room_issues IS 'Issues/blockers that need resolution';
COMMENT ON TABLE closing_room_activity IS 'Audit trail of all closing room activity';
COMMENT ON COLUMN closing_rooms.checklist_pct IS 'Auto-calculated percentage of checklist completion';
