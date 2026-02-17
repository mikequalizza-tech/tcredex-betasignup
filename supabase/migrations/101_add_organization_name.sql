-- =============================================================================
-- Add organization_name column to role tables
-- =============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS organization_name TEXT;

ALTER TABLE sponsors
ADD COLUMN IF NOT EXISTS organization_name TEXT;

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS organization_name TEXT;

ALTER TABLE cdes
ADD COLUMN IF NOT EXISTS organization_name TEXT;

ALTER TABLE cdes_merged
ADD COLUMN IF NOT EXISTS organization_name TEXT;

CREATE INDEX IF NOT EXISTS idx_users_organization_name ON users(organization_name);
CREATE INDEX IF NOT EXISTS idx_sponsors_organization_name ON sponsors(organization_name);
CREATE INDEX IF NOT EXISTS idx_investors_organization_name ON investors(organization_name);
CREATE INDEX IF NOT EXISTS idx_cdes_organization_name ON cdes(organization_name);
