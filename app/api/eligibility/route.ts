import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tract = searchParams.get('tract');

  if (!tract) {
    return NextResponse.json({ error: 'tract parameter required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const geoid = tract.replace(/[-\s]/g, '').padStart(11, '0');

    const { data, error } = await supabase
      .from('master_tax_credit_sot')
      .select('*')
      .eq('geoid', geoid)
      .single();

    if (error || !data) {
      return NextResponse.json({
        found: false,
        eligible: false,
        tract: geoid,
        programs: [],
        reason: 'Census tract not found in database',
        source: 'master_tax_credit_sot'
      }, { status: 404 });
    }

    const programs: string[] = [];
    if (data.is_nmtc_eligible) programs.push('NMTC');
    if (data.is_lihtc_qct_2025 || data.is_lihtc_qct_2026) programs.push('LIHTC QCT');
    if (data.is_dda_2025 || data.is_dda_2026) programs.push('DDA');
    if (data.is_oz_designated) programs.push('Opportunity Zone');
    if (data.is_severely_distressed) programs.push('Severely Distressed');
    if (data.is_high_opportunity_area) programs.push('High Opportunity Area');
    if (data.has_state_nmtc) programs.push('State NMTC');
    if (data.has_state_htc) programs.push('State HTC');
    if (data.has_brownfield_credit) programs.push('Brownfield');

    return NextResponse.json({
      found: true,
      tract: geoid,
      eligible: programs.length > 0,
      has_any_tax_credit: programs.length > 0,
      programs,
      program_count: programs.length,
      federal: {
        nmtc_eligible: data.is_nmtc_eligible || false,
        lihtc_qct: data.is_lihtc_qct_2025 || data.is_lihtc_qct_2026 || false,
        lihtc_dda: data.is_dda_2025 || data.is_dda_2026 || false,
        opportunity_zone: data.is_oz_designated || false,
        poverty_rate: data.nmtc_poverty_rate ?? 0,
        median_income_pct: data.nmtc_mfi_percent ?? 0,
        unemployment_rate: data.nmtc_unemployment_rate ?? 0,
        severely_distressed: data.is_severely_distressed || false,
      },
      reason: programs.length > 0
        ? 'Qualifies for one or more tax credit programs'
        : 'Does not qualify for any tax credit programs',
      source: 'master_tax_credit_sot'
    });
  } catch (error) {
    console.error('[Eligibility] Error:', error);
    return NextResponse.json({ error: 'Eligibility check failed' }, { status: 500 });
  }
}
