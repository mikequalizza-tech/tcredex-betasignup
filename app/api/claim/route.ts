/**
 * Claim Code API
 *
 * GET  /api/claim?code=XXXXXXXX  → Validate code, return org info
 * POST /api/claim { code, password } → Create Supabase auth + users row, sign in
 *
 * Handles TWO types of claim codes:
 * 1. Deal outreach codes (match_requests.claim_code) - for CDE/Investor invites from sponsors
 * 2. Team invite codes (users.invite_code) - for team member invites from org admins
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase";
import { email as emailService } from "@/lib/email/send";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { claimSchema } from "@/lib/api/schemas";

/**
 * GET /api/claim?code=XXXXXXXX
 * Validate a claim code and return the org info for the claim page
 * Checks both match_requests (deal outreach) and users (team invites)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const cleanCode = code.replace(/[-\s]/g, "").toUpperCase();
  const supabase = getSupabaseAdmin();

  // FIRST: Check if it's a team invite code
  const { data: teamInvite } = await supabase
    .from("users")
    .select(
      "id, email, name, role, organization_id, organization_name, role_type, invite_expires_at, is_active",
    )
    .eq("invite_code", cleanCode)
    .maybeSingle();

  if (teamInvite) {
    // Check expiration
    if (
      teamInvite.invite_expires_at &&
      new Date(teamInvite.invite_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "This claim code has expired" },
        { status: 410 },
      );
    }

    // Return team invite info
    return NextResponse.json({
      valid: true,
      type: "team_invite",
      orgName: teamInvite.organization_name || "Organization",
      contactName: teamInvite.name || "",
      contactEmail: teamInvite.email,
      roleName: teamInvite.role || "MEMBER",
      roleType: teamInvite.role_type,
      organizationId: teamInvite.organization_id,
    });
  }

  // SECOND: Check if it's a deal outreach code
  const { data: match, error } = await supabase
    .from("match_requests")
    .select("id, deal_id, target_type, target_id, status, expires_at")
    .eq("claim_code", cleanCode)
    .single();

  if (error || !match) {
    return NextResponse.json({ error: "Invalid claim code" }, { status: 404 });
  }

  // Check expiration
  if (match.expires_at && new Date(match.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This claim code has expired" },
      { status: 410 },
    );
  }

  // Look up the org info based on target_type
  let orgInfo: {
    name: string;
    contactName: string;
    contactEmail: string;
    organizationId: string;
  } | null = null;

  if (match.target_type === "cde") {
    const { data: cde } = await supabase
      .from("cdes_merged")
      .select("name, contact_name, contact_email, organization_id")
      .eq("organization_id", match.target_id)
      .order("year", { ascending: false })
      .limit(1)
      .single();

    if (!cde && match.target_id) {
      // Fallback: try by row id
      const { data: cdeById } = await supabase
        .from("cdes_merged")
        .select("name, contact_name, contact_email, organization_id")
        .eq("id", match.target_id)
        .limit(1)
        .single();
      if (cdeById) {
        const c = cdeById as {
          name?: string;
          contact_name?: string;
          contact_email?: string;
          organization_id?: string;
        };
        orgInfo = {
          name: c.name || "Unknown CDE",
          contactName: c.contact_name || "",
          contactEmail: c.contact_email || "",
          organizationId: c.organization_id || match.target_id,
        };
      }
    } else if (cde) {
      const c = cde as {
        name?: string;
        contact_name?: string;
        contact_email?: string;
        organization_id?: string;
      };
      orgInfo = {
        name: c.name || "Unknown CDE",
        contactName: c.contact_name || "",
        contactEmail: c.contact_email || "",
        organizationId: c.organization_id || match.target_id,
      };
    }
  } else if (match.target_type === "investor") {
    const { data: investor } = await supabase
      .from("investors")
      .select(
        "organization_name, primary_contact_name, primary_contact_email, organization_id",
      )
      .eq("organization_id", match.target_id)
      .limit(1)
      .single();

    if (!investor && match.target_id) {
      const { data: invById } = await supabase
        .from("investors")
        .select(
          "organization_name, primary_contact_name, primary_contact_email, organization_id",
        )
        .eq("id", match.target_id)
        .limit(1)
        .single();
      if (invById) {
        const inv = invById as {
          organization_name?: string;
          primary_contact_name?: string;
          primary_contact_email?: string;
          organization_id?: string;
        };
        orgInfo = {
          name: inv.organization_name || "Unknown Investor",
          contactName: inv.primary_contact_name || "",
          contactEmail: inv.primary_contact_email || "",
          organizationId: inv.organization_id || match.target_id,
        };
      }
    } else if (investor) {
      const inv = investor as {
        organization_name?: string;
        primary_contact_name?: string;
        primary_contact_email?: string;
        organization_id?: string;
      };
      orgInfo = {
        name: inv.organization_name || "Unknown Investor",
        contactName: inv.primary_contact_name || "",
        contactEmail: inv.primary_contact_email || "",
        organizationId: inv.organization_id || match.target_id,
      };
    }
  }

  if (!orgInfo) {
    return NextResponse.json(
      { error: "Organization not found for this code" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    valid: true,
    orgName: orgInfo.name,
    contactName: orgInfo.contactName,
    contactEmail: orgInfo.contactEmail,
    targetType: match.target_type,
    dealId: match.deal_id,
  });
}

/**
 * POST /api/claim
 * Activate a claim code: create Supabase auth user + users row, sign in
 * Handles both team invite codes and deal outreach codes
 *
 * Body: { code: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, claimSchema);
    if (isValidationError(parsed)) return parsed;
    const { code, password } = parsed;

    const cleanCode = code.replace(/[-\s]/g, "").toUpperCase();
    const supabase = getSupabaseAdmin();

    // FIRST: Check if it's a team invite code
    const { data: teamInvite } = await supabase
      .from("users")
      .select(
        "id, email, name, role, organization_id, organization_name, role_type, invite_expires_at, is_active",
      )
      .eq("invite_code", cleanCode)
      .maybeSingle();

    if (teamInvite) {
      // Check expiration
      if (
        teamInvite.invite_expires_at &&
        new Date(teamInvite.invite_expires_at) < new Date()
      ) {
        return NextResponse.json(
          { error: "This claim code has expired" },
          { status: 410 },
        );
      }

      // Create Supabase auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: teamInvite.email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: teamInvite.name,
            role: teamInvite.role_type,
          },
        });

      if (authError) {
        console.error("[Claim] Team invite auth creation failed:", authError);
        return NextResponse.json(
          { error: authError.message || "Failed to create account" },
          { status: 400 },
        );
      }

      // Update the users row with auth ID and activate
      const { error: updateError } = await supabase
        .from("users")
        .update({
          id: authData.user.id,
          is_active: true,
          email_verified: true,
          invite_code: null, // Clear the code so it can't be reused
          invite_expires_at: null,
        } as never)
        .eq("id", teamInvite.id);

      if (updateError) {
        console.error("[Claim] Team invite user update failed:", updateError);
        return NextResponse.json(
          { error: "Account created but activation failed. Contact support." },
          { status: 500 },
        );
      }

      // Sign them in
      const response = NextResponse.json({
        success: true,
        message: "Account activated successfully",
        redirectTo: "/dashboard",
      });

      // Use Supabase SSR client to set session cookie
      const ssrSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options),
              );
            },
          },
        },
      );

      await ssrSupabase.auth.signInWithPassword({
        email: teamInvite.email,
        password,
      });

      return response;
    }

    // SECOND: Check if it's a deal outreach code
    const { data: match, error: matchError } = await supabase
      .from("match_requests")
      .select("id, deal_id, target_type, target_id, status, expires_at")
      .eq("claim_code", cleanCode)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: "Invalid claim code" },
        { status: 404 },
      );
    }

    if (match.expires_at && new Date(match.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This claim code has expired" },
        { status: 410 },
      );
    }

    // 2. Look up org info
    let orgName = "";
    let contactName = "";
    let contactEmail = "";
    let organizationId = match.target_id;
    const roleType = match.target_type === "investor" ? "investor" : "cde";

    if (match.target_type === "cde") {
      const { data: cde } = await supabase
        .from("cdes_merged")
        .select("name, contact_name, contact_email, organization_id")
        .eq("organization_id", match.target_id)
        .order("year", { ascending: false })
        .limit(1)
        .single();

      const c =
        (cde as {
          name?: string;
          contact_name?: string;
          contact_email?: string;
          organization_id?: string;
        } | null) || {};
      orgName = c.name || "CDE";
      contactName = c.contact_name || "";
      contactEmail = c.contact_email || "";
      organizationId = c.organization_id || match.target_id;
    } else {
      const { data: investor } = await supabase
        .from("investors")
        .select(
          "organization_name, primary_contact_name, primary_contact_email, organization_id",
        )
        .eq("organization_id", match.target_id)
        .limit(1)
        .single();

      const inv =
        (investor as {
          organization_name?: string;
          primary_contact_name?: string;
          primary_contact_email?: string;
          organization_id?: string;
        } | null) || {};
      orgName = inv.organization_name || "Investor";
      contactName = inv.primary_contact_name || "";
      contactEmail = inv.primary_contact_email || "";
      organizationId = inv.organization_id || match.target_id;
    }

    if (!contactEmail) {
      return NextResponse.json(
        {
          error:
            "No contact email found for this organization. Please contact support.",
        },
        { status: 400 },
      );
    }

    const lowerEmail = contactEmail.toLowerCase();

    // 3. Create Supabase Auth user (or reuse existing)
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email: lowerEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: contactName || orgName, role: roleType },
      });

    let authUser = created?.user || null;

    if (
      !authUser &&
      createError?.message?.toLowerCase().includes("already registered")
    ) {
      // User already exists — try to find them
      let page = 1;
      const perPage = 1000;
      while (!authUser) {
        const { data: userList } = await supabase.auth.admin.listUsers({
          page,
          perPage,
        });
        const candidates = userList?.users || [];
        authUser =
          candidates.find((u) => u.email?.toLowerCase() === lowerEmail) || null;
        if (authUser || candidates.length < perPage) break;
        page += 1;
      }
      if (!authUser) {
        return NextResponse.json(
          { error: "Account already exists. Please sign in instead." },
          { status: 409 },
        );
      }
      // Update password for existing user
      await supabase.auth.admin.updateUserById(authUser.id, { password });
    } else if (!authUser) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create account" },
        { status: 400 },
      );
    }

    // 4. Create users row (links auth ID → org)
    const { error: userError } = await supabase.from("users").upsert(
      {
        id: authUser.id,
        email: lowerEmail,
        name: contactName || orgName,
        role: "ORG_ADMIN",
        organization_id: organizationId,
        role_type: roleType,
        organization_name: orgName,
        is_active: true,
        email_verified: true,
      } as never,
      { onConflict: "id" },
    );

    if (userError) {
      console.error("[Claim] Users row creation failed:", userError);
      return NextResponse.json(
        {
          error:
            "Account created but profile setup failed. Please contact support.",
        },
        { status: 500 },
      );
    }

    // 5. Update match_request status to 'accepted'
    await supabase
      .from("match_requests")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
      } as never)
      .eq("id", match.id);

    // 6. Sign in and set cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const redirectTo = `/deals/${match.deal_id}`;

    let response = NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: authUser.id,
        email: lowerEmail,
        name: contactName || orgName,
        role: "ORG_ADMIN",
        organizationId,
        organizationType: roleType,
      },
    });

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

    const { error: signInError } = await supabaseSSR.auth.signInWithPassword({
      email: lowerEmail,
      password,
    });

    if (signInError) {
      console.error(
        "[Claim] Sign in failed after account creation:",
        signInError,
      );
      return NextResponse.json({
        success: true,
        redirectTo: `/signin?email=${encodeURIComponent(lowerEmail)}`,
        message: "Account created. Please sign in with your password.",
      });
    }

    // 7. Send welcome email (non-blocking)
    emailService
      .welcome(
        lowerEmail,
        contactName || orgName,
        roleType as "cde" | "investor",
      )
      .then((r) =>
        r.success
          ? console.log(`[Claim] Welcome email sent to ${lowerEmail}`)
          : console.warn(`[Claim] Welcome email failed:`, r.error),
      )
      .catch((e) => console.warn("[Claim] Welcome email error:", e));

    console.log(
      `[Claim] Account created for ${orgName} (${lowerEmail}), redirecting to ${redirectTo}`,
    );
    return response;
  } catch (error) {
    console.error("[Claim] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
