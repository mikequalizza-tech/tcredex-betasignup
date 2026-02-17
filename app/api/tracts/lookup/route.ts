/**
 * Tract Lookup API - SOURCE OF TRUTH
 * ===================================
 * Uses: master_tax_credit_sot table
 *
 * GET /api/tracts/lookup?geoid=17031010100
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const geoid = searchParams.get("geoid");

  if (!geoid) {
    return NextResponse.json(
      {
        error: "GEOID parameter required",
        example: "/api/tracts/lookup?geoid=17031010100",
      },
      { status: 400 },
    );
  }

  // Normalize GEOID (pad to 11 chars if needed)
  const normalizedGeoid = geoid.replace(/\D/g, "").padStart(11, "0");

  if (normalizedGeoid.length !== 11) {
    return NextResponse.json(
      {
        error:
          "Invalid GEOID format. Must be 11 digits (state + county + tract)",
        geoid: normalizedGeoid,
      },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: tractData, error } = await supabase
      .from("master_tax_credit_sot")
      .select("*")
      .eq("geoid", normalizedGeoid)
      .single();

    type TractRow = {
      geoid: string;
      has_any_tax_credit: boolean;
      is_nmtc_eligible: boolean;
      is_lihtc_qct_2025: boolean;
      is_oz_designated: boolean;
      is_dda_2025: boolean;
      has_state_nmtc: boolean;
      has_state_htc: boolean;
      has_brownfield_credit: boolean;
      poverty_rate: number;
      mfi_percent: number;
      unemployment_rate: number;
      stack_score: number;
    };
    const data = tractData as TractRow | null;

    if (error || !data) {
      // Not found in database
      const stateFips = normalizedGeoid.substring(0, 2);

      return NextResponse.json({
        geoid: normalizedGeoid,
        state_fips: stateFips,
        found: false,
        eligible: false,
        has_any_tax_credit: false,
        programs: [],
        _note: "Tract not found in master_tax_credit_sot table",
        source: "master_tax_credit_sot",
      });
    }

    // Build programs array (using actual column names from SOT)
    const programs: string[] = [];
    if (data.is_nmtc_eligible) programs.push("Federal NMTC");
    if (data.is_lihtc_qct_2025) programs.push("LIHTC QCT");
    if (data.is_oz_designated) programs.push("Opportunity Zone");
    if (data.is_dda_2025) programs.push("DDA");
    if (data.has_state_nmtc) programs.push("State NMTC");
    if (data.has_state_htc) programs.push("State HTC");
    if (data.has_brownfield_credit) programs.push("Brownfield");

    return NextResponse.json({
      geoid: data.geoid,
      state_fips: data.geoid?.substring(0, 2),
      found: true,
      // Tax credit flags (normalized names for API consumers)
      eligible: data.has_any_tax_credit,
      has_any_tax_credit: data.has_any_tax_credit,
      is_nmtc_eligible: data.is_nmtc_eligible,
      is_qct: data.is_lihtc_qct_2025,
      is_oz: data.is_oz_designated,
      is_dda: data.is_dda_2025,
      has_state_nmtc: data.has_state_nmtc,
      has_state_htc: data.has_state_htc,
      has_brownfield_credit: data.has_brownfield_credit,
      // Metrics
      poverty_rate: data.poverty_rate,
      mfi_pct: data.mfi_percent,
      unemployment_rate: data.unemployment_rate,
      stack_score: data.stack_score,
      // Programs
      programs,
      program_count: programs.length,
      // Source
      source: "master_tax_credit_sot",
    });
  } catch (error) {
    console.error("[TractLookup] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", geoid: normalizedGeoid },
      { status: 500 },
    );
  }
}
