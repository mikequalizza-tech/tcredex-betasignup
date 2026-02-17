/**
 * tCredex LOI API - Individual Operations
 * 
 * GET /api/loi/[id] - Get LOI by ID
 * PUT /api/loi/[id] - Update LOI
 * DELETE /api/loi/[id] - Withdraw LOI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLOIService } from '@/lib/loi';
import { UpdateLOIInput } from '@/types/loi';
import { handleAuthError, requireAuth, verifyDealAccess } from '@/lib/api/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

// =============================================================================
// GET /api/loi/[id]
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const service = getLOIService();
    const loi = await service.getById(id);

    if (!loi) {
      return NextResponse.json(
        { success: false, error: 'LOI not found' },
        { status: 404 }
      );
    }
    await verifyDealAccess(request, user, loi.deal_id, 'view');

    return NextResponse.json({
      success: true,
      loi,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PUT /api/loi/[id]
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { input } = body as { input: UpdateLOIInput };

    if (!input) {
      return NextResponse.json(
        { success: false, error: 'input required' },
        { status: 400 }
      );
    }

    const service = getLOIService();
    const existing = await service.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'LOI not found' },
        { status: 404 }
      );
    }
    await verifyDealAccess(request, user, existing.deal_id, 'edit');

    if (user.organizationType !== 'admin' && !(await canUserManageLoiAsCde(user.organizationId, existing.cde_id))) {
      return NextResponse.json(
        { success: false, error: 'Only the issuing CDE can update this LOI' },
        { status: 403 }
      );
    }

    const loi = await service.update(id, input, user.id);

    return NextResponse.json({
      success: true,
      loi,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// DELETE /api/loi/[id] (Withdraw)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { reason } = body as { reason: string };

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'reason required' },
        { status: 400 }
      );
    }

    const service = getLOIService();
    const existing = await service.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'LOI not found' },
        { status: 404 }
      );
    }
    await verifyDealAccess(request, user, existing.deal_id, 'edit');

    if (user.organizationType !== 'admin' && !(await canUserManageLoiAsCde(user.organizationId, existing.cde_id))) {
      return NextResponse.json(
        { success: false, error: 'Only the issuing CDE can withdraw this LOI' },
        { status: 403 }
      );
    }

    const loi = await service.withdraw(id, user.id, reason);

    return NextResponse.json({
      success: true,
      loi,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function canUserManageLoiAsCde(userOrganizationId: string, loiCdeId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: cde } = await supabase
    .from('cdes_merged')
    .select('organization_id')
    .eq('id', loiCdeId)
    .single();

  if (cde && (cde as { organization_id: string }).organization_id === userOrganizationId) {
    return true;
  }

  const { data: cdeFallback } = await supabase
    .from('cdes')
    .select('organization_id')
    .eq('id', loiCdeId)
    .single();

  return !!cdeFallback && (cdeFallback as { organization_id: string }).organization_id === userOrganizationId;
}
