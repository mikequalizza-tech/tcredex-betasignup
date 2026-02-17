/**
 * Tracts API - SOURCE OF TRUTH
 * =============================
 * Uses: master_tax_credit_sot table
 *
 * GET /api/tracts?summary=true           - National summary with all states
 * GET /api/tracts?state=IL               - Tracts for a state
 * GET /api/tracts?stats=true             - Aggregate statistics
 * GET /api/tracts?search=true&minPoverty=30  - Search with criteria
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const summary = searchParams.get("summary");
  const stats = searchParams.get("stats");
  const search = searchParams.get("search");

  try {
    const supabase = getSupabaseAdmin();

    // ===============================
    // Option 1: Aggregate statistics
    // ===============================
    if (stats === "true" || stats === "1") {
      const { data: statsData, error } = await supabase.rpc(
        "get_tract_statistics" as never,
      );

      if (error) {
        console.error("[TractAPI] Stats error:", error);
        // Fallback to direct query
        const { data: countData } = await supabase
          .from("master_tax_credit_sot")
          .select("geoid", { count: "exact", head: true });

        const { data: eligibleData } = await supabase
          .from("master_tax_credit_sot")
          .select("geoid", { count: "exact", head: true })
          .eq("has_any_tax_credit", true);

        return NextResponse.json({
          source: "master_tax_credit_sot",
          total_tracts: countData || 0,
          eligible_tracts: eligibleData || 0,
        });
      }

      type StatsResult = Record<string, unknown>;
      const data = (statsData || {}) as StatsResult;

      return NextResponse.json({
        source: "master_tax_credit_sot",
        ...data,
      });
    }

    // ===============================
    // Option 2: Search with criteria
    // ===============================
    if (search === "true" || search === "1") {
      const minPoverty = searchParams.get("minPoverty")
        ? parseFloat(searchParams.get("minPoverty")!)
        : undefined;
      const maxPoverty = searchParams.get("maxPoverty")
        ? parseFloat(searchParams.get("maxPoverty")!)
        : undefined;
      const minMfi = searchParams.get("minIncome")
        ? parseFloat(searchParams.get("minIncome")!)
        : undefined;
      const maxMfi = searchParams.get("maxIncome")
        ? parseFloat(searchParams.get("maxIncome")!)
        : undefined;
      const nmtcOnly = searchParams.get("nmtcOnly") === "true";
      const qctOnly = searchParams.get("qctOnly") === "true";
      const ozOnly = searchParams.get("ozOnly") === "true";
      const limit = parseInt(searchParams.get("limit") || "100");

      let query = supabase
        .from("master_tax_credit_sot")
        .select(
          "geoid, state_fips, poverty_rate, mfi_pct, unemployment_rate, is_nmtc_eligible, is_qct, is_oz, is_dda, has_any_tax_credit, stack_score",
        );

      if (minPoverty !== undefined)
        query = query.gte("poverty_rate", minPoverty);
      if (maxPoverty !== undefined)
        query = query.lte("poverty_rate", maxPoverty);
      if (minMfi !== undefined) query = query.gte("mfi_pct", minMfi);
      if (maxMfi !== undefined) query = query.lte("mfi_pct", maxMfi);
      if (nmtcOnly) query = query.eq("is_nmtc_eligible", true);
      if (qctOnly) query = query.eq("is_qct", true);
      if (ozOnly) query = query.eq("is_oz", true);

      const { data: searchData, error } = await query.limit(limit);

      type SearchRow = {
        geoid: string;
        state_fips: string;
        poverty_rate: number;
        mfi_pct: number;
        unemployment_rate: number;
        is_nmtc_eligible: boolean;
        is_qct: boolean;
        is_oz: boolean;
        is_dda: boolean;
        has_any_tax_credit: boolean;
        stack_score: number;
      };
      const data = searchData as SearchRow[] | null;

      if (error) {
        console.error("[TractAPI] Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
      }

      return NextResponse.json({
        criteria: {
          minPoverty,
          maxPoverty,
          minMfi,
          maxMfi,
          nmtcOnly,
          qctOnly,
          ozOnly,
          limit,
        },
        count: data?.length || 0,
        tracts: data || [],
        source: "master_tax_credit_sot",
      });
    }

    // ===============================
    // Option 3: State summary
    // ===============================
    if (summary === "true" || summary === "1") {
      const { data: summaryData, error } = await supabase.rpc(
        "get_state_summaries" as never,
      );

      if (error) {
        console.error("[TractAPI] Summary error:", error);
        return NextResponse.json(
          { error: "Failed to get summaries" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        source: "master_tax_credit_sot",
        states: summaryData,
      });
    }

    // ===============================
    // Option 4: Specific state data
    // ===============================
    if (state) {
      const stateUpper = state.toUpperCase();
      const stateFips =
        STATE_ABBR_TO_FIPS[stateUpper] || stateUpper.padStart(2, "0");

      // No limit - return all tracts for state
      const { data: stateData, error } = await supabase
        .from("master_tax_credit_sot")
        .select(
          "geoid, poverty_rate, mfi_pct, unemployment_rate, is_nmtc_eligible, is_qct, is_oz, is_dda, has_any_tax_credit, stack_score",
        )
        .eq("state_fips", stateFips);

      type StateRow = {
        geoid: string;
        poverty_rate: number;
        mfi_pct: number;
        unemployment_rate: number;
        is_nmtc_eligible: boolean;
        is_qct: boolean;
        is_oz: boolean;
        is_dda: boolean;
        has_any_tax_credit: boolean;
        stack_score: number;
      };
      const data = stateData as StateRow[] | null;

      if (error) {
        console.error("[TractAPI] State query error:", error);
        return NextResponse.json(
          { error: "State query failed" },
          { status: 500 },
        );
      }

      const eligible = data?.filter((t) => t.has_any_tax_credit) || [];

      return NextResponse.json({
        state: stateUpper,
        state_fips: stateFips,
        summary: {
          total_tracts: data?.length || 0,
          eligible_tracts: eligible.length,
          eligibility_rate: data?.length
            ? ((eligible.length / data.length) * 100).toFixed(1)
            : 0,
        },
        tractCount: data?.length || 0,
        tracts: data?.slice(0, 100) || [],
        _note:
          (data?.length || 0) > 100
            ? `Showing first 100 of ${data?.length} tracts`
            : undefined,
        source: "master_tax_credit_sot",
      });
    }

    // ===============================
    // Default: API info
    // ===============================
    return NextResponse.json({
      message: "tCredex Tracts API - Source of Truth",
      endpoints: {
        summary: "/api/tracts?summary=true",
        state: "/api/tracts?state=IL",
        stats: "/api/tracts?stats=true",
        search: "/api/tracts?search=true&minPoverty=30&limit=50",
        lookup: "/api/tracts/lookup?geoid=17031010100",
        geoid: "/api/tracts/17031010100",
      },
      source: "master_tax_credit_sot",
    });
  } catch (error) {
    console.error("[TractAPI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// State abbreviation to FIPS mapping
const STATE_ABBR_TO_FIPS: Record<string, string> = {
  AL: "01",
  AK: "02",
  AZ: "04",
  AR: "05",
  CA: "06",
  CO: "08",
  CT: "09",
  DE: "10",
  DC: "11",
  FL: "12",
  GA: "13",
  HI: "15",
  ID: "16",
  IL: "17",
  IN: "18",
  IA: "19",
  KS: "20",
  KY: "21",
  LA: "22",
  ME: "23",
  MD: "24",
  MA: "25",
  MI: "26",
  MN: "27",
  MS: "28",
  MO: "29",
  MT: "30",
  NE: "31",
  NV: "32",
  NH: "33",
  NJ: "34",
  NM: "35",
  NY: "36",
  NC: "37",
  ND: "38",
  OH: "39",
  OK: "40",
  OR: "41",
  PA: "42",
  RI: "44",
  SC: "45",
  SD: "46",
  TN: "47",
  TX: "48",
  UT: "49",
  VT: "50",
  VA: "51",
  WA: "53",
  WV: "54",
  WI: "55",
  WY: "56",
  PR: "72",
};
