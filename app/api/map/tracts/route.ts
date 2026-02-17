/**
 * Map Tracts API - SOURCE OF TRUTH
 * =================================
 * Uses: tract_geometries + master_tax_credit_sot (via tract_map_layer view)
 *
 * The census_tracts table is DEPRECATED/JUNK - do not use!
 *
 * Endpoints:
 *   GET /api/map/tracts?bbox=minLng,minLat,maxLng,maxLat  - Get tracts in viewport
 *   GET /api/map/tracts?geoid=12345678901                 - Get single tract
 *   GET /api/map/tracts?lat=39.5&lng=-98.5                - Get tract at coordinates
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Matches tract_map_layer view structure AND get_map_tracts_in_bbox RPC
// Handles both column name conventions (old RPC vs new view)
interface TractRow {
  geoid: string;
  geom_json: string;
  // New column names (from tract_map_layer view)
  has_any_tax_credit?: boolean;
  is_qct?: boolean;
  is_oz?: boolean;
  is_dda?: boolean;
  is_nmtc_eligible?: boolean;
  is_nmtc_high_migration?: boolean;
  // Old column names (from get_map_tracts_in_bbox RPC)
  is_lihtc_qct?: boolean;
  is_oz_designated?: boolean;
  severely_distressed?: boolean;
  median_family_income_pct?: number;
  state_name?: string;
  county_name?: string;
  // Common columns
  has_state_nmtc?: boolean;
  has_state_lihtc?: boolean;
  stack_score?: number;
  poverty_rate?: number;
  mfi_pct?: number;
  unemployment_rate?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get("bbox");
  const geoid = searchParams.get("geoid");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  // Add caching headers for all responses
  const cacheHeaders = {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=3600", // 5min cache, 1h stale
    Vary: "Accept-Encoding",
  };

  try {
    const supabase = getSupabaseAdmin();

    // ===========================================
    // Option 1: Get single tract by GEOID
    // ===========================================
    if (geoid) {
      const cleanGeoid = geoid.replace(/[-\s]/g, "").padStart(11, "0");

      const { data, error } = await supabase.rpc(
        "get_tract_with_credits" as never,
        {
          p_geoid: cleanGeoid,
        } as never,
      );

      const rpcData = data as TractRow[] | null;

      if (error) {
        console.error("[MapTracts] GEOID lookup error:", error);
        // Fallback to direct query
        return await directGeoidQuery(supabase, cleanGeoid);
      }

      if (!rpcData || rpcData.length === 0) {
        return NextResponse.json({
          type: "FeatureCollection",
          features: [],
          error: "Tract not found",
        });
      }

      return NextResponse.json(
        {
          type: "FeatureCollection",
          features: [mapRowToFeature(rpcData[0])],
          source: "tract_map_layer",
        },
        { headers: cacheHeaders },
      );
    }

    // ===========================================
    // Option 2: Get tract at coordinates
    // ===========================================
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);

      if (isNaN(latNum) || isNaN(lngNum)) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 },
        );
      }

      const { data: pointData, error } = await supabase.rpc(
        "get_tract_at_point" as never,
        {
          p_lat: latNum,
          p_lng: lngNum,
        } as never,
      );

      const pointRpcData = pointData as TractRow[] | null;

      if (error) {
        console.error("[MapTracts] Coordinate lookup error:", error);
        return NextResponse.json({
          type: "FeatureCollection",
          features: [],
          error: "Point-in-polygon lookup failed",
        });
      }

      if (!pointRpcData || pointRpcData.length === 0) {
        return NextResponse.json({
          type: "FeatureCollection",
          features: [],
          message: "No tract found at coordinates",
        });
      }

      return NextResponse.json(
        {
          type: "FeatureCollection",
          features: [mapRowToFeature(pointRpcData[0])],
          source: "tract_map_layer",
        },
        { headers: cacheHeaders },
      );
    }

    // ===========================================
    // Option 3: Get tracts in bounding box
    // ===========================================
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
      const simplified = searchParams.get("simplified") === "true";
      const centroids = searchParams.get("centroids") === "true";

      if ([minLng, minLat, maxLng, maxLat].some(isNaN)) {
        return NextResponse.json(
          { error: "Invalid bbox format. Use: minLng,minLat,maxLng,maxLat" },
          { status: 400 },
        );
      }

      // Use simplified geometries for zoomed-out view (much faster)
      const rpcFunction = simplified
        ? "get_simplified_tracts_in_bbox"
        : "get_map_tracts_in_bbox";
      console.log(`[MapTracts] Using ${rpcFunction} for bbox query`);

      const { data: bboxData, error } = await supabase.rpc(
        rpcFunction as never,
        {
          p_min_lng: minLng,
          p_min_lat: minLat,
          p_max_lng: maxLng,
          p_max_lat: maxLat,
        } as never,
      );

      const bboxRpcData = bboxData as TractRow[] | null;

      if (error) {
        console.error(`[MapTracts] ${rpcFunction} error:`, error);
        // Fallback to direct query
        return await directBboxQuery(supabase, minLng, minLat, maxLng, maxLat);
      }

      // For centroids mode, return simplified point features
      if (centroids) {
        const centroidFeatures = (bboxRpcData || []).map((row: TractRow) => {
          // Federal programs only - State programs are bonuses
          // NOTE: DDA is NOT a standalone qualifier - only a 30% boost if LIHTC QCT eligible
          const eligible =
            row.has_any_tax_credit ??
            (row.is_lihtc_qct ||
              row.is_oz_designated ||
              row.is_qct ||
              row.is_oz ||
              row.is_nmtc_eligible ||
              row.is_nmtc_high_migration);
          return {
            type: "Feature",
            id: row.geoid,
            properties: {
              geoid: row.geoid,
              has_any_tax_credit: eligible,
              eligible: eligible,
            },
            // Return centroid instead of full geometry
            geometry: row.geom_json
              ? getCentroid(JSON.parse(row.geom_json))
              : null,
          };
        });

        return NextResponse.json(
          {
            type: "FeatureCollection",
            features: centroidFeatures,
            count: centroidFeatures.length,
            source: rpcFunction,
            mode: "centroids",
          },
          { headers: cacheHeaders },
        );
      }

      const features = (bboxRpcData || []).map((row: TractRow) =>
        mapRowToFeature(row),
      );
      console.log(
        `[MapTracts] Returned ${features.length} tracts for bbox (${simplified ? "simplified" : "full"})`,
      );

      return NextResponse.json(
        {
          type: "FeatureCollection",
          features,
          count: features.length,
          source: rpcFunction,
          mode: simplified ? "simplified" : "full",
        },
        { headers: cacheHeaders },
      );
    }

    // No valid parameters
    return NextResponse.json(
      {
        error: "Missing required parameter",
        usage: {
          bbox: "/api/map/tracts?bbox=-90.5,38.5,-89.5,39.5",
          geoid: "/api/map/tracts?geoid=29189010100",
          coordinates: "/api/map/tracts?lat=38.6&lng=-90.2",
        },
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[MapTracts] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracts", details: String(error) },
      { status: 500 },
    );
  }
}

// Normalize row to standard column names (handles both RPC and view data)
function normalizeRow(row: TractRow) {
  // Map old RPC column names to new standard names
  const is_qct = row.is_qct ?? row.is_lihtc_qct ?? false;
  const is_oz = row.is_oz ?? row.is_oz_designated ?? false;
  const is_dda = row.is_dda ?? false;
  const is_nmtc_eligible =
    row.is_nmtc_eligible ?? row.severely_distressed ?? false;
  const mfi_pct = row.mfi_pct ?? row.median_family_income_pct;

  // Calculate has_any_tax_credit - Federal programs only (State programs are bonuses)
  // NMTC (LIC or High Migration), LIHTC QCT, OZ
  // NOTE: DDA is NOT a standalone qualifier - only a 30% boost if LIHTC QCT eligible
  const is_nmtc_high_migration = row.is_nmtc_high_migration ?? false;
  const has_any_tax_credit =
    row.has_any_tax_credit ??
    (is_qct || is_oz || is_nmtc_eligible || is_nmtc_high_migration);

  return {
    ...row,
    is_qct,
    is_oz,
    is_dda,
    is_nmtc_eligible,
    mfi_pct,
    has_any_tax_credit,
  };
}

function buildProgramsArray(row: ReturnType<typeof normalizeRow>): string[] {
  // NOTE: NO HTC or Brownfield - we don't have logic for those yet
  const programs: string[] = [];

  // NMTC: Federal first, then State if applicable
  if (row.is_nmtc_eligible) {
    programs.push("Federal NMTC");
    if (row.has_state_nmtc) {
      programs.push("State NMTC");
    }
  }

  // LIHTC QCT
  if (row.is_qct) {
    programs.push("LIHTC QCT");
    // DDA is ONLY a 30% basis boost - only show if LIHTC QCT eligible
    if (row.is_dda) programs.push("DDA (30% Boost)");
  }

  // Opportunity Zone
  if (row.is_oz) programs.push("Opportunity Zone");

  return programs;
}

function mapRowToFeature(rawRow: TractRow) {
  const row = normalizeRow(rawRow);
  const programs = buildProgramsArray(row);

  return {
    type: "Feature",
    id: row.geoid,
    properties: {
      geoid: row.geoid,
      GEOID: row.geoid,
      // Location
      state_name: row.state_name,
      county_name: row.county_name,
      // Tax credit flags (normalized) - NO HTC or Brownfield
      has_any_tax_credit: row.has_any_tax_credit,
      is_qct: row.is_qct,
      is_oz: row.is_oz,
      is_dda: row.is_dda,
      is_nmtc_eligible: row.is_nmtc_eligible,
      has_state_nmtc: row.has_state_nmtc ?? false,
      severely_distressed: row.severely_distressed ?? false,
      // Legacy aliases for backwards compatibility with frontend
      is_lihtc_qct: row.is_qct,
      is_oz_designated: row.is_oz,
      // Metrics
      stack_score: row.stack_score ?? programs.length,
      poverty_rate: row.poverty_rate,
      mfi_pct: row.mfi_pct,
      unemployment_rate: row.unemployment_rate,
      // Computed
      eligible: row.has_any_tax_credit,
      programs: JSON.stringify(programs),
      program_count: programs.length,
    },
    geometry: row.geom_json ? JSON.parse(row.geom_json) : null,
  };
}

// Calculate centroid from polygon geometry
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCentroid(
  geometry: any,
): { type: "Point"; coordinates: [number, number] } | null {
  if (!geometry || !geometry.coordinates) return null;

  try {
    // Handle MultiPolygon or Polygon
    const coords =
      geometry.type === "MultiPolygon"
        ? geometry.coordinates[0][0] // First polygon, outer ring
        : geometry.coordinates[0]; // Outer ring

    if (!coords || coords.length === 0) return null;

    // Simple centroid calculation (average of all points)
    let sumLng = 0,
      sumLat = 0;
    for (const [lng, lat] of coords) {
      sumLng += lng;
      sumLat += lat;
    }

    return {
      type: "Point",
      coordinates: [sumLng / coords.length, sumLat / coords.length],
    };
  } catch (e) {
    console.error("[MapTracts] Centroid calculation error:", e);
    return null;
  }
}

// Direct query fallback using tract_geometries + master_tax_credit_sot
async function directGeoidQuery(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  cleanGeoid: string,
) {
  console.log("[MapTracts] Using direct query for GEOID:", cleanGeoid);

  const { data, error } = await supabase
    .from("tract_map_layer")
    .select("*")
    .eq("geoid", cleanGeoid)
    .single();

  if (error || !data) {
    console.error("[MapTracts] Direct GEOID query error:", error);
    return NextResponse.json({
      type: "FeatureCollection",
      features: [],
      error: "Tract not found",
    });
  }

  return NextResponse.json({
    type: "FeatureCollection",
    features: [mapRowToFeature(data as TractRow)],
    source: "tract_map_layer",
    mode: "direct",
  });
}

// Direct query fallback for bbox (without PostGIS RPC)
async function directBboxQuery(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  _minLng: number,
  _minLat: number,
  _maxLng: number,
  _maxLat: number,
) {
  console.log("[MapTracts] Using direct bbox query (RPC unavailable)");

  // Query tract_map_layer view - this is a join of tract_geometries + master_tax_credit_sot
  // Note: Without PostGIS RPC, we can't do spatial filtering, so we return all
  // This is a fallback - the RPC function should be created for production use
  // NO LIMIT - return all tracts (the database can handle 85K+ tracts)
  const { data, error } = await supabase.from("tract_map_layer").select("*");

  if (error) {
    console.error("[MapTracts] Direct bbox query error:", error);
    return NextResponse.json({
      type: "FeatureCollection",
      features: [],
      error: "Query failed",
    });
  }

  const features = ((data || []) as TractRow[]).map((row) =>
    mapRowToFeature(row),
  );

  return NextResponse.json({
    type: "FeatureCollection",
    features,
    count: features.length,
    source: "tract_map_layer",
    mode: "direct_fallback",
  });
}
