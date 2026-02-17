/**
 * tCredex Admin API - CDEs Management
 * GET /api/admin/cdes - List all CDEs from cdes_merged (SOT)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireSystemAdmin } from "@/lib/api/auth-middleware";

export const dynamic = "force-dynamic";

interface AdminCDE {
  id: string;
  organizationId: string;
  name: string;
  allocation: number;
  deployed: number;
  available: number;
  activeDeals: number;
  states: string[];
  sectors: string[];
  minDeal: number;
  maxDeal: number;
  status: "active" | "pending" | "paused";
  contact: string;
  email: string;
  year: number;
}

export async function GET(request: NextRequest) {
  try {
    await requireSystemAdmin(request);
    const supabase = getSupabaseAdmin();
    const adminCDEs: AdminCDE[] = [];

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();

    // Fetch from cdes_merged (SOT) — use cde_totals view for aggregated per-CDE data
    // cdes_merged has one row per CDE per allocation year; we want the latest year per CDE
    const { data: cdesData, error: cdesError } = await supabase
      .from("cdes_merged")
      .select(
        `
        id,
        organization_id,
        name,
        year,
        total_allocation,
        amount_deployed,
        amount_remaining,
        primary_states,
        target_sectors,
        min_deal_size,
        max_deal_size,
        primary_contact_name,
        primary_contact_email,
        rural_focus,
        uts_focus,
        minority_focus
      `,
      )
      .order("year", { ascending: false });

    type CDERow = {
      id: string;
      organization_id: string | null;
      name: string | null;
      year: number | null;
      total_allocation: number | null;
      amount_deployed: number | null;
      amount_remaining: number | null;
      primary_states: string[] | null;
      target_sectors: string[] | null;
      min_deal_size: number | null;
      max_deal_size: number | null;
      primary_contact_name: string | null;
      primary_contact_email: string | null;
      rural_focus: boolean | null;
      uts_focus: boolean | null;
      minority_focus: boolean | null;
    };

    const cdes = cdesData as CDERow[] | null;

    if (!cdesError && cdes) {
      // Deduplicate by organization_id — keep only latest year row per CDE
      const seenOrgs = new Set<string>();

      for (const cde of cdes) {
        const orgId = cde.organization_id || cde.id;
        if (seenOrgs.has(orgId)) continue;
        seenOrgs.add(orgId);

        const cdeName = cde.name || "Unknown CDE";

        // Apply search filter
        if (search && !cdeName.toLowerCase().includes(search)) continue;

        // Count active deals for this CDE (check both assigned_cde_id and match_requests)
        let activeDeals = 0;
        const { count } = await supabase
          .from("match_requests")
          .select("*", { count: "exact", head: true })
          .eq("target_id", orgId)
          .eq("target_type", "cde")
          .in("status", ["pending", "accepted"]);
        activeDeals = count || 0;

        adminCDEs.push({
          id: cde.id,
          organizationId: orgId,
          name: cdeName,
          allocation: Number(cde.total_allocation) || 0,
          deployed: Number(cde.amount_deployed) || 0,
          available: Number(cde.amount_remaining) || 0,
          activeDeals,
          states: cde.primary_states || [],
          sectors: cde.target_sectors || [],
          minDeal: Number(cde.min_deal_size) || 0,
          maxDeal: Number(cde.max_deal_size) || 0,
          status: "active",
          contact: cde.primary_contact_name || "",
          email: cde.primary_contact_email || "",
          year: cde.year || 0,
        });
      }
    }

    return NextResponse.json({
      cdes: adminCDEs,
      total: adminCDEs.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
