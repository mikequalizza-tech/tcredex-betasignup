/**
 * Tract Geometry API - SOURCE OF TRUTH
 * =====================================
 * Uses: tract_geometries + master_tax_credit_sot (via RPC functions)
 *
 * The census_tracts table is DEPRECATED - do not use!
 *
 * GET /api/geo/tract-geometry?geoid=12345678901
 * GET /api/geo/tract-geometry?lat=38.6&lng=-90.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface TractResult {
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
  const geoid = searchParams.get('geoid');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!geoid && (!lat || !lng)) {
    return NextResponse.json(
      { error: 'Either geoid or lat/lng required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Option 1: Get by GEOID
    if (geoid) {
      const cleanGeoid = geoid.replace(/[-\s]/g, '').padStart(11, '0');

      const { data, error } = await supabase.rpc('get_tract_with_credits' as never, {
        p_geoid: cleanGeoid
      } as never);

      const rpcData = data as TractResult[] | null;

      if (error || !rpcData || rpcData.length === 0) {
        return NextResponse.json({
          found: false,
          geoid: cleanGeoid,
          message: 'Tract not found in database'
        });
      }

      const tract = rpcData[0];
      return formatTractResponse(tract);
    }

    // Option 2: Get by coordinates (lat/lng)
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);

      if (isNaN(latNum) || isNaN(lngNum)) {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
      }

      const { data: pointData, error } = await supabase.rpc('get_tract_at_point' as never, {
        p_lat: latNum,
        p_lng: lngNum
      } as never);

      const pointRpcData = pointData as TractResult[] | null;

      if (error || !pointRpcData || pointRpcData.length === 0) {
        return NextResponse.json({
          found: false,
          message: 'No tract found at coordinates',
          coordinates: { lat: latNum, lng: lngNum }
        });
      }

      const tract = pointRpcData[0];
      return formatTractResponse(tract);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  } catch (error) {
    console.error('[TractGeometry] Error:', error);
    return NextResponse.json(
      {
        found: false,
        error: 'Failed to fetch tract geometry',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function formatTractResponse(tract: TractResult) {
  const geometry = tract.geom_json ? JSON.parse(tract.geom_json) : null;
  const programs = buildProgramsArray(tract);

  return NextResponse.json({
    found: true,
    geoid: tract.geoid,
    geometry,
    // SOT fields
    has_any_tax_credit: tract.has_any_tax_credit,
    is_qct: tract.is_qct,
    is_oz: tract.is_oz,
    is_dda: tract.is_dda,
    is_nmtc_eligible: tract.is_nmtc_eligible,
    has_state_nmtc: tract.has_state_nmtc,
    has_state_htc: tract.has_state_htc,
    has_brownfield_credit: tract.has_brownfield_credit,
    stack_score: tract.stack_score,
    // Metrics
    poverty_rate: tract.poverty_rate,
    mfi_pct: tract.mfi_pct,
    unemployment_rate: tract.unemployment_rate,
    // Legacy aliases
    eligible: tract.has_any_tax_credit,
    povertyRate: tract.poverty_rate,
    mfiPct: tract.mfi_pct,
    // Programs array
    programs,
    // GeoJSON feature
    feature: {
      type: 'Feature',
      id: tract.geoid,
      properties: {
        geoid: tract.geoid,
        GEOID: tract.geoid,
        has_any_tax_credit: tract.has_any_tax_credit,
        is_qct: tract.is_qct,
        is_oz: tract.is_oz,
        is_dda: tract.is_dda,
        is_nmtc_eligible: tract.is_nmtc_eligible,
        has_state_nmtc: tract.has_state_nmtc,
        has_state_htc: tract.has_state_htc,
        has_brownfield_credit: tract.has_brownfield_credit,
        stack_score: tract.stack_score,
        // Legacy
        eligible: tract.has_any_tax_credit,
        is_lihtc_qct: tract.is_qct,
        is_oz_designated: tract.is_oz,
        poverty_rate: tract.poverty_rate,
        mfi_pct: tract.mfi_pct,
        programs: JSON.stringify(programs)
      },
      geometry
    }
  });
}

function buildProgramsArray(tract: TractResult): string[] {
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
