import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";

// Type for organization data from role tables
interface OrgData {
  name?: string;
  organization_name?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  year_founded?: number;
  description?: string;
  organization_type?: string;
  low_income_owned?: string;
  woman_owned?: string;
  minority_owned?: string;
  veteran_owned?: string;
  [key: string]: unknown;
}

// GET - Fetch organization by ID
// Note: organizations table was removed. Organization data now lives in sponsors, cdes, investors tables
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 },
      );
    }

    // CRITICAL: Users can only access their own organization (unless admin)
    if (id !== user.organizationId && user.organizationType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get organization data from the appropriate role table based on user type
    const roleTable =
      user.organizationType === "sponsor"
        ? "sponsors"
        : user.organizationType === "cde"
          ? "cdes"
          : user.organizationType === "investor"
            ? "investors"
            : null;

    if (roleTable) {
      const { data, error: orgError } = await supabase
        .from(roleTable)
        .select("*")
        .eq("organization_id", id)
        .single();

      const orgData = data as OrgData | null;

      if (!orgError && orgData) {
        return NextResponse.json({
          organization: {
            id: id,
            name:
              orgData.name ||
              orgData.organization_name ||
              orgData.primary_contact_name ||
              "Organization",
            type: user.organizationType,
            ...orgData,
          },
        });
      }

      // Fallback for CDEs: try cdes_merged if cdes table had no match
      if (user.organizationType === "cde") {
        const { data: mergedData, error: mergedError } = await supabase
          .from("cdes_merged")
          .select("*")
          .eq("organization_id", id)
          .order("year", { ascending: false })
          .limit(1)
          .maybeSingle();

        const mergedOrg = mergedData as OrgData | null;
        if (!mergedError && mergedOrg) {
          return NextResponse.json({
            organization: {
              id: id,
              name: mergedOrg.name || mergedOrg.organization_name || "CDE",
              type: "cde",
              ...mergedOrg,
            },
          });
        }
      }
    }

    // Fallback: Get basic org info from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, organization_name, role_type")
      .eq("organization_id", id)
      .limit(1)
      .single();

    if (userError || !userData) {
      console.error("[Organization] Fetch error:", userError);
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Return synthetic organization data from users table
    const orgType = userData.role_type;
    return NextResponse.json({
      organization: {
        id: userData.organization_id,
        name: userData.organization_name || "Organization",
        type: orgType || "sponsor",
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PUT - Update organization
// Note: organizations table was removed. Updates go to the appropriate role table (sponsors, cdes, investors)
export async function PUT(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const body = await request.json();
    const {
      id,
      name,
      website,
      phone,
      address,
      address_line1,
      city,
      state,
      zip_code,
      year_founded,
      description,
      primary_contact_name,
      primary_contact_email,
      primary_contact_phone,
      logo_url,
      // Sponsor-specific fields
      organization_type,
      low_income_owned,
      woman_owned,
      minority_owned,
      veteran_owned,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 },
      );
    }

    // CRITICAL: Users can only update their own organization (unless admin)
    if (id !== user.organizationId && user.organizationType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Determine which table to update based on organization type
    const roleTable =
      user.organizationType === "sponsor"
        ? "sponsors"
        : user.organizationType === "cde"
          ? "cdes"
          : user.organizationType === "investor"
            ? "investors"
            : null;

    if (!roleTable) {
      return NextResponse.json(
        { error: "Invalid organization type" },
        { status: 400 },
      );
    }

    // Build update object with only provided fields
    // Note: Different tables have different schemas
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Common fields for ALL organization types (after migration adds columns)
    if (name !== undefined) updateData.organization_name = name;
    if (website !== undefined) updateData.website = website;
    if (description !== undefined) updateData.description = description;
    if (primary_contact_name !== undefined)
      updateData.primary_contact_name = primary_contact_name;
    if (primary_contact_email !== undefined)
      updateData.primary_contact_email = primary_contact_email;
    if (primary_contact_phone !== undefined)
      updateData.primary_contact_phone = primary_contact_phone;
    if (phone !== undefined) updateData.primary_contact_phone = phone;
    if (address !== undefined || address_line1 !== undefined)
      updateData.address = address || address_line1;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip_code !== undefined) updateData.zip_code = zip_code;
    if (year_founded !== undefined) updateData.year_founded = year_founded;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    // Sponsor-specific fields
    if (user.organizationType === "sponsor") {
      if (organization_type !== undefined)
        updateData.organization_type = organization_type;
      if (low_income_owned !== undefined)
        updateData.low_income_owned = low_income_owned;
      if (woman_owned !== undefined) updateData.woman_owned = woman_owned;
      if (minority_owned !== undefined)
        updateData.minority_owned = minority_owned;
      if (veteran_owned !== undefined) updateData.veteran_owned = veteran_owned;
    }

    // CDE-specific fields (uses cdes table, not cdes_merged which is read-only)
    if (user.organizationType === "cde") {
      // year_founded maps to year_established in cdes table
      if (year_founded !== undefined)
        updateData.year_established = year_founded;
      delete updateData.year_founded; // cdes uses year_established instead
    }

    // Update the appropriate role table
    const { data, error } = await supabase
      .from(roleTable)
      .update(updateData as never)
      .eq("organization_id", id)
      .select()
      .single();

    if (error) {
      console.error("[Organization] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 },
      );
    }

    const updatedOrg = data as OrgData;

    // ALSO update organization_name in users table (for header display)
    if (name !== undefined) {
      console.log("[Organization] Syncing name to users table:", {
        organization_id: id,
        name,
      });
      const {
        data: usersData,
        error: usersError,
        count: _count,
      } = await supabase
        .from("users")
        .update({
          organization_name: name,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", id)
        .select("id, email, organization_name");

      if (usersError) {
        console.warn(
          "[Organization] Failed to update users table:",
          usersError,
        );
        // Don't fail the request, role table was updated successfully
      } else {
        console.log("[Organization] Users table updated:", {
          rowsUpdated: usersData?.length || 0,
          users: usersData,
        });
      }
    }

    return NextResponse.json({
      organization: {
        id: id,
        name:
          updatedOrg.name ||
          updatedOrg.organization_name ||
          updatedOrg.primary_contact_name ||
          "Organization",
        type: user.organizationType,
        ...updatedOrg,
      },
      success: true,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
