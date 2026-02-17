import { NextRequest, NextResponse } from "next/server";

/**
 * Compatibility route for legacy callers.
 *
 * Source of truth is /api/geo/tract-lookup (Supabase RPC + SOT table).
 * This route now proxies to tract-lookup and reshapes the response to the
 * historical resolve-tract contract.
 */
export const dynamic = "force-dynamic";

interface TractLookupPayload {
  geoid?: string;
  tract_id?: string;
  coordinates?: [number, number];
  matched_address?: string;
  has_any_tax_credit?: boolean;
  eligible?: boolean;
  programs?: string[];
  source?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address")?.trim() || null;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!address && (!lat || !lng)) {
    return NextResponse.json(
      { error: "Provide either address or lat/lng coordinates" },
      { status: 400 },
    );
  }

  const parsedLat = lat ? Number.parseFloat(lat) : undefined;
  const parsedLng = lng ? Number.parseFloat(lng) : undefined;

  if (!address && (Number.isNaN(parsedLat) || Number.isNaN(parsedLng))) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const proxyParams = new URLSearchParams();
    if (address) {
      proxyParams.set("address", address);
    } else {
      proxyParams.set("lat", String(parsedLat));
      proxyParams.set("lng", String(parsedLng));
    }

    const tractLookupUrl = new URL(
      "/api/geo/tract-lookup",
      request.nextUrl.origin,
    );
    tractLookupUrl.search = proxyParams.toString();

    const tractLookupResponse = await fetch(tractLookupUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const tractLookupData = (await tractLookupResponse
      .json()
      .catch(() => null)) as TractLookupPayload | null;

    if (!tractLookupResponse.ok || !tractLookupData) {
      return NextResponse.json(
        { error: tractLookupData?.error || "Unable to resolve census tract" },
        { status: tractLookupResponse.status || 502 },
      );
    }

    const geoid = normalizeGeoid(
      tractLookupData.tract_id || tractLookupData.geoid,
    );
    if (!geoid) {
      return NextResponse.json(
        { error: "Unable to determine census tract for location" },
        { status: 404 },
      );
    }

    const responseLng = tractLookupData.coordinates?.[0] ?? parsedLng;
    const responseLat = tractLookupData.coordinates?.[1] ?? parsedLat;

    return NextResponse.json({
      tract_id: geoid,
      geoid,
      state_fips: geoid.substring(0, 2),
      county_fips: geoid.substring(2, 5),
      tract_code: geoid.substring(5, 11),
      lat: responseLat,
      lng: responseLng,
      matched_address: tractLookupData.matched_address,
      has_any_tax_credit:
        tractLookupData.has_any_tax_credit ?? tractLookupData.eligible ?? false,
      programs: tractLookupData.programs || [],
      source: tractLookupData.source || "master_tax_credit_sot",
    });
  } catch (error) {
    console.error("[GeoResolveTract] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function normalizeGeoid(value?: string): string | null {
  if (!value) return null;
  const normalized = value.replace(/[-\s]/g, "");
  return /^\d{11}$/.test(normalized) ? normalized : null;
}
