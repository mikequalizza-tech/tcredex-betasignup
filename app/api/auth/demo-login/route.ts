/**
 * tCredex API - Demo Login
 * POST /api/auth/demo-login
 *
 * SIMPLIFIED: Uses simplified schema tables (sponsors, investors, users, cdes_merged) - no organization FK joins
 * Password: "demo123" for all demo accounts
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const DEMO_PASSWORD = "demo123";
const ADMIN_PASSWORD = "admin123";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabaseAdmin();

    // Check password (demo users have fixed passwords)
    const isAdminEmail = normalizedEmail.includes("@tcredex.com");
    const expectedPassword = isAdminEmail ? ADMIN_PASSWORD : DEMO_PASSWORD;

    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // ===================================================================
    // Try to find user in each simplified table by email
    // ===================================================================

    // 1. Check investors table
    const { data: investorData } = await supabase
      .from("investors")
      .select(
        "id, organization_name, primary_contact_name, primary_contact_email, organization_id",
      )
      .eq("primary_contact_email", normalizedEmail)
      .single();

    if (investorData) {
      return NextResponse.json({
        success: true,
        user: {
          id: investorData.id,
          email: normalizedEmail,
          name:
            investorData.primary_contact_name ||
            investorData.organization_name ||
            "Investor User",
          role: "ORG_ADMIN",
          organizationId: investorData.organization_id,
          organizationType: "investor",
          organization: {
            id: investorData.organization_id,
            name: investorData.organization_name,
            slug: null,
            type: "investor",
          },
          userType: "investor",
        },
      });
    }

    // 2. Check sponsors table
    const { data: sponsorData } = await supabase
      .from("sponsors")
      .select(
        "id, organization_name, primary_contact_name, primary_contact_email, organization_id",
      )
      .eq("primary_contact_email", normalizedEmail)
      .single();

    if (sponsorData) {
      return NextResponse.json({
        success: true,
        user: {
          id: sponsorData.id,
          email: normalizedEmail,
          name:
            sponsorData.primary_contact_name ||
            sponsorData.organization_name ||
            "Sponsor User",
          role: "ORG_ADMIN",
          organizationId: sponsorData.organization_id,
          organizationType: "sponsor",
          organization: {
            id: sponsorData.organization_id,
            name: sponsorData.organization_name,
            slug: null,
            type: "sponsor",
          },
          userType: "sponsor",
        },
      });
    }

    // 3. Check users table (for CDEs and admins)
    // Note: Both role_type (newer) and organization_type (legacy) may exist
    const { data: userData } = await supabase
      .from("users")
      .select(
        "id, email, name, role, organization_id, role_type, organization_type",
      )
      .eq("email", normalizedEmail)
      .single();

    type UserData = {
      id: string;
      email: string;
      name: string | null;
      role: string | null;
      organization_id: string | null;
      role_type: string | null;
      organization_type: string | null;
    };
    const user = userData as UserData | null;

    if (user) {
      // Use role_type if available, fall back to organization_type for legacy data
      const effectiveRoleType = user.role_type || user.organization_type;

      // Get org details from appropriate table
      let orgName = null;
      let orgSlug = null;
      if (user.organization_id && effectiveRoleType) {
        const tableName =
          effectiveRoleType === "sponsor"
            ? "sponsors"
            : effectiveRoleType === "investor"
              ? "investors"
              : "cdes";
        // Dynamic table — cast through unknown since column sets differ per table
        const { data: org } = await supabase
          .from(tableName)
          .select("organization_name, slug")
          .eq("organization_id", user.organization_id)
          .single();
        if (org) {
          const orgRow = org as unknown as {
            organization_name: string | null;
            slug?: string | null;
          };
          orgName = orgRow.organization_name;
          orgSlug = orgRow.slug || null;
        }
      }

      const orgType = effectiveRoleType || "cde";
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "ORG_ADMIN",
          organizationId: user.organization_id,
          organizationType: orgType,
          organization: user.organization_id
            ? {
                id: user.organization_id,
                name: orgName,
                slug: orgSlug,
                type: orgType,
              }
            : null,
          userType: orgType === "admin" ? "admin" : "cde",
        },
      });
    }

    // User not found in any table
    return NextResponse.json(
      { error: "No demo user found with this email" },
      { status: 404 },
    );
  } catch (error) {
    console.error("[DemoLogin] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
