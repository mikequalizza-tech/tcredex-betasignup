/**
 * Map Tracts API - SOURCE OF TRUTH
 * Uses: tract_geometries + master_tax_credit_sot (via tract_map_layer view)
 *
 * Endpoints:
 *   GET /api/map/tracts?bbox=minLng,minLat,maxLng,maxLat  - Get tracts in viewport
 *   GET /api/map/tracts?geoid=12345678901                 - Get single tract
 *   GET /api/map/tracts?lat=39.5&lng=-98.5                - Get tract at coordinates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface TractRow {
  geoid: string;
  geom_json: string;
  has_any_tax_credit?: boolean;
  is_qct?: boolean;
  is_oz?: boolean;
  is_dda?: boolean;
  is_nmtc_eligible?: boolean;
  is_nmtc_high_migration?: boolean;
  is_lihtc_qct?: boolean;
  is_oz_designated?: boolean;
  severely_distressed?: boolean;
  median_family_income_pct?: number;
  state_name?: string;
  county_name?: string;
  has_state_nmtc?: boolean;
  has_state_lihtc?: boolean;
  stack_score?: number;
  poverty_rate?: number;
  mfi_pct?: number;
  unemployment_rate?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const geoid = searchParams.get('geoid');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const cacheHeaders = {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    'Vary': 'Accept-Encoding',
  };

  try {
    const supabase = getSupabaseAdmin();

    // Get single tract by GEOID
    if (geoid) {
      const cleanGeoid = geoid.replace(/[-\s]/g, '').padStart(11, '0');
      const { data, error } = await supabase.rpc('get_tract_with_credits' as never, {
        p_geoid: cleanGeoid
      } as never);

      const rpcData = data as TractRow[] | null;
      if (error || !rpcData || rpcData.length === 0) {
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
      }

      return NextResponse.json({
        type: 'FeatureCollection',
        features: [mapRowToFeature(rpcData[0])]
      }, { headers: cacheHeaders });
    }

    // Get tract at coordinates
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

      const pointRpcData = pointData as TractRow[] | null;
      if (error || !pointRpcData || pointRpcData.length === 0) {
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
      }

      return NextResponse.json({
        type: 'FeatureCollection',
        features: [mapRowToFeature(pointRpcData[0])]
      }, { headers: cacheHeaders });
    }

    // Get tracts in bounding box
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);

      if ([minLng, minLat, maxLng, maxLat].some(isNaN)) {
        return NextResponse.json(
          { error: 'Invalid bbox format. Use: minLng,minLat,maxLng,maxLat' },
          { status: 400 }
        );
      }

      const { data: bboxData, error } = await supabase.rpc('get_map_tracts_in_bbox' as never, {
        p_min_lng: minLng,
        p_min_lat: minLat,
        p_max_lng: maxLng,
        p_max_lat: maxLat
      } as never);

      const bboxRpcData = bboxData as TractRow[] | null;

      if (error) {
        console.error('[MapTracts] bbox error:', error);
        return NextResponse.json({ type: 'FeatureCollection', features: [] });
      }

      const features = (bboxRpcData || []).map((row: TractRow) => mapRowToFeature(row));

      return NextResponse.json({
        type: 'FeatureCollection',
        features,
        count: features.length
      }, { headers: cacheHeaders });
    }

    return NextResponse.json({ error: 'Missing required parameter' }, { status: 400 });
  } catch (error) {
    console.error('[MapTracts] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracts' }, { status: 500 });
  }
}

function normalizeRow(row: TractRow) {
  const is_qct = row.is_qct ?? row.is_lihtc_qct ?? false;
  const is_oz = row.is_oz ?? row.is_oz_designated ?? false;
  const is_dda = row.is_dda ?? false;
  const is_nmtc_eligible = row.is_nmtc_eligible ?? row.severely_distressed ?? false;
  const mfi_pct = row.mfi_pct ?? row.median_family_income_pct;
  const is_nmtc_high_migration = row.is_nmtc_high_migration ?? false;
  const has_any_tax_credit = row.has_any_tax_credit ?? (
    is_qct || is_oz || is_nmtc_eligible || is_nmtc_high_migration
  );

  return { ...row, is_qct, is_oz, is_dda, is_nmtc_eligible, mfi_pct, has_any_tax_credit };
}

function buildProgramsArray(row: ReturnType<typeof normalizeRow>): string[] {
  const programs: string[] = [];
  if (row.is_nmtc_eligible) {
    programs.push('Federal NMTC');
    if (row.has_state_nmtc) programs.push('State NMTC');
  }
  if (row.is_qct) {
    programs.push('LIHTC QCT');
    if (row.is_dda) programs.push('DDA (30% Boost)');
  }
  if (row.is_oz) programs.push('Opportunity Zone');
  return programs;
}

function mapRowToFeature(rawRow: TractRow) {
  const row = normalizeRow(rawRow);
  const programs = buildProgramsArray(row);

  return {
    type: 'Feature',
    id: row.geoid,
    properties: {
      geoid: row.geoid,
      GEOID: row.geoid,
      state_name: row.state_name,
      county_name: row.county_name,
      has_any_tax_credit: row.has_any_tax_credit,
      is_qct: row.is_qct,
      is_oz: row.is_oz,
      is_dda: row.is_dda,
      is_nmtc_eligible: row.is_nmtc_eligible,
      has_state_nmtc: row.has_state_nmtc ?? false,
      severely_distressed: row.severely_distressed ?? false,
      is_lihtc_qct: row.is_qct,
      is_oz_designated: row.is_oz,
      stack_score: row.stack_score ?? programs.length,
      poverty_rate: row.poverty_rate,
      mfi_pct: row.mfi_pct,
      unemployment_rate: row.unemployment_rate,
      eligible: row.has_any_tax_credit,
      programs: JSON.stringify(programs),
      program_count: programs.length
    },
    geometry: row.geom_json ? JSON.parse(row.geom_json) : null
  };
}
