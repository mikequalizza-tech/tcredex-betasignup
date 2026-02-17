-- =============================================================================
-- tCredex Founder Members & Tracking Schema
-- =============================================================================
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Founder Members Table
CREATE TABLE founder_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  founder_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,  -- founder_code of referrer
  utm_source TEXT,
  status TEXT DEFAULT 'pending',  -- pending, active, closed_deal
  deals_at_founder_rate INT DEFAULT 1,  -- How many deals they get at 1%
  deals_used INT DEFAULT 0,  -- How many 1% deals they've used
  referral_count INT DEFAULT 0,  -- How many people used their code
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  first_deal_closed_at TIMESTAMPTZ
);

-- Indexes for founder_members
CREATE INDEX idx_founder_members_email ON founder_members(email);
CREATE INDEX idx_founder_members_code ON founder_members(founder_code);
CREATE INDEX idx_founder_members_referred_by ON founder_members(referred_by);
CREATE INDEX idx_founder_members_status ON founder_members(status);

-- RLS for founder_members
ALTER TABLE founder_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages founder_members"
  ON founder_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can read own founder record"
  ON founder_members FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR email = auth.email());

-- =============================================================================
-- Tracking Events Table (QR codes, referral clicks)
-- =============================================================================
CREATE TABLE tracking_events (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,  -- campaign code or referral code
  event_type TEXT NOT NULL,  -- 'qr_scan', 'referral_click', 'page_view'
  ip_hash TEXT,  -- hashed for privacy
  user_agent TEXT,
  device_type TEXT,  -- 'mobile', 'desktop'
  referer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tracking_events
CREATE INDEX idx_tracking_events_code ON tracking_events(code);
CREATE INDEX idx_tracking_events_type ON tracking_events(event_type);
CREATE INDEX idx_tracking_events_created ON tracking_events(created_at);

-- RLS for tracking_events
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages tracking_events"
  ON tracking_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anonymous inserts (for tracking pixels/redirects)
CREATE POLICY "Anyone can insert tracking events"
  ON tracking_events FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- Helper function to increment referral clicks
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_referral_clicks(referral_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE founder_members 
  SET referral_count = referral_count + 1,
      deals_at_founder_rate = GREATEST(1, FLOOR((referral_count + 1) / 2.0)::INT + 1)
  WHERE founder_code = referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- View: Founder Stats Dashboard
-- =============================================================================
CREATE OR REPLACE VIEW founder_stats AS
SELECT 
  fm.id,
  fm.email,
  fm.name,
  fm.company,
  fm.founder_code,
  fm.status,
  fm.deals_at_founder_rate,
  fm.deals_used,
  fm.referral_count,
  fm.created_at,
  (SELECT COUNT(*) FROM founder_members WHERE referred_by = fm.founder_code) AS direct_referrals,
  (SELECT COUNT(*) FROM tracking_events WHERE code = fm.founder_code AND event_type = 'referral_click') AS link_clicks
FROM founder_members fm;

-- =============================================================================
-- View: Campaign Analytics
-- =============================================================================
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT 
  code,
  event_type,
  device_type,
  DATE_TRUNC('day', created_at) AS date,
  COUNT(*) AS event_count
FROM tracking_events
GROUP BY code, event_type, device_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC, event_count DESC;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE founder_members IS 'Pre-launch founder member signups with referral tracking';
COMMENT ON TABLE tracking_events IS 'QR code scans and referral link clicks for attribution';
COMMENT ON COLUMN founder_members.deals_at_founder_rate IS 'Number of deals this member can close at 1% (base 1 + 1 per 2 referrals)';
