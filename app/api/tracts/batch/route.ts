/**
 * Batch Tract Lookup API - SOURCE OF TRUTH
 * =========================================
 * Uses: master_tax_credit_sot table
 *
 * POST /api/tracts/batch - Body: { geoids: ["17031010100", ...] }
 * GET /api/tracts/batch?geoids=17031010100,17031010201
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Uses actual column names from master_tax_credit_sot (verified against generated types)

function buildPrograms(tract: {
  is_nmtc_eligible: boolean | null;
  is_lihtc_qct_2025: boolean | null;
  is_oz_designated: boolean | null;
  is_dda_2025: boolean | null;
  has_state_nmtc: boolean | null;
  has_state_htc: boolean | null;
  has_brownfield_credit: boolean | null;
}): string[] {
  const programs: string[] = [];
  if (tract.is_nmtc_eligible) programs.push("Federal NMTC");
  if (tract.is_lihtc_qct_2025) programs.push("LIHTC QCT");
  if (tract.is_oz_designated) programs.push("Opportunity Zone");
  if (tract.is_dda_2025) programs.push("DDA");
  if (tract.has_state_nmtc) programs.push("State NMTC");
  if (tract.has_state_htc) programs.push("State HTC");
  if (tract.has_brownfield_credit) programs.push("Brownfield");
  return programs;
}

async function batchLookup(geoids: string[]) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("master_tax_credit_sot")
    .select(
      "geoid, is_nmtc_eligible, is_lihtc_qct_2025, is_oz_designated, is_dda_2025, has_state_nmtc, has_state_htc, has_brownfield_credit, nmtc_poverty_rate, nmtc_mfi_percent, nmtc_unemployment_rate, stack_score",
    )
    .in("geoid", geoids);

  if (error) {
    console.error("[TractBatch] Query error:", error);
    throw error;
  }

  // Build results map
  const found: Record<string, object> = {};
  const foundGeoids = new Set<string>();

  for (const tract of data || []) {
    foundGeoids.add(tract.geoid);
    const programs = buildPrograms(tract);
    const hasAnyTaxCredit = programs.length > 0;

    found[tract.geoid] = {
      geoid: tract.geoid,
      state_fips: tract.geoid?.substring(0, 2),
      has_any_tax_credit: hasAnyTaxCredit,
      is_nmtc_eligible: tract.is_nmtc_eligible,
      is_qct: tract.is_lihtc_qct_2025,
      is_oz: tract.is_oz_designated,
      is_dda: tract.is_dda_2025,
      has_state_nmtc: tract.has_state_nmtc,
      has_state_htc: tract.has_state_htc,
      has_brownfield_credit: tract.has_brownfield_credit,
      poverty_rate: tract.nmtc_poverty_rate,
      mfi_pct: tract.nmtc_mfi_percent,
      unemployment_rate: tract.nmtc_unemployment_rate,
      stack_score: tract.stack_score,
      programs,
      program_count: programs.length,
      eligible: hasAnyTaxCredit,
    };
  }

  const notFound = geoids.filter((g) => !foundGeoids.has(g));

  return { found, notFound };
}

/**
 * POST /api/tracts/batch
 * Body: { geoids: ["17031010100", "17031010201", ...] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { geoids } = body;

    if (!geoids || !Array.isArray(geoids)) {
      return NextResponse.json(
        { error: "Request body must contain geoids array" },
        { status: 400 },
      );
    }

    if (geoids.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 GEOIDs per request" },
        { status: 400 },
      );
    }

    // Normalize GEOIDs
    const normalizedGeoids = geoids.map((g: string) =>
      String(g).replace(/\D/g, "").padStart(11, "0"),
    );

    const { found, notFound } = await batchLookup(normalizedGeoids);

    return NextResponse.json({
      requested: normalizedGeoids.length,
      found: Object.keys(found).length,
      results: found,
      notFound: notFound.length > 0 ? notFound : undefined,
      source: "master_tax_credit_sot",
    });
  } catch (error) {
    console.error("[TractBatch] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/tracts/batch?geoids=17031010100,17031010201
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const geoidsParam = searchParams.get("geoids");

  if (!geoidsParam) {
    return NextResponse.json(
      {
        error: "geoids parameter required (comma-separated)",
        example: "/api/tracts/batch?geoids=17031010100,17031010201",
      },
      { status: 400 },
    );
  }

  const geoids = geoidsParam
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  if (geoids.length > 100) {
    return NextResponse.json(
      { error: "Maximum 100 GEOIDs via GET. Use POST for larger batches." },
      { status: 400 },
    );
  }

  try {
    // Normalize and lookup
    const normalizedGeoids = geoids.map((g) =>
      g.replace(/\D/g, "").padStart(11, "0"),
    );
    const { found, notFound } = await batchLookup(normalizedGeoids);

    return NextResponse.json({
      requested: normalizedGeoids.length,
      found: Object.keys(found).length,
      results: found,
      notFound: notFound.length > 0 ? notFound : undefined,
      source: "master_tax_credit_sot",
    });
  } catch (error) {
    console.error("[TractBatch] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
