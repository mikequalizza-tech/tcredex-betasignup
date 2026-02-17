/**
 * Eligibility Check API - SOURCE OF TRUTH
 * ========================================
 * Uses: master_tax_credit_sot + tract_geometries (for point-in-polygon)
 *       historic_buildings (for Federal HTC eligibility)
 *
 * GET /api/eligibility?tract=01001020100
 * GET /api/eligibility?lat=38.846&lng=-76.9275
 * GET /api/eligibility?address=4600 Silver Hill Rd, Washington, DC
 *
 * Note: HTC eligibility is PROPERTY-based (National Register), not tract-based
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

interface HistoricBuildingMatch {
  id: number;
  property_name: string;
  street_address: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  status: string | null;
  listed_date: string | null;
  is_nhl: boolean;
  distance_miles?: number;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tract = searchParams.get("tract");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const address = searchParams.get("address");
  const debug = searchParams.get("debug") === "true";

  try {
    const supabase = getSupabaseAdmin();
    let eligibilityData: Record<string, unknown> | null = null;
    let matchedAddress: string | null = null;
    let coordinates: [number, number] | null = null;
    let historicBuildings: HistoricBuildingMatch[] = [];

    // ===============================
    // Option 1: Direct GEOID lookup
    // ===============================
    if (tract) {
      const geoid = tract.replace(/[-\s]/g, "").padStart(11, "0");

      const { data, error } = await supabase
        .from("master_tax_credit_sot")
        .select("*")
        .eq("geoid", geoid)
        .single();

      if (error) {
        console.error("[Eligibility] GEOID lookup error:", error);
      }
      eligibilityData = data;
    }

    // ===============================
    // Option 2: Lat/Lng lookup (point-in-polygon)
    // ===============================
    else if (lat && lng) {
      coordinates = [parseFloat(lng), parseFloat(lat)];

      // Use RPC function for point-in-polygon
      const { data, error } = await supabase.rpc(
        "get_tract_at_point" as never,
        {
          p_lat: coordinates[1],
          p_lng: coordinates[0],
        } as never,
      );

      type RpcResult = { geoid: string }[];
      const rpcData = data as RpcResult | null;

      if (error) {
        console.error("[Eligibility] Point lookup error:", error);
      } else if (rpcData && rpcData.length > 0) {
        // Get full data from master_tax_credit_sot
        const { data: sotData } = await supabase
          .from("master_tax_credit_sot")
          .select("*")
          .eq("geoid", rpcData[0].geoid)
          .single();

        eligibilityData = sotData;
      }
    }

    // ===============================
    // Option 3: Address lookup (geocode then point-in-polygon)
    // ===============================
    else if (address) {
      // Census Bureau geocoder (free, no API key)
      const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
      const geocodeResponse = await fetch(geocodeUrl);

      if (!geocodeResponse.ok) {
        return NextResponse.json(
          { error: "Geocoding service unavailable" },
          { status: 503 },
        );
      }

      const geocodeData = await geocodeResponse.json();
      const match = geocodeData?.result?.addressMatches?.[0];

      if (!match) {
        return NextResponse.json(
          {
            found: false,
            error: "Address not found",
            address,
          },
          { status: 404 },
        );
      }

      matchedAddress = match.matchedAddress;
      coordinates = [match.coordinates.x, match.coordinates.y];

      // Use RPC for point-in-polygon
      const { data: rpcData2, error } = await supabase.rpc(
        "get_tract_at_point" as never,
        {
          p_lat: coordinates[1],
          p_lng: coordinates[0],
        } as never,
      );

      type RpcResult2 = { geoid: string }[];
      const tractData = rpcData2 as RpcResult2 | null;

      if (error) {
        console.error("[Eligibility] Address point lookup error:", error);
      } else if (tractData && tractData.length > 0) {
        // Get full data from master_tax_credit_sot
        const { data: sotData } = await supabase
          .from("master_tax_credit_sot")
          .select("*")
          .eq("geoid", tractData[0].geoid)
          .single();

        eligibilityData = sotData;
      }
    } else {
      return NextResponse.json(
        {
          error: "Provide tract, lat/lng, or address",
        },
        { status: 400 },
      );
    }

    // ===============================
    // HTC Check: Search historic_buildings by address or coordinates
    // ===============================
    if (address || matchedAddress) {
      // Extract street number and name for better matching
      const searchAddr = matchedAddress || address || "";

      // Try to extract just the street address part (before city/state)
      const streetPart = searchAddr.split(",")[0].trim();

      // Also try matching on city if we can extract it
      const parts = searchAddr.split(",").map((p) => p.trim());
      const city = parts.length > 1 ? parts[1] : null;

      // Build search - look for street address match in same city/state
      let query = supabase
        .from("historic_buildings")
        .select(
          "id, property_name, street_address, city, state, category, status, listed_date, is_nhl",
        )
        .eq("status", "Listed");

      // Search by street address pattern
      if (streetPart) {
        // Extract just the number and first word of street name for loose match
        const streetMatch = streetPart.match(/^(\d+)\s+(.+)/);
        if (streetMatch) {
          const streetNum = streetMatch[1];
          const streetName = streetMatch[2].split(/\s+/)[0]; // First word of street name
          query = query.ilike("street_address", `${streetNum}%${streetName}%`);
        } else {
          query = query.ilike("street_address", `%${streetPart}%`);
        }
      }

      // Filter by city if available
      if (city) {
        query = query.ilike("city", `%${city}%`);
      }

      const { data: htcData, error: htcError } = await query.limit(10);

      if (htcError) {
        console.error("[Eligibility] HTC search error:", htcError);
      }

      if (htcData && htcData.length > 0) {
        historicBuildings = htcData as HistoricBuildingMatch[];
      }
    }

    // Fallback: search by coordinates if we have them and no address match (within 0.25 miles)
    if (coordinates && historicBuildings.length === 0) {
      const { data: nearbyData } = await supabase.rpc(
        "get_historic_buildings_near_point" as never,
        {
          p_lat: coordinates[1],
          p_lng: coordinates[0],
          p_radius_miles: 0.25,
          p_limit: 5,
        } as never,
      );

      const nearbyResults = nearbyData as HistoricBuildingMatch[] | null;
      if (nearbyResults && nearbyResults.length > 0) {
        historicBuildings = nearbyResults;
      }
    }

    // Not found
    if (!eligibilityData) {
      return NextResponse.json(
        {
          found: false,
          eligible: false,
          has_any_tax_credit: false,
          programs: [],
          reason: "Location not found in database",
          coordinates,
          matched_address: matchedAddress,
          source: "master_tax_credit_sot",
        },
        { status: 404 },
      );
    }

    // Build response
    return NextResponse.json(
      formatEligibilityResponse(
        eligibilityData,
        coordinates,
        matchedAddress,
        historicBuildings,
        debug,
      ),
    );
  } catch (error) {
    console.error("[Eligibility] Error:", error);
    return NextResponse.json(
      {
        error: "Eligibility check failed",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

function formatEligibilityResponse(
  data: Record<string, unknown>,
  coordinates: [number, number] | null,
  matchedAddress: string | null,
  historicBuildings: HistoricBuildingMatch[],
  debug: boolean,
) {
  // Build programs array
  // Federal programs are qualifiers, State programs are bonuses (only if federal qualifies)
  const programs: string[] = [];

  // HTC: Property is on National Register of Historic Places
  const isHtcEligible = historicBuildings.length > 0;
  const isNHL = historicBuildings.some((b) => b.is_nhl);

  if (isHtcEligible) {
    programs.push("Federal HTC");
    if (isNHL) {
      programs.push("National Historic Landmark");
    }
  }

  // NMTC: Federal NMTC or High Migration are qualifiers, State NMTC is a bonus
  const isNmtcEligible = data.is_nmtc_eligible || data.is_nmtc_high_migration;
  if (data.is_nmtc_eligible) {
    programs.push("Federal NMTC");
  }
  if (data.is_nmtc_high_migration) {
    programs.push("High Migration NMTC");
  }
  // State NMTC is bonus only if Federal NMTC or High Migration eligible
  if (isNmtcEligible && data.has_state_nmtc) {
    programs.push("State NMTC");
  }

  // LIHTC: HOA OR QCT OR DDA = Eligible, QCT/DDA = 30% Basis Boost
  const isLihtcEligible =
    data.is_high_opportunity_area ||
    data.is_lihtc_qct_2025 ||
    data.is_lihtc_qct_2026 ||
    data.is_dda_2025 ||
    data.is_dda_2026;
  const hasLihtcBoost =
    data.is_lihtc_qct_2025 ||
    data.is_lihtc_qct_2026 ||
    data.is_dda_2025 ||
    data.is_dda_2026;

  if (isLihtcEligible) {
    programs.push("LIHTC Eligible");
    if (data.is_high_opportunity_area) programs.push("High Opportunity Area");
    if (data.is_lihtc_qct_2025) programs.push("LIHTC QCT 2025");
    if (data.is_lihtc_qct_2026) programs.push("LIHTC QCT 2026");
    if (hasLihtcBoost) {
      programs.push("30% Basis Boost");
    }
    if (data.has_state_lihtc) {
      programs.push("State LIHTC");
    }
  }

  // Opportunity Zone - standalone qualifier
  if (data.is_oz_designated) {
    programs.push("Opportunity Zone");
  }

  const geoid = data.geoid as string;

  const response: Record<string, unknown> = {
    found: true,
    tract: geoid,
    state_fips: geoid?.substring(0, 2),

    // Primary eligibility flag (recalculated without HTC/Brownfield)
    eligible: programs.length > 0,
    has_any_tax_credit: programs.length > 0,

    // All programs
    programs,
    program_count: programs.length,
    stack_score: data.stack_score,

    // Federal programs (normalized names for API consumers)
    federal: {
      nmtc_eligible: data.is_nmtc_eligible || false,
      // LIHTC: HOA OR QCT OR DDA = Eligible
      lihtc_eligible: isLihtcEligible,
      lihtc_high_opportunity_area: data.is_high_opportunity_area || false,
      lihtc_qct: data.is_lihtc_qct_2025 || data.is_lihtc_qct_2026 || false,
      lihtc_qct_2025: data.is_lihtc_qct_2025 || false,
      lihtc_qct_2026: data.is_lihtc_qct_2026 || false,
      lihtc_dda: data.is_dda_2025 || data.is_dda_2026 || false,
      lihtc_dda_2025: data.is_dda_2025 || false,
      lihtc_dda_2026: data.is_dda_2026 || false,
      lihtc_basis_boost: hasLihtcBoost,
      opportunity_zone: data.is_oz_designated || false,
      htc_eligible: isHtcEligible,
      htc_is_nhl: isNHL,
      // Tribal and poverty data
      is_tribal_area: data.is_tribal_area || false,
      is_rcap: data.is_rcap || false,
      is_acp: data.is_acp || false,
      // Use nmtc_* prefixed columns from database
      poverty_rate: data.nmtc_poverty_rate ?? 0,
      poverty_qualifies: data.nmtc_poverty_rate
        ? Number(data.nmtc_poverty_rate) >= 20
        : false,
      median_income_pct: data.nmtc_mfi_percent ?? 0,
      income_qualifies: data.nmtc_mfi_percent
        ? Number(data.nmtc_mfi_percent) <= 80
        : false,
      unemployment_rate: data.nmtc_unemployment_rate ?? 0,
      unemployment_qualifies: data.nmtc_unemployment_rate
        ? Number(data.nmtc_unemployment_rate) >= 6
        : false, // 1.5x ~4% national avg
      metro_status: data.metro_status || "N/A",
      severely_distressed:
        data.is_severely_distressed ||
        (data.is_nmtc_eligible &&
          ((data.nmtc_poverty_rate && Number(data.nmtc_poverty_rate) >= 30) ||
            (data.nmtc_mfi_percent && Number(data.nmtc_mfi_percent) <= 60))),
    },

    // HTC: Historic buildings at/near this address (property-based, not tract-based)
    htc: {
      eligible: isHtcEligible,
      is_national_historic_landmark: isNHL,
      buildings: historicBuildings,
      note: isHtcEligible
        ? "Property appears on National Register of Historic Places - eligible for 20% Federal HTC"
        : "No matching historic properties found. Search manually at nps.gov/subjects/nationalregister",
    },

    // State programs
    state: {
      nmtc: data.has_state_nmtc || false,
      lihtc: data.has_state_lihtc || false,
      htc: data.has_state_htc || false,
      brownfield: data.has_brownfield_credit || false,
    },

    // Location info
    location: {
      state: data.state_name || "",
      county: data.county_name || "",
      metro_status: data.metro_status || "N/A",
    },

    // Reason
    reason:
      programs.length > 0
        ? "Qualifies for one or more tax credit programs"
        : "Does not qualify for any tax credit programs",

    source: "master_tax_credit_sot",
  };

  if (coordinates) response.coordinates = coordinates;
  if (matchedAddress) response.matched_address = matchedAddress;

  if (debug) {
    response._debug = {
      raw_data: data,
      timestamp: new Date().toISOString(),
    };
  }

  return response;
}
