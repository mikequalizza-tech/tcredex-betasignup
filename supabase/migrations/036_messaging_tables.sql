-- ============================================
-- MESSAGING SYSTEM TABLES
-- Full messaging between users/organizations
-- ============================================

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type: direct (1:1), deal (deal-specific), team (org internal)
  type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'deal', 'team', 'group')),

  -- Optional: For deal-related conversations
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  deal_name VARCHAR(255),

  -- Optional: For team/group conversations
  name VARCHAR(255),

  -- Category for filtering (team, cde, investor, sponsor)
  category VARCHAR(20),

  -- Last message preview
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_sender_id UUID,
  last_sender_name VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATION PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- User info
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),

  -- Organization info
  organization_id UUID,
  organization_name VARCHAR(255),
  organization_type VARCHAR(20), -- sponsor, cde, investor

  -- Role in conversation
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  -- Unread tracking
  unread_count INT DEFAULT 0,
  last_read_at TIMESTAMPTZ,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  -- Ensure user can only be in a conversation once
  UNIQUE(conversation_id, user_id)
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender info (denormalized for performance)
  sender_id UUID NOT NULL,
  sender_name VARCHAR(255),
  sender_org VARCHAR(255),
  sender_org_id UUID,

  -- Message content
  content TEXT NOT NULL,

  -- Message type (text, file, system)
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'loi', 'commitment')),

  -- For file messages
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size INT,

  -- For deal-related messages (LOI, commitment)
  metadata JSONB,

  -- Status
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,

  -- Edit tracking
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGE READ STATUS (per-user)
-- ============================================
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(message_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_deal_id ON conversations(deal_id);
CREATE INDEX IF NOT EXISTS idx_conversations_category ON conversations(category);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_org ON conversation_participants(organization_id);
CREATE INDEX IF NOT EXISTS idx_participants_unread ON conversation_participants(user_id, unread_count) WHERE unread_count > 0;

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type) WHERE message_type != 'text';

-- Message reads
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they participate in
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id
      FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

-- Users can update conversations they participate in
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id
      FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Participants: users can view participants in their conversations
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id
      FROM conversation_participants cp2
      WHERE cp2.user_id = auth.uid() AND cp2.left_at IS NULL
    )
  );

-- Users can add participants to conversations they're in
CREATE POLICY "Users can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (true);

-- Users can update their own participant record
CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Messages: users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id
      FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Users can send messages to their conversations
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id
      FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Message reads: users can view/create their own read status
CREATE POLICY "Users can manage own read status"
  ON message_reads FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_user1_id UUID,
  p_user1_name VARCHAR,
  p_user1_org_id UUID,
  p_user1_org_name VARCHAR,
  p_user1_org_type VARCHAR,
  p_user2_id UUID,
  p_user2_name VARCHAR,
  p_user2_org_id UUID,
  p_user2_org_name VARCHAR,
  p_user2_org_type VARCHAR,
  p_category VARCHAR DEFAULT 'direct'
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp1
      WHERE cp1.conversation_id = c.id AND cp1.user_id = p_user1_id
    )
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = c.id AND cp2.user_id = p_user2_id
    )
  LIMIT 1;

  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (type, category)
    VALUES ('direct', p_category)
    RETURNING id INTO v_conversation_id;

    -- Add participants
    INSERT INTO conversation_participants
      (conversation_id, user_id, user_name, organization_id, organization_name, organization_type)
    VALUES
      (v_conversation_id, p_user1_id, p_user1_name, p_user1_org_id, p_user1_org_name, p_user1_org_type),
      (v_conversation_id, p_user2_id, p_user2_name, p_user2_org_id, p_user2_org_name, p_user2_org_type);
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment unread count for all participants except sender
CREATE OR REPLACE FUNCTION increment_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment unread counts
DROP TRIGGER IF EXISTS trigger_increment_unread ON messages;
CREATE TRIGGER trigger_increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_counts();

-- Function to update conversation's last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message = LEFT(NEW.content, 100),
    last_message_at = NEW.created_at,
    last_sender_id = NEW.sender_id,
    last_sender_name = NEW.sender_name,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last message
DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
CREATE TRIGGER trigger_update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE conversations IS 'Chat conversations - direct messages, deal discussions, or team channels';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations with unread tracking';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE message_reads IS 'Tracks which users have read which messages';
