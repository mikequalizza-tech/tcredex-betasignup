/**
 * tCredex API - My Deals
 * GET /api/deals/mine - Get current user's deals (authenticated)
 *
 * Returns deals based on the user's organization type:
 * - Sponsors: Their own deals
 * - CDEs: Deals assigned to them
 * - Investors: Deals they have commitments on
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/api/auth-middleware';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    let deals: Record<string, unknown>[] = [];

    if (user.organizationType === 'sponsor') {
      // Get sponsor_id from sponsors table
      const { data: sponsorData } = await supabase
        .from('sponsors')
        .select('id')
        .eq('organization_id', user.organizationId)
        .single();

      if (sponsorData) {
        const { data, error } = await supabase
          .from('deals')
          .select(`
            id,
            project_name,
            sponsor_name,
            sponsor_id,
            sponsor_organization_id,
            programs,
            status,
            nmtc_financing_requested,
            city,
            state,
            census_tract,
            created_at,
            updated_at
          `)
          .eq('sponsor_id', sponsorData.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        deals = data || [];
      }
    } else if (user.organizationType === 'cde') {
      // Get CDE's assigned deals
      const cdeId = await getCdeIdForOrganization(supabase, user.organizationId);

      if (cdeId) {
        const { data, error } = await supabase
          .from('deals')
          .select(`
            id,
            project_name,
            sponsor_name,
            sponsor_id,
            sponsor_organization_id,
            programs,
            status,
            nmtc_financing_requested,
            city,
            state,
            census_tract,
            created_at,
            updated_at
          `)
          .eq('assigned_cde_id', cdeId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        deals = data || [];
      }
    } else if (user.organizationType === 'investor') {
      // Get investor's committed deals
      const { data: investorData } = await supabase
        .from('investors')
        .select('id')
        .eq('organization_id', user.organizationId)
        .single();

      if (investorData) {
        const { data: directDeals, error: directError } = await supabase
          .from('deals')
          .select(`
            id,
            project_name,
            sponsor_name,
            sponsor_id,
            sponsor_organization_id,
            programs,
            status,
            nmtc_financing_requested,
            city,
            state,
            census_tract,
            created_at,
            updated_at
          `)
          .eq('investor_id', investorData.id)
          .order('updated_at', { ascending: false });

        if (directError) throw directError;
        deals = directDeals || [];

        // Fallback: include deals where investor has commitments
        const { data: commitmentRows, error: commitmentError } = await supabase
          .from('commitments')
          .select('deal_id')
          .eq('investor_id', investorData.id);

        if (!commitmentError && commitmentRows && commitmentRows.length > 0) {
          const committedDealIds = Array.from(new Set(commitmentRows.map((row: Record<string, unknown>) => row.deal_id as string).filter(Boolean)));
          const existingIds = new Set((deals || []).map((d: Record<string, unknown>) => d.id as string));
          const missingDealIds = committedDealIds.filter((dealId: string) => !existingIds.has(dealId));

          if (missingDealIds.length > 0) {
            const { data: committedDeals, error: committedDealsError } = await supabase
              .from('deals')
              .select(`
                id,
                project_name,
                sponsor_name,
                sponsor_id,
                sponsor_organization_id,
                programs,
                status,
                nmtc_financing_requested,
                city,
                state,
                census_tract,
                created_at,
                updated_at
              `)
              .in('id', missingDealIds)
              .order('updated_at', { ascending: false });

            if (!committedDealsError && committedDeals) {
              deals = [...deals, ...committedDeals];
            }
          }
        }
      }
    } else if (user.organizationType === 'admin') {
      // Admins see all deals
      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          project_name,
          sponsor_name,
          sponsor_id,
          sponsor_organization_id,
          programs,
          status,
          nmtc_financing_requested,
          city,
          state,
          census_tract,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      deals = data || [];
    }

    const dealsRaw = (deals || []) as Array<Record<string, unknown>>;
    const sponsorById = new Map<string, Record<string, unknown>>();
    const sponsorByOrgId = new Map<string, Record<string, unknown>>();
    const sponsorIds = Array.from(
      new Set(dealsRaw.map((deal) => deal.sponsor_id).filter((value): value is string => typeof value === 'string'))
    );
    if (sponsorIds.length > 0) {
      const { data: sponsorsById } = await supabase
        .from('sponsors')
        .select('id, organization_id, organization_name')
        .in('id', sponsorIds);
      for (const sponsor of (sponsorsById || []) as Array<Record<string, unknown>>) {
        if (typeof sponsor.id === 'string') sponsorById.set(sponsor.id, sponsor);
        if (typeof sponsor.organization_id === 'string') sponsorByOrgId.set(sponsor.organization_id, sponsor);
      }
    }
    const sponsorOrgIds = Array.from(
      new Set(
        dealsRaw
          .map((deal) => deal.sponsor_organization_id)
          .filter((value): value is string => typeof value === 'string' && !sponsorByOrgId.has(value))
      )
    );
    if (sponsorOrgIds.length > 0) {
      const { data: sponsorsByOrg } = await supabase
        .from('sponsors')
        .select('id, organization_id, organization_name')
        .in('organization_id', sponsorOrgIds);
      for (const sponsor of (sponsorsByOrg || []) as Array<Record<string, unknown>>) {
        if (typeof sponsor.id === 'string') sponsorById.set(sponsor.id, sponsor);
        if (typeof sponsor.organization_id === 'string') sponsorByOrgId.set(sponsor.organization_id, sponsor);
      }
    }

    // Transform to consistent format
    const formatted = dealsRaw.map((deal: Record<string, unknown>) => {
      const sponsor =
        (typeof deal.sponsor_id === 'string' ? sponsorById.get(deal.sponsor_id) : undefined) ||
        (typeof deal.sponsor_organization_id === 'string' ? sponsorByOrgId.get(deal.sponsor_organization_id) : undefined);

      return {
        id: deal.id,
        projectName: deal.project_name,
        sponsorName:
          sponsor?.organization_name ||
          deal.sponsor_organization_name ||
          deal.sponsor_name ||
          'Unknown Sponsor',
        programType: ((deal.programs as string[]) || [])[0] || 'NMTC',
        status: deal.status,
        allocation: deal.nmtc_financing_requested || 0,
        city: deal.city,
        state: deal.state,
        censusTract: deal.census_tract,
        submittedDate: deal.created_at,
        lastUpdated: deal.updated_at,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    return handleAuthError(error);
  }
}

async function getCdeIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string
): Promise<string | null> {
  const { data: cdeData } = await supabase
    .from('cdes')
    .select('id')
    .eq('organization_id', organizationId)
    .single();

  if (cdeData) {
    return (cdeData as { id: string }).id;
  }

  const { data: mergedData } = await supabase
    .from('cdes_merged')
    .select('id')
    .eq('organization_id', organizationId)
    .limit(1)
    .single();

  return (mergedData as { id: string } | null)?.id || null;
}
