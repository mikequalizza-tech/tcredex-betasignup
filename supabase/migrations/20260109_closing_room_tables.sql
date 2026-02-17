-- Closing Room Tables for tCredex
-- Discord-style communication for deal closing

-- Add clerk_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Closing Room Channels (like Discord channels - general, documents, questions, etc.)
CREATE TABLE IF NOT EXISTS closing_room_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'audio', 'video')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(deal_id, name)
);

CREATE INDEX IF NOT EXISTS idx_closing_room_channels_deal_id ON closing_room_channels(deal_id);

-- Closing Room Messages
CREATE TABLE IF NOT EXISTS closing_room_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES closing_room_channels(id) ON DELETE CASCADE,
    room_type TEXT NOT NULL DEFAULT 'text',
    sender_id UUID REFERENCES users(id),
    sender_clerk_id TEXT,
    sender_name TEXT NOT NULL,
    sender_org_id UUID,
    sender_org_name TEXT,
    content TEXT NOT NULL,
    file_url TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_closing_room_messages_room_id ON closing_room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_closing_room_messages_sender_id ON closing_room_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_closing_room_messages_created_at ON closing_room_messages(created_at DESC);

-- Add clerk_id to conversation_participants if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_participants') THEN
        ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS clerk_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_conversation_participants_clerk_id ON conversation_participants(clerk_id);
    END IF;
END $$;

-- Add sender_clerk_id to messages table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_clerk_id TEXT;
    END IF;
END $$;

-- Enable realtime for closing room messages
ALTER PUBLICATION supabase_realtime ADD TABLE closing_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE closing_room_channels;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_closing_room_channels_updated_at ON closing_room_channels;
CREATE TRIGGER update_closing_room_channels_updated_at
    BEFORE UPDATE ON closing_room_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_closing_room_messages_updated_at ON closing_room_messages;
CREATE TRIGGER update_closing_room_messages_updated_at
    BEFORE UPDATE ON closing_room_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE closing_room_channels IS 'Discord-style channels for deal closing rooms (text, audio, video)';
COMMENT ON TABLE closing_room_messages IS 'Messages in closing room channels with real-time support';
