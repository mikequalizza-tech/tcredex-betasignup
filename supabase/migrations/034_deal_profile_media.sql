-- =============================================================================
-- Migration 034: Deal Profile Media Fields
-- =============================================================================
-- Adds logo and hero image support for deal cards and project profiles
-- Also adds contact info and sources/uses for financing breakdown
-- =============================================================================

-- Add media fields to deals table
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS community_impact TEXT,
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS uses JSONB DEFAULT '[]';

-- Comments for documentation
COMMENT ON COLUMN deals.logo_url IS 'Organization/sponsor logo URL (Supabase storage)';
COMMENT ON COLUMN deals.hero_image_url IS 'Project hero image/rendering URL (Supabase storage)';
COMMENT ON COLUMN deals.contact_name IS 'Primary contact name for the deal';
COMMENT ON COLUMN deals.contact_email IS 'Primary contact email for the deal';
COMMENT ON COLUMN deals.contact_phone IS 'Primary contact phone for the deal';
COMMENT ON COLUMN deals.community_impact IS 'Description of community impact (jobs, services, etc.)';
COMMENT ON COLUMN deals.sources IS 'Financing sources array: [{name: string, amount: number}]';
COMMENT ON COLUMN deals.uses IS 'Financing uses array: [{name: string, amount: number}]';

-- =============================================================================
-- Create storage bucket for deal media (run in Supabase dashboard or via API)
-- =============================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('deal-media', 'deal-media', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies (public read, authenticated write)
-- CREATE POLICY "Deal media is publicly accessible"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'deal-media');

-- CREATE POLICY "Authenticated users can upload deal media"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'deal-media' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can update their own deal media"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'deal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own deal media"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'deal-media' AND auth.uid()::text = (storage.foldername(name))[1]);
