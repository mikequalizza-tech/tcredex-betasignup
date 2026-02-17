-- Migration 106: Fix schema mismatches for notifications + match_requests
-- The live DB is missing columns that the app code writes to.
-- Run this in Supabase SQL Editor.

-- ============================================
-- 1. NOTIFICATIONS TABLE — add missing columns
-- ============================================
-- Live schema has: id, user_id, type, title, message, entity_type, entity_id, read, read_at, action_url, created_at
-- App code uses:   body, deal_id, event, priority, expires_at

DO $$
BEGIN
  -- Add 'body' column (app code uses 'body' for notification text)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='body') THEN
    ALTER TABLE public.notifications ADD COLUMN body TEXT;
    -- Copy existing 'message' data into 'body' for consistency
    UPDATE public.notifications SET body = message WHERE message IS NOT NULL AND body IS NULL;
  END IF;

  -- Add 'deal_id' column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='deal_id') THEN
    ALTER TABLE public.notifications ADD COLUMN deal_id UUID;
  END IF;

  -- Add 'event' column (e.g., match_request_received, new_message_received)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='event') THEN
    ALTER TABLE public.notifications ADD COLUMN event VARCHAR(100);
  END IF;

  -- Add 'priority' column (urgent, high, normal, low)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='priority') THEN
    ALTER TABLE public.notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
  END IF;

  -- Add 'expires_at' column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='expires_at') THEN
    ALTER TABLE public.notifications ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_deal_id ON public.notifications(deal_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_event ON public.notifications(event);


-- ============================================
-- 2. MATCH_REQUESTS TABLE — add missing columns
-- ============================================
-- Live schema has: id, deal_id, sponsor_id, target_type, target_id, status, message,
--                  responded_at, response_message, responded_by_id, created_at, updated_at,
--                  expires_at, claim_code
-- App code uses:   target_org_id, cooldown_ends_at, requested_at

DO $$
BEGIN
  -- Add 'target_org_id' — stores the target CDE/Investor organization_id for access control
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='match_requests' AND column_name='target_org_id') THEN
    ALTER TABLE public.match_requests ADD COLUMN target_org_id VARCHAR;
  END IF;

  -- Add 'cooldown_ends_at' — 7-day cooldown after decline before slot frees up
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='match_requests' AND column_name='cooldown_ends_at') THEN
    ALTER TABLE public.match_requests ADD COLUMN cooldown_ends_at TIMESTAMPTZ;
  END IF;

  -- Add 'requested_at' — explicit timestamp for when request was sent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='match_requests' AND column_name='requested_at') THEN
    ALTER TABLE public.match_requests ADD COLUMN requested_at TIMESTAMPTZ;
    -- Backfill from created_at
    UPDATE public.match_requests SET requested_at = created_at WHERE requested_at IS NULL;
  END IF;
END $$;

-- Match requests indexes
CREATE INDEX IF NOT EXISTS idx_match_requests_target_org ON public.match_requests(target_org_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_sponsor ON public.match_requests(sponsor_id, status);
CREATE INDEX IF NOT EXISTS idx_match_requests_deal ON public.match_requests(deal_id, target_type);
