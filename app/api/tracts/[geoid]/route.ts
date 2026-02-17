/**
 * Single Tract API - SOURCE OF TRUTH
 * ===================================
 * Uses: master_tax_credit_sot table
 *
 * GET /api/tracts/17031010100
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ geoid: string }> }
) {
  const { geoid } = await params;

  // Normalize GEOID
  const normalizedGeoid = geoid.replace(/\D/g, '').padStart(11, '0');

  if (normalizedGeoid.length !== 11) {
    return NextResponse.json(
      { error: 'Invalid GEOID format. Must be 11 digits.', geoid: normalizedGeoid },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: tractData, error } = await supabase
      .from('master_tax_credit_sot')
      .select('*')
      .eq('geoid', normalizedGeoid)
      .single();

    type TractRow = {
      geoid: string;
      state_fips: string;
      has_any_tax_credit: boolean;
      is_nmtc_eligible: boolean;
      is_qct: boolean;
      is_oz: boolean;
      is_dda: boolean;
      has_state_nmtc: boolean;
      has_state_htc: boolean;
      has_brownfield_credit: boolean;
      poverty_rate: number;
      mfi_pct: number;
      unemployment_rate: number;
      stack_score: number;
    };
    const data = tractData as TractRow | null;

    if (error || !data) {
      return NextResponse.json(
        { error: 'Tract not found', geoid: normalizedGeoid },
        { status: 404 }
      );
    }

    // Build programs array
    const programs: string[] = [];
    if (data.is_nmtc_eligible) programs.push('Federal NMTC');
    if (data.is_qct) programs.push('LIHTC QCT');
    if (data.is_oz) programs.push('Opportunity Zone');
    if (data.is_dda) programs.push('DDA');
    if (data.has_state_nmtc) programs.push('State NMTC');
    if (data.has_state_htc) programs.push('State HTC');
    if (data.has_brownfield_credit) programs.push('Brownfield');

    return NextResponse.json({
      geoid: data.geoid,
      state_fips: data.state_fips,
      // Tax credit flags
      has_any_tax_credit: data.has_any_tax_credit,
      is_nmtc_eligible: data.is_nmtc_eligible,
      is_qct: data.is_qct,
      is_oz: data.is_oz,
      is_dda: data.is_dda,
      has_state_nmtc: data.has_state_nmtc,
      has_state_htc: data.has_state_htc,
      has_brownfield_credit: data.has_brownfield_credit,
      // Metrics
      poverty_rate: data.poverty_rate,
      mfi_pct: data.mfi_pct,
      unemployment_rate: data.unemployment_rate,
      stack_score: data.stack_score,
      // Programs
      programs,
      program_count: programs.length,
      // Legacy format for backwards compatibility
      flags: {
        nmtc_eligible: data.is_nmtc_eligible,
        lihtc_qct: data.is_qct,
        opportunity_zone: data.is_oz,
        dda: data.is_dda,
        state_nmtc: data.has_state_nmtc,
        state_htc: data.has_state_htc,
        brownfield: data.has_brownfield_credit
      },
      // Source
      source: 'master_tax_credit_sot'
    });

  } catch (error) {
    console.error('[TractByGeoid] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
