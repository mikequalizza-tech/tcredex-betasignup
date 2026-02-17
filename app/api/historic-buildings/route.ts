import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Historic Buildings API
 * ======================
 * Search and retrieve historic building data from the 101K+ SOT database
 *
 * Endpoints:
 *   GET /api/historic-buildings?address=123 Main St
 *   GET /api/historic-buildings?lat=40.7&lng=-74.0
 *   GET /api/historic-buildings?zip=10001
 *   GET /api/historic-buildings?state=NY&limit=100
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const zip = searchParams.get("zip");
  const state = searchParams.get("state");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const supabase = getSupabaseAdmin();

    // Search by address (fuzzy match)
    if (address) {
      const { data, error } = await supabase
        .from("historic_buildings")
        .select("*")
        .or(
          `address.ilike.%${address.replace(/[,\s]+/g, "%")}%,street_address.ilike.%${address.replace(/[,\s]+/g, "%")}%,property_name.ilike.%${address}%`,
        )
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        buildings: data || [],
        count: data?.length || 0,
        search_type: "address",
        query: address,
      });
    }

    // Search by coordinates (within radius)
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusMiles = parseFloat(searchParams.get("radius") || "1");

      if (isNaN(latNum) || isNaN(lngNum)) {
        return NextResponse.json(
          { error: "Invalid coordinates" },
          { status: 400 },
        );
      }

      // Use PostGIS to find buildings within radius
      const { data, error } = await supabase.rpc(
        "get_historic_buildings_near_point" as never,
        {
          p_lat: latNum,
          p_lng: lngNum,
          p_radius_miles: radiusMiles,
          p_limit: limit,
        } as never,
      );

      const rpcData = data as Record<string, unknown>[] | null;

      if (error) {
        // Fallback to simple query if RPC doesn't exist
        const { data: fallbackData, error: _fallbackError } = await supabase
          .from("historic_buildings")
          .select("*")
          .limit(limit);

        return NextResponse.json({
          buildings: fallbackData || [],
          count: fallbackData?.length || 0,
          search_type: "coordinates_fallback",
          coordinates: { lat: latNum, lng: lngNum },
        });
      }

      return NextResponse.json({
        buildings: rpcData || [],
        count: rpcData?.length || 0,
        search_type: "coordinates",
        coordinates: { lat: latNum, lng: lngNum },
        radius_miles: radiusMiles,
      });
    }

    // Search by ZIP code
    if (zip) {
      const { data, error } = await supabase
        .from("historic_buildings")
        .select("*")
        .or(`zip_code.eq.${zip},postal_code.eq.${zip}`)
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        buildings: data || [],
        count: data?.length || 0,
        search_type: "zip_code",
        zip_code: zip,
      });
    }

    // Search by state
    if (state) {
      const { data, error } = await supabase
        .from("historic_buildings")
        .select("*")
        .or(`state.ilike.${state},state_abbr.ilike.${state}`)
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        buildings: data || [],
        count: data?.length || 0,
        search_type: "state",
        state: state,
      });
    }

    // No search parameters - return usage info
    return NextResponse.json(
      {
        error: "Missing search parameters",
        usage: {
          address: "/api/historic-buildings?address=123 Main St",
          coordinates: "/api/historic-buildings?lat=40.7&lng=-74.0&radius=1",
          zip: "/api/historic-buildings?zip=10001",
          state: "/api/historic-buildings?state=NY&limit=100",
        },
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[HistoricBuildings] API Error:", error);
    return NextResponse.json(
      { error: "Failed to search historic buildings", details: String(error) },
      { status: 500 },
    );
  }
}

// POST endpoint for bulk lookups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses, coordinates } = body;

    if (!addresses && !coordinates) {
      return NextResponse.json(
        { error: "Missing addresses or coordinates array" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const results = [];

    // Bulk address lookup
    if (addresses && Array.isArray(addresses)) {
      for (const address of addresses.slice(0, 50)) {
        // Limit to 50 per request
        const { data, error } = await supabase
          .from("historic_buildings")
          .select("*")
          .or(
            `address.ilike.%${address.replace(/[,\s]+/g, "%")}%,street_address.ilike.%${address.replace(/[,\s]+/g, "%")}%`,
          )
          .limit(5);

        results.push({
          query: address,
          buildings: data || [],
          count: data?.length || 0,
          error: error?.message,
        });
      }
    }

    return NextResponse.json({
      results,
      total_queries: results.length,
      search_type: "bulk",
    });
  } catch (error) {
    console.error("[HistoricBuildings] Bulk API Error:", error);
    return NextResponse.json(
      { error: "Bulk lookup failed", details: String(error) },
      { status: 500 },
    );
  }
}
