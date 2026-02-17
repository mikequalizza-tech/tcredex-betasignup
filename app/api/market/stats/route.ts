/**
 * GET /api/market/stats
 * Returns real-time market statistics including:
 * - Active CDEs with allocation available
 * - Total allocation available on platform
 * - Active investors
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Query active CDEs with available allocation
    // A CDE is "active" if they have at least one allocation where:
    // - available_on_platform > 0
    // - deployment_deadline is null or > now
    const { data: allocations, error: allocError } = await supabase
      .from("cde_allocations")
      .select("cde_id, available_on_platform, deployment_deadline")
      .gt("available_on_platform", 0);

    if (allocError) {
      console.error("Allocation query error:", allocError);
      // Return zeros if table doesn't exist
      return NextResponse.json({
        activeCDEs: 0,
        totalAllocation: 0,
        activeInvestors: 0,
      });
    }

    // Filter out expired allocations and aggregate
    const now = new Date();
    const activeAllocations = (allocations || []).filter((a) => {
      if (!a.deployment_deadline) return true;
      return new Date(a.deployment_deadline) > now;
    });

    // Count unique CDEs with active allocation
    const uniqueCDEs = new Set(activeAllocations.map((a) => a.cde_id));
    const activeCDEs = uniqueCDEs.size;

    // Sum total available allocation
    const totalAllocation = activeAllocations.reduce((sum, a) => {
      return sum + (parseFloat(String(a.available_on_platform)) || 0);
    }, 0);

    // Count active investors
    const { count: investorCount, error: investorError } = await supabase
      .from("investors")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    if (investorError) {
      console.error("Investor query error:", investorError);
    }

    return NextResponse.json({
      activeCDEs,
      totalAllocation,
      activeInvestors: investorCount || 0,
      // Include allocation count for reference
      totalAllocations: activeAllocations.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
