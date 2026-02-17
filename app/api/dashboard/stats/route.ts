/**
 * Dashboard Stats API
 * Returns real-time statistics for the dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Get sponsor_id if user is a sponsor
    let sponsorId: string | null = null;
    if (user.organizationType === "sponsor") {
      const { data: sponsorData } = await supabase
        .from("sponsors")
        .select("id")
        .eq("organization_id", user.organizationId)
        .single();
      sponsorId = sponsorData?.id || null;
    }

    // Get total deals for sponsor
    let totalDeals = 0;
    let totalAllocation = 0;
    let inClosing = 0;
    let matched = 0;

    if (sponsorId) {
      interface DealRow {
        id: string;
        status: string;
        nmtc_financing_requested: number | null;
        programs: string[] | null;
        total_project_cost: number | null;
      }

      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select(
          "id, status, nmtc_financing_requested, programs, total_project_cost",
        )
        .eq("sponsor_id", sponsorId);

      if (!dealsError && dealsData) {
        const typedDeals = dealsData as unknown as DealRow[];
        totalDeals = typedDeals.length;
        inClosing = typedDeals.filter((d) => d.status === "closing").length;
        matched = typedDeals.filter((d) => d.status === "matched").length;

        // Calculate total allocation — use nmtc_financing_requested or total_project_cost
        totalAllocation = typedDeals.reduce((sum: number, deal) => {
          return (
            sum +
            (Number(deal.nmtc_financing_requested) ||
              Number(deal.total_project_cost) ||
              0)
          );
        }, 0);
      }
    }

    // OPTIMIZATION: Parallelize independent queries
    const [
      { count: activeCDEsCount },
      { count: activeInvestorsCount },
      { data: cdesData },
    ] = await Promise.all([
      // Get total active CDEs with allocation
      supabase
        .from("cdes_merged")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gt("amount_remaining", 0),
      // Get total active investors (investors table doesn't have status column)
      supabase.from("investors").select("*", { count: "exact", head: true }),
      // Calculate total NMTC allocation available (sum of all active CDEs)
      supabase
        .from("cdes_merged")
        .select("amount_remaining")
        .eq("status", "active")
        .gt("amount_remaining", 0),
    ]);

    const totalNMTCAvailable =
      cdesData?.reduce((sum, cde) => {
        return sum + (Number(cde.amount_remaining) || 0);
      }, 0) || 0;

    return NextResponse.json(
      {
        stats: {
          totalDeals,
          totalAllocation,
          inClosing,
          matched,
          activeCDEs: activeCDEsCount || 0,
          activeInvestors: activeInvestorsCount || 0,
          totalNMTCAvailable,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30", // Cache for 30 seconds
        },
      },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
