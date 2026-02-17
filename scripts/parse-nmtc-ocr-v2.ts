/**
 * Parse NMTC OCR Combined Raw Text - V2
 * Handles multi-column OCR where columns got linearized separately
 */

import * as fs from 'fs';

const STATES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
  'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'PR': 'Puerto Rico', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming'
};

interface CDEEntry {
  allocatee: string;
  city: string;
  state: string;
  serviceArea: string;
  amount: number;
}

function parseOCRText(filePath: string): CDEEntry[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim());

  const entries: CDEEntry[] = [];

  // SECTION 1: Parse complete inline entries (lines with allocatee + city + state + amount on same line)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Look for lines with dollar amounts
    const amountMatch = line.match(/\$(\d{1,3}(?:,\d{3})+)/);
    if (!amountMatch) continue;

    const amount = parseInt(amountMatch[1].replace(/,/g, ''));
    if (amount < 20000000 || amount > 100000000) continue;

    // Try to find a state code
    const stateMatch = line.match(/\b([A-Z]{2})\s+(NATIONAL|LOCAL|MULTI-STATE|STATEWIDE|\$)/);
    if (!stateMatch) continue;

    const stateCode = stateMatch[1];
    if (!STATES[stateCode]) continue;

    // Extract service area
    let serviceArea = 'NATIONAL';
    if (line.includes('LOCAL')) serviceArea = 'LOCAL';
    else if (line.includes('MULTI-STATE')) serviceArea = 'MULTI-STATE';
    else if (line.includes('STATEWIDE') || line.includes('TERRITORY')) serviceArea = 'STATEWIDE';

    // Find where state appears
    const statePos = line.indexOf(stateMatch[0]);
    const beforeState = line.substring(0, statePos).trim();

    // Parse allocatee and city from beforeState
    // Format is usually: ALLOCATEE NAME CITY
    const parts = beforeState.split(/\s+/);

    // Find city - usually 1-2 words at the end that are all caps
    let cityParts: string[] = [];
    let allocateeParts: string[] = [];

    for (let j = parts.length - 1; j >= 0; j--) {
      const word = parts[j];
      // Cities are uppercase, not common suffixes like LLC, INC
      if (cityParts.length < 2 && word.match(/^[A-Z.]+$/) && !['LLC', 'INC', 'INC.', 'L.L.C.', 'LP', 'N.A.'].includes(word)) {
        cityParts.unshift(word);
      } else {
        allocateeParts = parts.slice(0, j + 1);
        break;
      }
    }

    const allocatee = allocateeParts.join(' ').replace(/,\s*$/, '').trim();
    const city = cityParts.join(' ').replace(/\.$/, '').trim();

    if (allocatee.length > 3 && city.length > 0) {
      entries.push({ allocatee, city, state: stateCode, serviceArea, amount });
    }
  }

  // SECTION 2: Parse the split-column sections
  // Lines 47-100ish: More allocatee names
  // Lines 102-151ish: Cities
  // Lines 153-210ish: Service areas
  // Lines 212-260ish: Amounts

  // Find the split sections by identifying patterns
  const allocateeLines: string[] = [];
  const cityLines: string[] = [];
  const serviceAreaLines: string[] = [];
  const amountLines: number[] = [];

  let inAllocateeBlock = false;
  let inCityBlock = false;
  let inServiceAreaBlock = false;
  let inAmountBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Skip already processed complete lines
    if (line.match(/\$\d{1,3}(,\d{3})+/) && line.match(/\b[A-Z]{2}\s+(NATIONAL|LOCAL|MULTI)/)) {
      continue;
    }

    // Detect allocatee block (company names, often with LLC, INC, FUND, etc.)
    if (line.match(/^(COLORADO GROWTH|COMMONWEALTH|COMMUNITY DEVELOPMENT|COMMUNITY FIRST|FORWARD|FRENCH|GENESIS|FNB|FORT WAYNE)/i) ||
        line.match(/(FUND|LLC|INC|CORPORATION|CAPITAL|DEVELOPMENT|PARTNERS|HOUSING|COMMUNITY)$/i)) {
      if (!line.match(/^\d/) && !line.match(/^NATIONAL|^LOCAL|^MULTI|^STATEWIDE|^\$/)) {
        allocateeLines.push(line);
        continue;
      }
    }

    // Detect city block (single uppercase city names)
    if (line.match(/^[A-Z][A-Z\s.]+$/) && line.length < 20 &&
        !line.match(/^(NATIONAL|LOCAL|MULTI-STATE|STATEWIDE|TERRITORY)/)) {
      const possibleCity = line.replace(/\./g, '').trim();
      if (possibleCity.length > 2 && possibleCity.length < 18) {
        cityLines.push(possibleCity);
        continue;
      }
    }

    // Detect service area block
    if (line.match(/^(NATIONAL|LOCAL|MULTI-STATE|STATEWIDE \(OR|TERRITORY-WIDE\))$/)) {
      serviceAreaLines.push(line.replace('STATEWIDE (OR', 'STATEWIDE').replace('TERRITORY-WIDE)', ''));
      continue;
    }

    // Detect standalone amounts
    if (line.match(/^\$\d{1,3}(,\d{3})+$/)) {
      const amt = parseInt(line.replace(/[$,]/g, ''));
      if (amt >= 20000000 && amt <= 100000000) {
        amountLines.push(amt);
      }
      continue;
    }
  }

  console.log(`\nSplit-column analysis:`);
  console.log(`  Allocatee fragments: ${allocateeLines.length}`);
  console.log(`  City fragments: ${cityLines.length}`);
  console.log(`  Service area fragments: ${serviceAreaLines.length}`);
  console.log(`  Amount fragments: ${amountLines.length}`);

  // Try to align the fragments
  // This is imperfect due to OCR issues, but we can match by count
  const minLen = Math.min(allocateeLines.length, cityLines.length, amountLines.length);

  console.log(`\n  Alignable entries: ${minLen}`);

  // Add aligned entries
  // Note: This requires manual verification due to OCR column alignment issues
  for (let i = 0; i < minLen; i++) {
    // Skip if we can't determine state
    // For now, just count as fragments - full alignment needs manual review
  }

  return entries;
}

function main() {
  const ocrPath = 'C:/tcredex.com/tracts/NMTC_OCR_Combined_Raw_Text.txt';

  console.log('Parsing:', ocrPath);
  const entries = parseOCRText(ocrPath);

  console.log(`\n========================================`);
  console.log(`Complete entries parsed: ${entries.length}`);

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  console.log(`Total from complete lines: $${(total / 1e9).toFixed(2)}B`);

  // The OCR file has ~141 amounts totaling $9.91B
  // Complete lines capture only a portion
  // The rest need manual alignment or a better OCR source

  // Group by service area
  const byArea: Record<string, number> = {};
  for (const e of entries) {
    byArea[e.serviceArea] = (byArea[e.serviceArea] || 0) + 1;
  }
  console.log('\nBy Service Area:');
  for (const [area, count] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${area}: ${count}`);
  }

  // Write what we have to CSV
  const csvPath = 'C:/tcredex.com/tracts/NMTC_Allocations_Partial.csv';
  const csvContent = [
    'ALLOCATEE,CITY,STATE,SERVICE_AREA,AMOUNT',
    ...entries.map(e => `"${e.allocatee}","${e.city}","${e.state}","${e.serviceArea}",${e.amount}`)
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent);
  console.log(`\nPartial CSV written to: ${csvPath}`);

  console.log(`\n========================================`);
  console.log(`NOTE: The OCR source has ~141 allocations totaling ~$9.91B`);
  console.log(`Only ${entries.length} have complete inline data.`);
  console.log(`The remaining entries have columns split across line blocks.`);
  console.log(`Consider using the official CDFI Fund awards database for complete data.`);
}

main();
