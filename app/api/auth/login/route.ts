/**
 * tCredex API - Login
 * POST /api/auth/login
 *
 * SIMPLIFIED: Uses users table directly
 * No organizations FK chain - organization_id + organization_type tells you which entity table
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { loginSchema } from "@/lib/api/schemas";

const SESSION_TTL_SECONDS = 60 * 60 * 24;

// User record type matching DB schema
type UserRecord = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  title: string | null;
  organization_id: string | null;
  role_type: string | null;
  organization_name: string | null;
  role: string | null;
  is_active: boolean | null;
  email_verified: boolean | null;
  last_login_at: string | null;
  created_at: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, loginSchema);
    if (isValidationError(parsed)) return parsed;
    const { email, password } = parsed;

    const supabase = getSupabaseAdmin();

    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

    if (authError || !authData.session) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Step 2: Fetch user record from users (no FK joins)
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userRecord) {
      console.error("[Login] User record not found:", userError);
      return NextResponse.json(
        { error: "User record not found" },
        { status: 401 },
      );
    }

    const typedRecord = userRecord as UserRecord;

    // Step 3: Validate user is active
    if (!typedRecord.is_active) {
      return NextResponse.json(
        { error: "User account is inactive" },
        { status: 403 },
      );
    }

    // Step 4: Get organization details from the appropriate table
    // Use role_type if available, fall back to organization_type for legacy data
    let organization = null;
    const orgType = typedRecord.role_type;
    if (typedRecord.organization_id && orgType) {
      const tableName =
        orgType === "sponsor"
          ? "sponsors"
          : orgType === "investor"
            ? "investors"
            : "cdes";

      // Dynamic table — cast through unknown since column sets differ per table
      const { data: org } = await supabase
        .from(tableName)
        .select("primary_contact_name, primary_contact_email")
        .eq("organization_id", typedRecord.organization_id)
        .single();

      if (org) {
        const orgRow = org as unknown as {
          primary_contact_name: string | null;
          primary_contact_email: string | null;
        };
        organization = {
          id: typedRecord.organization_id,
          name:
            typedRecord.organization_name ||
            orgRow.primary_contact_name ||
            "Organization",
          type: orgType,
          contactEmail: orgRow.primary_contact_email || null,
        };
      }
    }
    if (!organization && typedRecord.organization_id && orgType) {
      organization = {
        id: typedRecord.organization_id,
        name: typedRecord.organization_name || "Organization",
        type: orgType,
        contactEmail: null,
      };
    }

    // Step 5: Return user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: typedRecord.id,
        email: typedRecord.email,
        name: typedRecord.name,
        role: typedRecord.role,
        organizationId: typedRecord.organization_id,
        organizationType: orgType,
        organization,
        avatar: typedRecord.avatar_url,
        title: typedRecord.title,
        phone: typedRecord.phone,
        isActive: typedRecord.is_active,
        emailVerified: typedRecord.email_verified,
        lastLoginAt: typedRecord.last_login_at,
        createdAt: typedRecord.created_at,
      },
    });

    // Step 6: Set secure session cookie
    const sessionToken = authData.session.access_token;
    if (sessionToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: SESSION_TTL_SECONDS,
        path: "/",
      };

      response.cookies.set({
        name: "auth-token",
        value: sessionToken,
        ...cookieOptions,
      });

      // Backward compatibility
      response.cookies.set({
        name: "tcredex_session",
        value: sessionToken,
        ...cookieOptions,
      });
    }

    // Update last login
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", typedRecord.id);

    // Log to ledger
    try {
      await supabase.from("ledger_events").insert({
        actor_type: "human",
        actor_id: typedRecord.id,
        entity_type: "auth",
        entity_id: typedRecord.id,
        action: "login",
        payload_json: { email: typedRecord.email },
      } as never);
    } catch (err) {
      console.error("[Login] Ledger error:", err);
    }

    return response;
  } catch (error) {
    console.error("[Login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
