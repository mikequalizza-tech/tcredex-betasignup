-- tCredex Database Schema: Notifications, Messages, Push Tokens
-- Run this in Supabase SQL Editor

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'status', -- match, message, document, status, reminder
  event VARCHAR(100), -- cde_match_found, new_message_received, etc.
  title VARCHAR(255) NOT NULL,
  body TEXT,
  priority VARCHAR(20) DEFAULT 'normal', -- urgent, normal, low
  read BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_deal_id ON notifications(deal_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);


-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name VARCHAR(255),
  sender_org VARCHAR(255),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_deal_id ON messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(deal_id, created_at);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for deals they're involved in
CREATE POLICY "Users can view messages for their deals"
  ON messages FOR SELECT
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
      UNION
      SELECT deal_id FROM deal_parties WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages for deals they're involved in
CREATE POLICY "Users can send messages for their deals"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
      UNION
      SELECT deal_id FROM deal_parties WHERE user_id = auth.uid()
    )
  );


-- ============================================
-- PUSH TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  platform VARCHAR(20) NOT NULL, -- ios, android
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Index for push tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- RLS for push tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);


-- ============================================
-- DEAL PARTIES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role VARCHAR(100), -- CDE, Investor, Lender, Counsel, etc.
  organization_name VARCHAR(255),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_parties_deal_id ON deal_parties(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_parties_user_id ON deal_parties(user_id);


-- ============================================
-- DEAL TIMELINE TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  milestone VARCHAR(255) NOT NULL,
  target_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_timeline_deal_id ON deal_timeline(deal_id);


-- ============================================
-- DEAL DOCUMENTS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  doc_type VARCHAR(100), -- Site Control, Phase I, Financial Projections, etc.
  filename VARCHAR(500),
  file_url TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_documents_deal_id ON deal_documents(deal_id);


-- ============================================
-- Success message
-- ============================================
SELECT 'tCredex Mobile Schema Created Successfully!' AS status;
