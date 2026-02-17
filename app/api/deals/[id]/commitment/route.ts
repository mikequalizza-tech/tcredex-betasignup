import { NextRequest, NextResponse } from 'next/server';
import { getCommitmentService } from '@/lib/loi/commitmentService';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notify } from '@/lib/notifications/emit';
import { handleAuthError, requireAuth, verifyDealAccess } from '@/lib/api/auth-middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (user.organizationType !== 'investor' && user.organizationType !== 'admin') {
      return NextResponse.json(
        { error: 'Only investor users can create commitments' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    await verifyDealAccess(request, user, id, 'view');

    const supabase = getSupabaseAdmin();
    const investorId = user.organizationType === 'investor'
      ? await getInvestorIdForOrganization(supabase, user.organizationId)
      : (body.investor_id || body.senderOrgId);

    if (!investorId) {
      return NextResponse.json(
        { error: 'Unable to resolve investor profile for this user' },
        { status: 400 }
      );
    }

    const commitmentService = getCommitmentService();

    // Create commitment using existing service
    const commitment = await commitmentService.create(
      {
        deal_id: id,
        investor_id: investorId,
        cde_id: body.cde_id,
        loi_id: body.loi_id,
        investment_amount: body.investment_amount || 0,
        credit_type: body.credit_type || 'NMTC',
        credit_rate: body.credit_rate || 0.5,
        pricing_cents_per_credit: body.pricing_cents_per_credit,
        target_closing_date: body.target_closing_date,
        special_terms: body.message || undefined,
        conditions: body.conditions,
      },
      user.id
    );

    // Send notification to sponsor and CDE about new commitment
    try {
      // Get deal and investor info for notification
      const [{ data: deal }, { data: investor }] = await Promise.all([
        supabase.from('deals').select('project_name').eq('id', id).single(),
        supabase
          .from('investors')
          .select('organization_name, primary_contact_name')
          .eq('id', investorId)
          .single(),
      ]);

      if (deal) {
        const projectName = deal.project_name || 'Your Project';
        const investorName =
          (investor as { organization_name?: string | null; primary_contact_name?: string | null } | null)?.organization_name
          || (investor as { organization_name?: string | null; primary_contact_name?: string | null } | null)?.primary_contact_name
          || 'An Investor';

        // Notify sponsor and CDE about new commitment
        await notify.commitmentReceived(id, projectName, investorName);
      }
    } catch (notifyError) {
      console.error('Failed to send commitment notification:', notifyError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: commitment }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function getInvestorIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('investors')
    .select('id')
    .eq('organization_id', organizationId)
    .single();

  return (data as { id: string } | null)?.id || null;
}
