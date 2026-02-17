/**
 * Parse NMTC OCR Combined Raw Text - V3
 * Aggressive column realignment for multi-column PDF OCR
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

const STATE_CODES = Object.keys(STATES);

// Known cities from the OCR (for validation)
const KNOWN_CITIES = [
  'DENVER', 'HARRISBURG', 'SALT LAKE CITY', 'NEW YORK', 'LANCASTER', 'BOSTON', 'OSPREY',
  'DECATUR', 'NEW BRUNSWICK', 'SAN FRANCISCO', 'SEATTLE', 'RENNER', 'DALLAS', 'FARGO',
  'AKRON', 'NEW ORLEANS', 'ST. LOUIS', 'ST LOUIS', 'COLUMBIA', 'BURLINGTON', 'DUBLIN',
  'MILWAUKEE', 'AUSTIN', 'ORLANDO', 'OXFORD', 'FT WAYNE', 'FORT WAYNE', 'MADISON', 'PAOLI',
  'LOS ANGELES', 'ATLANTA', 'BALTIMORE', 'CLAYTON', 'LITTLE ROCK', 'JACKSON', 'CHICAGO',
  'RICE LAKE', 'INDIANAPOLIS', 'WASHINGTON', 'DETROIT', 'LAS VEGAS', 'SPRINGFIELD',
  'RICHMOND', 'HANOVER', 'EDMOND', 'BETHESDA', 'DETROIT LAKES', 'GRIMES', 'MISSOULA',
  'PORTLAND', 'WAYZATA', 'MINNEAPOLIS', 'DOVER', 'COLUMBUS', 'LOUISVILLE', 'LONGMONT',
  'FORT WORTH', 'CHARLES TOWN', 'NASHVILLE', 'MENDENHALL', 'ABINGDON', 'PHOENIX',
  'PITTSBURGH', 'SAN JUAN', 'DURANT', 'PHILADELPHIA', 'CHATTANOOGA', 'FOREST CITY',
  'DURHAM', 'CHARLESTON', 'ARKADELPHIA', 'GREENVILLE', 'SAN ANTONIO', 'KANSAS CITY',
  'SANTA MONICA', 'ATMORE', 'HUNT VALLEY', 'MERCEDES', 'SAN JOSE', 'WELLESLEY', 'LOWELL',
  'WATERLOO', 'CARLSBAD', 'RALEIGH', 'ALAMO', 'ARLINGTON', 'SAVANNAH', 'BRUNSWICK',
  'ROCK ISLAND', 'FRESNO', 'ADA', 'CINCINNATI', 'LANSING', 'SAN DIEGO', 'KNOXVILLE'
];

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
  const processedLines = new Set<number>();

  // PASS 1: Extract complete inline entries
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const amountMatch = line.match(/\$(\d{1,3}(?:,\d{3})+)/);
    if (!amountMatch) continue;

    const amount = parseInt(amountMatch[1].replace(/,/g, ''));
    if (amount < 20000000 || amount > 100000000) continue;

    // Find state code
    let stateCode: string | null = null;
    let statePos = -1;

    for (const st of STATE_CODES) {
      const regex = new RegExp(`\\b${st}\\b(?=\\s+(NATIONAL|LOCAL|MULTI|STATEWIDE|\\$))`, 'i');
      const match = line.match(regex);
      if (match && match.index !== undefined) {
        stateCode = st;
        statePos = match.index;
        break;
      }
    }

    if (!stateCode || statePos < 5) continue;

    let serviceArea = 'NATIONAL';
    if (line.includes('LOCAL') && !line.includes('LOCALLY')) serviceArea = 'LOCAL';
    else if (line.includes('MULTI-STATE')) serviceArea = 'MULTI-STATE';
    else if (line.includes('STATEWIDE') || line.includes('TERRITORY')) serviceArea = 'STATEWIDE';

    const beforeState = line.substring(0, statePos).trim();
    const parts = beforeState.split(/\s+/);

    let cityParts: string[] = [];
    let allocateeParts: string[] = [];

    for (let j = parts.length - 1; j >= 0; j--) {
      const word = parts[j];
      if (cityParts.length < 2 && word.match(/^[A-Z.]+$/) &&
          !['LLC', 'INC', 'INC.', 'L.L.C.', 'LP', 'N.A.', 'CDC', 'CDE', 'FUND', 'FUND,'].includes(word)) {
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
      processedLines.add(i);
    }
  }

  console.log(`Pass 1 (inline entries): ${entries.length}`);

  // PASS 2: Extract split-column data
  // Identify the blocks based on content patterns

  const allocateeBlock: { line: number; text: string }[] = [];
  const cityStateBlock: { line: number; city: string; state: string }[] = [];
  const serviceAreaBlock: { line: number; area: string }[] = [];
  const amountBlock: { line: number; amount: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (processedLines.has(i)) continue;
    const line = lines[i];
    if (!line) continue;

    // Skip noise
    if (line.match(/^[0-9]+\s+THE NEW MARKETS/)) continue;
    if (line.match(/^THE NEW MARKETS TAX CREDIT/)) continue;
    if (line === 'TERRITORY-WIDE)') continue;

    // Standalone amounts
    if (line.match(/^\$\d{1,3}(,\d{3})+$/)) {
      const amt = parseInt(line.replace(/[$,]/g, ''));
      if (amt >= 20000000 && amt <= 100000000) {
        amountBlock.push({ line: i, amount: amt });
      }
      continue;
    }

    // Service areas (standalone)
    if (line.match(/^(NATIONAL|LOCAL|MULTI-STATE)$/)) {
      serviceAreaBlock.push({ line: i, area: line });
      continue;
    }
    if (line.match(/^STATEWIDE \(OR$/)) {
      serviceAreaBlock.push({ line: i, area: 'STATEWIDE' });
      continue;
    }

    // Cities with state codes (like "DENVER CO" or standalone cities)
    const cityStateMatch = line.match(/^([A-Z][A-Z\s.]+?)\s+([A-Z]{2})$/);
    if (cityStateMatch && STATE_CODES.includes(cityStateMatch[2])) {
      cityStateBlock.push({ line: i, city: cityStateMatch[1].trim(), state: cityStateMatch[2] });
      continue;
    }

    // Standalone cities (no state)
    if (line.match(/^[A-Z][A-Z\s.]+$/) && line.length < 20 &&
        !line.match(/^(NATIONAL|LOCAL|MULTI|STATEWIDE|TERRITORY|LLC|INC|FUND|CDC|CDE)/)) {
      // This might be a city - we'll try to match it later
      const cleanCity = line.replace(/\./g, '').trim();
      if (KNOWN_CITIES.some(kc => kc === cleanCity || kc.startsWith(cleanCity))) {
        cityStateBlock.push({ line: i, city: cleanCity, state: '' });
      }
      continue;
    }

    // Allocatee names (company names with typical suffixes or patterns)
    if (line.match(/(LLC|INC\.?|CORPORATION|FUND|CAPITAL|DEVELOPMENT|PARTNERS|CDE|CDC|L\.L\.C\.|N\.A\.|LP)$/i) ||
        line.match(/^(COLORADO|COMMONWEALTH|COMMUNITY|CORPORATION|CRAFT|DAKOTAS|DALLAS|DBL|DEVELOPMENT|EMPIRE|EMPOWERMENT|ENHANCED|ENTERPRISE|ESIC|EVERNORTH|FIFTH|FIRSTPATHWAY|FIVE|FLORIDA|FNB|FORT|FORWARD|FRENCH|GENESIS|GREENLINE|GULF|HABITAT|HARBOR|HEARTLAND|HEDC|HOPE|IFF|IMPACT|INDIANAPOLIS|INDUSTRIAL|INVEST|JUSTINE|LAS|LEGACY|LIBERTY|LOCAL|LOCUS|MASCOMA|MBS|METAFUND|MHIC|MID-CITY|MIDWEST|MONTANA|MUNISTRATEGIES|NATIONAL|NATIVE|NCALL|NEW|NONPROFIT|NYCR|OHIO|OLD|OWEESTA|PACESETTER|PARTNER|PARTNERS|PATHWAY|PB|PEOPLE|PETROS|PHOENIX|PITTSBURGH|POPULAR|PRESTAMOS|RAZA|REI|REINVESTMENT|RIVER|RURAL|SAN|SELF|SOUTH|SOUTHERN|SOUTHSIDE|ST\.|TD|TEXAS|THE|THREE|TRANSPECOS|TRAVOIS|TURNER|UB|URBAN|USBCDE)/i)) {
      allocateeBlock.push({ line: i, text: line });
      continue;
    }
  }

  console.log(`\nPass 2 block extraction:`);
  console.log(`  Allocatee fragments: ${allocateeBlock.length}`);
  console.log(`  City/State fragments: ${cityStateBlock.length}`);
  console.log(`  Service area fragments: ${serviceAreaBlock.length}`);
  console.log(`  Amount fragments: ${amountBlock.length}`);

  // PASS 3: Try to align blocks by line number proximity
  // The PDF columns should roughly align: each "row" was on the same page line

  // Sort all blocks by line number
  allocateeBlock.sort((a, b) => a.line - b.line);
  cityStateBlock.sort((a, b) => a.line - b.line);
  serviceAreaBlock.sort((a, b) => a.line - b.line);
  amountBlock.sort((a, b) => a.line - b.line);

  // Try sequential alignment (assumes columns were read in order)
  const minCount = Math.min(
    allocateeBlock.length,
    amountBlock.length
  );

  console.log(`\nPass 3: Attempting sequential alignment for ${minCount} entries...`);

  // Build aligned entries
  for (let i = 0; i < minCount; i++) {
    const allocatee = allocateeBlock[i]?.text || '';
    const cityState = cityStateBlock[i] || { city: '', state: '' };
    const area = serviceAreaBlock[i]?.area || 'NATIONAL';
    const amount = amountBlock[i]?.amount || 0;

    if (allocatee && amount > 0) {
      // Try to clean up allocatee name (may have continuation from previous line)
      let cleanAllocatee = allocatee;

      // Check if previous line was a continuation
      if (i > 0 && allocateeBlock[i-1]) {
        const prevLine = allocateeBlock[i-1].text;
        // If current starts lowercase or is a suffix, merge
        if (cleanAllocatee.match(/^(LLC|INC|CDC|FUND|CDE)$/)) {
          // Skip - this is a continuation, not a new entry
          continue;
        }
      }

      entries.push({
        allocatee: cleanAllocatee,
        city: cityState.city,
        state: cityState.state || 'XX', // Unknown state
        serviceArea: area,
        amount
      });
    }
  }

  console.log(`Pass 3 aligned entries: ${entries.length - entries.filter(e => e.state !== 'XX').length} (with unknown states)`);

  return entries;
}

function main() {
  const ocrPath = 'C:/tcredex.com/tracts/NMTC_OCR_Combined_Raw_Text.txt';

  console.log('Parsing:', ocrPath);
  console.log('');

  const entries = parseOCRText(ocrPath);

  // Dedupe by allocatee name (fuzzy)
  const seen = new Set<string>();
  const uniqueEntries = entries.filter(e => {
    const key = e.allocatee.toLowerCase().replace(/[^a-z]/g, '').substring(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\n========================================`);
  console.log(`Total unique entries: ${uniqueEntries.length}`);

  const total = uniqueEntries.reduce((sum, e) => sum + e.amount, 0);
  console.log(`Total allocation: $${(total / 1e9).toFixed(2)}B`);

  // Stats
  const withState = uniqueEntries.filter(e => e.state !== 'XX').length;
  const withCity = uniqueEntries.filter(e => e.city.length > 0).length;
  console.log(`  With state: ${withState}`);
  console.log(`  With city: ${withCity}`);

  // By service area
  const byArea: Record<string, number> = {};
  for (const e of uniqueEntries) {
    byArea[e.serviceArea] = (byArea[e.serviceArea] || 0) + 1;
  }
  console.log('\nBy Service Area:');
  for (const [area, count] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${area}: ${count}`);
  }

  // Sample
  console.log('\nSample entries (first 15):');
  uniqueEntries.slice(0, 15).forEach((e, i) => {
    const cityState = e.city ? `${e.city}, ${e.state}` : e.state;
    console.log(`${String(i + 1).padStart(2)}. ${e.allocatee.substring(0, 45).padEnd(45)} | ${cityState.padEnd(20)} | ${e.serviceArea.padEnd(12)} | $${(e.amount / 1e6)}M`);
  });

  // Write CSV
  const csvPath = 'C:/tcredex.com/tracts/NMTC_Allocations_V3.csv';
  const csvContent = [
    'ALLOCATEE,CITY,STATE,SERVICE_AREA,AMOUNT',
    ...uniqueEntries.map(e => `"${e.allocatee}","${e.city}","${e.state}","${e.serviceArea}",${e.amount}`)
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent);
  console.log(`\nCSV written to: ${csvPath}`);

  // Summary
  console.log(`\n========================================`);
  console.log(`Target: ~141 CDEs, ~$9.91B`);
  console.log(`Parsed: ${uniqueEntries.length} CDEs, $${(total / 1e9).toFixed(2)}B`);
  console.log(`Gap: ${141 - uniqueEntries.length} entries, $${((9.91e9 - total) / 1e9).toFixed(2)}B`);
}

main();
