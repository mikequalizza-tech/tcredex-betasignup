/**
 * Import QEI CDE Data -> cdes_merged table (per-year rows)
 *
 * Pipeline: QEI PDF -> parse-qei-pdf.py -> CSV -> THIS SCRIPT -> cdes_merged
 *
 * This script:
 * 1. Reads the QEI CSV (one row per CDE per allocation year)
 * 2. Maps each row to cdes_merged columns (15 QEI fields)
 * 3. Generates organization_id (deterministic UUID from CDE name)
 * 4. UPSERTs on (organization_id, year) — preserves ~45 platform preference columns
 * 5. Outputs JSON for review or executes against Supabase
 *
 * Usage:
 *   node scripts/import-qei-to-cdes-merged.js                    # Preview -> JSON
 *   node scripts/import-qei-to-cdes-merged.js --execute           # Insert into DB
 *   node scripts/import-qei-to-cdes-merged.js --csv path/to.csv  # Custom CSV path
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// CSV Parsing Utilities
// ============================================================================

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCurrency(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parsePercentage(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[%\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ============================================================================
// Name & Field Utilities
// ============================================================================

function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * Generate a deterministic UUID v5 from CDE name.
 * Same name always produces same organization_id across imports.
 * Uses the DNS namespace UUID as base.
 */
function generateOrgId(name) {
  const normalized = name.trim().replace(/\s+/g, ' ').toLowerCase();
  // Create a deterministic UUID v5 using SHA-1 hash
  const hash = crypto.createHash('sha1')
    .update('tcredex-cde:' + normalized)
    .digest('hex');
  // Format as UUID v5
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),  // Version 5
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join('-');
}

function cleanPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
  }
  return phone.trim() || null;
}

function cleanEmail(email) {
  if (!email) return null;
  const cleaned = email.trim().toLowerCase();
  if (cleaned.includes('@') && cleaned.includes('.')) {
    return cleaned;
  }
  return null;
}

function cleanContactName(name) {
  if (!name) return null;
  return name.replace(/,\s*$/, '').replace(/\s+/g, ' ').trim() || null;
}

/**
 * Classify service area description into type code.
 */
function getServiceAreaType(serviceArea) {
  if (!serviceArea) return 'national';
  const lower = serviceArea.toLowerCase();
  if (lower.includes('national')) return 'national';
  if (lower.includes('statewide') || lower.includes('territory-wide')) return 'statewide';
  if (lower.includes('multi-state')) return 'multi-state';
  if (lower.includes('local')) return 'local';
  return 'national';
}

/**
 * Extract state codes from "Predominant Market Served" field.
 * Input: "CA,FL,NC,TN,TX,WV" or "AL, FL, MS" or ""
 * Output: ["CA","FL","NC","TN","TX","WV"] or null
 */
function extractPrimaryStates(predominantMarket) {
  if (!predominantMarket || !predominantMarket.trim()) return null;
  const states = predominantMarket
    .split(/[,;]+/)
    .map(s => s.trim().toUpperCase())
    .filter(s => /^[A-Z]{2}$/.test(s));
  return states.length > 0 ? states : null;
}

/**
 * Detect rural/urban/native focus from innovative activities and non-metro commitment.
 */
function detectFocusFlags(innovativeActivities, nonMetroCommitment) {
  const lower = (innovativeActivities || '').toLowerCase();
  return {
    rural_focus: nonMetroCommitment >= 40,
    native_american_focus: lower.includes('indian country') || lower.includes('tribal'),
    uts_focus: lower.includes('targeting identified states') || lower.includes('underserved'),
    small_deal_fund: lower.includes('small dollar'),
    minority_focus: lower.includes('minority') || lower.includes('african') || lower.includes('hispanic') || lower.includes('latino'),
  };
}

/**
 * Derive target_sectors from predominant_financing, predominant_market, and
 * innovative_activities text.
 *
 * IMPORTANT: Output values MUST match the intake form's SectorCategory enum:
 *   Healthcare/Medical, Education/Schools, Housing/Residential,
 *   Industrial/Manufacturing, Retail/Commercial, Food Access/Grocery,
 *   Childcare/Early Education, Senior Services, Community Facility,
 *   Mixed-Use, Other
 *
 * This ensures both sides of the AutoMatch speak the same vocabulary.
 */
function deriveTargetSectors(predominantFinancing, predominantMarket, innovativeActivities) {
  const sectors = [];
  const financing = (predominantFinancing || '').toLowerCase();
  const market = (predominantMarket || '').toLowerCase();
  const activities = (innovativeActivities || '').toLowerCase();

  // ── From predominant_financing sub-type ──────────────────────────────
  // "Real Estate Financing - Community Facilities" → broad community sectors
  if (financing.includes('community') || financing.includes('facilit')) {
    sectors.push('Community Facility', 'Healthcare/Medical', 'Education/Schools',
      'Childcare/Early Education', 'Senior Services', 'Food Access/Grocery');
  }
  // "Real Estate Financing - Industrial/Manufacturing"
  if (financing.includes('industrial') || financing.includes('manufactur')) {
    sectors.push('Industrial/Manufacturing');
  }
  // "Real Estate Financing - Mixed-use" or "Mixed-use (housing, commercial, or retail)"
  if (financing.includes('mixed')) {
    sectors.push('Mixed-Use', 'Retail/Commercial', 'Housing/Residential');
  }
  // "Real Estate Financing - For-Sale Housing"
  if (financing.includes('housing') || financing.includes('for-sale')) {
    sectors.push('Housing/Residential');
  }
  // "Real Estate Financing - Office Space"
  if (financing.includes('office')) {
    sectors.push('Retail/Commercial');
  }
  // "Real Estate Financing - Retail"
  if (financing.includes('retail')) {
    sectors.push('Retail/Commercial');
  }
  // "Operating Business Financing" — no sub-type qualifier, genuinely broad
  if (financing.includes('operating') || financing.includes('business')) {
    sectors.push('Retail/Commercial', 'Industrial/Manufacturing');
  }
  // "Other Real Estate Financing"
  if (financing.includes('other real estate')) {
    sectors.push('Mixed-Use', 'Retail/Commercial');
  }

  // ── From innovative_activities ───────────────────────────────────────
  // "Providing QLICIs for Non-Real Estate Activities" = business financing
  if (activities.includes('non-real estate')) {
    sectors.push('Retail/Commercial', 'Industrial/Manufacturing');
  }

  // ── From predominant_market keywords ─────────────────────────────────
  if (market.includes('health') || market.includes('medical')) sectors.push('Healthcare/Medical');
  if (market.includes('education') || market.includes('school')) sectors.push('Education/Schools');
  if (market.includes('food') || market.includes('grocery')) sectors.push('Food Access/Grocery');
  if (market.includes('child') || market.includes('daycare')) sectors.push('Childcare/Early Education');
  if (market.includes('senior') || market.includes('elder')) sectors.push('Senior Services');

  // Deduplicate
  return [...new Set(sectors)];
}

// ============================================================================
// Main Import
// ============================================================================

async function importToMerged() {
  console.log('QEI -> cdes_merged Import');
  console.log('='.repeat(50));

  // Determine CSV path
  let csvPath;
  const csvArg = process.argv.indexOf('--csv');
  if (csvArg !== -1 && process.argv[csvArg + 1]) {
    csvPath = path.resolve(process.argv[csvArg + 1]);
  } else {
    // Default: look for the most recent QEI CSV in project root
    csvPath = path.join(__dirname, '../../NMTC_Allocatee_Data_Feb2026_v2.csv');
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(__dirname, '../../NMTC_Allocatee_Data_Feb2026.csv');
    }
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(__dirname, '../../NMTC_Allocatee_Data_with_Contact_Split.csv');
    }
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    console.error('Run: python scripts/parse-qei-pdf.py <QEI_PDF> first');
    process.exit(1);
  }

  console.log(`CSV: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);

  console.log(`Rows: ${lines.length - 1}`);

  // Column index mapping
  const col = {
    name: headers.findIndex(h => h.toLowerCase().includes('name of allocatee')),
    year: headers.findIndex(h => h.toLowerCase().includes('year of award')),
    totalAllocation: headers.findIndex(h => h.toLowerCase().includes('total allocation')),
    amountFinalized: headers.findIndex(h => h.toLowerCase().includes('amount finalized')),
    amountRemaining: headers.findIndex(h => h.toLowerCase().includes('amount remaining')),
    nonMetro: headers.findIndex(h => h.toLowerCase().includes('non-metro')),
    serviceArea: headers.findIndex(h => h.toLowerCase().includes('service area')),
    controllingEntity: headers.findIndex(h => h.toLowerCase().includes('controlling entity')),
    predominantFinancing: headers.findIndex(h => h.toLowerCase().includes('predominant financing')),
    predominantMarket: headers.findIndex(h => h.toLowerCase().includes('predominant market')),
    innovativeActivities: headers.findIndex(h => h.toLowerCase().includes('innovative')),
    contactName: headers.findIndex(h => h.toLowerCase() === 'contact name'),
    contactPhone: headers.findIndex(h => h.toLowerCase() === 'contact phone'),
    contactEmail: headers.findIndex(h => h.toLowerCase() === 'contact email'),
  };

  // Build per-year rows for cdes_merged
  const rows = [];
  const now = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const v = parseCSVLine(lines[i]);
    if (v.length < 5) continue;

    const rawName = (v[col.name] || '').trim().replace(/\s+/g, ' ');
    if (!rawName) continue;

    const year = parseInt(v[col.year]) || 0;
    if (!year) continue;

    const nonMetro = parsePercentage(v[col.nonMetro]);
    const innovativeActivities = (v[col.innovativeActivities] || '').trim();
    const predominantMarket = (v[col.predominantMarket] || '').trim();
    const predominantFinancing = (v[col.predominantFinancing] || '').trim();
    const focusFlags = detectFocusFlags(innovativeActivities, nonMetro);
    const primaryStates = extractPrimaryStates(predominantMarket);
    const serviceArea = (v[col.serviceArea] || '').trim();
    const targetSectors = deriveTargetSectors(predominantFinancing, predominantMarket, innovativeActivities);

    // Build the cdes_merged row — QEI-sourced + QEI-derived fields
    // Platform preference columns not derivable from QEI are left null (preserved on UPSERT)
    rows.push({
      // Identity
      organization_id: generateOrgId(rawName),
      name: rawName,
      slug: createSlug(rawName),

      // Allocation year
      year: year,
      allocation_type: 'federal',

      // Amounts
      total_allocation: parseCurrency(v[col.totalAllocation]),
      amount_finalized: parseCurrency(v[col.amountFinalized]),
      amount_remaining: parseCurrency(v[col.amountRemaining]),
      non_metro_commitment: nonMetro,

      // From CSV
      service_area: serviceArea,
      service_area_type: getServiceAreaType(serviceArea),
      controlling_entity: ((v[col.controllingEntity] || '').trim() || null)?.substring(0, 255) || null,
      predominant_financing: predominantFinancing || null,
      predominant_market: predominantMarket || null,
      innovative_activities: innovativeActivities || null,

      // Contact
      contact_name: cleanContactName(v[col.contactName]),
      contact_phone: cleanPhone(v[col.contactPhone]),
      contact_email: cleanEmail(v[col.contactEmail]),

      // Derived from QEI data (seeds for AutoMatch, CDE can override later)
      primary_states: primaryStates,
      rural_focus: focusFlags.rural_focus,
      // native_american_focus: NOT in live DB schema — derived at runtime by enrichCDE()
      uts_focus: focusFlags.uts_focus,                // FIXED: was underserved_states_focus
      small_deal_fund: focusFlags.small_deal_fund,
      minority_focus: focusFlags.minority_focus,      // NEW: derived from innovative_activities
      target_sectors: targetSectors,                  // NEW: derived from predominant_financing
      owner_occupied_preferred: true,                 // Default true — most CDEs prefer owner-occupied

      // Status
      status: 'active',
      updated_at: now,
    });
  }

  // Stats
  const uniqueCDEs = new Set(rows.map(r => r.organization_id));
  const yearCounts = {};
  rows.forEach(r => { yearCounts[r.year] = (yearCounts[r.year] || 0) + 1; });

  console.log(`\nPer-year rows: ${rows.length}`);
  console.log(`Unique CDEs: ${uniqueCDEs.size}`);
  console.log('\nBy Year:');
  Object.keys(yearCounts).sort().forEach(y => {
    console.log(`  ${y}: ${yearCounts[y]}`);
  });

  // Top 10 by remaining
  const sortedByRemaining = [...rows].sort((a, b) => b.amount_remaining - a.amount_remaining);
  console.log('\nTop 10 by Remaining Allocation:');
  console.log('='.repeat(50));
  sortedByRemaining.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (${r.year})`);
    console.log(`   Remaining: $${(r.amount_remaining / 1e6).toFixed(1)}M | Total: $${(r.total_allocation / 1e6).toFixed(1)}M`);
    console.log(`   Contact: ${r.contact_name || 'N/A'} | ${r.contact_email || 'N/A'}`);
    console.log(`   States: ${r.primary_states ? r.primary_states.join(', ') : 'National'}`);
    console.log('');
  });

  // Preview mode (default) -> JSON
  if (!process.argv.includes('--execute')) {
    const jsonPath = path.join(__dirname, '../../cdes-merged-import-preview.json');
    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
    console.log(`\nPreview saved to: ${jsonPath}`);
    console.log(`\nRun with --execute to UPSERT into cdes_merged.`);
    console.log(`NOTE: UPSERT on (organization_id, year) preserves platform preferences.`);
    return;
  }

  // ========================================================================
  // Execute mode: UPSERT into cdes_merged
  // ========================================================================
  console.log('\nUPSERTing into cdes_merged...\n');

  // QEI-sourced + QEI-derived columns — these get updated on conflict
  // Platform-only preferences (deal sizes, distress requirements, etc.) are NOT touched
  const QEI_UPDATE_COLUMNS = [
    'name', 'slug',
    'total_allocation', 'amount_finalized', 'amount_remaining', 'non_metro_commitment',
    'service_area', 'service_area_type', 'controlling_entity',
    'predominant_financing', 'predominant_market', 'innovative_activities',
    'contact_name', 'contact_phone', 'contact_email',
    'primary_states', 'rural_focus',
    'uts_focus', 'small_deal_fund',                   // FIXED: was underserved_states_focus
    'minority_focus', 'target_sectors',               // NEW: derived from QEI data
    'owner_occupied_preferred',                        // Default true
    'status', 'updated_at',
  ];

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('cdes_merged')
      .upsert(batch, {
        onConflict: 'organization_id,year',
        ignoreDuplicates: false,
      })
      .select('id, organization_id, year');

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errors += batch.length;

      // Fall back to individual inserts
      for (const row of batch) {
        const { error: singleError } = await supabase
          .from('cdes_merged')
          .upsert(row, {
            onConflict: 'organization_id,year',
            ignoreDuplicates: false,
          });

        if (singleError) {
          console.error(`  Error: ${row.name} (${row.year}): ${singleError.message}`);
          errors++;
        } else {
          inserted++;
        }
        errors--; // Remove the batch count we added
      }
    } else {
      inserted += batch.length;
      if ((i / BATCH_SIZE) % 2 === 0) {
        console.log(`  Processed ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}...`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Import Complete!');
  console.log(`  Rows UPSERTed: ${inserted}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Unique CDEs: ${uniqueCDEs.size}`);
  console.log('='.repeat(50));

  // Verify
  const { count } = await supabase
    .from('cdes_merged')
    .select('*', { count: 'exact', head: true });
  console.log(`\ncdes_merged total rows now: ${count}`);
}

// Run
importToMerged().catch(console.error);
