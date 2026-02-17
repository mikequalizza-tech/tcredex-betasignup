-- ============================================
-- OUTREACH REQUESTS TABLE
-- Tracks sponsor outreach to CDEs and Investors
-- ============================================

CREATE TABLE IF NOT EXISTS outreach_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

  -- Sender (Sponsor)
  sender_id UUID NOT NULL,
  sender_org_id UUID NOT NULL,
  sender_name VARCHAR(255),
  sender_org VARCHAR(255),

  -- Recipient (CDE or Investor)
  recipient_id UUID NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('cde', 'investor')),

  -- Message content
  message TEXT NOT NULL,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Sent, not yet viewed
    'viewed',      -- Recipient has viewed (email opened or logged in)
    'interested',  -- Recipient expressed interest
    'declined',    -- Recipient declined
    'expired'      -- 7 days passed with no response
  )),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,

  -- Email tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  email_opened BOOLEAN DEFAULT FALSE,
  email_opened_at TIMESTAMPTZ,
  tracking_id UUID DEFAULT gen_random_uuid() -- For email tracking pixel
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outreach_deal_id ON outreach_requests(deal_id);
CREATE INDEX IF NOT EXISTS idx_outreach_sender_org ON outreach_requests(sender_org_id);
CREATE INDEX IF NOT EXISTS idx_outreach_recipient ON outreach_requests(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_requests(status);
CREATE INDEX IF NOT EXISTS idx_outreach_expires ON outreach_requests(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_outreach_tracking ON outreach_requests(tracking_id);

-- RLS
ALTER TABLE outreach_requests ENABLE ROW LEVEL SECURITY;

-- Sponsors can view their own outreach requests
CREATE POLICY "Sponsors can view own outreach"
  ON outreach_requests FOR SELECT
  USING (sender_id = auth.uid());

-- Recipients can view requests sent to them
CREATE POLICY "Recipients can view requests to them"
  ON outreach_requests FOR SELECT
  USING (
    recipient_id IN (
      SELECT id FROM cdes WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      UNION
      SELECT id FROM investors WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- Add is_system_user to organizations table
-- ============================================
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS is_system_user BOOLEAN DEFAULT FALSE;

-- ============================================
-- BLACKLIST TABLE
-- Organizations that should never appear in outreach
-- ============================================
CREATE TABLE IF NOT EXISTS organization_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  reason TEXT,
  added_by UUID,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert known blacklisted orgs
INSERT INTO organization_blacklist (organization_name, reason)
VALUES ('US Bank', 'Historical issues - do not engage')
ON CONFLICT DO NOTHING;

-- ============================================
-- Function to auto-expire old requests
-- Run via pg_cron or scheduled job
-- ============================================
CREATE OR REPLACE FUNCTION expire_old_outreach_requests()
RETURNS void AS $$
BEGIN
  UPDATE outreach_requests
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE outreach_requests IS 'Tracks sponsor outreach to CDEs and investors. Max 3 active requests per type per deal.';
COMMENT ON COLUMN outreach_requests.tracking_id IS 'Unique ID for email tracking pixel URL';
