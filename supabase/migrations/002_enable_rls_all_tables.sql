-- =============================================================================
-- tCredex RLS Policies - Enable Row Level Security on all tables
-- =============================================================================
-- Run this in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. CDEs - Community Development Entities
-- Public can read, service role manages
-- =============================================================================
ALTER TABLE cdes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read CDEs"
  ON cdes FOR SELECT
  USING (true);

CREATE POLICY "Service role manages CDEs"
  ON cdes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 2. Census Tracts - Reference data
-- Public read access (needed for map/eligibility lookups)
-- =============================================================================
ALTER TABLE census_tracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read census tracts"
  ON census_tracts FOR SELECT
  USING (true);

CREATE POLICY "Service role manages census tracts"
  ON census_tracts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 3. Investors
-- Investors see their own data, service role manages all
-- =============================================================================
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can read own data"
  ON investors FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id OR auth.uid()::text = id::text);

CREATE POLICY "Investors can update own data"
  ON investors FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id OR auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = user_id OR auth.uid()::text = id::text);

CREATE POLICY "Service role manages investors"
  ON investors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 4. Knowledge Chunks - AI/RAG system
-- Authenticated can read, service role manages
-- =============================================================================
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read knowledge chunks"
  ON knowledge_chunks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages knowledge chunks"
  ON knowledge_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 5. Knowledge Documents - AI/RAG system
-- Authenticated can read, service role manages
-- =============================================================================
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read knowledge documents"
  ON knowledge_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages knowledge documents"
  ON knowledge_documents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 6. Preregistrations - Early signup list
-- Service role only (admin access)
-- =============================================================================
ALTER TABLE preregistrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages preregistrations"
  ON preregistrations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to insert (for signup form)
CREATE POLICY "Anyone can submit preregistration"
  ON preregistrations FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================================================
-- 7. Projects - Deal/Application data
-- Owners see their projects, CDEs see matched projects, service role manages all
-- =============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can read their own projects
CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = sponsor_id 
    OR auth.uid()::text = user_id 
    OR auth.uid()::text = created_by
  );

-- Users can insert their own projects
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = sponsor_id 
    OR auth.uid()::text = user_id 
    OR auth.uid()::text = created_by
  );

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = sponsor_id 
    OR auth.uid()::text = user_id 
    OR auth.uid()::text = created_by
  )
  WITH CHECK (
    auth.uid()::text = sponsor_id 
    OR auth.uid()::text = user_id 
    OR auth.uid()::text = created_by
  );

CREATE POLICY "Service role manages projects"
  ON projects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 8. State Credit Matrix - Reference data
-- Public read access
-- =============================================================================
ALTER TABLE state_credit_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read state credit matrix"
  ON state_credit_matrix FOR SELECT
  USING (true);

CREATE POLICY "Service role manages state credit matrix"
  ON state_credit_matrix FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 9. Tract Geocode Cache - API cache
-- Public read (for map lookups), service role manages
-- =============================================================================
ALTER TABLE tract_geocode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tract cache"
  ON tract_geocode_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role manages tract cache"
  ON tract_geocode_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to insert cache entries (from API)
CREATE POLICY "Anyone can insert tract cache"
  ON tract_geocode_cache FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- 10. Tracts - Tract reference data
-- Public read access
-- =============================================================================
ALTER TABLE tracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tracts"
  ON tracts FOR SELECT
  USING (true);

CREATE POLICY "Service role manages tracts"
  ON tracts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Verification query - run after to confirm RLS is enabled
-- =============================================================================
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
