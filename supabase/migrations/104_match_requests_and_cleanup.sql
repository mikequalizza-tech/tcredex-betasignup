-- Migration 104: Create match_requests table and clean up Clerk garbage
-- Date: 2026-01-31

-- ============================================
-- 1. CREATE MATCH_REQUESTS TABLE
-- Enforces the 3-contact rule for Sponsors
-- ============================================

CREATE TABLE IF NOT EXISTS match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('cde', 'investor')),
  target_id UUID NOT NULL, -- cdes_merged.organization_id OR investors.id
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn', 'expired')),

  -- Request metadata
  message TEXT, -- Optional message from sponsor

  -- Response metadata
  responded_at TIMESTAMPTZ,
  response_message TEXT,
  responded_by_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  -- Prevent duplicate requests
  UNIQUE(deal_id, target_type, target_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_match_requests_sponsor ON match_requests(sponsor_id, target_type, status);
CREATE INDEX IF NOT EXISTS idx_match_requests_target ON match_requests(target_type, target_id, status);
CREATE INDEX IF NOT EXISTS idx_match_requests_deal ON match_requests(deal_id);

-- Enable RLS
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sponsors can view their own requests"
  ON match_requests FOR SELECT
  USING (sponsor_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Sponsors can create requests"
  ON match_requests FOR INSERT
  WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "Targets can update request status"
  ON match_requests FOR UPDATE
  USING (target_id = auth.uid());

-- Function to check 3-contact rule
CREATE OR REPLACE FUNCTION check_contact_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Count active requests for this sponsor and target type
  SELECT COUNT(*) INTO active_count
  FROM match_requests
  WHERE sponsor_id = NEW.sponsor_id
    AND target_type = NEW.target_type
    AND status IN ('pending', 'accepted');

  -- Enforce 3-contact limit
  IF active_count >= 3 THEN
    RAISE EXCEPTION 'Contact limit reached: You can only have 3 active % contacts at a time', NEW.target_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for 3-contact rule
DROP TRIGGER IF EXISTS enforce_contact_limit ON match_requests;
CREATE TRIGGER enforce_contact_limit
  BEFORE INSERT ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_limit();

-- ============================================
-- 2. CLEAN UP CLERK GARBAGE COLUMNS
-- ============================================

-- Remove clerk_id from conversation_participants
ALTER TABLE conversation_participants DROP COLUMN IF EXISTS clerk_id;

-- Remove sender_clerk_id from messages
ALTER TABLE messages DROP COLUMN IF EXISTS sender_clerk_id;

-- Remove sender_clerk_id from closing_room_messages
ALTER TABLE closing_room_messages DROP COLUMN IF EXISTS sender_clerk_id;

-- ============================================
-- 3. ADD UPDATED_AT TRIGGER FOR MATCH_REQUESTS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_match_requests_updated_at ON match_requests;
CREATE TRIGGER update_match_requests_updated_at
  BEFORE UPDATE ON match_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Done
SELECT 'Migration 104 complete: match_requests table created, Clerk columns removed' as status;
