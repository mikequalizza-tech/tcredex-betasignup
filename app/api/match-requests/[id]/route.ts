import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MATCH_REQUEST_LIMITS } from "@/lib/types/match-request";
import {
  AuthError,
  handleAuthError,
  requireAuth,
} from "@/lib/api/auth-middleware";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { matchRequestActionSchema } from "@/lib/api/schemas";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/match-requests/[id]
 *
 * Get a single match request by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // No organizations table — read sponsor org name from sponsors table directly
    const { data, error } = await supabase
      .from("match_requests")
      .select(
        `
        *,
        deals:deal_id (id, project_name, status, programs),
        sponsors:sponsor_id (
          id,
          organization_id,
          organization_name
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Match request not found" },
        { status: 404 },
      );
    }

    await ensureCanAccessMatchRequest(user, data as MatchRequestRow, "view");

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/match-requests/[id]
 *
 * Update a match request (respond to it or withdraw)
 * Body:
 * - action: 'accept' | 'decline' | 'withdraw'
 * - message: string (optional response message)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await parseBody(request, matchRequestActionSchema);
    if (isValidationError(body)) return body;
    const { action, message } = body;

    // Get the current request
    const { data: currentRequest, error: fetchError } = await supabase
      .from("match_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json(
        { error: "Match request not found" },
        { status: 404 },
      );
    }

    await ensureCanAccessMatchRequest(
      user,
      currentRequest as MatchRequestRow,
      action === "withdraw" ? "withdraw" : "respond",
    );

    // Validate state transitions
    if (currentRequest.status !== "pending") {
      return NextResponse.json(
        {
          error: `Cannot ${action} a request with status "${currentRequest.status}"`,
        },
        { status: 400 },
      );
    }

    // Build the update based on action
    const now = new Date().toISOString();
    let updateData: Record<string, unknown> = {
      updated_at: now,
      responded_at: now,
      response_message: message || null,
    };

    switch (action) {
      case "accept":
        updateData.status = "accepted";
        break;

      case "decline":
        // Calculate cooldown end date
        const cooldownEnd = new Date();
        cooldownEnd.setDate(
          cooldownEnd.getDate() + MATCH_REQUEST_LIMITS.cooldownDays,
        );
        updateData.status = "declined";
        updateData.cooldown_ends_at = cooldownEnd.toISOString();
        break;

      case "withdraw":
        // Sponsor withdrawing their own request - frees slot immediately
        updateData.status = "withdrawn";
        break;
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from("match_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create notification for the other party
    try {
      if (action === "withdraw") {
        // Sponsor withdrew → notify target org's users
        const { data: targetUsers } = await supabase
          .from("users")
          .select("id")
          .eq("organization_id", currentRequest.target_org_id);

        // Get sponsor name for context
        const { data: sponsorData } = await supabase
          .from("sponsors")
          .select("organization_name")
          .eq("id", currentRequest.sponsor_id)
          .single();
        const sponsorName =
          (sponsorData as { organization_name?: string } | null)
            ?.organization_name || "A Sponsor";

        // Get deal name
        const { data: dealData } = await supabase
          .from("deals")
          .select("project_name")
          .eq("id", currentRequest.deal_id)
          .single();
        const dealName =
          (dealData as { project_name?: string } | null)?.project_name ||
          "a deal";

        if (targetUsers && targetUsers.length > 0) {
          const notifs = targetUsers.map((u: { id: string }) => ({
            user_id: u.id,
            deal_id: currentRequest.deal_id,
            type: "match",
            event: "match_request_withdrawn",
            title: `Request withdrawn by ${sponsorName}`,
            body: `${sponsorName} has withdrawn their allocation request for "${dealName}"`,
            priority: "normal",
            read: false,
            created_at: now,
          }));
          await supabase.from("notifications").insert(notifs as never[]);
        }
      } else {
        // CDE/Investor accepted or declined → notify sponsor's users
        const { data: sponsorData } = await supabase
          .from("sponsors")
          .select("organization_id")
          .eq("id", currentRequest.sponsor_id)
          .single();

        if (sponsorData) {
          const { data: sponsorUsers } = await supabase
            .from("users")
            .select("id")
            .eq(
              "organization_id",
              (sponsorData as { organization_id: string }).organization_id,
            );

          // Get target org name
          const targetTable =
            currentRequest.target_type === "cde" ? "cdes" : "investors";
          const { data: targetData } = await supabase
            .from(targetTable)
            .select("organization_name")
            .eq("organization_id", currentRequest.target_org_id)
            .single();
          const targetName =
            (targetData as { organization_name?: string } | null)
              ?.organization_name || currentRequest.target_type.toUpperCase();

          // Get deal name
          const { data: dealData } = await supabase
            .from("deals")
            .select("project_name")
            .eq("id", currentRequest.deal_id)
            .single();
          const dealName =
            (dealData as { project_name?: string } | null)?.project_name ||
            "your deal";

          if (sponsorUsers && sponsorUsers.length > 0) {
            const statusLabel = action === "accept" ? "accepted" : "declined";
            const notifs = sponsorUsers.map((u: { id: string }) => ({
              user_id: u.id,
              deal_id: currentRequest.deal_id,
              type: "match",
              event: `match_request_${statusLabel}`,
              title: `Request ${statusLabel} by ${targetName}`,
              body: `${targetName} has ${statusLabel} your allocation request for "${dealName}"`,
              priority: action === "accept" ? "high" : "normal",
              read: false,
              created_at: now,
            }));
            await supabase.from("notifications").insert(notifs as never[]);
          }
        }
      }
    } catch (notifErr) {
      console.error("[MatchRequests] Notification error:", notifErr);
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: getActionMessage(action, currentRequest.target_type),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/match-requests/[id]
 *
 * Delete a match request (admin only, or withdraw by sponsor)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const { data: currentRequest, error: fetchError } = await supabase
      .from("match_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json(
        { error: "Match request not found" },
        { status: 404 },
      );
    }

    await ensureCanAccessMatchRequest(
      user,
      currentRequest as MatchRequestRow,
      "delete",
    );

    const { error } = await supabase
      .from("match_requests")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Match request deleted",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

function getActionMessage(action: string, targetType: string): string {
  const typeLabel = targetType === "cde" ? "CDE" : "Investor";
  switch (action) {
    case "accept":
      return `Request accepted. You can now proceed with the ${typeLabel}.`;
    case "decline":
      return `Request declined. The slot will be available again after ${MATCH_REQUEST_LIMITS.cooldownDays} days.`;
    case "withdraw":
      return "Request withdrawn. Your slot is now available.";
    default:
      return "Request updated.";
  }
}

type MatchRequestRow = {
  id: string;
  sponsor_id: string;
  target_type: "cde" | "investor";
  target_org_id: string | null;
};

type AccessAction = "view" | "respond" | "withdraw" | "delete";

async function ensureCanAccessMatchRequest(
  user: Awaited<ReturnType<typeof requireAuth>>,
  requestRow: MatchRequestRow,
  action: AccessAction,
): Promise<void> {
  if (user.organizationType === "admin") {
    return;
  }

  const sponsorId = await getSponsorIdForOrganization(user.organizationId);
  const isSponsorOwner =
    sponsorId !== null && sponsorId === requestRow.sponsor_id;
  const isTargetOwner =
    requestRow.target_org_id === user.organizationId &&
    ((requestRow.target_type === "cde" && user.organizationType === "cde") ||
      (requestRow.target_type === "investor" &&
        user.organizationType === "investor"));

  if (action === "view" && (isSponsorOwner || isTargetOwner)) {
    return;
  }

  if (action === "respond" && isTargetOwner) {
    return;
  }

  if (action === "withdraw" && isSponsorOwner) {
    return;
  }

  if (action === "delete") {
    throw new AuthError(
      "FORBIDDEN",
      "Only system admins can delete match requests",
      403,
    );
  }

  throw new AuthError(
    "FORBIDDEN",
    "You are not authorized for this match request",
    403,
  );
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
