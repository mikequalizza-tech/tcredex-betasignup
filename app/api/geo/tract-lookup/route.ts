import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

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

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    const { data, error } = await supabase.rpc('get_tract_at_point' as never, {
      p_lat: latNum,
      p_lng: lngNum
    } as never);

    const rpcData = data as TractResult[] | null;

    if (error) {
      console.error('[TractLookup] Database error:', error);
      return NextResponse.json({ error: 'Database lookup failed' }, { status: 500 });
    }

    if (!rpcData || rpcData.length === 0) {
      return NextResponse.json({
        error: 'No census tract found at this location',
        coordinates: [lngNum, latNum]
      }, { status: 404 });
    }

    const tract = rpcData[0];
    const programs: string[] = [];
    if (tract.is_nmtc_eligible) programs.push('Federal NMTC');
    if (tract.is_qct) programs.push('LIHTC QCT');
    if (tract.is_oz) programs.push('Opportunity Zone');
    if (tract.is_dda) programs.push('DDA');
    if (tract.has_state_nmtc) programs.push('State NMTC');
    if (tract.has_state_htc) programs.push('State HTC');
    if (tract.has_brownfield_credit) programs.push('Brownfield');

    return NextResponse.json({
      geoid: tract.geoid,
      tract_id: tract.geoid,
      coordinates: [lngNum, latNum],
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
        unemployment_rate: tract.unemployment_rate
      },
      state: {
        nmtc: tract.has_state_nmtc,
        htc: tract.has_state_htc,
        brownfield: tract.has_brownfield_credit
      },
      source: 'master_tax_credit_sot'
    });
  } catch (error) {
    console.error('[TractLookup] Error:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}
