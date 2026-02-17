import { Deal } from '@/lib/data/deals';

const PROJECT_COST_MULTIPLIER = 2;
const FINANCING_GAP_RATIO = 0.1;

/**
 * Maps a Deal from Supabase to ensure all required fields are populated
 * for display in DealCard and other components.
 */
export function mapDealToCard(deal: Deal): Deal {
  const estimatedProjectCost = deal.projectCost || (deal.allocation ? deal.allocation * PROJECT_COST_MULTIPLIER : 0);
  const completionYear = deal.submittedDate ? new Date(deal.submittedDate).getFullYear() : undefined;

  return {
    ...deal,
    projectCost: estimatedProjectCost,
    shovelReady: deal.shovelReady ?? (deal.status !== 'closed' && deal.status !== 'closing'),
    completionDate: deal.completionDate ?? (completionYear ? `${completionYear}` : undefined),
    financingGap: deal.financingGap ?? Math.max(0, Math.round((deal.allocation || 0) * FINANCING_GAP_RATIO)),
  };
}
