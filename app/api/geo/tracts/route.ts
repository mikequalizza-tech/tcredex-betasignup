/**
 * Tract Geometries API - SOURCE OF TRUTH
 * =======================================
 * Uses: tract_geometries + master_tax_credit_sot (via tract_map_layer view)
 *
 * The census_tracts table is DEPRECATED - do not use!
 *
 * GET /api/geo/tracts?bbox=-90.5,38.5,-89.5,39.5
 * GET /api/geo/tracts?geoid=29189010100
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

interface TractRow {
  geoid: string;
  geom_json: string;
  has_any_tax_credit: boolean;
  is_qct: boolean;
  is_oz: boolean;
  is_dda: boolean;
  is_nmtc_eligible: boolean;
  has_state_nmtc: boolean;
  has_state_htc: boolean;
  has_brownfield_credit: boolean;
  stack_score: number;
  poverty_rate?: number;
  mfi_pct?: number;
  unemployment_rate?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get("bbox");
  const geoid = searchParams.get("geoid");

  try {
    const supabase = getSupabaseAdmin();

    // Option 1: Get by bounding box
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);

      if ([minLng, minLat, maxLng, maxLat].some(isNaN)) {
        return NextResponse.json(
          { error: "Invalid bbox format. Use: minLng,minLat,maxLng,maxLat" },
          { status: 400 },
        );
      }

      const { data, error } = await supabase.rpc(
        "get_tracts_in_bbox" as never,
        {
          p_min_lng: minLng,
          p_min_lat: minLat,
          p_max_lng: maxLng,
          p_max_lat: maxLat,
        } as never,
      );

      if (error) {
        console.error("[GeoTracts] BBox error:", error);
        return NextResponse.json({ type: "FeatureCollection", features: [] });
      }

      const features = ((data as TractRow[] | null) || []).map(
        (row: TractRow) => mapRowToFeature(row),
      );
      console.log(`[GeoTracts] Returned ${features.length} tracts`);

      return NextResponse.json({
        type: "FeatureCollection",
        features,
        source: "tract_map_layer",
      });
    }

    // Option 2: Get single tract by GEOID
    if (geoid) {
      const cleanGeoid = geoid.replace(/[-\s]/g, "").padStart(11, "0");

      const { data: geoidData, error } = await supabase.rpc(
        "get_tract_with_credits" as never,
        {
          p_geoid: cleanGeoid,
        } as never,
      );

      const tractData = geoidData as TractRow[] | null;

      if (error || !tractData || tractData.length === 0) {
        return NextResponse.json({ type: "FeatureCollection", features: [] });
      }

      return NextResponse.json({
        type: "FeatureCollection",
        features: [mapRowToFeature(tractData[0])],
        source: "tract_map_layer",
      });
    }

    // No valid params
    return NextResponse.json(
      {
        error: "Missing required parameter",
        usage: {
          bbox: "/api/geo/tracts?bbox=-90.5,38.5,-89.5,39.5",
          geoid: "/api/geo/tracts?geoid=29189010100",
        },
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[GeoTracts] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tract geometries", details: String(error) },
      { status: 500 },
    );
  }
}

function buildProgramsArray(row: Partial<TractRow>): string[] {
  const programs: string[] = [];
  if (row.is_nmtc_eligible) programs.push("Federal NMTC");
  if (row.is_qct) programs.push("LIHTC QCT");
  if (row.is_oz) programs.push("Opportunity Zone");
  if (row.is_dda) programs.push("DDA");
  if (row.has_state_nmtc) programs.push("State NMTC");
  if (row.has_state_htc) programs.push("State HTC");
  if (row.has_brownfield_credit) programs.push("Brownfield");
  return programs;
}

function mapRowToFeature(row: TractRow) {
  const programs = buildProgramsArray(row);

  return {
    type: "Feature",
    id: row.geoid,
    properties: {
      geoid: row.geoid,
      GEOID: row.geoid,
      // SOT flags
      has_any_tax_credit: row.has_any_tax_credit,
      is_qct: row.is_qct,
      is_oz: row.is_oz,
      is_dda: row.is_dda,
      is_nmtc_eligible: row.is_nmtc_eligible,
      has_state_nmtc: row.has_state_nmtc,
      has_state_htc: row.has_state_htc,
      has_brownfield_credit: row.has_brownfield_credit,
      // Legacy aliases
      eligible: row.has_any_tax_credit,
      is_lihtc_qct: row.is_qct,
      is_oz_designated: row.is_oz,
      // Metrics
      stack_score: row.stack_score,
      poverty_rate: row.poverty_rate,
      mfi_pct: row.mfi_pct,
      povertyRate: row.poverty_rate?.toFixed(1),
      medianIncomePct: row.mfi_pct?.toFixed(0),
      programs: JSON.stringify(programs),
      program_count: programs.length,
    },
    geometry: row.geom_json ? JSON.parse(row.geom_json) : null,
  };
}
