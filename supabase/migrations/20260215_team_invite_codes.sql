-- Add invite_code and invite_expires_at columns to users table for team invite flow
-- These columns support the claim code system (beta version before magic links go live)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS invite_code VARCHAR(10) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code) WHERE invite_code IS NOT NULL;

COMMENT ON COLUMN users.invite_code IS 'Claim code for team invites (8 chars, expires in 7 days)';
COMMENT ON COLUMN users.invite_expires_at IS 'Expiration timestamp for invite_code';
