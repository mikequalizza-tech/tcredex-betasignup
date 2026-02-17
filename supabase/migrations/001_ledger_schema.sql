-- =============================================================================
-- tCredex Ledger Schema - Tamper-Evident Audit Log
-- =============================================================================
-- This creates the append-only ledger_events table with hash chain support
-- Run this migration in Supabase SQL Editor
-- =============================================================================

-- Create enum types for actor and action types
CREATE TYPE ledger_actor_type AS ENUM ('system', 'human', 'api_key');

CREATE TYPE ledger_action AS ENUM (
  -- Application lifecycle
  'application_created',
  'application_updated',
  'application_submitted',
  'application_status_changed',
  
  -- AI Scoring
  'distress_score_calculated',
  'impact_score_calculated',
  'eligibility_determined',
  
  -- Matching
  'cde_match_suggested',
  'cde_match_accepted',
  'cde_match_rejected',
  'cde_match_override',
  
  -- Documents
  'document_uploaded',
  'document_hashed',
  'document_signed',
  'document_executed',
  
  -- Closing
  'closing_initiated',
  'closing_milestone_reached',
  'funding_approved',
  'funding_disbursed',
  'closing_completed',
  
  -- Post-closing
  'compliance_check_performed',
  'annual_report_submitted',
  'amendment_recorded'
);

CREATE TYPE ledger_entity_type AS ENUM (
  'application',
  'project',
  'tract',
  'cde',
  'investor',
  'sponsor',
  'document',
  'closing',
  'qalicb',
  'qlici'
);

-- =============================================================================
-- Main Ledger Table
-- =============================================================================
CREATE TABLE ledger_events (
  id BIGSERIAL PRIMARY KEY,
  
  -- Timestamp (always UTC)
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Actor information
  actor_type ledger_actor_type NOT NULL,
  actor_id TEXT NOT NULL,  -- user UUID, service name, or API key identifier
  
  -- Entity being acted upon
  entity_type ledger_entity_type NOT NULL,
  entity_id TEXT NOT NULL,  -- UUID or composite key
  
  -- Action performed
  action ledger_action NOT NULL,
  
  -- Payload: snapshot of relevant data at decision time
  payload_json JSONB NOT NULL DEFAULT '{}',
  
  -- Model versioning (for AI/scoring events)
  model_version TEXT,
  
  -- Reason codes / feature explanations
  reason_codes JSONB,
  
  -- Hash chain fields
  prev_hash TEXT,  -- SHA-256 hash of previous event (null for first event)
  hash TEXT NOT NULL,  -- SHA-256 hash of this event's canonical representation
  
  -- Optional Ed25519 signature
  sig TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes for efficient querying
-- =============================================================================
CREATE INDEX idx_ledger_events_timestamp ON ledger_events(event_timestamp);
CREATE INDEX idx_ledger_events_entity ON ledger_events(entity_type, entity_id);
CREATE INDEX idx_ledger_events_actor ON ledger_events(actor_type, actor_id);
CREATE INDEX idx_ledger_events_action ON ledger_events(action);
CREATE INDEX idx_ledger_events_hash ON ledger_events(hash);

-- =============================================================================
-- Immutability Triggers - Block UPDATE and DELETE
-- =============================================================================
CREATE OR REPLACE FUNCTION ledger_block_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger modification not allowed: % operations are blocked on ledger_events table', TG_OP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Block UPDATE
CREATE TRIGGER ledger_no_update
  BEFORE UPDATE ON ledger_events
  FOR EACH ROW
  EXECUTE FUNCTION ledger_block_modification();

-- Block DELETE
CREATE TRIGGER ledger_no_delete
  BEFORE DELETE ON ledger_events
  FOR EACH ROW
  EXECUTE FUNCTION ledger_block_modification();

-- =============================================================================
-- External Anchors Table (for tracking anchor points)
-- =============================================================================
CREATE TABLE ledger_anchors (
  id BIGSERIAL PRIMARY KEY,
  
  -- Reference to the ledger event being anchored
  ledger_event_id BIGINT NOT NULL REFERENCES ledger_events(id),
  
  -- The hash being anchored
  anchored_hash TEXT NOT NULL,
  
  -- Anchor destination type
  anchor_type TEXT NOT NULL,  -- 'github_gist', 'blockchain', 'escrow_email'
  
  -- External reference (gist ID, tx hash, message ID)
  external_reference TEXT,
  
  -- Anchor timestamp
  anchored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Verification status
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_ledger_anchors_event ON ledger_anchors(ledger_event_id);
CREATE INDEX idx_ledger_anchors_hash ON ledger_anchors(anchored_hash);
CREATE INDEX idx_ledger_anchors_type ON ledger_anchors(anchor_type);

-- =============================================================================
-- Verification Log Table (track verification attempts)
-- =============================================================================
CREATE TABLE ledger_verifications (
  id BIGSERIAL PRIMARY KEY,
  
  -- Verification scope
  start_event_id BIGINT,
  end_event_id BIGINT,
  
  -- Results
  events_checked INT NOT NULL,
  chain_valid BOOLEAN NOT NULL,
  signatures_valid BOOLEAN,  -- null if signatures not checked
  anchor_matched BOOLEAN,    -- null if anchor not checked
  
  -- Any issues found
  issues JSONB,
  
  -- Who requested verification
  requested_by TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE ledger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_verifications ENABLE ROW LEVEL SECURITY;

-- Service role can INSERT into ledger_events (no UPDATE/DELETE via triggers)
CREATE POLICY "Service can insert ledger events"
  ON ledger_events FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users can read ledger events (with appropriate role checks in app)
CREATE POLICY "Authenticated can read ledger events"
  ON ledger_events FOR SELECT
  TO authenticated
  USING (true);

-- Service role manages anchors
CREATE POLICY "Service manages anchors"
  ON ledger_anchors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated can read anchors
CREATE POLICY "Authenticated can read anchors"
  ON ledger_anchors FOR SELECT
  TO authenticated
  USING (true);

-- Service role manages verifications
CREATE POLICY "Service manages verifications"
  ON ledger_verifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated can read verifications
CREATE POLICY "Authenticated can read verifications"
  ON ledger_verifications FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE ledger_events IS 'Append-only, tamper-evident audit ledger for all critical platform events';
COMMENT ON COLUMN ledger_events.prev_hash IS 'SHA-256 hash of the previous ledger event, forming a hash chain';
COMMENT ON COLUMN ledger_events.hash IS 'SHA-256 hash of this events canonical representation';
COMMENT ON COLUMN ledger_events.sig IS 'Optional Ed25519 signature over the hash for additional verification';
COMMENT ON TABLE ledger_anchors IS 'External anchor points for independent verification of ledger state';
COMMENT ON TABLE ledger_verifications IS 'Log of verification attempts and results';
