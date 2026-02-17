/**
 * tCredex Commitment API - Individual Operations
 * 
 * GET /api/commitments/[id] - Get commitment by ID
 * PUT /api/commitments/[id] - Update commitment
 * DELETE /api/commitments/[id] - Withdraw commitment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCommitmentService } from '@/lib/loi';
import { UpdateCommitmentInput } from '@/types/loi';
import { handleAuthError, requireAuth, verifyDealAccess } from '@/lib/api/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

// =============================================================================
// GET /api/commitments/[id]
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const service = getCommitmentService();
    const commitment = await service.getById(id);

    if (!commitment) {
      return NextResponse.json(
        { success: false, error: 'Commitment not found' },
        { status: 404 }
      );
    }
    await verifyDealAccess(request, user, commitment.deal_id, 'view');

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PUT /api/commitments/[id]
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { input } = body as { input: UpdateCommitmentInput };

    if (!input) {
      return NextResponse.json(
        { success: false, error: 'input required' },
        { status: 400 }
      );
    }

    const service = getCommitmentService();
    const existing = await service.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Commitment not found' },
        { status: 404 }
      );
    }
    await verifyDealAccess(request, user, existing.deal_id, 'edit');

    if (user.organizationType !== 'admin' && !(await canUserManageCommitmentAsInvestor(user.organizationId, existing.investor_id))) {
      return NextResponse.json(
        { success: false, error: 'Only the issuing investor can update this commitment' },
        { status: 403 }
      );
    }

    const commitment = await service.update(id, input, user.id);

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// DELETE /api/commitments/[id] (Withdraw)
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

    const service = getCommitmentService();
    const existing = await service.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Commitment not found' },
        { status: 404 }
      );
    }
    await verifyDealAccess(request, user, existing.deal_id, 'edit');

    if (user.organizationType !== 'admin' && !(await canUserManageCommitmentAsInvestor(user.organizationId, existing.investor_id))) {
      return NextResponse.json(
        { success: false, error: 'Only the issuing investor can withdraw this commitment' },
        { status: 403 }
      );
    }

    const commitment = await service.withdraw(id, user.id, reason);

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function canUserManageCommitmentAsInvestor(userOrganizationId: string, investorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: investor } = await supabase
    .from('investors')
    .select('organization_id')
    .eq('id', investorId)
    .single();

  return !!investor && (investor as { organization_id: string }).organization_id === userOrganizationId;
}
