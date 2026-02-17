-- Add claim_code column to match_requests for domain-independent CDE/Investor onboarding
-- Replaces magic link URLs with 8-char alphanumeric codes shown in outreach emails

ALTER TABLE match_requests ADD COLUMN IF NOT EXISTS claim_code VARCHAR(10) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_match_requests_claim_code
  ON match_requests(claim_code)
  WHERE claim_code IS NOT NULL;
