/**
 * tCredex Deal Submit API
 * 
 * POST /api/deals/[id]/submit - Submit deal for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { handleAuthError, requireAuth, verifyDealAccess } from '@/lib/api/auth-middleware';
import { calculateReadiness } from '@/lib/intake/readinessScore';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    if (user.organizationType !== 'sponsor') {
      return NextResponse.json({ error: 'Only sponsors can submit deals' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { id } = await params;
    await verifyDealAccess(request, user, id, 'edit');
    const body = await request.json();
    
    // Get current deal
    const { data: dealData, error: fetchError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    type DealRow = {
      id: string;
      status: string;
      exclusivity_agreed: boolean | null;
      intake_data: Record<string, unknown> | null;
      programs: string[] | null;
    };
    const deal = dealData as DealRow | null;

    if (fetchError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }
    
    // Check status - can only submit drafts
    if (deal.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot submit deal in status: ${deal.status}` },
        { status: 400 }
      );
    }
    
    // Check exclusivity agreement
    if (!deal.exclusivity_agreed && !body.exclusivity_agreed) {
      return NextResponse.json(
        { error: 'Exclusivity agreement required' },
        { status: 400 }
      );
    }
    
    // Calculate readiness score from intake_data MERGED with deal-level columns
    // The scoring engine checks camelCase keys, but deal columns are snake_case.
    // Merge so the engine sees all available data, not just what's in the JSON blob.
    const rawIntake = (deal.intake_data || {}) as Record<string, unknown>;
    const dealRow = dealData as Record<string, unknown>;
    const mergedData: Record<string, unknown> = {
      ...rawIntake,
      // Tier 1: Basics, Location, Programs, Costs
      projectName: rawIntake.projectName || dealRow.project_name,
      sponsorName:
        rawIntake.sponsorName ||
        dealRow.sponsor_organization_name ||
        dealRow.sponsor_name,
      projectType: rawIntake.projectType || dealRow.project_type,
      address: rawIntake.address || dealRow.address || (dealRow.city ? `${dealRow.city}, ${dealRow.state}` : undefined),
      programs: rawIntake.programs || dealRow.programs,
      totalProjectCost: rawIntake.totalProjectCost || dealRow.total_project_cost,
      // Tier 2: Impact, Benefits, Team, Capital, Site, Timeline
      communityImpact: rawIntake.communityImpact || rawIntake.communitySupport || dealRow.community_benefit,
      communitySupport: rawIntake.communitySupport || rawIntake.communityImpact || dealRow.community_benefit,
      permanentJobsFTE: rawIntake.permanentJobsFTE ?? dealRow.permanent_jobs_fte ?? dealRow.jobs_created,
      constructionJobsFTE: rawIntake.constructionJobsFTE ?? dealRow.construction_jobs_fte,
      siteControl: rawIntake.siteControl || dealRow.site_control,
      constructionStartDate: rawIntake.constructionStartDate || dealRow.construction_start_date,
      targetClosingDate: rawIntake.targetClosingDate || dealRow.projected_closing_date,
      // Tier 3: Due Diligence
      phaseIEnvironmental: rawIntake.phaseIEnvironmental || dealRow.phase_i_environmental,
      zoningApproval: rawIntake.zoningApproval || dealRow.zoning_approval,
    };
    const readinessResult = calculateReadiness(mergedData);
    
    // Determine tier from score
    let tier = 1;
    if (readinessResult.totalScore >= 70) tier = 2;
    if (readinessResult.totalScore >= 90) tier = 3;
    
    // Update deal
    const updateData = {
      status: 'submitted',
      visible: true,
      readiness_score: readinessResult.totalScore,
      tier,
      submitted_at: new Date().toISOString(),
      exclusivity_agreed: true,
      exclusivity_agreed_at: new Date().toISOString(),
    };
    
    const { data: updatedDeal, error: updateError } = await supabase
      .from('deals')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log to ledger
    await supabase.from('ledger_events').insert({
      actor_type: 'human',
      actor_id: user.id,
      entity_type: 'deal',
      entity_id: id,
      action: 'application_submitted',
      payload_json: {
        readiness_score: readinessResult.totalScore,
        tier,
        programs: deal.programs,
      },
      hash: generateHash(updateData),
    } as never);
    
    return NextResponse.json({
      deal: updatedDeal,
      readiness: readinessResult,
    });
    
  } catch (error) {
    return handleAuthError(error);
  }
}

function generateHash(data: unknown): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}
