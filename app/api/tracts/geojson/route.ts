import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GeoJSON Tracts API
 * Returns census tract polygons with eligibility data for map rendering
 * 
 * GET /api/tracts/geojson - Load ALL tracts (for initial map)
 * GET /api/tracts/geojson?bbox=-86.6,34.7,-86.5,34.8 - Load tracts in bbox
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get("bbox");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100000"), 100000);

  try {
    // If bbox provided, use spatial query
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
      
      if (!isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat)) {
        const { data, error } = await supabase.rpc("get_tracts_geojson_bbox", {
          min_lng: minLng,
          min_lat: minLat,
          max_lng: maxLng,
          max_lat: maxLat,
          row_limit: Math.min(limit, 5000),
        });

        if (!error && data && data.length > 0) {
          return NextResponse.json(
            { type: "FeatureCollection", features: data },
            { headers: { "Cache-Control": "public, max-age=3600" } }
          );
        }
        
        if (error) {
          console.log("[GeoJSON API] Bbox RPC error:", error.message);
        }
      }
    }

    // No bbox = load ALL tracts for full US view
    console.log(`[GeoJSON API] Loading all tracts (limit: ${limit})...`);
    
    const { data, error } = await supabase.rpc("get_all_tracts_geojson", {
      row_limit: limit,
    });

    if (error) {
      console.error("[GeoJSON API] get_all_tracts_geojson error:", error.message);
      // Fallback - return empty (RPC might not exist yet)
      return NextResponse.json(
        { type: "FeatureCollection", features: [], _error: "RPC not available" },
        { headers: { "Cache-Control": "public, max-age=60" } }
      );
    }

    console.log(`[GeoJSON API] Returning ${data?.length || 0} tracts`);

    return NextResponse.json(
      { type: "FeatureCollection", features: data || [] },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch (err) {
    console.error("[GeoJSON API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch tracts" },
      { status: 500 }
    );
  }
}
