-- =============================================================================
-- CLERK INTEGRATION MIGRATION
-- =============================================================================
-- This migration updates the schema to support Clerk authentication directly
-- without requiring the organizations table as an intermediary.
--
-- Changes:
-- 1. Add clerk_id to sponsors, cdes, investors tables (for Clerk Org ID)
-- 2. Add clerk_id to users table (for Clerk User ID)
-- 3. Add role_type to users table (to discriminate which role table)
-- 4. Make organization_id nullable on role tables (we'll set it to NULL for Clerk-based orgs)
-- =============================================================================

-- Add clerk_id to users table (this is the Clerk User ID)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;

-- Add role_type to users table (sponsor | cde | investor)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role_type VARCHAR(50);

-- Add clerk_id to sponsors table (this is the Clerk Organization ID)
ALTER TABLE sponsors
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;

-- Make organization_id nullable on sponsors (for Clerk-based orgs)
ALTER TABLE sponsors
ALTER COLUMN organization_id DROP NOT NULL;

-- Add clerk_id to cdes table
ALTER TABLE cdes
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;

-- Make organization_id nullable on cdes
ALTER TABLE cdes
ALTER COLUMN organization_id DROP NOT NULL;

-- Add clerk_id to investors table
ALTER TABLE investors
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE;

-- Make organization_id nullable on investors
ALTER TABLE investors
ALTER COLUMN organization_id DROP NOT NULL;

-- Create indexes for clerk_id lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_clerk_id ON sponsors(clerk_id);
CREATE INDEX IF NOT EXISTS idx_cdes_clerk_id ON cdes(clerk_id);
CREATE INDEX IF NOT EXISTS idx_investors_clerk_id ON investors(clerk_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Users can read their own record
DROP POLICY IF EXISTS "Users can read own record" ON users;
CREATE POLICY "Users can read own record" ON users
FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can update their own record
DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record" ON users
FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role can do anything (for API operations)
DROP POLICY IF EXISTS "Service role full access users" ON users;
CREATE POLICY "Service role full access users" ON users
FOR ALL USING (current_setting('role', true) = 'service_role');

-- Similar policies for role tables
DROP POLICY IF EXISTS "Service role full access sponsors" ON sponsors;
CREATE POLICY "Service role full access sponsors" ON sponsors
FOR ALL USING (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "Service role full access cdes" ON cdes;
CREATE POLICY "Service role full access cdes" ON cdes
FOR ALL USING (current_setting('role', true) = 'service_role');

DROP POLICY IF EXISTS "Service role full access investors" ON investors;
CREATE POLICY "Service role full access investors" ON investors
FOR ALL USING (current_setting('role', true) = 'service_role');

-- =============================================================================
-- COMMENT
-- =============================================================================
COMMENT ON COLUMN users.clerk_id IS 'Clerk User ID (user_xxx)';
COMMENT ON COLUMN users.role_type IS 'Organization type: sponsor, cde, or investor';
COMMENT ON COLUMN sponsors.clerk_id IS 'Clerk Organization ID (org_xxx)';
COMMENT ON COLUMN cdes.clerk_id IS 'Clerk Organization ID (org_xxx)';
COMMENT ON COLUMN investors.clerk_id IS 'Clerk Organization ID (org_xxx)';
