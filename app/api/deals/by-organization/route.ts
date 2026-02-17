/**
 * Deals by Organization API
 * SIMPLIFIED: Uses simplified schema tables (sponsors, investors, users, cdes_merged) - no organization FK joins
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireAuth } from "@/lib/api/auth-middleware";

// GET - Fetch deals for an organization
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const orgType = searchParams.get("orgType"); // optional override

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    // Non-admins can only request deals for their own organization
    if (user.organizationType !== "admin" && orgId !== user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // If orgType is provided, use it directly. Otherwise, try to determine from entity tables.
    let organizationType = orgType || user.organizationType;

    if (!organizationType) {
      // Try to find organization type by checking each simplified table
      const { data: sponsor } = await supabase
        .from("sponsors")
        .select("id")
        .eq("organization_id", orgId)
        .single();

      if (sponsor) {
        organizationType = "sponsor";
      } else {
        const { data: cde } = await supabase
          .from("cdes_merged")
          .select("id")
          .eq("organization_id", orgId)
          .single();

        if (cde) {
          organizationType = "cde";
        } else {
          const { data: investor } = await supabase
            .from("investors")
            .select("id")
            .eq("organization_id", orgId)
            .single();

          if (investor) {
            organizationType = "investor";
          }
        }
      }
    }

    let query = supabase.from("deals").select("*");

    // Build conditions based on organization type
    if (organizationType === "sponsor") {
      // For sponsors, look up sponsor_id from sponsors
      const { data: sponsorData } = await supabase
        .from("sponsors")
        .select("id")
        .eq("organization_id", orgId)
        .single();

      if (sponsorData) {
        // Show ALL deals for sponsors including drafts — Projects page needs them
        query = query.eq("sponsor_id", (sponsorData as { id: string }).id);
      } else {
        return NextResponse.json({ deals: [] });
      }
    } else if (organizationType === "cde") {
      // For CDEs: assigned deals + outreach-invited deals
      // Collect ALL possible IDs for this CDE across tables to catch match_requests
      // that may reference cdes.id, cdes.organization_id, or cdes_merged.id
      const allCdeIds = await getAllCdeIds(supabase, orgId);
      const invitedDealIds = await getInvitedDealIdsMulti(
        supabase,
        allCdeIds,
        "cde",
      );

      const orClauses: string[] = [];
      for (const cid of allCdeIds) {
        orClauses.push(`assigned_cde_id.eq.${cid}`);
      }
      if (invitedDealIds.length > 0)
        orClauses.push(`id.in.(${invitedDealIds.join(",")})`);

      if (orClauses.length === 0) {
        return NextResponse.json({ deals: [] });
      }
      query = query.or(orClauses.join(","));
    } else if (organizationType === "investor") {
      // For investors: assigned deals + outreach-invited deals
      const { data: investorData } = await supabase
        .from("investors")
        .select("id")
        .eq("organization_id", orgId)
        .single();

      const invitedDealIds = await getInvitedDealIds(
        supabase,
        orgId,
        "investor",
      );

      const orClauses: string[] = [];
      if (investorData)
        orClauses.push(`investor_id.eq.${(investorData as { id: string }).id}`);
      if (invitedDealIds.length > 0)
        orClauses.push(`id.in.(${invitedDealIds.join(",")})`);

      if (orClauses.length === 0) {
        return NextResponse.json({ deals: [] });
      }
      query = query.or(orClauses.join(","));
    } else {
      // Admin or unknown - return all visible deals
      query = query.eq("visible", true);
    }

    const { data: deals, error } = await query.order("updated_at", {
      ascending: false,
    });

    if (error) {
      console.error("[Deals by Org] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch deals" },
        { status: 500 },
      );
    }

    const dealsRaw = (deals || []) as Array<Record<string, unknown>>;
    const sponsorById = new Map<string, Record<string, unknown>>();
    const sponsorByOrgId = new Map<string, Record<string, unknown>>();
    const sponsorSelect =
      "id, organization_id, organization_name, organization_type, primary_contact_name, primary_contact_email, primary_contact_phone, woman_owned, minority_owned, veteran_owned, low_income_owned, description, website, year_founded";

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
        .select(sponsorSelect)
        .in("id", sponsorIds);
      for (const sponsor of (sponsorsById || []) as Array<
        Record<string, unknown>
      >) {
        if (typeof sponsor.id === "string") {
          sponsorById.set(sponsor.id, sponsor);
        }
        if (typeof sponsor.organization_id === "string") {
          sponsorByOrgId.set(sponsor.organization_id, sponsor);
        }
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
        .select(sponsorSelect)
        .in("organization_id", sponsorOrgIds);
      for (const sponsor of (sponsorsByOrg || []) as Array<
        Record<string, unknown>
      >) {
        if (typeof sponsor.id === "string") {
          sponsorById.set(sponsor.id, sponsor);
        }
        if (typeof sponsor.organization_id === "string") {
          sponsorByOrgId.set(sponsor.organization_id, sponsor);
        }
      }
    }

    const enrichedDeals = dealsRaw.map((deal) => {
      const sponsor =
        (typeof deal.sponsor_id === "string"
          ? sponsorById.get(deal.sponsor_id)
          : undefined) ||
        (typeof deal.sponsor_organization_id === "string"
          ? sponsorByOrgId.get(deal.sponsor_organization_id)
          : undefined) ||
        null;

      return {
        ...deal,
        sponsors: sponsor,
        sponsor_organization_name:
          sponsor?.organization_name ||
          deal.sponsor_organization_name ||
          deal.sponsor_name,
        sponsor_organization_id:
          sponsor?.organization_id || deal.sponsor_organization_id,
      };
    });

    return NextResponse.json({ deals: enrichedDeals });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function getInvitedDealIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
  targetType: "cde" | "investor",
): Promise<string[]> {
  const { data } = await supabase
    .from("match_requests")
    .select("deal_id")
    .eq("target_id", organizationId)
    .eq("target_type", targetType)
    .in("status", ["pending", "accepted"]);

  if (!data || data.length === 0) return [];
  return [
    ...new Set((data as Array<{ deal_id: string }>).map((r) => r.deal_id)),
  ];
}

/**
 * Collect ALL possible IDs for a CDE from cdes_merged (SOT).
 * cdes_merged has multiple rows per CDE (one per allocation year), each with a unique UUIDv5 id.
 * Outreach may store any of these as match_requests.target_id.
 */
async function getAllCdeIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string[]> {
  const ids = new Set<string>([organizationId]);

  const { data: mergedRows } = await supabase
    .from("cdes_merged")
    .select("id, organization_id")
    .eq("organization_id", organizationId);

  for (const row of (mergedRows || []) as Array<{
    id: string;
    organization_id: string;
  }>) {
    if (row.id) ids.add(row.id);
    if (row.organization_id) ids.add(row.organization_id);
  }

  return [...ids];
}

/**
 * Find invited deal IDs checking match_requests against multiple possible target IDs.
 */
async function getInvitedDealIdsMulti(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  targetIds: string[],
  targetType: "cde" | "investor",
): Promise<string[]> {
  if (targetIds.length === 0) return [];

  const { data } = await supabase
    .from("match_requests")
    .select("deal_id")
    .in("target_id", targetIds)
    .eq("target_type", targetType)
    .in("status", ["pending", "accepted"]);

  if (!data || data.length === 0) return [];
  return [
    ...new Set((data as Array<{ deal_id: string }>).map((r) => r.deal_id)),
  ];
}
