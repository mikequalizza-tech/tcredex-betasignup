-- Migration: 110_drop_clerk_columns.sql
-- Purpose: Remove legacy Clerk columns now that authentication is Supabase-only.

-- Users
ALTER TABLE users DROP COLUMN IF EXISTS clerk_id;
DROP INDEX IF EXISTS idx_users_clerk_id;

-- Sponsors / CDEs / Investors
ALTER TABLE sponsors DROP COLUMN IF EXISTS clerk_id;
ALTER TABLE cdes DROP COLUMN IF EXISTS clerk_id;
ALTER TABLE investors DROP COLUMN IF EXISTS clerk_id;
DROP INDEX IF EXISTS idx_sponsors_clerk_id;
DROP INDEX IF EXISTS idx_cdes_clerk_id;
DROP INDEX IF EXISTS idx_investors_clerk_id;

-- Conversations / messages (closing room + general)
ALTER TABLE conversation_participants DROP COLUMN IF EXISTS clerk_id;
ALTER TABLE messages DROP COLUMN IF EXISTS sender_clerk_id;
ALTER TABLE closing_room_messages DROP COLUMN IF EXISTS sender_clerk_id;
DROP INDEX IF EXISTS idx_conversation_participants_clerk_id;

-- cdes_merged legacy
ALTER TABLE cdes_merged DROP COLUMN IF EXISTS clerk_id;
DROP INDEX IF EXISTS idx_cdes_merged_clerk_id;
