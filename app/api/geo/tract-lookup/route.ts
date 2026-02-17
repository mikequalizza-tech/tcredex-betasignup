/**
 * Tract Lookup API - SOURCE OF TRUTH
 * ===================================
 * Uses: tract_geometries + master_tax_credit_sot (via get_tract_at_point RPC)
 *
 * GET /api/geo/tract-lookup?lat=38.846&lng=-76.9275
 * GET /api/geo/tract-lookup?address=4600 Silver Hill Rd, Washington, DC
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface TractResult {
  geoid: string;
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
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const address = searchParams.get('address');

  const supabase = getSupabaseAdmin();

  // If address provided, geocode first (still need Census geocoder for address→coords)
  if (address) {
    try {
      const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;

      const geocodeResponse = await fetch(geocodeUrl);
      if (!geocodeResponse.ok) {
        return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 });
      }

      const geocodeData = await geocodeResponse.json();
      const match = geocodeData?.result?.addressMatches?.[0];

      if (!match) {
        return NextResponse.json({ error: 'Address not found' }, { status: 404 });
      }

      // Use get_tract_at_point RPC for point-in-polygon lookup
      const { data, error } = await supabase.rpc('get_tract_at_point' as never, {
        p_lat: match.coordinates.y,
        p_lng: match.coordinates.x
      } as never);

      const rpcData = data as TractResult[] | null;

      if (error || !rpcData || rpcData.length === 0) {
        return NextResponse.json({
          error: 'Census tract not found for this location',
          coordinates: [match.coordinates.x, match.coordinates.y]
        }, { status: 404 });
      }

      const tract = rpcData[0];
      return NextResponse.json({
        geoid: tract.geoid,
        tract_id: tract.geoid,
        matched_address: match.matchedAddress,
        coordinates: [match.coordinates.x, match.coordinates.y],
        ...formatEligibilityResponse(tract),
        source: 'master_tax_credit_sot'
      });

    } catch (error) {
      console.error('[TractLookup] Address lookup error:', error);
      return NextResponse.json({ error: 'Failed to process address' }, { status: 500 });
    }
  }

  // Direct lat/lng lookup
  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required, or provide address' }, { status: 400 });
  }

  try {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    const { data: coordData, error } = await supabase.rpc('get_tract_at_point' as never, {
      p_lat: latNum,
      p_lng: lngNum
    } as never);

    const coordRpcData = coordData as TractResult[] | null;

    if (error) {
      console.error('[TractLookup] Database error:', error);
      return NextResponse.json({ error: 'Database lookup failed' }, { status: 500 });
    }

    if (!coordRpcData || coordRpcData.length === 0) {
      return NextResponse.json({
        error: 'No census tract found at this location',
        coordinates: [lngNum, latNum]
      }, { status: 404 });
    }

    const tract = coordRpcData[0];
    return NextResponse.json({
      geoid: tract.geoid,
      tract_id: tract.geoid,
      coordinates: [lngNum, latNum],
      ...formatEligibilityResponse(tract),
      source: 'master_tax_credit_sot'
    });

  } catch (error) {
    console.error('[TractLookup] Error:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}

function buildPrograms(tract: TractResult): string[] {
  const programs: string[] = [];
  if (tract.is_nmtc_eligible) programs.push('Federal NMTC');
  if (tract.is_qct) programs.push('LIHTC QCT');
  if (tract.is_oz) programs.push('Opportunity Zone');
  if (tract.is_dda) programs.push('DDA');
  if (tract.has_state_nmtc) programs.push('State NMTC');
  if (tract.has_state_htc) programs.push('State HTC');
  if (tract.has_brownfield_credit) programs.push('Brownfield');
  return programs;
}

function formatEligibilityResponse(tract: TractResult) {
  const programs = buildPrograms(tract);

  return {
    eligible: tract.has_any_tax_credit,
    has_any_tax_credit: tract.has_any_tax_credit,
    programs,
    program_count: programs.length,
    stack_score: tract.stack_score,
    federal: {
      nmtc_eligible: tract.is_nmtc_eligible,
      lihtc_qct: tract.is_qct,
      lihtc_dda: tract.is_dda,
      opportunity_zone: tract.is_oz,
      poverty_rate: tract.poverty_rate,
      median_income_pct: tract.mfi_pct,
      income_qualifies: tract.mfi_pct ? tract.mfi_pct <= 80 : false,
      poverty_qualifies: tract.poverty_rate ? tract.poverty_rate >= 20 : false,
      unemployment_rate: tract.unemployment_rate
    },
    state: {
      nmtc: tract.has_state_nmtc,
      htc: tract.has_state_htc,
      brownfield: tract.has_brownfield_credit
    }
  };
}
