/**
 * tCredex Admin API - Deals Management
 * GET /api/admin/deals - List all deals with filters
 * POST /api/admin/deals/bulk - Bulk actions
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireSystemAdmin } from "@/lib/api/auth-middleware";
import { DealStatus } from "@/lib/deals";

export async function GET(request: NextRequest) {
  try {
    await requireSystemAdmin(request);
    const supabase = getSupabaseAdmin();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as DealStatus | null;
    const program = searchParams.get("program");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("deals")
      .select(
        `
        id,
        project_name,
        sponsor_name,
        sponsor_id,
        sponsor_organization_id,
        programs,
        status,
        nmtc_financing_requested,
        city,
        state,
        census_tract,
        created_at,
        updated_at
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (program) {
      query = query.contains("programs", [program]);
    }
    if (search) {
      query = query.or(
        `project_name.ilike.%${search}%,sponsor_name.ilike.%${search}%`,
      );
    }

    const { data: dealsData, count, error } = await query;

    if (error) {
      console.error("Admin deals query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch deals" },
        { status: 500 },
      );
    }

    type DealRow = {
      id: string;
      project_name: string;
      sponsor_name: string | null;
      sponsor_id: string | null;
      sponsor_organization_id: string | null;
      programs: string[];
      status: string;
      nmtc_financing_requested: number | null;
      city: string | null;
      state: string | null;
      census_tract: string | null;
      created_at: string;
      updated_at: string;
    };

    const deals = dealsData as DealRow[] | null;
    const dealsRaw = deals || [];
    const sponsorById = new Map<string, Record<string, unknown>>();
    const sponsorByOrgId = new Map<string, Record<string, unknown>>();
    const sponsorIds = Array.from(
      new Set(
        dealsRaw
          .map((deal) => deal.sponsor_id)
          .filter((value): value is string => typeof value === "string"),
      ),
    );
    if (sponsorIds.length > 0) {
      const { data: sponsorsById } = await supabase
        .from("sponsors")
        .select("id, organization_id, organization_name")
        .in("id", sponsorIds);
      for (const sponsor of (sponsorsById || []) as Array<
        Record<string, unknown>
      >) {
        if (typeof sponsor.id === "string")
          sponsorById.set(sponsor.id, sponsor);
        if (typeof sponsor.organization_id === "string")
          sponsorByOrgId.set(sponsor.organization_id, sponsor);
      }
    }
    const sponsorOrgIds = Array.from(
      new Set(
        dealsRaw
          .map((deal) => deal.sponsor_organization_id)
          .filter(
            (value): value is string =>
              typeof value === "string" && !sponsorByOrgId.has(value),
          ),
      ),
    );
    if (sponsorOrgIds.length > 0) {
      const { data: sponsorsByOrg } = await supabase
        .from("sponsors")
        .select("id, organization_id, organization_name")
        .in("organization_id", sponsorOrgIds);
      for (const sponsor of (sponsorsByOrg || []) as Array<
        Record<string, unknown>
      >) {
        if (typeof sponsor.id === "string")
          sponsorById.set(sponsor.id, sponsor);
        if (typeof sponsor.organization_id === "string")
          sponsorByOrgId.set(sponsor.organization_id, sponsor);
      }
    }

    // Format response
    const formatted = dealsRaw.map((deal) => {
      const sponsor =
        (typeof deal.sponsor_id === "string"
          ? sponsorById.get(deal.sponsor_id)
          : undefined) ||
        (typeof deal.sponsor_organization_id === "string"
          ? sponsorByOrgId.get(deal.sponsor_organization_id)
          : undefined);
      return {
        id: deal.id,
        projectName: deal.project_name,
        sponsorName:
          sponsor?.organization_name || deal.sponsor_name || "Unknown Sponsor",
        programs: deal.programs,
        status: deal.status,
        allocation: deal.nmtc_financing_requested || 0,
        location:
          deal.city && deal.state ? `${deal.city}, ${deal.state}` : null,
        censusTract: deal.census_tract,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
      };
    });

    return NextResponse.json({
      deals: formatted,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
