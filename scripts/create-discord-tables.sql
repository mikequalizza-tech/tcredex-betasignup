-- ============================================================================
-- Create Discord tables in Supabase
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- Enum types
DO $$ BEGIN
  CREATE TYPE discord_server_type AS ENUM ('organization', 'deal', 'closing_room');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE discord_channel_type AS ENUM ('TEXT', 'AUDIO', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE discord_member_role AS ENUM ('ADMIN', 'MODERATOR', 'GUEST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Discord Servers
CREATE TABLE IF NOT EXISTS discord_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  invite_code VARCHAR(20) NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  organization_id UUID,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  server_type discord_server_type NOT NULL DEFAULT 'organization',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discord Channels
CREATE TABLE IF NOT EXISTS discord_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type discord_channel_type NOT NULL DEFAULT 'TEXT',
  server_id UUID NOT NULL REFERENCES discord_servers(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(server_id, name)
);
CREATE INDEX IF NOT EXISTS idx_discord_channels_server ON discord_channels(server_id);

-- Discord Members
CREATE TABLE IF NOT EXISTS discord_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role discord_member_role NOT NULL DEFAULT 'GUEST',
  user_id UUID NOT NULL,
  server_id UUID NOT NULL REFERENCES discord_servers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, server_id)
);
CREATE INDEX IF NOT EXISTS idx_discord_members_user ON discord_members(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_members_server ON discord_members(server_id);

-- Discord Messages
CREATE TABLE IF NOT EXISTS discord_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  deleted BOOLEAN DEFAULT false,
  edited BOOLEAN DEFAULT false,
  member_id UUID NOT NULL REFERENCES discord_members(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES discord_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_discord_messages_channel ON discord_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_discord_messages_member ON discord_messages(member_id);

-- Discord Conversations (DMs)
CREATE TABLE IF NOT EXISTS discord_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_one_id UUID NOT NULL REFERENCES discord_members(id) ON DELETE CASCADE,
  member_two_id UUID NOT NULL REFERENCES discord_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_one_id, member_two_id)
);
CREATE INDEX IF NOT EXISTS idx_discord_conversations_m2 ON discord_conversations(member_two_id);

-- Discord Direct Messages
CREATE TABLE IF NOT EXISTS discord_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  deleted BOOLEAN DEFAULT false,
  edited BOOLEAN DEFAULT false,
  member_id UUID NOT NULL REFERENCES discord_members(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES discord_conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_discord_dm_conversation ON discord_direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_discord_dm_member ON discord_direct_messages(member_id);

-- ============================================================================
-- RLS Policies (allow service role full access, anon users read own data)
-- ============================================================================
ALTER TABLE discord_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_direct_messages ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- For authenticated users, allow read access to servers they're members of.
CREATE POLICY "Users can view their servers" ON discord_servers
  FOR SELECT USING (
    id IN (SELECT server_id FROM discord_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view channels in their servers" ON discord_channels
  FOR SELECT USING (
    server_id IN (SELECT server_id FROM discord_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their memberships" ON discord_members
  FOR SELECT USING (user_id = auth.uid() OR server_id IN (
    SELECT server_id FROM discord_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view messages in their channels" ON discord_messages
  FOR SELECT USING (
    channel_id IN (
      SELECT dc.id FROM discord_channels dc
      JOIN discord_members dm ON dm.server_id = dc.server_id
      WHERE dm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their DM conversations" ON discord_conversations
  FOR SELECT USING (
    member_one_id IN (SELECT id FROM discord_members WHERE user_id = auth.uid())
    OR member_two_id IN (SELECT id FROM discord_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their direct messages" ON discord_direct_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT dc.id FROM discord_conversations dc
      JOIN discord_members dm ON (dm.id = dc.member_one_id OR dm.id = dc.member_two_id)
      WHERE dm.user_id = auth.uid()
    )
  );

SELECT 'Discord tables created successfully!' AS result;
