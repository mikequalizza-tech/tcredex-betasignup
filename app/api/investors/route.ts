/**
 * tCredex Investors API
 * CRUD operations for Investors
 *
 * CRITICAL: All endpoints require authentication and org filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";

// =============================================================================
// GET /api/investors - List investors with filters
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);

    const creditType = searchParams.get("credit_type");
    const minInvestment = searchParams.get("min_investment");
    const craMotivated = searchParams.get("cra_motivated");
    // OPTIMIZATION: Enforce maximum limit to prevent large queries
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    let query = supabase
      .from("investors")
      .select(
        `
        id,
        organization_id,
        primary_contact_name,
        primary_contact_email,
        investor_type,
        cra_motivated,
        min_investment,
        max_investment,
        target_credit_types,
        target_states,
        accredited,
        created_at
      `,
      )
      .order("max_investment", { ascending: false })
      .limit(limit);

    // CRITICAL: Filter by organization based on user type
    if (user.organizationType === "investor") {
      // Investors see only their own profile
      query = query.eq("organization_id", user.organizationId);
    }
    // Sponsors and CDEs see all investors (no status filter - investors table doesn't have status column)
    // Admin sees all investors (no filter)

    if (creditType) query = query.contains("target_credit_types", [creditType]);
    if (minInvestment)
      query = query.gte("max_investment", parseInt(minInvestment));
    if (craMotivated === "true") query = query.eq("cra_motivated", true);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(
      {
        investors: data,
        organizationId: user.organizationId,
        organizationType: user.organizationType,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60", // Cache for 60 seconds
        },
      },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/investors - Create investor profile
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require authentication and ORG_ADMIN role
    const user = await requireAuth(request);

    if (user.organizationType !== "investor" || user.userRole !== "ORG_ADMIN") {
      return NextResponse.json(
        {
          error:
            "Only investor organization admins can create investor profiles",
        },
        { status: 403 },
      );
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // CRITICAL: Investor profile must belong to user's organization
    const organizationId = user.organizationId;

    // Create investor profile
    const { data, error } = await supabase
      .from("investors")
      .insert({
        organization_id: organizationId,
        primary_contact_name: body.primary_contact_name,
        primary_contact_email: body.primary_contact_email,
        investor_type: body.investor_type || "Bank",
        cra_motivated: body.cra_motivated ?? true,
        min_investment: body.min_investment || 1000000,
        max_investment: body.max_investment || 25000000,
        target_credit_types: body.target_credit_types || ["NMTC"],
        target_states: body.target_states,
        accredited: body.accredited ?? true,
      } as never)
      .select()
      .single();

    if (error) throw error;

    const typedData = data as Record<string, unknown>;

    return NextResponse.json(
      {
        ...typedData,
        organizationId: user.organizationId,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
