-- =============================================================================
-- Project Drafts Table
-- =============================================================================
-- Saves intake form drafts to database instead of localStorage
-- =============================================================================

CREATE TABLE project_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner identification (use email for now, can link to auth.users later)
  owner_email TEXT NOT NULL,
  
  -- Draft metadata
  draft_name TEXT,  -- Optional name for the draft
  project_name TEXT,  -- Extracted for quick display
  
  -- The full intake form data as JSON
  data JSONB NOT NULL DEFAULT '{}',
  
  -- Readiness score at time of save
  readiness_score INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'draft'  -- draft, submitted, archived
);

-- Indexes
CREATE INDEX idx_project_drafts_owner ON project_drafts(owner_email);
CREATE INDEX idx_project_drafts_updated ON project_drafts(updated_at DESC);
CREATE INDEX idx_project_drafts_status ON project_drafts(status);

-- Unique constraint: one active draft per email (can have multiple if we want later)
-- For now, we'll just upsert on owner_email + status='draft'

-- RLS
ALTER TABLE project_drafts ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role manages project_drafts"
  ON project_drafts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own drafts
CREATE POLICY "Users can read own drafts"
  ON project_drafts FOR SELECT
  TO authenticated
  USING (owner_email = auth.email());

-- Users can insert their own drafts
CREATE POLICY "Users can insert own drafts"
  ON project_drafts FOR INSERT
  TO authenticated
  WITH CHECK (owner_email = auth.email());

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts"
  ON project_drafts FOR UPDATE
  TO authenticated
  USING (owner_email = auth.email())
  WITH CHECK (owner_email = auth.email());

-- Anon can also save drafts (for pre-registration flow)
CREATE POLICY "Anon can insert drafts"
  ON project_drafts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can read drafts by email"
  ON project_drafts FOR SELECT
  TO anon
  USING (true);  -- Will filter by email in API

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_project_drafts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_drafts_updated
  BEFORE UPDATE ON project_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_project_drafts_timestamp();

-- Comments
COMMENT ON TABLE project_drafts IS 'Intake form drafts saved to database for persistence across sessions/devices';
COMMENT ON COLUMN project_drafts.data IS 'Full IntakeData JSON object';
