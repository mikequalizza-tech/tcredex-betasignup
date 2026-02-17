-- =============================================================================
-- Supabase Full-Text Search Migration
-- Replaces Meilisearch with native PostgreSQL FTS via RPC functions
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- 1. search_deals — Full-text search on deals with role-based filtering
CREATE OR REPLACE FUNCTION search_deals(
  search_query TEXT,
  result_limit INT DEFAULT 10,
  user_org_type TEXT DEFAULT NULL,
  user_org_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  project_name TEXT,
  city TEXT,
  state TEXT,
  programs TEXT[],
  status TEXT,
  nmtc_financing_requested NUMERIC,
  sponsor_id UUID,
  sponsor_organization_id UUID,
  sponsor_name TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.project_name,
    d.city,
    d.state,
    d.programs,
    d.status,
    d.nmtc_financing_requested,
    d.sponsor_id,
    d.sponsor_organization_id,
    d.sponsor_name,
    ts_rank(
      to_tsvector('english',
        COALESCE(d.project_name, '') || ' ' ||
        COALESCE(d.city, '') || ' ' ||
        COALESCE(d.state, '') || ' ' ||
        COALESCE(d.sponsor_name, '') || ' ' ||
        COALESCE(d.description, '')
      ),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM deals d
  WHERE
    to_tsvector('english',
      COALESCE(d.project_name, '') || ' ' ||
      COALESCE(d.city, '') || ' ' ||
      COALESCE(d.state, '') || ' ' ||
      COALESCE(d.sponsor_name, '') || ' ' ||
      COALESCE(d.description, '')
    ) @@ plainto_tsquery('english', search_query)
    AND (
      (user_org_type = 'sponsor' AND d.sponsor_organization_id = user_org_id)
      OR (user_org_type IS NULL)
      OR (user_org_type != 'sponsor' AND d.status IN ('submitted', 'available', 'seeking_capital', 'matched', 'closing', 'closed'))
    )
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. search_cdes — Full-text search on CDE directory
CREATE OR REPLACE FUNCTION search_cdes(
  search_query TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  primary_states TEXT[],
  service_area TEXT,
  total_allocation NUMERIC,
  amount_remaining NUMERIC,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.primary_states,
    c.service_area,
    c.total_allocation,
    c.amount_remaining,
    ts_rank(
      to_tsvector('english',
        COALESCE(c.name, '') || ' ' ||
        COALESCE(c.service_area, '') || ' ' ||
        COALESCE(array_to_string(c.primary_states, ' '), '')
      ),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM cdes_merged c
  WHERE
    to_tsvector('english',
      COALESCE(c.name, '') || ' ' ||
      COALESCE(c.service_area, '') || ' ' ||
      COALESCE(array_to_string(c.primary_states, ' '), '')
    ) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. GIN indexes for performance (expression-based, matches the tsvector in queries)
CREATE INDEX IF NOT EXISTS idx_deals_fts ON deals USING GIN (
  to_tsvector('english',
    COALESCE(project_name, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(state, '') || ' ' ||
    COALESCE(sponsor_name, '') || ' ' ||
    COALESCE(description, '')
  )
);

CREATE INDEX IF NOT EXISTS idx_cdes_merged_fts ON cdes_merged USING GIN (
  to_tsvector('english',
    COALESCE(name, '') || ' ' ||
    COALESCE(service_area, '') || ' ' ||
    COALESCE(array_to_string(primary_states, ' '), '')
  )
);
