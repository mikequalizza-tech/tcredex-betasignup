/**
 * tCredex CDE API - Single CDE Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { handleAuthError, requireAuth } from '@/lib/api/auth-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Resolve CDE by `cdes.id`, `cdes.organization_id`, or `cdes_merged.organization_id`.
 * Dashboard passes users.organization_id which may match any of these.
 * Returns { id, source } where source indicates which table matched.
 */
async function resolveCdeId(supabase: ReturnType<typeof getSupabaseAdmin>, idOrOrgId: string): Promise<{ id: string; orgId: string; source: 'cdes' | 'cdes_merged' } | null> {
  const { data: byId } = await supabase
    .from('cdes')
    .select('id, organization_id')
    .eq('id', idOrOrgId)
    .maybeSingle();

  if (byId) return { id: (byId as { id: string }).id, orgId: (byId as { organization_id: string }).organization_id, source: 'cdes' };

  const { data: byOrgId } = await supabase
    .from('cdes')
    .select('id, organization_id')
    .eq('organization_id', idOrOrgId)
    .maybeSingle();

  if (byOrgId) return { id: (byOrgId as { id: string }).id, orgId: (byOrgId as { organization_id: string }).organization_id, source: 'cdes' };

  // Fall back to cdes_merged (QEI-imported CDEs without a cdes table row)
  const { data: merged } = await supabase
    .from('cdes_merged')
    .select('id, organization_id')
    .eq('organization_id', idOrOrgId)
    .limit(1)
    .maybeSingle();

  if (merged) return { id: (merged as { id: string }).id, orgId: (merged as { organization_id: string }).organization_id, source: 'cdes_merged' };

  return null;
}

// =============================================================================
// GET /api/cdes/[id] - Get single CDE with allocations
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    // Resolve CDE by id or organization_id (checks cdes then cdes_merged)
    const resolved = await resolveCdeId(supabase, id);
    if (!resolved) {
      return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
    }

    const isAdmin = user.organizationType === 'admin';
    const isOwner = user.organizationType === 'cde' && resolved.orgId === user.organizationId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (resolved.source === 'cdes') {
      const { data: cdeData, error } = await supabase
        .from('cdes')
        .select(`
          *,
          allocations:cde_allocations(*)
        `)
        .eq('id', resolved.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
        }
        throw error;
      }
      return NextResponse.json(cdeData);
    }

    // CDE only in cdes_merged — aggregate all year rows into a single response
    const { data: mergedRows, error: mergedError } = await supabase
      .from('cdes_merged')
      .select('*')
      .eq('organization_id', resolved.orgId)
      .order('year', { ascending: false });

    if (mergedError) throw mergedError;
    if (!mergedRows || mergedRows.length === 0) {
      return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
    }

    // Use the most recent row as the base profile, attach all rows as allocations
    const latest = mergedRows[0] as Record<string, unknown>;
    return NextResponse.json({
      ...latest,
      allocations: mergedRows.map((row: Record<string, unknown>) => ({
        id: row.id,
        type: row.allocation_type || 'federal',
        year: row.year,
        awarded_amount: row.total_allocation || 0,
        available_on_platform: row.amount_remaining || 0,
        deployed_amount: ((row.total_allocation as number) || 0) - ((row.amount_remaining as number) || 0),
        deployment_deadline: null,
      })),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PATCH /api/cdes/[id] - Update CDE profile
// =============================================================================
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await request.json();

    const resolved = await resolveCdeId(supabase, id);
    if (!resolved) {
      return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
    }

    const isAdmin = user.organizationType === 'admin';
    const isOwner = user.organizationType === 'cde' && resolved.orgId === user.organizationId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // cdes_merged is read-only — PATCH only works for cdes table
    if (resolved.source === 'cdes_merged') {
      return NextResponse.json({ error: 'CDE profile is read-only (imported from CDFI Fund)' }, { status: 403 });
    }

    // Handle allocations separately
    const { allocations, ...cdeUpdates } = body;

    // Update CDE profile
    const { data: _data, error } = await supabase
      .from('cdes')
      .update(cdeUpdates as never)
      .eq('id', resolved.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
      }
      throw error;
    }

    // Update allocations if provided
    if (allocations && Array.isArray(allocations)) {
      await supabase.from('cde_allocations').delete().eq('cde_id', resolved.id);

      if (allocations.length > 0) {
        const allocationsToInsert = allocations.map((a: Record<string, unknown>) => ({
          cde_id: resolved.id,
          type: a.type,
          year: a.year,
          state_code: a.state_code,
          awarded_amount: a.awarded_amount,
          available_on_platform: a.available_on_platform,
          deployment_deadline: a.deployment_deadline,
        }));

        await supabase.from('cde_allocations').insert(allocationsToInsert as never);
      }

      const totalAllocation = allocations.reduce((sum: number, a: Record<string, number>) => sum + (a.awarded_amount || 0), 0);
      const remainingAllocation = allocations.reduce((sum: number, a: Record<string, number>) => sum + (a.available_on_platform || 0), 0);

      await supabase
        .from('cdes')
        .update({ total_allocation: totalAllocation, remaining_allocation: remainingAllocation } as never)
        .eq('id', resolved.id);
    }

    const { data: updated } = await supabase
      .from('cdes')
      .select(`*, allocations:cde_allocations(*)`)
      .eq('id', resolved.id)
      .single();

    return NextResponse.json(updated);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// DELETE /api/cdes/[id] - Deactivate CDE
// =============================================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;

    const resolved = await resolveCdeId(supabase, id);
    if (!resolved) {
      return NextResponse.json({ error: 'CDE not found' }, { status: 404 });
    }

    const isAdmin = user.organizationType === 'admin';
    const isOwner = user.organizationType === 'cde' && resolved.orgId === user.organizationId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (resolved.source === 'cdes_merged') {
      return NextResponse.json({ error: 'CDE profile is read-only (imported from CDFI Fund)' }, { status: 403 });
    }

    const { error } = await supabase
      .from('cdes')
      .update({ status: 'inactive' } as never)
      .eq('id', resolved.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
