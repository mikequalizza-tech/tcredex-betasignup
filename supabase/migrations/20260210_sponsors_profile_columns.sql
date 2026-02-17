-- ============================================
-- ADD PROFILE COLUMNS TO SPONSORS TABLE
-- ============================================
-- The old migration (037) added these to the now-removed `organizations` table.
-- The sponsors table needs them so the /dashboard/teams "About Organization"
-- section can save and the intake form can display Sponsor Details.

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS website CHARACTER VARYING;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS address CHARACTER VARYING;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS city CHARACTER VARYING;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS state CHARACTER VARYING;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS zip_code CHARACTER VARYING;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS year_founded CHARACTER VARYING(4);
