/**
 * LOI Response API
 *
 * POST /api/loi/[id]/respond - Submit sponsor response to LOI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLOIService } from '@/lib/loi';
import { handleAuthError, requireAuth, verifyDealAccess } from '@/lib/api/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notify } from '@/lib/notifications/emit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: loiId } = await params;
    const body = await request.json();

    const { action, notes, counter_terms } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action is required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject', 'counter'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be one of: accept, reject, counter' },
        { status: 400 }
      );
    }

    if (action === 'counter' && !counter_terms) {
      return NextResponse.json(
        { success: false, error: 'counter_terms required for counter action' },
        { status: 400 }
      );
    }

    const service = getLOIService();

    // Verify sponsor owns this LOI
    const loi = await service.getById(loiId);
    if (!loi) {
      return NextResponse.json(
        { success: false, error: 'LOI not found' },
        { status: 404 }
      );
    }
    await verifyDealAccess(request, user, loi.deal_id, 'edit');

    if (user.organizationType !== 'admin' && !(await canUserRespondAsSponsor(user.organizationId, loi.sponsor_id))) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to respond to this LOI' },
        { status: 403 }
      );
    }

    if (loi.status !== 'pending_sponsor') {
      return NextResponse.json(
        { success: false, error: `LOI is not pending sponsor response (current status: ${loi.status})` },
        { status: 400 }
      );
    }

    // Submit the response
    const updatedLOI = await service.sponsorRespond(
      loiId,
      {
        action,
        notes,
        counter_terms,
      },
      loi.sponsor_id
    );

    // Send notification to CDE about sponsor's response
    try {
      const supabase = getSupabaseAdmin();

      // Get deal and sponsor info for notification
      const { data: deal } = await supabase
        .from('deals')
        .select('project_name, sponsor_name')
        .eq('id', loi.deal_id)
        .single();

      if (deal) {
        const sponsorName = deal.sponsor_name || 'The sponsor';
        const projectName = deal.project_name || 'the project';

        switch (action) {
          case 'accept':
            await notify.loiAccepted(loi.deal_id, projectName, sponsorName);
            break;
          case 'reject':
            await notify.loiRejected(loi.deal_id, projectName, sponsorName);
            break;
          case 'counter':
            await notify.loiCountered(loi.deal_id, projectName, sponsorName);
            break;
        }
      }
    } catch (notifyError) {
      console.error('Failed to send LOI response notification:', notifyError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      loi: updatedLOI,
      message: action === 'accept' ? 'LOI accepted successfully' :
               action === 'counter' ? 'Counter proposal submitted' :
               'LOI rejected',
    });
  } catch (error) {
    return handleAuthError(error);
  }
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
