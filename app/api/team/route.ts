/**
 * Team Members API
 * Manage team members within an organization
 * SIMPLIFIED: Uses users table
 * Uses claim code system (not magic links) for invites
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  requireOrgAdmin,
  handleAuthError,
} from "@/lib/api/auth-middleware";
import { email as emailService } from "@/lib/email/send";

/**
 * Generate an 8-character claim code (same format as deal outreach codes)
 */
function generateClaimCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

// =============================================================================
// GET /api/team - List team members in user's organization
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("users")
      .select(
        "id, email, name, role, title, avatar_url, is_active, last_login_at, created_at",
      )
      .eq("organization_id", user.organizationId)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    return NextResponse.json({ members: data || [] });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/team - Invite new team member (org admin only)
// Uses CLAIM CODE system (not magic links) - invitee sets password at /claim
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const user = await requireOrgAdmin(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { email, role, name, message } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const validRoles = ["ORG_ADMIN", "PROJECT_ADMIN", "MEMBER", "VIEWER"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();
    const displayName = name || email.split("@")[0];

    // Check if user already exists in ANY org (can't be in two orgs)
    const { data: existing } = await supabase
      .from("users")
      .select("id, organization_id, organization_name, is_active")
      .eq("email", lowerEmail)
      .maybeSingle();

    if (existing) {
      if (existing.organization_id === user.organizationId) {
        // If the user was previously removed (is_active = false), re-invite them
        if (!existing.is_active) {
          const newClaimCode = generateClaimCode();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          const { error: reactivateError } = await supabase
            .from("users")
            .update({
              is_active: false, // stays inactive until they claim
              invite_code: newClaimCode,
              invite_expires_at: expiresAt.toISOString(),
              role: role || "MEMBER",
              name: displayName,
            } as never)
            .eq("id", existing.id);

          if (reactivateError) {
            return NextResponse.json(
              { error: `Failed to re-invite: ${reactivateError.message}` },
              { status: 500 },
            );
          }

          // Fetch org info for email
          const { data: inviterData } = await supabase
            .from("users")
            .select("organization_name, role_type")
            .eq("id", user.id)
            .single();

          const roleLabels: Record<string, string> = {
            ORG_ADMIN: "Organization Admin",
            PROJECT_ADMIN: "Project Admin",
            MEMBER: "Team Member",
            VIEWER: "Viewer",
          };

          let emailSent = false;
          const emailResult = await emailService.teamInviteWithCode(
            lowerEmail,
            displayName,
            (user as { name?: string }).name || user.email || "Your colleague",
            inviterData?.organization_name || "your organization",
            roleLabels[role || "MEMBER"] || "Team Member",
            newClaimCode,
            message,
          );
          emailSent = emailResult.success;

          return NextResponse.json(
            {
              success: true,
              message: emailSent
                ? `Re-invitation sent to ${lowerEmail}`
                : `Team member re-invited but email failed to send`,
              emailSent,
              claimCode: newClaimCode,
              user: existing,
            },
            { status: 201 },
          );
        }

        return NextResponse.json(
          { error: "User already exists in this organization" },
          { status: 409 },
        );
      } else {
        return NextResponse.json(
          {
            error: `This email is already registered with ${existing.organization_name || "another organization"}`,
          },
          { status: 409 },
        );
      }
    }

    // Fetch inviter's org info
    const { data: inviterData } = await supabase
      .from("users")
      .select("organization_name, role_type")
      .eq("id", user.id)
      .single();

    // Generate claim code (8 chars, no ambiguous characters)
    let claimCode = generateClaimCode();
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const { data: collision } = await supabase
        .from("users")
        .select("id")
        .eq("invite_code", claimCode)
        .maybeSingle();

      if (!collision) break;
      claimCode = generateClaimCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique claim code" },
        { status: 500 },
      );
    }

    // Create pending user record with claim code (no auth user yet)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to claim

    const insertPayload: Record<string, unknown> = {
      email: lowerEmail,
      name: displayName,
      role: role || "MEMBER",
      organization_id: user.organizationId,
      organization_name: inviterData?.organization_name || null,
      role_type: inviterData?.role_type || null,
      is_active: false, // inactive until they claim the code
      invite_code: claimCode,
      invite_expires_at: expiresAt.toISOString(),
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert(insertPayload as never)
      .select()
      .single();

    if (insertError) {
      console.error(
        "[Team] Users insert error:",
        insertError.message,
        insertError.details,
      );
      if (
        insertError.message?.includes("duplicate") ||
        insertError.code === "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "This user already exists. They may need to be reassigned to your organization.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Failed to create team member: ${insertError.message}` },
        { status: 500 },
      );
    }

    // Send invite email with claim code
    const roleLabels: Record<string, string> = {
      ORG_ADMIN: "Organization Admin",
      PROJECT_ADMIN: "Project Admin",
      MEMBER: "Team Member",
      VIEWER: "Viewer",
    };
    const roleName = roleLabels[role || "MEMBER"] || role || "Team Member";

    let emailSent = false;
    let emailError: string | undefined;

    const emailResult = await emailService.teamInviteWithCode(
      lowerEmail,
      displayName,
      (user as { name?: string }).name || user.email || "Your colleague",
      inviterData?.organization_name || "your organization",
      roleName,
      claimCode,
      message,
    );

    if (emailResult.success) {
      emailSent = true;
    } else {
      console.error("[Team] Email send failed:", emailResult.error);
      emailError = emailResult.error;
    }

    // Log to ledger (optional)
    try {
      await supabase.from("ledger_events").insert({
        actor_type: "human",
        actor_id: user.id,
        entity_type: "user",
        entity_id: (insertedUser as { id: string }).id,
        action: "team_member_invited",
        payload_json: { email: lowerEmail, role, claimCode, emailSent },
      } as never);
    } catch {
      // Ledger logging is optional
    }

    return NextResponse.json(
      {
        success: true,
        message: emailSent
          ? `Invitation sent to ${lowerEmail} with claim code`
          : `Team member created but invite email failed to send: ${emailError || "unknown error"}`,
        emailSent,
        claimCode, // Return for testing/debugging
        user: insertedUser,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[Team] Invite error:", error);
    return handleAuthError(error);
  }
}

// =============================================================================
// DELETE /api/team - Remove team member (org admin only)
// Soft-deletes by setting is_active = false and clearing invite data
// =============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireOrgAdmin(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 },
      );
    }

    // Prevent self-removal
    if (memberId === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 },
      );
    }

    // Verify the member belongs to the same organization
    const { data: member } = await supabase
      .from("users")
      .select("id, email, organization_id")
      .eq("id", memberId)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.organization_id !== user.organizationId) {
      return NextResponse.json(
        { error: "Member does not belong to your organization" },
        { status: 403 },
      );
    }

    // Soft-delete: deactivate and clear invite data
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: false,
        invite_code: null,
        invite_expires_at: null,
      } as never)
      .eq("id", memberId);

    if (updateError) {
      console.error("[Team] Remove member error:", updateError);
      return NextResponse.json(
        { error: `Failed to remove member: ${updateError.message}` },
        { status: 500 },
      );
    }

    // Log to ledger
    try {
      await supabase.from("ledger_events").insert({
        actor_type: "human",
        actor_id: user.id,
        entity_type: "user",
        entity_id: memberId,
        action: "team_member_removed",
        payload_json: { email: member.email },
      } as never);
    } catch {
      // Ledger is optional
    }

    return NextResponse.json({ success: true, message: "Team member removed" });
  } catch (error) {
    console.error("[Team] Remove error:", error);
    return handleAuthError(error);
  }
}
