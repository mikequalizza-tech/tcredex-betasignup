-- Beta Signups Table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/xlejizyoggqdedjkyset/sql
-- This table captures email signups for the beta launch notification list.

CREATE TABLE IF NOT EXISTS beta_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_signups_email ON beta_signups(email);

-- RLS: Allow anonymous inserts (for the signup form) but restrict reads to service role
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (signup form is public)
CREATE POLICY "Allow public signups" ON beta_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service role can read (admin dashboard)
CREATE POLICY "Service role can read signups" ON beta_signups
  FOR SELECT
  TO service_role
  USING (true);
