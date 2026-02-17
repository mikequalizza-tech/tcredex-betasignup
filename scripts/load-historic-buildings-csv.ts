/**
 * Load National Register of Historic Places (NRHP) Data from CSV
 * ================================================================
 * Loads 116K+ historic buildings from CSV into historic_buildings table
 * for Federal HTC eligibility lookups.
 *
 * Usage: npx tsx scripts/load-historic-buildings-csv.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const STATE_ABBREVS: Record<string, string> = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
  'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
  'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
  'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
  'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
  'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
  'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY',
  'DISTRICT OF COLUMBIA': 'DC', 'PUERTO RICO': 'PR', 'GUAM': 'GU', 'VIRGIN ISLANDS': 'VI',
  'AMERICAN SAMOA': 'AS', 'NORTHERN MARIANA ISLANDS': 'MP',
};

interface HistoricBuilding {
  ref_number?: string;
  property_name: string;
  state?: string;
  state_abbr?: string;
  county?: string;
  city?: string;
  street_address?: string;
  address?: string;
  status?: string;
  request_type?: string;
  restricted_address: boolean;
  acreage?: number;
  area_of_significance?: string;
  category?: string;
  external_link?: string;
  listed_date?: string;
  periods_of_significance?: string;
  is_htc_eligible: boolean;
  is_nhl: boolean;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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

function parseBool(value: string): boolean {
  return value?.toUpperCase() === 'TRUE';
}

function cleanString(value: string): string | undefined {
  if (!value || value.trim() === '') return undefined;
  return value.trim();
}

function parseDate(value: string): string | undefined {
  if (!value || value.trim() === '' || value === 'False' || value === 'TRUE') return undefined;
  // Format: DD/MM/YYYY -> YYYY-MM-DD
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const m = parseInt(month);
    const d = parseInt(day);
    // Validate month and day ranges
    if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
    return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return undefined;
}

async function loadHistoricBuildings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const csvPath = 'C:/tcredex.com/tracts/national-register-everything_20250624.csv';
  console.log(`Reading CSV from: ${csvPath}`);

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  const headers = parseCSVLine(lines[0]);
  console.log(`Headers: ${headers.length} columns`);
  console.log(`Data rows: ${lines.length - 1}`);

  // Build header index map
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => headerIndex[h] = i);

  const BATCH_SIZE = 500;
  let processed = 0;
  let errors = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i += BATCH_SIZE) {
    const batchLines = lines.slice(i, i + BATCH_SIZE);
    const records: Partial<HistoricBuilding>[] = [];
    const seenRefs = new Set<string>();

    for (const line of batchLines) {
      try {
        const cols = parseCSVLine(line);

        const propertyName = cleanString(cols[headerIndex['Property Name']]);
        if (!propertyName) {
          skipped++;
          continue;
        }

        const refNumber = cleanString(cols[headerIndex['Ref#']]);

        // Skip duplicates within batch
        if (refNumber) {
          if (seenRefs.has(refNumber)) continue;
          seenRefs.add(refNumber);
        }

        const state = cleanString(cols[headerIndex['State']]);
        const stateAbbr = state ? STATE_ABBREVS[state.toUpperCase()] : undefined;
        const city = cleanString(cols[headerIndex['City ']]);
        const streetAddress = cleanString(cols[headerIndex['Street & Number']]);
        const county = cleanString(cols[headerIndex['County']]);

        const addressParts = [streetAddress, city, state].filter(Boolean);
        const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;

        const status = cleanString(cols[headerIndex['Status']]);
        const isHtcEligible = status?.toUpperCase() === 'LISTED';

        const acreageStr = cols[headerIndex['Acreage of Property']];
        const acreage = acreageStr ? parseFloat(acreageStr) : undefined;

        records.push({
          ref_number: refNumber,
          property_name: propertyName,
          state,
          state_abbr: stateAbbr,
          county,
          city,
          street_address: streetAddress,
          address: fullAddress,
          status,
          request_type: cleanString(cols[headerIndex['Request Type']]),
          restricted_address: parseBool(cols[headerIndex['Restricted Address']]),
          acreage: isNaN(acreage!) ? undefined : acreage,
          area_of_significance: cleanString(cols[headerIndex['Area of Significance']]),
          category: cleanString(cols[headerIndex['Category of Property']]),
          external_link: cleanString(cols[headerIndex['External Link']]),
          listed_date: parseDate(cols[headerIndex['Listed Date']]),
          periods_of_significance: cleanString(cols[headerIndex['Periods of Significance']]),
          is_htc_eligible: isHtcEligible,
          is_nhl: false,
        });
      } catch (err) {
        errors++;
      }
    }

    if (records.length > 0) {
      const { error } = await supabase
        .from('historic_buildings')
        .upsert(records, { onConflict: 'ref_number' });

      if (error) {
        console.error(`Batch ${i} error:`, error.message);
        // Try one by one
        for (const record of records) {
          const { error: singleError } = await supabase
            .from('historic_buildings')
            .upsert(record, { onConflict: 'ref_number' });
          if (!singleError) processed++;
          else errors++;
        }
      } else {
        processed += records.length;
      }
    }

    if ((i + BATCH_SIZE) % 5000 < BATCH_SIZE || i + BATCH_SIZE >= lines.length) {
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, lines.length - 1)}/${lines.length - 1} (${processed} inserted, ${errors} errors, ${skipped} skipped)`);
    }
  }

  console.log('\n=== Load Complete ===');
  console.log(`Total processed: ${processed}`);
  console.log(`Total errors: ${errors}`);
  console.log(`Total skipped: ${skipped}`);

  // Verify via pagination
  let totalCount = 0;
  let lastId = 0;
  for (let i = 0; i < 200; i++) {
    const { data } = await supabase.from('historic_buildings').select('id').gt('id', lastId).order('id').limit(1000);
    if (!data || data.length === 0) break;
    totalCount += data.length;
    lastId = data[data.length - 1].id;
  }
  console.log(`\nVerified records in table: ${totalCount}`);
}

loadHistoricBuildings().catch(console.error);
