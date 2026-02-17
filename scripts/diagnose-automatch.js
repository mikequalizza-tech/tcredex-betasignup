#!/usr/bin/env node
/**
 * AutoMatch Diagnostic Script
 *
 * Walks through the scoring engine step-by-step with real data.
 * Shows exactly why each CDE gets the score it does.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xlejizyoggqdedjkyset.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZWppenlvZ2dxZGVkamt5c2V0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY2MjUyMCwiZXhwIjoyMDgxMjM4NTIwfQ._cv7Gg0Sc-qQATifHzKz4AJAQfVFGUf-g2LEa5UyMmg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TOTAL_CRITERIA = 15;

// ============================================================
// SCORING FUNCTIONS (copied from engine.ts for diagnosis)
// ============================================================

function normalizeText(value) {
  if (!value) return '';
  return value.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

const ABBREV_TO_NAME = {
  'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas', 'CA': 'california',
  'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware', 'FL': 'florida', 'GA': 'georgia',
  'HI': 'hawaii', 'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
  'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine', 'MD': 'maryland',
  'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota', 'MS': 'mississippi', 'MO': 'missouri',
  'MT': 'montana', 'NE': 'nebraska', 'NV': 'nevada', 'NH': 'new hampshire', 'NJ': 'new jersey',
  'NM': 'new mexico', 'NY': 'new york', 'NC': 'north carolina', 'ND': 'north dakota', 'OH': 'ohio',
  'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode island', 'SC': 'south carolina',
  'SD': 'south dakota', 'TN': 'tennessee', 'TX': 'texas', 'UT': 'utah', 'VT': 'vermont',
  'VA': 'virginia', 'WA': 'washington', 'WV': 'west virginia', 'WI': 'wisconsin', 'WY': 'wyoming',
};
const NAME_TO_ABBREV = Object.fromEntries(
  Object.entries(ABBREV_TO_NAME).map(([abbrev, name]) => [name, abbrev])
);

function getStateInfo(state) {
  const upper = state.toUpperCase().trim();
  const lower = state.toLowerCase().trim();
  if (ABBREV_TO_NAME[upper]) return { abbrev: upper, name: ABBREV_TO_NAME[upper] };
  if (NAME_TO_ABBREV[lower]) return { abbrev: NAME_TO_ABBREV[lower], name: lower };
  return null;
}

const UNDERSERVED_STATES_BY_YEAR = {
  2025: ['AZ', 'CA', 'CO', 'CT', 'FL', 'KS', 'NC', 'TX', 'VA', 'WV', 'PR'],
  2024: ['AZ', 'CA', 'CO', 'CT', 'FL', 'KS', 'NC', 'TX', 'VA', 'WV', 'PR'],
  2023: ['AZ', 'CA', 'CO', 'FL', 'KS', 'NV', 'NC', 'TX', 'VA', 'WV', 'PR'],
  2022: ['AZ', 'CA', 'CO', 'FL', 'NV', 'NC', 'TN', 'TX', 'VA', 'WV', 'VI', 'AS', 'GU', 'MP'],
};

// ============================================================
// ENRICHMENT — derive preferences from QEI data (same as /api/cdes)
// ============================================================

function enrichCDE(cde) {
  const predominantMarket = String(cde.predominant_market || '');
  const predominantFinancing = String(cde.predominant_financing || '').toLowerCase();
  const innovativeActivities = String(cde.innovative_activities || '').toLowerCase();
  const nonMetro = Number(cde.non_metro_commitment) || 0;

  // Derive primary_states from predominant_market
  if (!cde.primary_states || !Array.isArray(cde.primary_states) || cde.primary_states.length === 0) {
    const states = predominantMarket.split(/[,;]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{2}$/.test(s));
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

  // Derive target_sectors — values MUST match intake form SectorCategory enum
  if (!cde.target_sectors || !Array.isArray(cde.target_sectors) || cde.target_sectors.length === 0) {
    const sectors = [];
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

// ============================================================
// DIAGNOSTIC SCORING — logs every step
// ============================================================

function diagnoseScore(deal, cde) {
  const log = [];
  const cdeName = cde.name || 'Unknown';

  log.push(`\n${'='.repeat(80)}`);
  log.push(`CDE: ${cdeName} (year: ${cde.year}, org: ${cde.organization_id})`);
  log.push(`  service_area_type: "${cde.service_area_type || 'NULL'}"`);
  log.push(`  predominant_market: "${cde.predominant_market || 'NULL'}"`);
  log.push(`  predominant_financing: "${cde.predominant_financing || 'NULL'}"`);
  log.push(`  primary_states: ${JSON.stringify(cde.primary_states)}`);
  log.push(`  target_sectors: ${JSON.stringify(cde.target_sectors)}`);
  log.push(`  min_deal_size: ${cde.min_deal_size}, max_deal_size: ${cde.max_deal_size}`);
  log.push(`  rural_focus: ${cde.rural_focus}, urban_focus: ${cde.urban_focus}`);
  log.push(`  require_severely_distressed: ${cde.require_severely_distressed}`);
  log.push(`  min_distress_percentile: ${cde.min_distress_percentile}`);
  log.push(`  amount_remaining: ${cde.amount_remaining}`);
  log.push(`  small_deal_fund: ${cde.small_deal_fund}`);
  log.push(`  minority_focus: ${cde.minority_focus}`);
  log.push(`  uts_focus: ${cde.uts_focus}`);
  log.push(`  nonprofit_preferred: ${cde.nonprofit_preferred}`);
  log.push(`  forprofit_accepted: ${cde.forprofit_accepted}`);
  log.push(`  owner_occupied_preferred: ${cde.owner_occupied_preferred}`);
  log.push(`  native_american_focus: ${cde.native_american_focus}`);
  log.push(`  allocation_type: ${cde.allocation_type}`);
  log.push(`  innovative_activities: "${(cde.innovative_activities || '').substring(0, 80)}"`);
  log.push('');

  // ELIMINATOR 1: Geographic
  const serviceType = normalizeText(cde.service_area_type);
  let geoResult = 'FAIL';
  let geoReason = '';

  if (serviceType === 'national') {
    geoResult = 'PASS';
    geoReason = 'service_area_type = national';
  } else {
    const stateInfo = getStateInfo(deal.state || '');
    if (!stateInfo) {
      geoResult = 'FAIL';
      geoReason = `Deal state "${deal.state}" not recognized`;
    } else {
      // Check primary_states array
      let found = false;
      for (const s of (cde.primary_states || [])) {
        const cleaned = s.trim();
        if (cleaned.toUpperCase() === stateInfo.abbrev || cleaned.toLowerCase() === stateInfo.name) {
          geoResult = 'PASS';
          geoReason = `primary_states contains "${cleaned}" matching deal state "${deal.state}"`;
          found = true;
          break;
        }
      }
      // Parse predominant_market for comma-separated state abbreviations
      const rawMarket = cde.predominant_market || '';
      if (!found && rawMarket) {
        const marketStates = rawMarket.split(/[,;]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]{2}$/.test(s));
        if (marketStates.includes(stateInfo.abbrev)) {
          geoResult = 'PASS';
          geoReason = `predominant_market "${rawMarket}" contains state abbrev "${stateInfo.abbrev}"`;
          found = true;
        }
        if (!found) {
          const marketLower = rawMarket.toLowerCase();
          const stateNameRegex = new RegExp(`\\b${stateInfo.name}\\b`);
          if (stateNameRegex.test(marketLower)) {
            geoResult = 'PASS';
            geoReason = `predominant_market contains state name "${stateInfo.name}"`;
            found = true;
          }
        }
      }
      if (!found) {
        geoResult = 'FAIL';
        geoReason = `Not national, states ${JSON.stringify(cde.primary_states)} don't match "${deal.state}", market "${rawMarket || 'NULL'}" doesn't contain "${stateInfo.abbrev}"`;
      }
    }
  }

  log.push(`  ELIM 1 Geographic: ${geoResult} — ${geoReason}`);

  if (geoResult === 'FAIL') {
    log.push(`  >>> ELIMINATED by Geographic gate. Score = 0`);
    return { score: 0, log };
  }

  // ELIMINATOR 2: Financing
  const intakeData = deal.intake_data || {};
  // Default true when not specified — most NMTC deals are owner-occupied
  const isOwnerOccupied = intakeData.isOwnerOccupied ?? true;
  const financing = normalizeText(cde.predominant_financing);
  let finResult = 'PASS';
  let finReason = '';

  if (isOwnerOccupied) {
    finReason = 'Deal is owner-occupied, matches both RE and Biz';
  } else if (!financing) {
    finReason = 'CDE has no predominant_financing — matches all';
  } else {
    const isRealEstateCde = financing.includes('real estate');
    const isBusinessCde = financing.includes('business') || financing.includes('operating');
    if (!isRealEstateCde && !isBusinessCde) {
      finReason = `CDE financing "${financing}" not clearly RE or Biz — matches all`;
    } else {
      // Determine deal type
      const ventureType = normalizeText(intakeData.ventureType || '');
      const projectType = normalizeText(deal.project_type || intakeData.projectType || intakeData.sectorCategory || '');
      const RE_KEYWORDS = ['community facility', 'community center', 'healthcare', 'medical', 'clinic', 'hospital',
        'education', 'school', 'charter', 'housing', 'residential', 'affordable', 'senior',
        'shelter', 'homeless', 'rescue', 'mission', 'childcare', 'daycare', 'industrial',
        'manufacturing', 'warehouse', 'retail', 'commercial', 'office', 'mixed use',
        'renovation', 'construction', 'development', 'building', 'facility', 'real estate'];

      let isRealEstateDeal = null;
      if (ventureType.includes('real estate')) isRealEstateDeal = true;
      else if (ventureType.includes('business') || ventureType.includes('operating')) isRealEstateDeal = false;
      else if (RE_KEYWORDS.some(kw => projectType.includes(kw))) isRealEstateDeal = true;

      if (isRealEstateDeal === null) {
        finReason = `Can't determine deal type (ventureType="${ventureType}", projectType="${projectType}") — benefit of doubt`;
      } else if (isRealEstateDeal && isRealEstateCde) {
        finReason = `Deal is RE, CDE is RE — match`;
      } else if (!isRealEstateDeal && isBusinessCde) {
        finReason = `Deal is Biz, CDE is Biz — match`;
      } else {
        finResult = 'FAIL';
        finReason = `Deal isRealEstate=${isRealEstateDeal}, CDE isRE=${isRealEstateCde} isBiz=${isBusinessCde} — MISMATCH`;
      }
    }
  }

  log.push(`  ELIM 2 Financing: ${finResult} — ${finReason}`);

  if (finResult === 'FAIL') {
    log.push(`  >>> ELIMINATED by Financing gate. Score = 0`);
    return { score: 0, log };
  }

  // 15 BINARY CRITERIA
  const scores = {};
  const details = {};

  // 1. Geographic
  scores.geographic = 1;
  details.geographic = 'Passed eliminator';

  // 2. Financing
  scores.financing = 1;
  details.financing = 'Passed eliminator';

  // 3. Urban/Rural
  const isRural = intakeData.isRural || (deal.tract_classification || '').toLowerCase().includes('rural');
  if (isRural && cde.rural_focus) { scores.urbanRural = 1; details.urbanRural = `Deal rural + CDE rural_focus`; }
  else if (!isRural && cde.urban_focus) { scores.urbanRural = 1; details.urbanRural = `Deal urban + CDE urban_focus`; }
  else if (!cde.rural_focus && !cde.urban_focus) { scores.urbanRural = 1; details.urbanRural = `CDE has no rural/urban focus — matches all`; }
  else { scores.urbanRural = 0; details.urbanRural = `isRural=${isRural}, rural_focus=${cde.rural_focus}, urban_focus=${cde.urban_focus} — MISMATCH`; }

  // 4. Sector
  const dealSector = normalizeText(intakeData.sectorCategory || deal.project_type);
  const cdeSectors = (cde.target_sectors || []).map(normalizeText);
  const cdeMarket = normalizeText(cde.predominant_market);
  let sectorMatch = false;
  let sectorReason = '';

  if (!dealSector) {
    sectorReason = `Deal has no sector/projectType`;
    sectorMatch = (cdeSectors.length === 0 && !cdeMarket);
    if (!sectorMatch) sectorReason += ` — CDE has sectors but deal has none`;
  } else {
    for (const sector of cdeSectors) {
      if (sector && (dealSector.includes(sector) || sector.includes(dealSector))) {
        sectorMatch = true;
        sectorReason = `Deal sector "${dealSector}" matches CDE sector "${sector}"`;
        break;
      }
    }
    if (!sectorMatch && cdeMarket && dealSector && cdeMarket.includes(dealSector)) {
      sectorMatch = true;
      sectorReason = `Deal sector "${dealSector}" found in predominant_market`;
    }
    if (!sectorMatch && cdeSectors.length === 0 && !cdeMarket) {
      sectorMatch = true;
      sectorReason = `CDE has no target_sectors and no predominant_market — generalist`;
    }
    if (!sectorMatch) {
      sectorReason = `Deal "${dealSector}" not in CDE sectors ${JSON.stringify(cde.target_sectors)} or market "${cde.predominant_market || 'NULL'}"`;
    }
  }
  scores.sector = sectorMatch ? 1 : 0;
  details.sector = sectorReason;

  // 5. Deal Size
  const amount = Number(deal.nmtc_financing_requested) || 0;
  const minDeal = Number(cde.min_deal_size) || 0;
  const maxDeal = Number(cde.max_deal_size) || Number.MAX_SAFE_INTEGER;
  scores.dealSize = (amount >= minDeal && amount <= maxDeal) ? 1 : 0;
  details.dealSize = `Deal $${(amount/1e6).toFixed(1)}M vs CDE range $${(minDeal/1e6).toFixed(1)}M-$${(maxDeal/1e6).toFixed(1)}M`;

  // 6. Small Deal Fund
  const isSmallDeal = amount > 0 && amount <= 5000000;
  scores.smallDealFund = (!isSmallDeal || cde.small_deal_fund) ? 1 : 0;
  details.smallDealFund = `isSmallDeal=${isSmallDeal}, small_deal_fund=${cde.small_deal_fund}`;

  // 7. Severely Distressed
  scores.severelyDistressed = (!cde.require_severely_distressed || deal.tract_severely_distressed) ? 1 : 0;
  details.severelyDistressed = `CDE requires=${cde.require_severely_distressed}, deal has=${deal.tract_severely_distressed}`;

  // 8. Distress Percentile
  const minDistress = Number(cde.min_distress_percentile) || 0;
  if (minDistress === 0) {
    scores.distressPercentile = 1;
    details.distressPercentile = `CDE min_distress_percentile=0 — no requirement`;
  } else {
    const dealDistress = Number(intakeData.distressPercentile) || Number(deal.distress_score) || 0;
    scores.distressPercentile = (dealDistress >= minDistress) ? 1 : 0;
    details.distressPercentile = `Deal distress ${dealDistress} vs CDE min ${minDistress}`;
  }

  // 9. Minority Focus
  const isMinorityOwned = intakeData.minorityOwned || intakeData.isMinorityOwned || false;
  const cdeMinorityFocus = cde.minority_focus || false;
  scores.minorityFocus = (!cdeMinorityFocus || isMinorityOwned) ? 1 : 0;
  details.minorityFocus = `CDE minority_focus=${cdeMinorityFocus}, deal minority=${isMinorityOwned}`;

  // 10. UTS Focus
  const dealStateForUts = (deal.state || '').toUpperCase().trim();
  const cdeYear = Number(cde.year) || 0;
  const underservedList = UNDERSERVED_STATES_BY_YEAR[cdeYear] || [];
  const isUts = underservedList.includes(dealStateForUts) || intakeData.isUts || false;
  const cdeUtsFocus = cde.uts_focus || false;
  scores.utsFocus = (!cdeUtsFocus || isUts) ? 1 : 0;
  details.utsFocus = `CDE uts_focus=${cdeUtsFocus}, deal state="${dealStateForUts}" in underserved[${cdeYear}]=${isUts}`;

  // 11. Entity Type
  const orgTypeText = normalizeText(intakeData.organizationType || intakeData.entityType);
  const isNonProfit = orgTypeText.includes('nonprofit') || orgTypeText.includes('non-profit') || orgTypeText.includes('501');
  const cdeForprofitAccepted = cde.forprofit_accepted ?? true;
  if (!cdeForprofitAccepted && !isNonProfit) { scores.entityType = 0; }
  else { scores.entityType = 1; }
  details.entityType = `CDE forprofit_accepted=${cde.forprofit_accepted} (resolved: ${cdeForprofitAccepted}), deal nonprofit=${isNonProfit}`;

  // 12. Owner Occupied
  const cdeOwnerOccPref = cde.owner_occupied_preferred || false;
  scores.ownerOccupied = (!cdeOwnerOccPref || isOwnerOccupied) ? 1 : 0;
  details.ownerOccupied = `CDE owner_occupied_preferred=${cde.owner_occupied_preferred} (resolved: ${cdeOwnerOccPref}), deal=${isOwnerOccupied}`;

  // 13. Tribal / AIAN
  const isTribal = intakeData.isTribal || intakeData.isAian || deal.aian === 1 || false;
  scores.tribal = (!cde.native_american_focus || isTribal) ? 1 : 0;
  details.tribal = `CDE native_american_focus=${cde.native_american_focus}, deal tribal=${isTribal} (aian=${deal.aian})`;

  // 14. Allocation Type
  const dealAllocType = normalizeText(deal.program_level || 'federal');
  const cdeAllocType = normalizeText(cde.allocation_type || 'federal');
  scores.allocationType = (!dealAllocType || !cdeAllocType || dealAllocType === cdeAllocType) ? 1 : 0;
  details.allocationType = `Deal "${dealAllocType}" vs CDE "${cdeAllocType}"`;

  // 15. Has Allocation
  scores.hasAllocation = (Number(cde.amount_remaining) || 0) > 0 ? 1 : 0;
  details.hasAllocation = `CDE amount_remaining=${cde.amount_remaining}`;

  // Total
  const totalPoints = Object.values(scores).reduce((sum, val) => sum + val, 0);
  const total = Math.round((totalPoints / TOTAL_CRITERIA) * 100);

  log.push(`  BINARY SCORING (${totalPoints}/${TOTAL_CRITERIA} = ${total}%):`);
  for (const [key, val] of Object.entries(scores)) {
    const pad = key.padEnd(22);
    log.push(`    ${pad} ${val === 1 ? '✓ 1' : '✗ 0'}  ${details[key]}`);
  }
  log.push(`  TOTAL: ${totalPoints}/${TOTAL_CRITERIA} = ${total}%`);

  return { score: total, totalPoints, breakdown: scores, log };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('AutoMatch Diagnostic Script');
  console.log('==========================\n');

  // Get a sample deal
  const { data: deals, error: dealError } = await supabase
    .from('deals')
    .select('*')
    .in('status', ['available', 'seeking_capital', 'submitted'])
    .contains('programs', ['NMTC'])
    .limit(3);

  if (dealError || !deals?.length) {
    console.error('No deals found:', dealError);
    // Use a synthetic deal for testing
    console.log('\nUsing synthetic test deal instead...\n');
    const testDeal = {
      id: 'TEST-001',
      project_name: 'Test Community Center',
      state: 'IL',
      city: 'Chicago',
      nmtc_financing_requested: 8000000,
      programs: ['NMTC'],
      program_level: 'federal',
      project_type: 'community facility',
      tract_severely_distressed: true,
      tract_eligible: true,
      intake_data: {
        sectorCategory: 'community facility',
        isRural: false,
        isNonProfit: true,
        isOwnerOccupied: false,
        isMinorityOwned: false,
        isTribal: false,
        organizationType: 'nonprofit',
      },
    };
    await runDiagnostic(testDeal);
    return;
  }

  for (const deal of deals) {
    await runDiagnostic(deal);
  }
}

async function runDiagnostic(deal) {
  const intakeData = deal.intake_data || {};
  console.log(`\n${'#'.repeat(80)}`);
  console.log(`DEAL: ${deal.project_name || deal.id}`);
  console.log(`  state: ${deal.state}, city: ${deal.city}`);
  console.log(`  nmtc_request: $${((Number(deal.nmtc_financing_requested) || 0) / 1e6).toFixed(1)}M`);
  console.log(`  project_type: "${deal.project_type || 'NULL'}"`);
  console.log(`  intake_data.sectorCategory: "${intakeData.sectorCategory || 'NULL'}"`);
  console.log(`  intake_data.ventureType: "${intakeData.ventureType || 'NULL'}"`);
  console.log(`  intake_data.isRural: ${intakeData.isRural}`);
  console.log(`  intake_data.isNonProfit: ${intakeData.isNonProfit}`);
  console.log(`  intake_data.isOwnerOccupied: ${intakeData.isOwnerOccupied}`);
  console.log(`  tract_severely_distressed: ${deal.tract_severely_distressed}`);
  console.log(`  program_level: ${deal.program_level}`);
  console.log(`${'#'.repeat(80)}`);

  // Get CDEs
  const { data: cdes, error: cdeError } = await supabase
    .from('cdes_merged')
    .select('*')
    .eq('status', 'active')
    .limit(300);

  if (cdeError) {
    console.error('Error fetching CDEs:', cdeError);
    return;
  }

  console.log(`\nScoring against ${cdes.length} CDEs...\n`);

  // Score each CDE
  const results = [];
  const scoreDistribution = {};
  let eliminated = { geographic: 0, financing: 0 };

  for (let cde of cdes) {
    cde = enrichCDE(cde);
    const result = diagnoseScore(deal, cde);
    results.push({ name: cde.name, year: cde.year, orgId: cde.organization_id, ...result });

    const bucket = result.score;
    scoreDistribution[bucket] = (scoreDistribution[bucket] || 0) + 1;

    if (result.score === 0) {
      // Check which eliminator failed
      const logText = result.log.join('\n');
      if (logText.includes('ELIMINATED by Geographic')) eliminated.geographic++;
      else if (logText.includes('ELIMINATED by Financing')) eliminated.financing++;
    }
  }

  // Show detailed logs for first 5 CDEs at different score levels
  const byScore = {};
  for (const r of results) {
    if (!byScore[r.score]) byScore[r.score] = [];
    byScore[r.score].push(r);
  }

  console.log('\n' + '='.repeat(80));
  console.log('SCORE DISTRIBUTION:');
  console.log('='.repeat(80));
  const sortedScores = Object.keys(scoreDistribution).map(Number).sort((a, b) => b - a);
  for (const score of sortedScores) {
    const bar = '█'.repeat(Math.min(scoreDistribution[score], 50));
    console.log(`  ${String(score).padStart(3)}%: ${bar} (${scoreDistribution[score]} CDEs)`);
  }
  console.log(`\n  Eliminated by Geographic: ${eliminated.geographic}`);
  console.log(`  Eliminated by Financing: ${eliminated.financing}`);
  console.log(`  Passed both gates: ${cdes.length - eliminated.geographic - eliminated.financing}`);

  // Show detailed examples at each score level
  console.log('\n' + '='.repeat(80));
  console.log('DETAILED EXAMPLES (1 per score level):');
  console.log('='.repeat(80));

  for (const score of sortedScores) {
    const example = byScore[score][0];
    console.log(example.log.join('\n'));
  }

  // Show what criteria actually vary (cause score differences)
  if (Object.keys(byScore).some(s => Number(s) > 0 && Number(s) < 100)) {
    console.log('\n' + '='.repeat(80));
    console.log('CRITERIA THAT VARY (cause score differences among non-eliminated CDEs):');
    console.log('='.repeat(80));

    const nonZeroResults = results.filter(r => r.score > 0 && r.breakdown);
    if (nonZeroResults.length > 0) {
      const criteria = Object.keys(nonZeroResults[0].breakdown);
      for (const c of criteria) {
        const zeros = nonZeroResults.filter(r => r.breakdown[c] === 0).length;
        const ones = nonZeroResults.filter(r => r.breakdown[c] === 1).length;
        if (zeros > 0 && ones > 0) {
          console.log(`  ${c.padEnd(22)} ✓=${ones} ✗=${zeros} (${Math.round(zeros/(zeros+ones)*100)}% fail)`);
        } else if (zeros === 0) {
          console.log(`  ${c.padEnd(22)} ALL PASS (${ones} CDEs) — provides NO differentiation`);
        } else {
          console.log(`  ${c.padEnd(22)} ALL FAIL (${zeros} CDEs)`);
        }
      }
    }
  }
}

main().catch(console.error);
