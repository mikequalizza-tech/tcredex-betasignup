import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { getApiBaseUrl } from '@/lib/api/config';
import {
  TOTAL_CRITERIA,
  MATCH_THRESHOLDS,
  UNDERSERVED_STATES_BY_YEAR,
  normalizeText,
  getStateInfo,
} from '@/lib/automatch/constants';

const API_BASE = getApiBaseUrl();

// Retry fetch with exponential backoff for connection issues
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error: unknown) {
      const isLastAttempt = i === retries - 1;
      const isConnectionError = error instanceof Error &&
        (error.cause as { code?: string })?.code === 'ECONNREFUSED';

      if (isLastAttempt || !isConnectionError) {
        throw error;
      }
      // Wait before retry: 100ms, 200ms, 400ms
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
    }
  }
  throw new Error('Fetch failed after retries');
}

// Initialize Supabase client for scan mode
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key);
}

// GET saved matches from backend (proxy)
// Supports two modes:
// 1. dealId param - Get CDE matches for a specific deal (Sponsor view)
// 2. scan=true&cdeId param - Find deals matching a CDE's criteria (CDE view)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dealId = searchParams.get('dealId');
  const scan = searchParams.get('scan');
  const cdeId = searchParams.get('cdeId');
  const minScoreParam = searchParams.get('minScore');
  const minScore = minScoreParam ? parseInt(minScoreParam, 10) : 70;

  // Mode 1: CDE Scan - Find deals matching this CDE
  if (scan === 'true' && cdeId) {
    try {
      const supabase = getSupabase();

      // Get CDE criteria from cdes_merged
      const { data: cdeData, error: cdeError } = await supabase
        .from('cdes_merged')
        .select('*')
        .or(`id.eq.${cdeId},organization_id.eq.${cdeId}`)
        .limit(1)
        .single();

      if (cdeError || !cdeData) {
        console.log('[AutoMatch Scan] CDE not found:', cdeId);
        return NextResponse.json({ matches: [], error: 'CDE not found' });
      }

      // Get available deals (status = available or seeking_capital, and NMTC program)
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .in('status', ['available', 'seeking_capital'])
        .contains('programs', ['NMTC'])
        .limit(100);

      if (dealsError) {
        console.error('[AutoMatch Scan] Error fetching deals:', dealsError);
        return NextResponse.json({ matches: [], error: 'Failed to fetch deals' });
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

      console.log(`[AutoMatch Scan] Found ${deals?.length || 0} available NMTC deals for CDE ${(cdeData as Record<string, unknown>).name}`);

      // Enrich CDE data before scoring (fills NULL preference columns from QEI data)
      const enrichedCde = enrichCDE(cdeData as Record<string, unknown>);

      // Score each deal against CDE criteria
      const matches = dealsRaw.map(deal => {
        const sponsor =
          (typeof deal.sponsor_id === 'string' ? sponsorById.get(deal.sponsor_id) : undefined) ||
          (typeof deal.sponsor_organization_id === 'string' ? sponsorByOrgId.get(deal.sponsor_organization_id) : undefined);
        const sponsorName =
          sponsor?.organization_name ||
          deal.sponsor_organization_name ||
          deal.sponsor_name ||
          'Unknown';
        const score = calculateDealCdeMatch(deal, enrichedCde);
        return {
          id: deal.id,
          projectName: deal.project_name || 'Untitled',
          sponsorName,
          city: deal.city || '',
          state: deal.state || '',
          allocationRequest: Number(deal.nmtc_financing_requested) || 0,
          matchScore: score.total,
          tractType: getTractTypes(deal),
          programType: (((deal.programs as string[]) || [])[0] || 'NMTC') as 'NMTC' | 'HTC' | 'LIHTC',
          scoreBreakdown: score.breakdown,
          matchReasons: score.reasons,
          submittedDate: deal.submitted_at || deal.created_at || new Date().toISOString(),
        };
      })
        .filter(m => m.matchScore >= minScore)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 500);

      console.log(`[AutoMatch Scan] Returning ${matches.length} matches above ${minScore}%`);

      return NextResponse.json({ matches });
    } catch (error) {
      console.error('[AutoMatch Scan] Error:', error);
      return NextResponse.json({ matches: [], error: 'Scan failed' });
    }
  }

  // Mode 2: Deal Matches - Get CDEs for a specific deal (Sponsor view)
  if (!dealId) {
    return NextResponse.json({ error: 'dealId or scan+cdeId required' }, { status: 400 });
  }

  // Forward user's Supabase JWT to backend
  const supabaseClient = await createServerSupabase();
  const { data: { session: userSession } } = await supabaseClient.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userSession?.access_token) {
    headers['Authorization'] = `Bearer ${userSession.access_token}`;
  }

  const resp = await fetchWithRetry(`${API_BASE}/automatch/matches/${dealId}`, {
    headers,
    cache: 'no-store',
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return NextResponse.json(data || { error: 'Failed to fetch matches' }, { status: resp.status });
  }

  // Unwrap backend's { success, data } wrapper
  return NextResponse.json(data.data || data);
}

// Enrich CDE with derived fields from QEI data
// Same logic as /api/cdes enrichFromQEI — fills NULL/default preference columns
function enrichCDE(cde: Record<string, unknown>): Record<string, unknown> {
  const predominantMarket = String(cde.predominant_market || '');
  const predominantFinancing = String(cde.predominant_financing || '').toLowerCase();
  const innovativeActivities = String(cde.innovative_activities || '').toLowerCase();
  const nonMetro = Number(cde.non_metro_commitment) || 0;

  // Derive primary_states from predominant_market (parse comma-separated 2-letter codes)
  if (!cde.primary_states || !Array.isArray(cde.primary_states) || cde.primary_states.length === 0) {
    const states = predominantMarket.split(/[,;]+/).map((s: string) => s.trim().toUpperCase()).filter((s: string) => /^[A-Z]{2}$/.test(s));
    if (states.length > 0) cde.primary_states = states;
  }

  // Derive rural_focus from non_metro_commitment >= 40%
  if (!cde.rural_focus) cde.rural_focus = nonMetro >= 40;

  // Derive native_american_focus from innovative_activities
  if (!cde.native_american_focus) cde.native_american_focus = innovativeActivities.includes('indian country') || innovativeActivities.includes('tribal');

  // Derive small_deal_fund from innovative_activities
  if (!cde.small_deal_fund) cde.small_deal_fund = innovativeActivities.includes('small dollar');

  // Derive uts_focus from innovative_activities
  if (!cde.uts_focus) cde.uts_focus = innovativeActivities.includes('targeting identified states') || innovativeActivities.includes('underserved');

  // Derive target_sectors from predominant_financing sub-type + innovative_activities
  // Values MUST match the intake form SectorCategory enum for clean matching
  if (!cde.target_sectors || !Array.isArray(cde.target_sectors) || cde.target_sectors.length === 0) {
    const sectors: string[] = [];
    // "Real Estate Financing - Community Facilities"
    if (predominantFinancing.includes('community') || predominantFinancing.includes('facilit')) {
      sectors.push('Community Facility', 'Healthcare/Medical', 'Education/Schools',
        'Childcare/Early Education', 'Senior Services', 'Food Access/Grocery');
    }
    if (predominantFinancing.includes('industrial') || predominantFinancing.includes('manufactur')) {
      sectors.push('Industrial/Manufacturing');
    }
    if (predominantFinancing.includes('mixed')) {
      sectors.push('Mixed-Use', 'Retail/Commercial', 'Housing/Residential');
    }
    if (predominantFinancing.includes('housing') || predominantFinancing.includes('for-sale')) {
      sectors.push('Housing/Residential');
    }
    if (predominantFinancing.includes('office')) {
      sectors.push('Retail/Commercial');
    }
    if (predominantFinancing.includes('retail')) {
      sectors.push('Retail/Commercial');
    }
    if (predominantFinancing.includes('operating') || predominantFinancing.includes('business')) {
      sectors.push('Retail/Commercial', 'Industrial/Manufacturing');
    }
    if (predominantFinancing.includes('other real estate')) {
      sectors.push('Mixed-Use', 'Retail/Commercial');
    }
    // "Providing QLICIs for Non-Real Estate Activities" = business financing signal
    if (innovativeActivities.includes('non-real estate')) {
      sectors.push('Retail/Commercial', 'Industrial/Manufacturing');
    }
    const market = predominantMarket.toLowerCase();
    if (market.includes('health') || market.includes('medical')) sectors.push('Healthcare/Medical');
    if (market.includes('education') || market.includes('school')) sectors.push('Education/Schools');
    if (market.includes('food') || market.includes('grocery')) sectors.push('Food Access/Grocery');
    if (market.includes('child') || market.includes('daycare')) sectors.push('Childcare/Early Education');
    if (market.includes('senior') || market.includes('elder')) sectors.push('Senior Services');
    if (sectors.length > 0) cde.target_sectors = [...new Set(sectors)];
  }

  return cde;
}

// Helper: Get tract types from deal data
function getTractTypes(deal: Record<string, unknown>): string[] {
  const types: string[] = [];
  if (deal.tract_eligible) types.push('QCT');
  if (deal.tract_severely_distressed) types.push('SD');
  if (!types.length) types.push('LIC');
  return types;
}

// =============================================================================
// BINARY SCORING ENGINE (matches backend automatch.engine.ts)
// 2 Eliminators + 15 Binary Criteria = Score/15 × 100%
// Constants imported from @/lib/automatch/constants
// =============================================================================

// Check if a deal's state is underserved for a CDE's allocation year
function isDealInUnderservedState(dealState: string, cdeYear: number): boolean {
  const stateUpper = (dealState || '').toUpperCase().trim();
  const underserved = UNDERSERVED_STATES_BY_YEAR[cdeYear] || [];
  return underserved.includes(stateUpper);
}

// ELIMINATOR 1: Geographic
// CDE must be "national" OR serve the deal's state
function passesGeographic(deal: Record<string, unknown>, cde: Record<string, unknown>): boolean {
  // Check if CDE is national (via service_area_type)
  const serviceType = normalizeText(cde.service_area_type as string);
  if (serviceType === 'national') return true;

  // CDE is not national — check if they serve the deal's state
  const stateInfo = getStateInfo((deal.state || '') as string);
  if (!stateInfo) return false;

  // Check primary_states array (strict matching on abbreviation and full name)
  for (const s of ((cde.primary_states || []) as string[])) {
    const cleaned = s.trim();
    if (cleaned.toUpperCase() === stateInfo.abbrev) return true;
    if (cleaned.toLowerCase() === stateInfo.name) return true;
  }

  // Parse predominant_market for comma-separated state abbreviations
  // predominant_market contains values like "TX", "AL,GA", "CO,FL,NC,TN,TX,WV"
  // Split by comma, trim, and match EXACT 2-letter state codes only
  // This avoids "AL" matching inside words like "national" or "local"
  const rawMarket = (cde.predominant_market || '') as string;
  if (rawMarket) {
    const marketStates = rawMarket
      .split(/[,;]+/)
      .map((s: string) => s.trim().toUpperCase())
      .filter((s: string) => /^[A-Z]{2}$/.test(s));
    if (marketStates.includes(stateInfo.abbrev)) return true;

    // Also check for full state names (word boundary) in case market has prose text
    const marketLower = rawMarket.toLowerCase();
    const stateNameRegex = new RegExp(`\\b${stateInfo.name}\\b`);
    if (stateNameRegex.test(marketLower)) return true;
  }

  return false;
}

// ELIMINATOR 2: Financing Type
// CDE predominant_financing must match deal type ("real estate" or "business financing")
// Owner-occupied deals pass either type (financing both real estate and business)
function passesFinancing(deal: Record<string, unknown>, cde: Record<string, unknown>): boolean {
  const intakeData = (deal.intake_data || {}) as Record<string, unknown>;
  // Default true when not specified — most NMTC deals are owner-occupied
  const isOwnerOccupied = intakeData.isOwnerOccupied ?? true;
  if (isOwnerOccupied) return true;

  const financing = normalizeText(cde.predominant_financing as string);
  if (!financing) return true; // No CDE financing preference = matches anything

  const isRealEstateCde = financing.includes('real estate');
  const isBusinessCde = financing.includes('business') || financing.includes('operating');
  if (!isRealEstateCde && !isBusinessCde) return true; // Unknown CDE financing type = matches

  // Determine if deal is real estate — check ventureType first, then infer from project type
  const ventureType = normalizeText((intakeData.ventureType || '') as string);
  let isRealEstateDeal: boolean | null = null;

  if (ventureType.includes('real estate')) {
    isRealEstateDeal = true;
  } else if (ventureType.includes('business') || ventureType.includes('operating')) {
    isRealEstateDeal = false;
  } else {
    // Infer from project type keywords
    const projectType = normalizeText(
      (deal.project_type || intakeData.projectType || intakeData.sectorCategory || '') as string
    );
    const RE_KEYWORDS = [
      'community facility', 'community center', 'healthcare', 'medical', 'clinic', 'hospital',
      'education', 'school', 'charter', 'housing', 'residential', 'affordable', 'senior',
      'shelter', 'homeless', 'rescue', 'mission', 'childcare', 'daycare', 'industrial',
      'manufacturing', 'warehouse', 'retail', 'commercial', 'office', 'mixed use',
      'renovation', 'construction', 'development', 'building', 'facility', 'real estate',
    ];
    if (RE_KEYWORDS.some(kw => projectType.includes(kw))) {
      isRealEstateDeal = true;
    }
  }

  // If we can't determine deal type, give benefit of the doubt
  if (isRealEstateDeal === null) return true;

  if (isRealEstateDeal && isRealEstateCde) return true;
  if (!isRealEstateDeal && isBusinessCde) return true;
  return false;
}

// Helper: Calculate match score between deal and CDE using BINARY SCORING
function calculateDealCdeMatch(deal: Record<string, unknown>, cde: Record<string, unknown>): { total: number; breakdown: Record<string, number>; reasons: string[] } {
  const reasons: string[] = [];

  // ELIMINATORS - fail = 0 score
  if (!passesGeographic(deal, cde)) {
    return { total: 0, breakdown: { geographic: 0 }, reasons: [`Does not serve ${deal.state}`] };
  }
  if (!passesFinancing(deal, cde)) {
    return { total: 0, breakdown: { financing: 0 }, reasons: ['Financing type mismatch'] };
  }

  const intakeData = (deal.intake_data || {}) as Record<string, unknown>;
  const serviceType = normalizeText(cde.service_area_type as string);
  const marketText = normalizeText(cde.predominant_market as string);
  const isNational = serviceType === 'national' || (marketText ? /\bnational\b/.test(marketText) : false);
  reasons.push(isNational ? 'National coverage' : `Serves ${deal.state}`);

  // 15 BINARY CRITERIA (0 or 1 each)
  const scores: Record<string, number> = {};

  // 1. Geographic (passed eliminator)
  scores.geographic = 1;

  // 2. Financing (passed eliminator)
  scores.financing = 1;

  // 3. Urban/Rural
  const isRural = intakeData.isRural || ((deal.tract_classification || '') as string).toLowerCase().includes('rural');
  if (isRural && cde.rural_focus) scores.urbanRural = 1;
  else if (!isRural && cde.urban_focus) scores.urbanRural = 1;
  else if (!cde.rural_focus && !cde.urban_focus) scores.urbanRural = 1;
  else scores.urbanRural = 0;

  // 4. Sector
  const dealSector = normalizeText((intakeData.sectorCategory || deal.project_type) as string);
  const cdeMarket = normalizeText(cde.predominant_market as string);
  const cdeSectors = ((cde.target_sectors || []) as string[]).map(normalizeText);
  let sectorMatch = cdeSectors.length === 0 && !cdeMarket;
  if (!sectorMatch) {
    for (const sector of cdeSectors) {
      if (sector && (dealSector.includes(sector) || sector.includes(dealSector))) { sectorMatch = true; break; }
    }
    if (!sectorMatch && cdeMarket && dealSector && cdeMarket.includes(dealSector)) sectorMatch = true;
  }
  scores.sector = sectorMatch ? 1 : 0;
  if (sectorMatch) reasons.push('Sector match');

  // 5. Deal Size
  const amount = Number(deal.nmtc_financing_requested) || 0;
  const minDeal = Number(cde.min_deal_size) || 0;
  const maxDeal = Number(cde.max_deal_size) || Number.MAX_SAFE_INTEGER;
  scores.dealSize = (amount >= minDeal && amount <= maxDeal) ? 1 : 0;
  if (scores.dealSize) reasons.push('Deal size fits');

  // 6. Small Deal Fund
  const isSmallDeal = amount > 0 && amount <= 5000000;
  scores.smallDealFund = (!isSmallDeal || cde.small_deal_fund) ? 1 : 0;

  // 7. Severely Distressed
  scores.severelyDistressed = (!cde.require_severely_distressed || deal.tract_severely_distressed) ? 1 : 0;
  if (deal.tract_severely_distressed) reasons.push('Distressed tract');

  // 8. Distress Percentile (handle legacy column name fallback)
  const minDistress = Number(cde.min_distress_percentile || cde.min_distress_score) || 0;
  if (minDistress === 0) {
    scores.distressPercentile = 1; // CDE doesn't require a minimum
  } else {
    const dealDistress = Number(intakeData.distressPercentile) || Number(deal.distress_score) || 0;
    scores.distressPercentile = (dealDistress >= minDistress) ? 1 : 0;
  }

  // 9. Minority Focus
  const isMinorityOwned = intakeData.minorityOwned || intakeData.isMinorityOwned || false;
  const cdeMinorityFocus = cde.minority_focus || false;
  scores.minorityFocus = (!cdeMinorityFocus || isMinorityOwned) ? 1 : 0;

  // 10. UTS Focus (Underserved Target States)
  // Check if deal's state is in CDFI Fund's underserved states for the CDE's allocation year
  const dealStateForUts = ((deal.state || '') as string).toUpperCase().trim();
  const cdeYear = Number(cde.year) || 0;
  const isUts = isDealInUnderservedState(dealStateForUts, cdeYear) || intakeData.isUts || false;
  const cdeUtsFocus = cde.uts_focus || cde.underserved_states_focus || false;
  scores.utsFocus = (!cdeUtsFocus || isUts) ? 1 : 0;

  // 11. Entity Type
  const orgType = normalizeText((intakeData.organizationType || intakeData.entityType) as string);
  const isNonProfit = orgType.includes('nonprofit') || orgType.includes('non-profit') || orgType.includes('501');
  const cdeForprofitAccepted = cde.forprofit_accepted ?? true;
  const cdeNonprofitPreferred = cde.nonprofit_preferred || false;
  if (!cdeForprofitAccepted && !isNonProfit) scores.entityType = 0;
  else scores.entityType = 1;
  if (cdeNonprofitPreferred && isNonProfit) reasons.push('Nonprofit preferred match');

  // 12. Owner Occupied — default true when not specified
  const isOwnerOccupied = intakeData.isOwnerOccupied ?? true;
  const cdeOwnerOccupiedPref = cde.owner_occupied_preferred || false;
  scores.ownerOccupied = (!cdeOwnerOccupiedPref || isOwnerOccupied) ? 1 : 0;
  if (isOwnerOccupied) reasons.push('Owner-occupied');

  // 13. Tribal
  const isTribal = intakeData.isTribal || intakeData.isAian || false;
  scores.tribal = (!cde.native_american_focus || isTribal) ? 1 : 0;

  // 14. Allocation Type
  const dealType = normalizeText((deal.program_level || 'federal') as string);
  const cdeType = normalizeText((cde.allocation_type || 'federal') as string);
  scores.allocationType = (!dealType || !cdeType || dealType === cdeType) ? 1 : 0;

  // 15. Has Allocation
  scores.hasAllocation = (Number(cde.amount_remaining) || 0) > 0 ? 1 : 0;

  // Calculate total: points / 15 × 100
  const totalPoints = Object.values(scores).reduce((sum, val) => sum + val, 0);
  const total = Math.round((totalPoints / TOTAL_CRITERIA) * 100);

  // Raw binary breakdown — each criterion is 0 or 1
  return { total, breakdown: scores, reasons };
}

// POST run automatch — tries NestJS backend (with auth), falls back to local scoring
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { dealId, minScore = 0, maxResults = 500 } = body || {};

  if (!dealId) {
    return NextResponse.json({ error: 'dealId required' }, { status: 400 });
  }

  // Try NestJS backend first — forward user's Supabase JWT for auth
  try {
    // Get the user's session token from cookies
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (accessToken) {
      const resp = await fetchWithRetry(`${API_BASE}/automatch/run/${dealId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      });

      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        return NextResponse.json(data.data || data);
      }
      // If 401/403, fall through to local scoring
      if (resp.status !== 401 && resp.status !== 403) {
        return NextResponse.json(data || { error: 'AutoMatch failed' }, { status: resp.status });
      }
    }
  } catch {
    // Backend unavailable — fall through to local scoring
    console.log('[AutoMatch POST] Backend unavailable, using local scoring engine');
  }

  // Fallback: Score locally using the same binary engine as scan mode
  try {
    const supabase = getSupabase();

    // Get deal data
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Get all active CDEs
    const { data: cdes, error: cdeError } = await supabase
      .from('cdes_merged')
      .select('*')
      .eq('status', 'active')
      .limit(1000);

    if (cdeError) {
      return NextResponse.json({ error: 'Failed to fetch CDEs' }, { status: 500 });
    }

    // Score each CDE row against the deal
    // cdes_merged has one row per CDE per allocation year — aggregate by organization_id
    // Track the latest year's row ID per org (matches what /api/cdes returns as CDEDealCard.id)
    const orgLatestRowId = new Map<string, { rowId: string; year: number }>();
    for (const cde of (cdes || [])) {
      const orgId = String(cde.organization_id || cde.id);
      const year = Number(cde.year) || 0;
      const existing = orgLatestRowId.get(orgId);
      if (!existing || year > existing.year) {
        orgLatestRowId.set(orgId, { rowId: cde.id, year });
      }
    }

    const orgBestMatch = new Map<string, { cdeId: string; cdeName: string; totalScore: number; breakdown: Record<string, number>; matchStrength: string; reasons: string[] }>();

    for (const cde of (cdes || [])) {
      // Enrich CDE data before scoring (fills NULL preference columns from QEI data)
      const enrichedCde = enrichCDE(cde as Record<string, unknown>);
      const score = calculateDealCdeMatch(deal as Record<string, unknown>, enrichedCde);
      const orgId = String((cde as Record<string, unknown>).organization_id || (cde as Record<string, unknown>).id);
      const existing = orgBestMatch.get(orgId);

      // Keep the BEST score across all allocation years for this CDE
      if (!existing || score.total > existing.totalScore) {
        // Use the LATEST year's row ID so it matches the CDEDealCard.id from /api/cdes
        const latestInfo = orgLatestRowId.get(orgId);
        orgBestMatch.set(orgId, {
          cdeId: latestInfo?.rowId || cde.id,
          cdeName: cde.name || 'Unknown CDE',
          totalScore: score.total,
          breakdown: score.breakdown,
          matchStrength: score.total >= MATCH_THRESHOLDS.excellent ? 'excellent' : score.total >= MATCH_THRESHOLDS.good ? 'good' : score.total >= MATCH_THRESHOLDS.fair ? 'fair' : 'weak',
          reasons: score.reasons,
        });
      }
    }

    const matches = Array.from(orgBestMatch.values())
      .filter(m => m.totalScore >= minScore)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, maxResults);

    return NextResponse.json({
      matches,
      timestamp: new Date().toISOString(),
      source: 'local',
    });
  } catch (error) {
    console.error('[AutoMatch POST] Local scoring error:', error);
    return NextResponse.json({ error: 'AutoMatch scoring failed' }, { status: 500 });
  }
}
