-- Add simplified geometry column for fast full-US map rendering
-- ST_Simplify with tolerance 0.01 reduces polygon complexity by ~95%
-- while preserving tract boundaries visually at low zoom

ALTER TABLE census_tracts ADD COLUMN IF NOT EXISTS geom_simplified geometry(MultiPolygon, 4326);

-- Populate with simplified geometries
UPDATE census_tracts 
SET geom_simplified = ST_Simplify(geom, 0.01)
WHERE geom IS NOT NULL;

-- Create spatial index for fast bbox queries
CREATE INDEX IF NOT EXISTS idx_census_tracts_geom_simplified 
ON census_tracts USING GIST (geom_simplified);

-- Create RPC function to get simplified tracts in bbox (for zoomed-out view)
CREATE OR REPLACE FUNCTION get_simplified_tracts_in_bbox(
  p_min_lng double precision,
  p_min_lat double precision,
  p_max_lng double precision,
  p_max_lat double precision
)
RETURNS TABLE (
  geoid text,
  geom_json text,
  state_name text,
  county_name text,
  is_lihtc_qct boolean,
  is_oz_designated boolean,
  has_state_nmtc boolean,
  has_state_htc boolean,
  has_brownfield_credit boolean,
  severely_distressed boolean,
  poverty_rate numeric,
  median_family_income_pct numeric,
  unemployment_rate numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.geoid,
    ST_AsGeoJSON(ct.geom_simplified)::text as geom_json,
    ct.state_name,
    ct.county_name,
    ct.is_lihtc_qct,
    ct.is_oz_designated,
    ct.has_state_nmtc,
    ct.has_state_htc,
    ct.has_brownfield_credit,
    ct.severely_distressed,
    ct.poverty_rate,
    ct.median_family_income_pct,
    ct.unemployment_rate
  FROM census_tracts ct
  WHERE ct.geom_simplified && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
    AND ct.geom_simplified IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION get_simplified_tracts_in_bbox IS 'Returns all tracts in bbox with simplified geometries for fast full-US rendering';
