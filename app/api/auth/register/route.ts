/**
 * tCredex API - Register
 * POST /api/auth/register
 *
 * CRITICAL FLOW:
 * 1. Create Supabase auth user (email confirmed)
 * 2. Create organization (always new, unique slug)
 * 3. Create user record in users table (links auth to org)
 * 4. Create role-specific record (sponsors/cdes/investors)
 * 5. Send confirmation email
 * 6. Return session token
 *
 * KEY POINTS:
 * - Users table is source of truth for roles and org membership
 * - Each registration creates ONE new organization
 * - User role is ORG_ADMIN (they own their org)
 * - Organization type determines dashboard and permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase";
import { email as emailService } from "@/lib/email/send";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { registerSchema } from "@/lib/api/schemas";

// Unified registration flow with robust org/role logic and error handling
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, registerSchema);
    if (isValidationError(parsed)) return parsed;
    const {
      email,
      password,
      name,
      organizationName,
      role,
      existingOrgId,
      referralDealId,
    } = parsed;
    const supabase = getSupabaseAdmin();
    const lowerEmail = email.toLowerCase();

    // Step 1: Create or reuse Supabase Auth user
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email: lowerEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, role },
      });

    let authUser = created?.user || null;

    if (!authUser) {
      if (
        createError &&
        createError.message?.toLowerCase().includes("already registered")
      ) {
        // Supabase admin API lacks a direct getUserByEmail; paginate and search.
        let page = 1;
        const perPage = 1000;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let foundUser: any = null;
        while (!foundUser) {
          const { data: userList, error: fetchError } =
            await supabase.auth.admin.listUsers({ page, perPage });
          if (fetchError) {
            return NextResponse.json(
              { error: fetchError.message || "Failed to load existing user" },
              { status: 400 },
            );
          }
          const candidates = userList?.users || [];
          foundUser = candidates.find(
            (u) => u.email?.toLowerCase() === lowerEmail,
          );
          if (foundUser || candidates.length < perPage) break;
          page += 1;
        }
        if (!foundUser) {
          return NextResponse.json(
            { error: "User already exists but could not be loaded" },
            { status: 400 },
          );
        }
        authUser = foundUser;
      } else {
        return NextResponse.json(
          { error: createError?.message || "Failed to create user" },
          { status: 400 },
        );
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { error: "Auth user could not be resolved" },
        { status: 400 },
      );
    }

    // Step 2: Create or link org/role record
    // If existingOrgId is provided (referral from allocation request email),
    // link to the existing CDE org instead of creating a new one.
    const organizationId = existingOrgId || crypto.randomUUID();
    const roleTable =
      role === "sponsor"
        ? "sponsors"
        : role === "investor"
          ? "investors"
          : "cdes";

    let roleRow: { id: string; organization_id: string } | null = null;

    if (existingOrgId) {
      // Referral flow: check if a record already exists in the role table
      const { data: existingRole } = await supabase
        .from(roleTable)
        .select("id, organization_id")
        .eq("organization_id", existingOrgId)
        .limit(1)
        .single();

      if (existingRole) {
        // Record exists (e.g., from CDFI import) — update contact info, keep allocation data
        roleRow = existingRole as { id: string; organization_id: string };
        await supabase
          .from(roleTable)
          .update({
            primary_contact_name: name,
            primary_contact_email: lowerEmail,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("organization_id", existingOrgId);
        console.log(
          `[Register] Linked to existing ${role} org: ${existingOrgId}`,
        );
      } else {
        // No existing record — create one with the referral org ID
        const rolePayload: Record<string, unknown> = {
          organization_id: existingOrgId,
          primary_contact_name: name,
          primary_contact_email: lowerEmail,
          organization_name: organizationName,
        };
        if (role === "cde") {
          rolePayload.total_allocation = 0;
          rolePayload.remaining_allocation = 0;
          rolePayload.min_deal_size = 0;
          rolePayload.max_deal_size = 0;
          rolePayload.small_deal_fund = false;
          rolePayload.service_area_type = "national";
        }
        const { data: newRole, error: roleError } = await supabase
          .from(roleTable)
          .upsert(rolePayload as never, { onConflict: "organization_id" })
          .select("id, organization_id")
          .single();
        if (roleError || !newRole) {
          return NextResponse.json(
            {
              error: `${role} creation failed: ${roleError?.message || "Unknown error"}`,
            },
            { status: 400 },
          );
        }
        roleRow = newRole as { id: string; organization_id: string };
      }
    } else {
      // Normal flow: create a new org
      const rolePayload: Record<string, unknown> = {
        organization_id: organizationId,
        primary_contact_name: name,
        primary_contact_email: lowerEmail,
        organization_name: organizationName,
      };

      if (role === "cde") {
        rolePayload.total_allocation = 0;
        rolePayload.remaining_allocation = 0;
        rolePayload.min_deal_size = 0;
        rolePayload.max_deal_size = 0;
        rolePayload.small_deal_fund = false;
        rolePayload.service_area_type = "national";
      }

      const { data: newRole, error: roleError } = await supabase
        .from(roleTable)
        .upsert(rolePayload as never, { onConflict: "organization_id" })
        .select("id, organization_id")
        .single();

      if (roleError || !newRole) {
        return NextResponse.json(
          {
            error: `${role} creation failed: ${roleError?.message || "Unknown error"}`,
          },
          { status: 400 },
        );
      }
      roleRow = newRole as { id: string; organization_id: string };
    }

    // Step 3: Upsert user record
    const { error: userError } = await supabase.from("users").upsert(
      {
        id: authUser.id,
        email: lowerEmail,
        name,
        role: "ORG_ADMIN",
        organization_id: organizationId,
        role_type: role,
        organization_name: organizationName,
        is_active: true,
        email_verified: true,
      } as never,
      { onConflict: "id" },
    );

    if (userError) {
      return NextResponse.json(
        { error: "User record creation failed", details: userError.message },
        { status: 400 },
      );
    }

    // Step 4: Start a session so the user lands signed in
    // We need to use an SSR client to properly set cookies that the middleware can read
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Determine redirect — referral deals go straight to the deal page
    const defaultRedirect =
      role === "sponsor"
        ? "/dashboard"
        : role === "cde"
          ? "/dashboard/pipeline"
          : "/deals";
    const redirectTo = referralDealId
      ? `/deals/${referralDealId}`
      : defaultRedirect;

    // Create a mutable response that we can add cookies to
    let response = NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: authUser.id,
        email: authUser.email,
        name,
        role: "ORG_ADMIN",
        organizationId,
        organizationType: role,
        entityId: roleRow!.id,
      },
    });

    // Create SSR client that will properly set cookies
    const supabaseSSR = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Sign in using the SSR client - this will properly set session cookies
    const { data: sessionData, error: signInError } =
      await supabaseSSR.auth.signInWithPassword({
        email: lowerEmail,
        password,
      });

    if (signInError || !sessionData.session) {
      return NextResponse.json(
        { error: signInError?.message || "Failed to start session" },
        { status: 400 },
      );
    }

    // Step 5: Send emails (non-blocking, but log errors)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("/rest/v1", "") ||
      "https://tcredex.com";

    // Send verification email
    try {
      const confirmUrl = `${baseUrl}/signin?confirmed=1&email=${encodeURIComponent(lowerEmail)}`;
      const emailResult = await emailService.confirmEmail(
        lowerEmail,
        name,
        confirmUrl,
      );
      if (emailResult.success) {
        console.log(`[Register] Verification email sent to ${lowerEmail}`);
      } else {
        console.error(
          `[Register] Failed to send verification email:`,
          emailResult.error,
        );
      }
    } catch (emailError) {
      console.error("[Register] Verification email error:", emailError);
    }

    // Send welcome email
    try {
      const welcomeResult = await emailService.welcome(
        lowerEmail,
        name,
        role as "sponsor" | "cde" | "investor",
      );
      if (welcomeResult.success) {
        console.log(`[Register] Welcome email sent to ${lowerEmail}`);
      } else {
        console.error(
          `[Register] Failed to send welcome email:`,
          welcomeResult.error,
        );
      }
    } catch (emailError) {
      console.error("[Register] Welcome email error:", emailError);
    }

    return response;
  } catch (error) {
    console.error("[Register] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 },
    );
  }
}
