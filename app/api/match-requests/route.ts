import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MATCH_REQUEST_LIMITS,
  type MatchTargetType,
  type MatchRequestStatus,
} from "@/lib/types/match-request";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { matchRequestCreateSchema } from "@/lib/api/schemas";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/match-requests
 *
 * Get match requests with optional filters.
 * Query params:
 * - sponsorId: Filter by sponsor
 * - dealId: Filter by deal
 * - targetType: Filter by 'cde' or 'investor'
 * - targetId: Filter by target
 * - status: Filter by status
 * - includeSlots: Include slot availability info (for sponsors)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const sponsorId = searchParams.get("sponsorId");
    const dealId = searchParams.get("dealId");
    const targetType = searchParams.get("targetType") as MatchTargetType | null;
    const targetId = searchParams.get("targetId");
    const status = searchParams.get("status") as MatchRequestStatus | null;
    const includeSlots = searchParams.get("includeSlots") === "true";
    const effectiveSponsorId = sponsorId;

    if (user.organizationType === "sponsor") {
      const mySponsorId = await getSponsorIdForOrganization(
        user.organizationId,
      );
      if (!mySponsorId) {
        return NextResponse.json(
          { error: "Sponsor profile not found" },
          { status: 403 },
        );
      }
      if (effectiveSponsorId && effectiveSponsorId !== mySponsorId) {
        return NextResponse.json(
          { error: "You can only access your own match requests" },
          { status: 403 },
        );
      }
    }

    if (dealId) {
      await verifyDealAccess(request, user, dealId, "view");
    }

    // No organizations table — read sponsor org name from sponsors table directly
    let query = supabase.from("match_requests").select(`
      *,
      deals:deal_id (id, project_name),
      sponsors:sponsor_id (id, organization_id, organization_name)
    `);

    if (user.organizationType === "sponsor") {
      const mySponsorId = await getSponsorIdForOrganization(
        user.organizationId,
      );
      query = query.eq("sponsor_id", mySponsorId);
    } else if (effectiveSponsorId) {
      query = query.eq("sponsor_id", effectiveSponsorId);
    }
    if (dealId) query = query.eq("deal_id", dealId);
    if (targetType) query = query.eq("target_type", targetType);
    if (targetId) query = query.eq("target_id", targetId);
    if (status) query = query.eq("status", status);
    if (user.organizationType === "cde") {
      query = query
        .eq("target_type", "cde")
        .eq("target_org_id", user.organizationId);
    }
    if (user.organizationType === "investor") {
      query = query
        .eq("target_type", "investor")
        .eq("target_org_id", user.organizationId);
    }

    query = query.order("created_at", { ascending: false });

    const { data: requests, error } = await query;

    if (error) throw error;

    // If slots info requested and we have a sponsorId, calculate availability
    let slots = null;
    if (includeSlots && effectiveSponsorId) {
      slots = await calculateRequestSlots(effectiveSponsorId);
    } else if (includeSlots && user.organizationType === "sponsor") {
      const mySponsorId = await getSponsorIdForOrganization(
        user.organizationId,
      );
      if (mySponsorId) {
        slots = await calculateRequestSlots(mySponsorId);
      }
    }

    return NextResponse.json({
      success: true,
      data: requests || [],
      slots,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/match-requests
 *
 * Create a new match request. Enforces the 3-request limit.
 * Body:
 * - dealId: string (required)
 * - targetType: 'cde' | 'investor' (required)
 * - targetId: string (required)
 * - message: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (
      user.organizationType !== "sponsor" &&
      user.organizationType !== "admin"
    ) {
      return NextResponse.json(
        { error: "Only sponsors can create match requests" },
        { status: 403 },
      );
    }

    const body = await parseBody(request, matchRequestCreateSchema);
    if (isValidationError(body)) return body;
    const { dealId, targetType, targetId, message } = body;

    // Get the deal to find the sponsor
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id, sponsor_id, project_name")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }
    await verifyDealAccess(request, user, dealId, "edit");

    const sponsorId = deal.sponsor_id;
    if (user.organizationType === "sponsor") {
      const mySponsorId = await getSponsorIdForOrganization(
        user.organizationId,
      );
      if (!mySponsorId || mySponsorId !== sponsorId) {
        return NextResponse.json(
          { error: "You can only create requests for your own deals" },
          { status: 403 },
        );
      }
    }

    // Check for existing request to the same target for this deal
    const { data: existingRequest } = await supabase
      .from("match_requests")
      .select("id, status")
      .eq("deal_id", dealId)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .single();

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "A request already exists for this target",
          existingStatus: existingRequest.status,
        },
        { status: 409 },
      );
    }

    // Check the 3-request limit
    const slots = await calculateRequestSlots(sponsorId);
    const targetSlots = slots[targetType as MatchTargetType];

    if (targetSlots.available <= 0) {
      return NextResponse.json(
        {
          error: `Maximum ${targetType.toUpperCase()} requests reached (${targetSlots.max})`,
          slots,
        },
        { status: 429 },
      );
    }

    // Get target organization info (no organizations table — read from role table directly)
    const targetTable = targetType === "cde" ? "cdes" : "investors";
    const { data: target, error: targetError } = await supabase
      .from(targetTable)
      .select("id, organization_id, organization_name")
      .eq("id", targetId)
      .single();

    if (targetError || !target) {
      return NextResponse.json(
        { error: `${targetType.toUpperCase()} not found` },
        { status: 404 },
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + MATCH_REQUEST_LIMITS.expirationDays,
    );

    // Create the match request
    const { data: newRequest, error: createError } = await supabase
      .from("match_requests")
      .insert({
        sponsor_id: sponsorId,
        deal_id: dealId,
        target_type: targetType,
        target_id: targetId,
        target_org_id: target.organization_id,
        status: "pending",
        message: message || null,
        requested_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    // Notify target org's users about the new allocation request
    try {
      // Get sponsor org name for the notification
      const { data: sponsorData } = await supabase
        .from("sponsors")
        .select("organization_name")
        .eq("id", sponsorId)
        .single();
      const sponsorName =
        (sponsorData as { organization_name?: string } | null)
          ?.organization_name || "A Sponsor";

      // Find all users in the target organization
      const { data: targetUsers } = await supabase
        .from("users")
        .select("id")
        .eq("organization_id", target.organization_id);

      if (targetUsers && targetUsers.length > 0) {
        const notifInserts = targetUsers.map((u: { id: string }) => ({
          user_id: u.id,
          deal_id: dealId,
          type: "match",
          event: "match_request_received",
          title: `Allocation request from ${sponsorName}`,
          body: `${sponsorName} has requested ${targetType === "cde" ? "NMTC allocation" : "investment"} for "${deal.project_name}"`,
          priority: "high",
          read: false,
          created_at: new Date().toISOString(),
        }));

        await supabase.from("notifications").insert(notifInserts as never[]);
      }
    } catch (notifErr) {
      console.error("[MatchRequests] Notification creation error:", notifErr);
    }

    // Update slots after creation
    const updatedSlots = await calculateRequestSlots(sponsorId);

    return NextResponse.json(
      {
        success: true,
        data: newRequest,
        slots: updatedSlots,
        message: `Request sent to ${target.organization_name || targetType.toUpperCase()}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * Calculate request slots for a sponsor
 */
async function calculateRequestSlots(sponsorId: string) {
  const now = new Date().toISOString();

  // Get all active requests (pending, accepted) and recently declined (in cooldown)
  const { data: requests, error } = await supabase
    .from("match_requests")
    .select("id, target_type, status, cooldown_ends_at")
    .eq("sponsor_id", sponsorId)
    .in("status", ["pending", "accepted", "declined"]);

  if (error) throw error;

  const cdeRequests = (requests || []).filter((r) => {
    if (r.target_type !== "cde") return false;
    // Count pending and accepted
    if (r.status === "pending" || r.status === "accepted") return true;
    // Count declined only if still in cooldown
    if (r.status === "declined" && r.cooldown_ends_at) {
      return new Date(r.cooldown_ends_at) > new Date(now);
    }
    return false;
  });

  const investorRequests = (requests || []).filter((r) => {
    if (r.target_type !== "investor") return false;
    if (r.status === "pending" || r.status === "accepted") return true;
    if (r.status === "declined" && r.cooldown_ends_at) {
      return new Date(r.cooldown_ends_at) > new Date(now);
    }
    return false;
  });

  return {
    cde: {
      used: cdeRequests.length,
      max: MATCH_REQUEST_LIMITS.maxCDERequests,
      available: Math.max(
        0,
        MATCH_REQUEST_LIMITS.maxCDERequests - cdeRequests.length,
      ),
      requests: cdeRequests,
    },
    investor: {
      used: investorRequests.length,
      max: MATCH_REQUEST_LIMITS.maxInvestorRequests,
      available: Math.max(
        0,
        MATCH_REQUEST_LIMITS.maxInvestorRequests - investorRequests.length,
      ),
      requests: investorRequests,
    },
  };
}

async function getSponsorIdForOrganization(
  organizationId: string,
): Promise<string | null> {
  const { data: sponsor } = await supabase
    .from("sponsors")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  return (sponsor as { id: string } | null)?.id || null;
}
