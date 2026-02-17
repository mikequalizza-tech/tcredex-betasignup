-- =============================================================================
-- tCredex PostgreSQL Full-Text Search RPC Functions
-- Run this in Supabase SQL Editor to enable search across the platform.
--
-- Functions:
--   1. search_deals     — Role-filtered deal search
--   2. search_cdes      — CDE search (all authenticated users)
--   3. search_investors  — Investor search
--   4. search_blog_posts — Blog search (published only)
-- =============================================================================

-- 1. search_deals: Role-filtered deal search
-- Called by: /api/search, /api/search/deals
CREATE OR REPLACE FUNCTION search_deals(
  search_query TEXT,
  result_limit INT DEFAULT 10,
  user_org_type TEXT DEFAULT NULL,
  user_org_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  project_name VARCHAR,
  city VARCHAR,
  state VARCHAR,
  programs program_type[],
  status deal_status,
  total_project_cost NUMERIC,
  nmtc_financing_requested NUMERIC,
  sponsor_name VARCHAR,
  census_tract VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id, d.project_name, d.city, d.state, d.programs, d.status,
    d.total_project_cost, d.nmtc_financing_requested, d.sponsor_name,
    d.census_tract, d.created_at
  FROM deals d
  WHERE
    -- Full-text search on project name, city, state, sponsor name, description
    (
      to_tsvector('english',
        COALESCE(d.project_name::text, '') || ' ' ||
        COALESCE(d.city::text, '') || ' ' ||
        COALESCE(d.state::text, '') || ' ' ||
        COALESCE(d.sponsor_name::text, '') || ' ' ||
        COALESCE(d.project_description::text, '')
      ) @@ plainto_tsquery('english', search_query)
      OR d.project_name ILIKE '%' || search_query || '%'
      OR d.city ILIKE '%' || search_query || '%'
      OR d.sponsor_name ILIKE '%' || search_query || '%'
    )
    -- Role-based visibility
    AND (
      user_org_type IS NULL  -- No role = admin, sees all
      OR user_org_type = 'admin'
      OR (user_org_type = 'sponsor' AND d.sponsor_organization_id::TEXT = user_org_id)
      OR (user_org_type = 'cde' AND (d.status IN ('available', 'seeking_capital', 'matched') OR d.assigned_cde_id::TEXT = user_org_id))
      OR (user_org_type = 'investor' AND (d.status IN ('available', 'seeking_capital', 'matched') OR d.investor_id::TEXT = user_org_id))
    )
  ORDER BY
    ts_rank(
      to_tsvector('english',
        COALESCE(d.project_name::text, '') || ' ' ||
        COALESCE(d.city::text, '') || ' ' ||
        COALESCE(d.state::text, '')
      ),
      plainto_tsquery('english', search_query)
    ) DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. search_cdes: CDE search (visible to all authenticated users)
-- Called by: /api/search
CREATE OR REPLACE FUNCTION search_cdes(
  search_query TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  organization_id UUID,
  name VARCHAR,
  service_area TEXT,
  service_area_type VARCHAR,
  total_allocation NUMERIC,
  primary_states TEXT[],
  target_sectors TEXT[],
  rural_focus BOOLEAN,
  urban_focus BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (cm.organization_id)
    cm.id, cm.organization_id, cm.name, cm.service_area,
    cm.service_area_type, cm.total_allocation, cm.primary_states,
    cm.target_sectors, cm.rural_focus, cm.urban_focus
  FROM cdes_merged cm
  WHERE
    cm.status = 'active'
    AND (
      to_tsvector('english',
        COALESCE(cm.name::text, '') || ' ' ||
        COALESCE(cm.service_area::text, '') || ' ' ||
        COALESCE(cm.controlling_entity::text, '')
      ) @@ plainto_tsquery('english', search_query)
      OR cm.name ILIKE '%' || search_query || '%'
      OR cm.controlling_entity ILIKE '%' || search_query || '%'
    )
  ORDER BY cm.organization_id, cm.year DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. search_investors: Investor search
-- Called by: /api/search
CREATE OR REPLACE FUNCTION search_investors(
  search_query TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  organization_id UUID,
  organization_name VARCHAR,
  investor_type VARCHAR,
  target_credit_types TEXT[],
  cra_motivated BOOLEAN,
  city VARCHAR,
  state VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id, i.organization_id, i.organization_name, i.investor_type,
    i.target_credit_types, i.cra_motivated, i.city, i.state
  FROM investors i
  WHERE
    to_tsvector('english',
      COALESCE(i.organization_name::text, '') || ' ' ||
      COALESCE(i.city::text, '') || ' ' ||
      COALESCE(i.state::text, '') || ' ' ||
      COALESCE(i.investor_type::text, '')
    ) @@ plainto_tsquery('english', search_query)
    OR i.organization_name ILIKE '%' || search_query || '%'
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. search_blog_posts: Blog search (published only)
-- Called by: /api/search
CREATE OR REPLACE FUNCTION search_blog_posts(
  search_query TEXT,
  result_limit INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  summary TEXT,
  author TEXT,
  category TEXT,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id, bp.title, bp.slug, bp.summary, bp.author, bp.category, bp.published_at
  FROM blog_posts bp
  WHERE
    bp.status = 'published'
    AND (
      to_tsvector('english',
        COALESCE(bp.title::text, '') || ' ' ||
        COALESCE(bp.summary::text, '') || ' ' ||
        COALESCE(bp.content::text, '')
      ) @@ plainto_tsquery('english', search_query)
      OR bp.title ILIKE '%' || search_query || '%'
    )
  ORDER BY bp.published_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
