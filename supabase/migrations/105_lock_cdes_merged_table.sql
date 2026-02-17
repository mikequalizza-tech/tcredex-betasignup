-- Migration 105: Lock cdes_merged table as read-only
-- The CDE data is from the CDFI QEI Report and should never be modified by the application
-- Date: 2026-01-31

-- Revoke all write permissions from the anon and authenticated roles
REVOKE INSERT, UPDATE, DELETE ON cdes_merged FROM anon;
REVOKE INSERT, UPDATE, DELETE ON cdes_merged FROM authenticated;

-- Create a trigger that blocks ANY modifications as a safety net
CREATE OR REPLACE FUNCTION prevent_cdes_merged_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'cdes_merged table is read-only. CDE data is from the CDFI QEI Report and cannot be modified.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Block INSERT
DROP TRIGGER IF EXISTS block_cdes_merged_insert ON cdes_merged;
CREATE TRIGGER block_cdes_merged_insert
  BEFORE INSERT ON cdes_merged
  FOR EACH ROW
  EXECUTE FUNCTION prevent_cdes_merged_modification();

-- Block UPDATE
DROP TRIGGER IF EXISTS block_cdes_merged_update ON cdes_merged;
CREATE TRIGGER block_cdes_merged_update
  BEFORE UPDATE ON cdes_merged
  FOR EACH ROW
  EXECUTE FUNCTION prevent_cdes_merged_modification();

-- Block DELETE
DROP TRIGGER IF EXISTS block_cdes_merged_delete ON cdes_merged;
CREATE TRIGGER block_cdes_merged_delete
  BEFORE DELETE ON cdes_merged
  FOR EACH ROW
  EXECUTE FUNCTION prevent_cdes_merged_modification();

-- Add a comment to the table explaining why it's locked
COMMENT ON TABLE cdes_merged IS 'READ-ONLY: CDE allocation data from CDFI Fund QEI Report. Do not modify - use migrations only for official CDFI data updates.';

SELECT 'cdes_merged table is now locked as read-only' as status;
