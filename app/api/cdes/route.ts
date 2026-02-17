/**
 * tCredex CDEs API
 * CRUD operations for Community Development Entities
 *
 * Reads per-year rows from cdes_merged, aggregates into one row per CDE.
 * Same CDE can appear in cdes_merged multiple times (once per allocation year).
 * This API groups by organization_id and sums allocations across years.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAuth, handleAuthError } from '@/lib/api/auth-middleware';

// =============================================================================
// Derive display fields from QEI data that IS populated
// Fills in primary_states, rural_focus, target_sectors, etc. when DB columns are NULL
// =============================================================================
function enrichFromQEI(cde: Record<string, unknown>): Record<string, unknown> {
  const predominantMarket = String(cde.predominant_market || '');
  const predominantFinancing = String(cde.predominant_financing || '').toLowerCase();
  const innovativeActivities = String(cde.innovative_activities || '').toLowerCase();
  const nonMetro = Number(cde.non_metro_commitment) || 0;

  // Derive primary_states from predominant_market (parse 2-letter state codes)
  // DB column is ALWAYS null — we MUST derive from predominant_market
  if (!cde.primary_states || !Array.isArray(cde.primary_states) || (cde.primary_states as string[]).length === 0) {
    const states = predominantMarket
      .split(/[,;]+/)
      .map((s: string) => s.trim().toUpperCase())
      .filter((s: string) => /^[A-Z]{2}$/.test(s));
    if (states.length > 0) {
      cde.primary_states = states;
    }
  }

  // Derive rural_focus from non_metro_commitment >= 40%
  // DB defaults to false — must check for false too, not just null/undefined
  if (!cde.rural_focus) {
    cde.rural_focus = nonMetro >= 40;
  }

  // Derive native_american_focus from innovative_activities
  if (!cde.native_american_focus) {
    cde.native_american_focus = innovativeActivities.includes('indian country') || innovativeActivities.includes('tribal');
  }

  // Derive small_deal_fund from innovative_activities
  if (!cde.small_deal_fund) {
    cde.small_deal_fund = innovativeActivities.includes('small dollar');
  }

  // Derive uts_focus from innovative_activities "Targeting Identified States"
  if (!cde.uts_focus) {
    cde.uts_focus = innovativeActivities.includes('targeting identified states') || innovativeActivities.includes('underserved');
  }

  // Derive target_sectors from predominant_financing sub-type + innovative_activities
  // Values MUST match the intake form SectorCategory enum for clean matching
  if (!cde.target_sectors || !Array.isArray(cde.target_sectors) || (cde.target_sectors as string[]).length === 0) {
    const sectors: string[] = [];
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
    if (sectors.length > 0) {
      cde.target_sectors = [...new Set(sectors)];
    }
  }

  // Derive special_focus from innovative_activities keywords
  if (!cde.special_focus || !Array.isArray(cde.special_focus) || (cde.special_focus as string[]).length === 0) {
    const focus: string[] = [];
    if (innovativeActivities.includes('minority') || innovativeActivities.includes('african') || innovativeActivities.includes('hispanic') || innovativeActivities.includes('latino')) {
      focus.push('Minority-owned');
    }
    if (innovativeActivities.includes('indian country') || innovativeActivities.includes('tribal') || innovativeActivities.includes('native')) {
      focus.push('Native American');
    }
    if (innovativeActivities.includes('targeting identified states') || innovativeActivities.includes('underserved')) {
      focus.push('Underserved');
    }
    if (focus.length > 0) {
      cde.special_focus = focus;
    }
  }

  return cde;
}

// =============================================================================
// CDFI Fund Underserved/Targeted States by NMTC Allocation Round
// Each allocation year has different states the CDFI Fund has designated
// =============================================================================
const UNDERSERVED_STATES_BY_YEAR: Record<number, string[]> = {
  // CY 2024–2025 (awarded Dec 2025)
  2025: ['AZ', 'CA', 'CO', 'CT', 'FL', 'KS', 'NC', 'TX', 'VA', 'WV', 'PR'],
  2024: ['AZ', 'CA', 'CO', 'CT', 'FL', 'KS', 'NC', 'TX', 'VA', 'WV', 'PR'],
  // CY 2023 (awarded Sept 2024)
  2023: ['AZ', 'CA', 'CO', 'FL', 'KS', 'NV', 'NC', 'TX', 'VA', 'WV', 'PR'],
  // CY 2022 (awarded late 2022)
  2022: ['AZ', 'CA', 'CO', 'FL', 'NV', 'NC', 'TN', 'TX', 'VA', 'WV', 'VI', 'AS', 'GU', 'MP'],
};

function getUnderservedStatesForYear(year: number): string[] {
  return UNDERSERVED_STATES_BY_YEAR[year] || [];
}

// =============================================================================
// Aggregate per-year rows into one row per CDE
// Preserves per-year allocation details (amount, underserved states, etc.)
// =============================================================================
function aggregateCDEs(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const grouped = new Map<string, Record<string, unknown>[]>();

  for (const row of rows) {
    const orgId = row.organization_id as string;
    if (!grouped.has(orgId)) grouped.set(orgId, []);
    grouped.get(orgId)!.push(row);
  }

  const aggregated: Record<string, unknown>[] = [];

  for (const [orgId, yearRows] of grouped) {
    // Sort by year descending to pick latest metadata
    yearRows.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    const latest = yearRows[0];

    // Build per-year allocation details (preserves year-specific context)
    let totalAllocation = 0;
    let totalFinalized = 0;
    let totalRemaining = 0;
    let nonMetroSum = 0;
    const years: number[] = [];
    const year_allocations: Record<string, unknown>[] = [];

    for (const row of yearRows) {
      const year = Number(row.year) || 0;
      const rowAllocation = Number(row.total_allocation) || 0;
      const rowFinalized = Number(row.amount_finalized) || 0;
      const rowRemaining = Number(row.amount_remaining) || 0;
      const rowNonMetro = Number(row.non_metro_commitment) || 0;

      totalAllocation += rowAllocation;
      totalFinalized += rowFinalized;
      totalRemaining += rowRemaining;
      nonMetroSum += rowNonMetro;
      if (year) years.push(year);

      // Per-year allocation detail with underserved states for that round
      year_allocations.push({
        id: row.id,
        year,
        allocation_type: row.allocation_type || 'federal',
        total_allocation: rowAllocation,
        amount_finalized: rowFinalized,
        amount_remaining: rowRemaining,
        non_metro_commitment: rowNonMetro,
        deployment_deadline: null, // does not exist on cdes_merged
        // Underserved states for this specific allocation round
        underserved_states: getUnderservedStatesForYear(year),
        // Per-year QEI metadata (can differ between rounds)
        service_area: row.service_area,
        service_area_type: row.service_area_type,
        predominant_financing: row.predominant_financing,
        predominant_market: row.predominant_market,
        innovative_activities: row.innovative_activities,
      });
    }

    aggregated.push({
      // Use latest year's row ID as the CDE ID for the list
      id: latest.id,
      organization_id: orgId,
      name: latest.name,
      slug: latest.slug,
      // Aggregated financials (totals across years)
      total_allocation: totalAllocation,
      remaining_allocation: totalRemaining,
      amount_finalized: totalFinalized,
      non_metro_commitment: yearRows.length > 0 ? nonMetroSum / yearRows.length : 0,
      // Year info
      allocation_years: years.sort((a, b) => b - a),
      year_count: years.length,
      latest_allocation_year: years.length > 0 ? Math.max(...years) : null,
      // Per-year allocation details (preserves underserved states per round)
      year_allocations,
      // Metadata from latest year (for display defaults)
      service_area_type: latest.service_area_type,
      service_area: latest.service_area,
      controlling_entity: latest.controlling_entity,
      predominant_financing: latest.predominant_financing,
      predominant_market: latest.predominant_market,
      innovative_activities: latest.innovative_activities,
      contact_name: latest.contact_name,
      contact_email: latest.contact_email,
      contact_phone: latest.contact_phone,
      status: latest.status,
      updated_at: latest.updated_at,
      created_at: latest.created_at,
      allocation_type: latest.allocation_type,
      // Preference fields
      min_deal_size: latest.min_deal_size,
      max_deal_size: latest.max_deal_size,
      small_deal_fund: latest.small_deal_fund,
      primary_states: latest.primary_states,
      rural_focus: latest.rural_focus,
      urban_focus: latest.urban_focus,
      target_sectors: latest.target_sectors,
      impact_priorities: latest.impact_priorities,
      mission_statement: latest.mission_statement,
      description: latest.mission_statement,
      website: latest.website,
      city: latest.city,
      state: latest.state,
      headquarters_city: latest.headquarters_city,
      headquarters_state: latest.headquarters_state,
      // Map DB column names to API field names the frontend expects
      minority_focus: latest.minority_focus ?? false,
      uts_focus: latest.uts_focus ?? false,
      nonprofit_preferred: latest.nonprofit_preferred ?? false,
      forprofit_accepted: latest.forprofit_accepted ?? true,
      require_severely_distressed: latest.require_severely_distressed,
      min_distress_percentile: latest.min_distress_percentile ?? 0,
      htc_experience: latest.htc_experience,
      lihtc_experience: latest.lihtc_experience,
      oz_experience: latest.oz_experience,
      target_regions: latest.target_regions,
      excluded_states: latest.excluded_states,
      min_jobs_created: latest.min_jobs_created,
      max_time_to_close: latest.max_time_to_close,
      related_party_policy: latest.related_party_policy,
      qct_required: latest.qct_required,
      require_qct: latest.require_qct ?? latest.qct_required,
      prefers_qct: latest.require_qct ?? false,
      owner_occupied_preferred: latest.owner_occupied_preferred ?? false,
      native_american_focus: latest.native_american_focus,
      underserved_states_focus: latest.uts_focus,
      stacked_deals_preferred: latest.stacked_deals_preferred,
      projects_closed: latest.projects_closed,
      total_deployed: latest.total_deployed,
      avg_deal_size: latest.avg_deal_size,
      response_time: latest.response_time,
      deployment_deadline: null, // does not exist on cdes_merged
    });
  }

  // Enrich each CDE with derived display fields from QEI data
  for (let i = 0; i < aggregated.length; i++) {
    aggregated[i] = enrichFromQEI(aggregated[i]);
  }

  // Sort by remaining allocation descending
  aggregated.sort((a, b) => (Number(b.remaining_allocation) || 0) - (Number(a.remaining_allocation) || 0));
  return aggregated;
}

// =============================================================================
// GET /api/cdes - List CDEs with filters (aggregated: one row per CDE)
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const minAllocation = searchParams.get('min_allocation');
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') || '500');

    // Query all per-year rows from cdes_merged
    // We aggregate in JS to avoid relying on VIEW columns that may not exist in live schema
    let query = supabase
      .from('cdes_merged')
      .select('*')
      .order('amount_remaining', { ascending: false })
      .limit(Math.min(limit, 2000)); // Higher limit since we'll aggregate

    // CRITICAL: Filter by organization based on user type
    if (user.organizationType === 'cde') {
      query = query.eq('organization_id', user.organizationId);
    } else if (user.organizationType === 'sponsor' || user.organizationType === 'investor') {
      query = query.eq('status', 'active');
    }

    if (status) query = query.eq('status', status);
    if (state) query = query.contains('primary_states', [state]);
    if (year) query = query.eq('year', parseInt(year));

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate per-year rows into one row per CDE
    const cdes = aggregateCDEs(data || []);

    // Apply post-aggregation filters (these work on totals, not per-year)
    let filtered = cdes;
    if (minAllocation) {
      filtered = filtered.filter(c => (Number(c.remaining_allocation) || 0) >= parseInt(minAllocation));
    }

    // Apply limit after aggregation
    filtered = filtered.slice(0, Math.min(limit, 500));

    return NextResponse.json({
      cdes: filtered,
      organizationId: user.organizationId,
      organizationType: user.organizationType,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/cdes - Create new CDE allocation year
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require authentication and ORG_ADMIN role
    const user = await requireAuth(request);

    if (user.organizationType !== 'cde' || user.userRole !== 'ORG_ADMIN') {
      return NextResponse.json(
        { error: 'Only CDE organization admins can create CDE profiles' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // CRITICAL: CDE profile must belong to user's organization
    const organizationId = user.organizationId;

    // Generate unique slug
    const baseSlug = (body.name || 'cde')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create CDE row in cdes_merged (one row = one CDE + one allocation year)
    // Include ALL fields for complete CDE profile
    const { data, error } = await supabase
      .from('cdes_merged')
      .insert({
        organization_id: organizationId,
        name: body.name,
        slug: uniqueSlug,
        year: body.year || new Date().getFullYear(),
        allocation_type: body.allocation_type || 'federal',
        total_allocation: body.total_allocation || 0,
        amount_finalized: body.amount_finalized || 0,
        amount_remaining: body.remaining_allocation || body.total_allocation || 0,
        non_metro_commitment: body.non_metro_commitment || 0,
        service_area: body.service_area,
        service_area_type: body.service_area_type || 'national',
        controlling_entity: body.controlling_entity,
        predominant_financing: body.predominant_financing,
        predominant_market: body.predominant_market,
        innovative_activities: body.innovative_activities,
        contact_name: body.primary_contact_name || body.contact_name,
        contact_phone: body.primary_contact_phone || body.contact_phone,
        contact_email: body.primary_contact_email || body.contact_email,
        primary_states: body.primary_states || [],
        min_deal_size: body.min_deal_size || 1000000,
        max_deal_size: body.max_deal_size || 15000000,
        small_deal_fund: body.small_deal_fund || false,
        rural_focus: body.rural_focus || false,
        urban_focus: body.urban_focus ?? true,
        status: 'active',
        // Additional fields for complete CDE profile
        target_sectors: body.target_sectors || [],
        impact_priorities: body.impact_priorities || [],
        mission_statement: body.mission_statement || body.description,
        website: body.website,
        city: body.city,
        state: body.state,
        headquarters_city: body.headquarters_city || body.city,
        headquarters_state: body.headquarters_state || body.state,
        minority_focus: body.minority_focus || false,
        uts_focus: body.uts_focus || false,
        nonprofit_preferred: body.nonprofit_preferred || false,
        forprofit_accepted: body.forprofit_accepted ?? true,
        require_severely_distressed: body.require_severely_distressed || false,
        min_distress_percentile: body.min_distress_percentile || 0,
        htc_experience: body.htc_experience || false,
        lihtc_experience: body.lihtc_experience || false,
        oz_experience: body.oz_experience || false,
        target_regions: body.target_regions || [],
        excluded_states: body.excluded_states || [],
        min_jobs_created: body.min_jobs_created,
        max_time_to_close: body.max_time_to_close,
        related_party_policy: body.related_party_policy || 'case-by-case',
        qct_required: body.qct_required || false,
        stacked_deals_preferred: body.stacked_deals_preferred || false,
        allocation_year: body.allocation_year || body.year?.toString() || new Date().getFullYear().toString(),
      } as never)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...data,
      organizationId: user.organizationId,
    }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
