/**
 * tCredex Commitment Actions API
 * 
 * POST /api/commitments/[id]/actions
 * 
 * Actions:
 * - issue: Investor issues draft commitment
 * - send: Investor sends for acceptance
 * - sponsor_accept: Sponsor accepts commitment
 * - cde_accept: CDE accepts commitment (NMTC only)
 * - reject: Any party rejects
 * - withdraw: Investor withdraws commitment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCommitmentService } from '@/lib/loi';
import { handleAuthError, requireAuth, verifyDealAccess } from '@/lib/api/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

type CommitmentAction = 
  | 'issue' 
  | 'send' 
  | 'sponsor_accept' 
  | 'cde_accept' 
  | 'reject' 
  | 'withdraw';

interface ActionRequest {
  action: CommitmentAction;
  notes?: string;
  reason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json() as ActionRequest;
    const { action, notes, reason } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action required' },
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

    let commitment;

    switch (action) {
      case 'issue':
        if (user.organizationType !== 'admin' && !(await canUserActAsInvestor(user.organizationId, existing.investor_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the issuing investor can issue this commitment' },
            { status: 403 }
          );
        }
        commitment = await service.issue(id, user.id);
        break;

      case 'send':
        if (user.organizationType !== 'admin' && !(await canUserActAsInvestor(user.organizationId, existing.investor_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the issuing investor can send this commitment' },
            { status: 403 }
          );
        }
        commitment = await service.sendForAcceptance(id, user.id);
        break;

      case 'sponsor_accept':
        if (user.organizationType !== 'admin' && !(await canUserActAsSponsor(user.organizationId, existing.sponsor_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the sponsor can accept this commitment' },
            { status: 403 }
          );
        }
        commitment = await service.sponsorAccept(id, existing.sponsor_id, notes);
        break;

      case 'cde_accept':
        if (!existing.cde_id) {
          return NextResponse.json(
            { success: false, error: 'This commitment does not require CDE acceptance' },
            { status: 400 }
          );
        }
        if (user.organizationType !== 'admin' && !(await canUserActAsCde(user.organizationId, existing.cde_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the CDE can accept this commitment' },
            { status: 403 }
          );
        }
        commitment = await service.cdeAccept(id, user.id, notes);
        break;

      case 'reject':
        if (!reason) {
          return NextResponse.json(
            { success: false, error: 'reason required for reject action' },
            { status: 400 }
          );
        }
        if (user.organizationType !== 'admin' && !(await canUserParticipateInCommitment(user.organizationId, existing))) {
          return NextResponse.json(
            { success: false, error: 'Only deal participants can reject this commitment' },
            { status: 403 }
          );
        }
        commitment = await service.reject(id, user.id, reason);
        break;

      case 'withdraw':
        if (!reason) {
          return NextResponse.json(
            { success: false, error: 'reason required for withdraw action' },
            { status: 400 }
          );
        }
        if (user.organizationType !== 'admin' && !(await canUserActAsInvestor(user.organizationId, existing.investor_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the issuing investor can withdraw this commitment' },
            { status: 403 }
          );
        }
        commitment = await service.withdraw(id, user.id, reason);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Check if closing room was triggered
    const closingTriggered = commitment.status === 'all_accepted';

    return NextResponse.json({
      success: true,
      commitment,
      action_performed: action,
      closing_room_triggered: closingTriggered,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

type CommitmentRecord = {
  investor_id: string;
  sponsor_id: string;
  cde_id?: string | null;
};

async function canUserActAsInvestor(userOrganizationId: string, investorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data: investor } = await supabase
    .from('investors')
    .select('organization_id')
    .eq('id', investorId)
    .single();

  return !!investor && (investor as { organization_id: string }).organization_id === userOrganizationId;
}

async function canUserActAsSponsor(userOrganizationId: string, sponsorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('organization_id')
    .eq('id', sponsorId)
    .single();

  return !!sponsor && (sponsor as { organization_id: string }).organization_id === userOrganizationId;
}

async function canUserActAsCde(userOrganizationId: string, cdeId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data: cde } = await supabase
    .from('cdes')
    .select('organization_id')
    .eq('id', cdeId)
    .single();

  if (cde && (cde as { organization_id: string }).organization_id === userOrganizationId) {
    return true;
  }

  const { data: cdeFallback } = await supabase
    .from('cdes_merged')
    .select('organization_id')
    .eq('id', cdeId)
    .single();

  return !!cdeFallback && (cdeFallback as { organization_id: string }).organization_id === userOrganizationId;
}

async function canUserParticipateInCommitment(
  userOrganizationId: string,
  commitment: CommitmentRecord
): Promise<boolean> {
  if (await canUserActAsInvestor(userOrganizationId, commitment.investor_id)) {
    return true;
  }
  if (await canUserActAsSponsor(userOrganizationId, commitment.sponsor_id)) {
    return true;
  }
  if (commitment.cde_id && await canUserActAsCde(userOrganizationId, commitment.cde_id)) {
    return true;
  }

  return false;
}
