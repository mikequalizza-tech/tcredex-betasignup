/**
 * tCredex Investor Criteria API
 * GET/PATCH risk preferences for an investor
 *
 * Reads from the `investors` table columns that exist today
 * (min_investment, max_investment, target_credit_types, target_states, cra_motivated)
 * and returns defaults for columns that don't exist yet.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET /api/investors/[id]/criteria - Read investor risk preferences
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    // Only the investor's own org or admin can read criteria
    const isAdmin = user.organizationType === "admin";
    const isOwner =
      user.organizationType === "investor" && user.organizationId === id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Try to find investor by organization_id first, then by id
    let query = supabase
      .from("investors")
      .select("*")
      .eq("organization_id", id)
      .maybeSingle();

    const { data, error } = await query;

    if (error) throw error;

    if (!data) {
      // Try by primary key
      const { data: byId, error: byIdError } = await supabase
        .from("investors")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (byIdError) throw byIdError;
      if (!byId) {
        return NextResponse.json(
          { error: "Investor not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ data: byId });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PATCH /api/investors/[id]/criteria - Update investor risk preferences
// =============================================================================
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    // Only the investor's own org or admin can update criteria
    const isAdmin = user.organizationType === "admin";
    const isOwner =
      user.organizationType === "investor" && user.organizationId === id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Map incoming fields to existing investor table columns
    const updates: Record<string, unknown> = {};

    if (body.min_investment !== undefined)
      updates.min_investment = body.min_investment;
    if (body.max_investment !== undefined)
      updates.max_investment = body.max_investment;
    if (body.target_credit_types !== undefined)
      updates.target_credit_types = body.target_credit_types;
    if (body.target_states !== undefined)
      updates.target_states = body.target_states;
    if (body.cra_motivated !== undefined)
      updates.cra_motivated = body.cra_motivated;
    if (body.excluded_states !== undefined)
      updates.excluded_states = body.excluded_states;

    // Store remaining risk preferences as JSON in risk_preferences column (if exists)
    // Build the preferences object from all additional fields
    const riskPrefs: Record<string, unknown> = {};
    const riskFields = [
      "min_sources_committed",
      "max_leverage_ratio",
      "min_credit_price",
      "max_credit_price",
      "allow_stacked",
      "require_federal",
      "min_dd_completion",
      "require_phase1",
      "require_appraisal",
      "require_title",
      "max_close_months",
      "require_construction",
      "max_construction_months",
      "lmi_threshold",
    ];
    for (const field of riskFields) {
      if (body[field] !== undefined) riskPrefs[field] = body[field];
    }
    if (Object.keys(riskPrefs).length > 0) {
      updates.risk_preferences = riskPrefs;
    }

    // Try update by organization_id first
    const { data, error } = await supabase
      .from("investors")
      .update(updates as never)
      .eq("organization_id", id)
      .select()
      .maybeSingle();

    if (error) {
      // If risk_preferences column doesn't exist, retry without it
      if (error.message?.includes("risk_preferences")) {
        delete updates.risk_preferences;
        const { data: retryData, error: retryError } = await supabase
          .from("investors")
          .update(updates as never)
          .eq("organization_id", id)
          .select()
          .maybeSingle();

        if (retryError) throw retryError;
        return NextResponse.json({ data: retryData });
      }
      throw error;
    }

    if (!data) {
      // Try by primary key
      const { data: byId, error: byIdError } = await supabase
        .from("investors")
        .update(updates as never)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (byIdError) throw byIdError;
      if (!byId) {
        return NextResponse.json(
          { error: "Investor not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ data: byId });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAuthError(error);
  }
}
