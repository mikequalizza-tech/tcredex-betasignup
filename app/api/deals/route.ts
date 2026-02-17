/**
 * tCredex Deals API
 * CRUD operations for deals with proper auth and org filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { createDealSchema } from "@/lib/api/schemas";
import {
  requireAuth,
  handleAuthError,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

// =============================================================================
// GET /api/deals - List deals with filters or fetch single deal by id
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Fetch single deal by ID
    if (id) {
      // Verify user can access this deal
      await verifyDealAccess(request, user, id, "view");

      // Query deal WITHOUT FK join (avoids Supabase FK relationship issues)
      const { data: dealData, error: dealError } = await supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .single();

      if (dealError || !dealData) {
        console.error("[Deals API] Deal not found:", dealError);
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }

      const typedDeal = dealData as Record<string, unknown>;

      // Query sponsors table separately. Prefer sponsor_id, then fallback to sponsor_organization_id.
      let sponsorData = null;
      const sponsorSelect =
        "id, organization_id, organization_name, organization_type, primary_contact_name, primary_contact_email, primary_contact_phone, woman_owned, minority_owned, veteran_owned, low_income_owned, description, website, year_founded";
      const sponsorId =
        typeof typedDeal.sponsor_id === "string" ? typedDeal.sponsor_id : null;
      const sponsorOrganizationId =
        typeof typedDeal.sponsor_organization_id === "string"
          ? typedDeal.sponsor_organization_id
          : null;

      if (sponsorId) {
        const { data: sponsor } = await supabase
          .from("sponsors")
          .select(sponsorSelect)
          .eq("id", sponsorId)
          .maybeSingle();
        sponsorData = sponsor;
      }

      if (!sponsorData && sponsorOrganizationId) {
        const { data: sponsor } = await supabase
          .from("sponsors")
          .select(sponsorSelect)
          .eq("organization_id", sponsorOrganizationId)
          .maybeSingle();
        sponsorData = sponsor;
      }

      // Include sponsor organization info in response
      const dealWithSponsor = {
        ...typedDeal,
        sponsors: sponsorData, // For backwards compatibility with client code
        sponsor_organization_name:
          sponsorData?.organization_name || typedDeal.sponsor_name,
        sponsor_organization_id:
          sponsorData?.organization_id || typedDeal.sponsor_organization_id,
      };

      return NextResponse.json(
        { deal: dealWithSponsor },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=60", // Cache for 60 seconds
          },
        },
      );
    }

    // List deals with org filtering
    const status = searchParams.get("status");
    const state = searchParams.get("state");
    const program = searchParams.get("program");
    // OPTIMIZATION: Enforce maximum limit to prevent large queries
    const maxLimit = parseInt(process.env.MAX_DEALS_LIMIT || "100");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50"),
      maxLimit,
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query with org filtering based on user type
    // Note: No FK join used - sponsor filtering done via sponsor_id
    let query = supabase
      .from("deals")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // CRITICAL: Filter by organization and role
    if (user.organizationType === "sponsor") {
      // Sponsors see only their own deals
      // Need to join through sponsors table to get organization_id
      // First, get the sponsor_id for this organization
      const { data: sponsorData } = await supabase
        .from("sponsors")
        .select("id")
        .eq("organization_id", user.organizationId)
        .single();

      if (sponsorData) {
        query = query.eq("sponsor_id", sponsorData.id);
      } else {
        // No sponsor record found, return empty
        return NextResponse.json({ deals: [], total: 0, limit, offset });
      }
    } else if (user.organizationType === "cde") {
      // CDEs see: assigned deals + deals they've been invited to + public deals
      const cdeId = await getCdeIdForOrganization(
        supabase,
        user.organizationId,
      );

      // Get deal IDs from match_requests (outreach invitations)
      const invitedDealIds = await getInvitedDealIds(
        supabase,
        user.organizationId,
        "cde",
      );

      const orClauses: string[] = [];
      if (cdeId) orClauses.push(`assigned_cde_id.eq.${cdeId}`);
      if (invitedDealIds.length > 0)
        orClauses.push(`id.in.(${invitedDealIds.join(",")})`);
      orClauses.push("status.in.(available,seeking_capital,matched)");

      query = query.or(orClauses.join(","));
    } else if (user.organizationType === "investor") {
      // Investors see: public deals + deals with their commitments + invited deals
      const investorId = await getInvestorIdForOrganization(
        supabase,
        user.organizationId,
      );

      // Get deal IDs from match_requests (outreach invitations)
      const invitedDealIds = await getInvitedDealIds(
        supabase,
        user.organizationId,
        "investor",
      );

      const orClauses: string[] = [];
      if (investorId) orClauses.push(`investor_id.eq.${investorId}`);
      if (invitedDealIds.length > 0)
        orClauses.push(`id.in.(${invitedDealIds.join(",")})`);
      orClauses.push("status.in.(available,seeking_capital,matched)");

      query = query.or(orClauses.join(","));
    }
    // Admin sees all deals (no filter)

    // Apply additional filters
    if (status) query = query.eq("status", status as never);
    if (state) query = query.eq("state", state);
    if (program) query = query.contains("programs", [program]);

    const { data, error, count } = await query;

    if (error) throw error;

    const dealsRaw = (data || []) as Array<Record<string, unknown>>;
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

    return NextResponse.json(
      {
        deals: enrichedDeals,
        total: count,
        limit,
        offset,
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

// =============================================================================
// POST /api/deals - Create new deal
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require authentication and org admin role
    const user = await requireAuth(request);

    if (user.userRole !== "ORG_ADMIN") {
      return NextResponse.json(
        { error: "Only organization admins can create deals" },
        { status: 403 },
      );
    }

    // Only sponsors can create deals
    if (user.organizationType !== "sponsor") {
      return NextResponse.json(
        { error: "Only sponsors can create deals" },
        { status: 403 },
      );
    }

    const body = await parseBody(request, createDealSchema);
    if (isValidationError(body)) return body;
    const supabase = getSupabaseAdmin();

    // Get sponsor_id for this organization
    const { data: sponsorData } = await supabase
      .from("sponsors")
      .select("id")
      .eq("organization_id", user.organizationId)
      .single();

    if (!sponsorData) {
      return NextResponse.json(
        { error: "Sponsor record not found for your organization" },
        { status: 404 },
      );
    }

    // Insert deal with user's organization as sponsor
    const { data, error } = await supabase
      .from("deals")
      .insert({
        project_name: body.project_name,
        sponsor_id: sponsorData.id, // CRITICAL: Use sponsor_id, not organization_id
        sponsor_organization_id: user.organizationId, // Link deal to org for ownership detection
        sponsor_name: body.sponsor_name,
        programs: body.programs || ["NMTC"],
        program_level: body.program_level || "federal",
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        census_tract: body.census_tract,
        latitude: body.latitude,
        longitude: body.longitude,
        project_type: body.project_type,
        venture_type: body.venture_type,
        project_description: body.project_description,
        total_project_cost: body.total_project_cost,
        nmtc_financing_requested: body.nmtc_financing_requested,
        financing_gap: body.financing_gap,
        jobs_created: body.jobs_created,
        jobs_retained: body.jobs_retained,
        intake_data: body.intake_data || {},
        status: "draft",
        visible: false,
        readiness_score: 0,
        tier: 1,
      } as never)
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await supabase.from("ledger_events").insert({
      actor_type: "human",
      actor_id: user.id,
      entity_type: "deal",
      entity_id: (data as { id: string }).id,
      action: "deal_created",
      payload_json: { project_name: body.project_name },
      hash: generateHash(data as Record<string, unknown>),
    } as never);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

// Simple hash for ledger (in production, use proper chain)
function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
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

async function getCdeIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data: cdeData } = await supabase
    .from("cdes")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  if (cdeData) {
    return (cdeData as { id: string }).id;
  }

  const { data: mergedData } = await supabase
    .from("cdes_merged")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1)
    .single();

  return (mergedData as { id: string } | null)?.id || null;
}

async function getInvestorIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("investors")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  return (data as { id: string } | null)?.id || null;
}
