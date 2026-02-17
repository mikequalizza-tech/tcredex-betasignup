/**
 * tCredex LOI Actions API
 * 
 * POST /api/loi/[id]/actions
 * 
 * Actions:
 * - issue: CDE issues draft LOI
 * - send: CDE sends to sponsor
 * - respond: Sponsor accepts/rejects/counters
 * - withdraw: CDE withdraws LOI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLOIService } from '@/lib/loi';
import { LOISponsorResponse } from '@/types/loi';
import { handleAuthError, requireAuth, verifyDealAccess } from '@/lib/api/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

type LOIAction = 'issue' | 'send' | 'respond' | 'withdraw';

interface ActionRequest {
  action: LOIAction;
  // For respond action
  response?: LOISponsorResponse;
  // For withdraw action
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
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action required' },
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

    let loi;

    switch (action) {
      case 'issue':
        if (user.organizationType !== 'admin' && !(await canUserManageLoiAsCde(user.organizationId, existing.cde_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the issuing CDE can issue this LOI' },
            { status: 403 }
          );
        }
        loi = await service.issue(id, user.id);
        break;

      case 'send':
        if (user.organizationType !== 'admin' && !(await canUserManageLoiAsCde(user.organizationId, existing.cde_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the issuing CDE can send this LOI' },
            { status: 403 }
          );
        }
        loi = await service.sendToSponsor(id, user.id);
        break;

      case 'respond':
        if (!body.response) {
          return NextResponse.json(
            { success: false, error: 'response object required for respond action' },
            { status: 400 }
          );
        }
        if (user.organizationType !== 'admin' && !(await canUserRespondAsSponsor(user.organizationId, existing.sponsor_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the sponsor can respond to this LOI' },
            { status: 403 }
          );
        }
        loi = await service.sponsorRespond(id, body.response, existing.sponsor_id);
        break;

      case 'withdraw':
        if (!body.reason) {
          return NextResponse.json(
            { success: false, error: 'reason required for withdraw action' },
            { status: 400 }
          );
        }
        if (user.organizationType !== 'admin' && !(await canUserManageLoiAsCde(user.organizationId, existing.cde_id))) {
          return NextResponse.json(
            { success: false, error: 'Only the issuing CDE can withdraw this LOI' },
            { status: 403 }
          );
        }
        loi = await service.withdraw(id, user.id, body.reason);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      loi,
      action_performed: action,
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

async function canUserRespondAsSponsor(userOrganizationId: string, sponsorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: sponsor } = await supabase
    .from('sponsors')
    .select('organization_id')
    .eq('id', sponsorId)
    .single();

  return !!sponsor && (sponsor as { organization_id: string }).organization_id === userOrganizationId;
}
