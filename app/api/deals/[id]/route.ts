/**
 * tCredex Deal API - Single Deal Operations
 * GET, PATCH, DELETE for individual deals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { handleAuthError, requireAuth, verifyDealAccess } from '@/lib/api/auth-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET /api/deals/[id] - Get single deal
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    await verifyDealAccess(request, user, id, 'view');

    // Query deal WITHOUT FK joins (avoids Supabase FK relationship issues)
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (dealError) {
      if (dealError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      throw dealError;
    }

    const typedDeal = dealData as Record<string, unknown>;

    // Query related tables separately
    let sponsor = null;
    let assignedCde = null;
    let documents: unknown[] = [];

    // Get sponsor info (prefer sponsor_id, fallback to sponsor_organization_id)
    const sponsorSelect =
      'id, organization_name, organization_id, organization_type, website, description, year_founded, primary_contact_name, primary_contact_email, primary_contact_phone, woman_owned, minority_owned, veteran_owned, low_income_owned';
    const sponsorId = typeof typedDeal.sponsor_id === 'string' ? typedDeal.sponsor_id : null;
    const sponsorOrganizationId =
      typeof typedDeal.sponsor_organization_id === 'string' ? typedDeal.sponsor_organization_id : null;

    if (sponsorId) {
      const { data } = await supabase
        .from('sponsors')
        .select(sponsorSelect)
        .eq('id', sponsorId)
        .maybeSingle();
      sponsor = data;
    }

    if (!sponsor && sponsorOrganizationId) {
      const { data } = await supabase
        .from('sponsors')
        .select(sponsorSelect)
        .eq('organization_id', sponsorOrganizationId)
        .maybeSingle();
      sponsor = data;
    }

    // Get assigned CDE info
    if (typedDeal.assigned_cde_id) {
      const { data } = await supabase
        .from('cdes_merged')
        .select('id, name, organization_id, mission_statement, primary_states, target_sectors')
        .eq('id', typedDeal.assigned_cde_id as string)
        .single();
      assignedCde = data;
    }

    // Get documents for this deal
    const { data: docsData } = await supabase
      .from('documents')
      .select('id, name, category, status, created_at')
      .eq('deal_id', id);
    documents = docsData || [];

    // Combine into response
    const dealWithRelations = {
      ...typedDeal,
      sponsor,
      assigned_cde: assignedCde,
      documents,
    };

    return NextResponse.json(dealWithRelations);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PATCH /api/deals/[id] - Update deal
// =============================================================================
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    await verifyDealAccess(request, user, id, 'edit');
    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    const { id: _, created_at: _created_at, ...updates } = body;

    const { data, error } = await supabase
      .from('deals')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      throw error;
    }

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: user.id,
      entity_type: 'application',
      entity_id: id,
      action: 'application_updated',
      payload_json: { updated_fields: Object.keys(updates) },
      hash: generateHash({ id, updates }),
    } as never);

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// DELETE /api/deals/[id] - Delete deal (soft delete via status)
// =============================================================================
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    await verifyDealAccess(request, user, id, 'edit');

    // Soft delete - change status to withdrawn
    const { data: _data, error } = await supabase
      .from('deals')
      .update({ status: 'withdrawn', visible: false } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }
      throw error;
    }

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: user.id,
      entity_type: 'application',
      entity_id: id,
      action: 'application_status_changed',
      payload_json: { new_status: 'withdrawn' },
      hash: generateHash({ id, action: 'withdrawn' }),
    } as never);

    return NextResponse.json({ success: true, message: 'Deal withdrawn' });
  } catch (error) {
    return handleAuthError(error);
  }
}

function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
