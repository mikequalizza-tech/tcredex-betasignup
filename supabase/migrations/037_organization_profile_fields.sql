-- ============================================
-- ORGANIZATION PROFILE FIELDS
-- Additional fields for About Organization section
-- ============================================

-- Add description field
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;

-- Add year founded
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS year_founded VARCHAR(4);

-- Add primary contact fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(255);

-- Ensure address_line1 exists (may already exist)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);

-- Add updated_at if missing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Comments
COMMENT ON COLUMN organizations.description IS 'About/description text for the organization, used in exports';
COMMENT ON COLUMN organizations.year_founded IS 'Year the organization was founded';
COMMENT ON COLUMN organizations.primary_contact_name IS 'Primary contact person name';
COMMENT ON COLUMN organizations.primary_contact_email IS 'Primary contact email address';
