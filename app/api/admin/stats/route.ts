/**
 * tCredex Admin API - Dashboard Stats
 * GET /api/admin/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireSystemAdmin } from "@/lib/api/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    await requireSystemAdmin(request);
    const supabase = getSupabaseAdmin();

    // Gather top-level stats
    const [userCount, sponsorCount, cdeCount, investorCount, dealsResult] =
      await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("sponsors").select("id", { count: "exact", head: true }),
        supabase.from("cdes").select("id", { count: "exact", head: true }), // Platform-registered CDEs (cdes_merged has multi-year rows)
        supabase.from("investors").select("id", { count: "exact", head: true }),
        supabase
          .from("deals")
          .select(
            "id, status, created_at, updated_at, programs, nmtc_financing_requested",
          )
          .order("updated_at", { ascending: false }),
      ]);

    const deals = (dealsResult.data || []) as Array<{
      id: string;
      status: string | null;
      created_at: string | null;
      updated_at: string | null;
      programs: string[] | null;
      nmtc_financing_requested: number | null;
    }>;

    const totalDeals = deals.length;

    const byStatus: Record<string, number> = {};
    for (const deal of deals) {
      const status = deal.status || "unknown";
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    const byProgram: Record<string, number> = {};
    for (const deal of deals) {
      const programs = deal.programs || [];
      if (!programs.length) {
        byProgram.Unknown = (byProgram.Unknown || 0) + 1;
        continue;
      }
      for (const program of programs) {
        byProgram[program] = (byProgram[program] || 0) + 1;
      }
    }

    const totalAllocation = deals
      .filter((deal) =>
        [
          "available",
          "seeking_capital",
          "matched",
          "closing",
          "closed",
        ].includes(deal.status || ""),
      )
      .reduce((sum, deal) => sum + (deal.nmtc_financing_requested || 0), 0);

    const pendingReview = byStatus.submitted || 0;
    const needsInfo = byStatus.under_review || 0;

    const recentActivity = deals.slice(0, 10).map((deal) => ({
      dealId: deal.id,
      action: `Status: ${deal.status || "unknown"}`,
      timestamp: deal.updated_at || deal.created_at || new Date().toISOString(),
    }));

    const orgCount = {
      count:
        (sponsorCount.count || 0) +
        (cdeCount.count || 0) +
        (investorCount.count || 0),
    };

    // Get recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: recentSignups } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    return NextResponse.json({
      overview: {
        totalDeals,
        totalUsers: userCount.count || 0,
        totalOrganizations: orgCount.count || 0,
        totalAllocation,
        recentSignups: recentSignups || 0,
      },
      actionRequired: {
        pendingReview,
        needsInfo,
        expiringOffers: 0,
      },
      dealsByStatus: byStatus,
      dealsByProgram: byProgram,
      recentActivity,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
