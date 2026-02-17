/**
 * tCredex Organizations API
 * CRITICAL: Requires authentication and org membership
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { organizationCreateSchema } from "@/lib/api/schemas";

// =============================================================================
// GET /api/organizations - List user's organization(s)
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      return NextResponse.json(
        {
          error: "Use /api/organization?id=... for single organization access",
        },
        { status: 400 },
      );
    }

    // No organizations table — build org data from user record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, organization_name, role_type")
      .eq("id", user.id)
      .single();

    if (
      userError ||
      !userData ||
      !(userData as { organization_id?: string }).organization_id
    ) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const typedUser = userData as {
      organization_id: string;
      organization_name: string | null;
      role_type: string | null;
    };

    return NextResponse.json({
      organization: {
        id: typedUser.organization_id,
        name: typedUser.organization_name || "Organization",
        slug: typedUser.organization_id,
        type: typedUser.role_type || user.organizationType,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/organizations - Create organization (admin only)
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require system admin
    const user = await requireAuth(request);

    if (user.organizationType !== "admin") {
      return NextResponse.json(
        { error: "Only system admins can create organizations" },
        { status: 403 },
      );
    }

    const body = await parseBody(request, organizationCreateSchema);
    if (isValidationError(body)) return body;
    const supabase = getSupabaseAdmin();

    // Generate unique slug
    const baseSlug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 80);
    const _slug = `${baseSlug}-${Date.now().toString(36)}`;

    // No organizations table — create via role table instead
    // Organizations are created via the appropriate role table (sponsors/cdes/investors)
    const roleTable =
      body.type === "sponsor"
        ? "sponsors"
        : body.type === "cde"
          ? "cdes"
          : body.type === "investor"
            ? "investors"
            : null;

    if (!roleTable) {
      return NextResponse.json(
        { error: "Invalid organization type for creation" },
        { status: 400 },
      );
    }

    const orgId = crypto.randomUUID();
    const { data, error } = await supabase
      .from(roleTable)
      .insert({
        organization_id: orgId,
        organization_name: body.name,
        primary_contact_name: body.contact_name || body.name,
        primary_contact_email: body.contact_email,
        primary_contact_phone: body.phone,
      } as never)
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await supabase.from("ledger_events").insert({
      actor_type: "human",
      actor_id: user.id,
      entity_type: "organization",
      entity_id: orgId,
      action: "organization_created",
      payload_json: { name: body.name, type: body.type },
      hash: generateHash({ orgId, name: body.name }),
    } as never);

    return NextResponse.json(
      {
        id: orgId,
        name: body.name,
        slug: orgId,
        type: body.type,
        roleTableRecord: data,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

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
