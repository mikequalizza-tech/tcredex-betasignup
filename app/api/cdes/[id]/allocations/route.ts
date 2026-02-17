/**
 * tCredex CDE Allocations API
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireAuth } from "@/lib/api/auth-middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Resolve CDE by `cdes.id`, `cdes.organization_id`, or `cdes_merged.organization_id`.
 * Dashboard passes users.organization_id which may match any of these.
 * Returns { id, organization_id, source } where source indicates which table matched.
 */
async function resolveCde(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  idOrOrgId: string,
) {
  // Try cdes table by primary key
  const { data: byId } = await supabase
    .from("cdes")
    .select("id, organization_id")
    .eq("id", idOrOrgId)
    .maybeSingle();

  if (byId)
    return {
      ...(byId as { id: string; organization_id: string }),
      source: "cdes" as const,
    };

  // Try cdes table by organization_id
  const { data: byOrgId } = await supabase
    .from("cdes")
    .select("id, organization_id")
    .eq("organization_id", idOrOrgId)
    .maybeSingle();

  if (byOrgId)
    return {
      ...(byOrgId as { id: string; organization_id: string }),
      source: "cdes" as const,
    };

  // Fall back to cdes_merged (QEI-imported CDEs that may not have a cdes row)
  const { data: merged } = await supabase
    .from("cdes_merged")
    .select("id, organization_id")
    .eq("organization_id", idOrOrgId)
    .limit(1)
    .maybeSingle();

  if (merged)
    return {
      ...(merged as { id: string; organization_id: string }),
      source: "cdes_merged" as const,
    };

  return null;
}

// =============================================================================
// GET /api/cdes/[id]/allocations
// =============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const cde = await resolveCde(supabase, id);

    if (!cde) {
      return NextResponse.json({ error: "CDE not found" }, { status: 404 });
    }

    const isAdmin = user.organizationType === "admin";
    const isOwner =
      user.organizationType === "cde" &&
      cde.organization_id === user.organizationId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If CDE exists in the cdes table, get allocations from cde_allocations
    if (cde.source === "cdes") {
      const { data, error } = await supabase
        .from("cde_allocations")
        .select("*")
        .eq("cde_id", cde.id)
        .order("year", { ascending: false });

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    // CDE only in cdes_merged — return allocation data from merged rows
    // Note: deployment_deadline does NOT exist on cdes_merged (only on cde_allocations)
    const { data: mergedRows, error: mergedError } = await supabase
      .from("cdes_merged")
      .select(
        "id, year, total_allocation, amount_remaining, amount_finalized, non_metro_commitment, allocation_type",
      )
      .eq("organization_id", cde.organization_id)
      .order("year", { ascending: false });

    if (mergedError) throw mergedError;

    // Map cdes_merged rows to cde_allocations-like shape for dashboard compatibility
    const allocations = (mergedRows || []).map(
      (row: Record<string, unknown>) => ({
        id: row.id,
        cde_id: cde.id,
        type: row.allocation_type || "federal",
        year: row.year,
        awarded_amount: row.total_allocation || 0,
        available_on_platform: row.amount_remaining || 0,
        deployed_amount:
          ((row.total_allocation as number) || 0) -
          ((row.amount_remaining as number) || 0),
        deployment_deadline: null,
      }),
    );

    return NextResponse.json(allocations);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/cdes/[id]/allocations - Add new allocation
// =============================================================================

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await request.json();

    const cde = await resolveCde(supabase, id);

    if (!cde) {
      return NextResponse.json({ error: "CDE not found" }, { status: 404 });
    }

    const isAdmin = user.organizationType === "admin";
    const isOwner =
      user.organizationType === "cde" &&
      cde.organization_id === user.organizationId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate required fields
    if (!body.type || !body.year || !body.awarded_amount) {
      return NextResponse.json(
        { error: "type, year, and awarded_amount are required" },
        { status: 400 },
      );
    }

    const allocationData = {
      cde_id: cde.id,
      type: body.type,
      year: body.year,
      state_code: body.state_code,
      awarded_amount: body.awarded_amount,
      available_on_platform: body.available_on_platform || body.awarded_amount,
      deployed_amount: body.deployed_amount || 0,
      percentage_won: body.percentage_won,
      deployment_deadline: body.deployment_deadline,
      notes: body.notes,
    };

    const { data, error } = await supabase
      .from("cde_allocations")
      .insert(allocationData as never)
      .select()
      .single();

    if (error) throw error;

    // Update CDE totals
    await updateCDETotals(cde.id, supabase);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// Helper: Update CDE allocation totals
// =============================================================================

async function updateCDETotals(
  cdeId: string,
  supabase: ReturnType<typeof getSupabaseAdmin>,
) {
  const { data: allocationsData } = await supabase
    .from("cde_allocations")
    .select("awarded_amount, available_on_platform, deployment_deadline")
    .eq("cde_id", cdeId);

  type AllocationRow = {
    awarded_amount: number | null;
    available_on_platform: number | null;
    deployment_deadline: string | null;
  };
  const allocations = allocationsData as AllocationRow[] | null;

  if (!allocations || allocations.length === 0) return;

  const totalAllocation = allocations.reduce(
    (sum, a) => sum + (a.awarded_amount || 0),
    0,
  );
  const remainingAllocation = allocations.reduce(
    (sum, a) => sum + (a.available_on_platform || 0),
    0,
  );

  // Find earliest deadline
  const deadlines = allocations
    .filter((a) => a.deployment_deadline)
    .map((a) => new Date(a.deployment_deadline!));
  const earliestDeadline =
    deadlines.length > 0
      ? new Date(Math.min(...deadlines.map((d) => d.getTime())))
          .toISOString()
          .split("T")[0]
      : null;

  await supabase
    .from("cdes")
    .update({
      total_allocation: totalAllocation,
      remaining_allocation: remainingAllocation,
      deployment_deadline: earliestDeadline,
    } as never)
    .eq("id", cdeId);
}
