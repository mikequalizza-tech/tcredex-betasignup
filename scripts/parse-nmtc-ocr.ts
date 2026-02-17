/**
 * Parse NMTC OCR Combined Raw Text
 * Extracts CDE allocation data from multi-column OCR output
 */

import * as fs from 'fs';
import * as path from 'path';

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','PR','RI','SC','SD','TN','TX',
  'UT','VT','VA','WA','WV','WI','WY'
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
  const lines = content.split('\n');

  const entries: CDEEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty, headers, footers
    if (!line) continue;
    if (line.includes('ALLOCATEE') || line.includes('SERVICE AREA')) continue;
    if (line.includes('NEW MARKETS TAX CREDIT PROGRAM')) continue;
    if (line.includes('PHOTO CREDITS') || line.includes('ADDITIONAL RESOURCES')) continue;
    if (line.includes('www.cdfifund.gov')) continue;

    // Look for lines with dollar amounts
    const amountMatch = line.match(/\$(\d{1,3}(?:,\d{3})+)/);
    if (!amountMatch) continue;

    const amount = parseInt(amountMatch[1].replace(/,/g, ''));
    if (amount < 20000000 || amount > 100000000) continue;

    // Find state code in line
    let stateCode: string | null = null;
    let statePos = -1;

    for (const st of STATES) {
      // Match state as whole word, case insensitive for 'co' edge case
      const regex = new RegExp(`\\b${st}\\b`, 'i');
      const match = line.match(regex);
      if (match && match.index !== undefined) {
        // Make sure it's actually a state, not part of word like "COLORADO"
        const afterState = line.substring(match.index + st.length);
        // State should be followed by space or service area keyword
        if (afterState.match(/^\s+(NATIONAL|LOCAL|MULTI|STATEWIDE|\$)/i)) {
          stateCode = st.toUpperCase();
          statePos = match.index;
          break;
        }
      }
    }

    if (!stateCode || statePos < 5) continue;

    // Extract service area
    let serviceArea = 'NATIONAL';
    if (line.includes('LOCAL')) serviceArea = 'LOCAL';
    else if (line.includes('MULTI-STATE')) serviceArea = 'MULTI-STATE';
    else if (line.includes('STATEWIDE') || line.includes('TERRITORY-WIDE')) serviceArea = 'STATEWIDE';

    // Extract name and city from before state
    const beforeState = line.substring(0, statePos).trim();

    // Try to find city - usually last 1-2 uppercase words before state
    const words = beforeState.split(/\s+/);
    let cityWords: string[] = [];
    let nameWords: string[] = [];

    // Work backwards to find city
    let foundCity = false;
    for (let j = words.length - 1; j >= 0; j--) {
      const word = words[j];
      // City names are usually all caps, 2+ chars
      if (!foundCity && word.match(/^[A-Z]{2,}\.?$/)) {
        cityWords.unshift(word);
        // Most cities are 1-2 words
        if (cityWords.length >= 2) foundCity = true;
      } else {
        nameWords = words.slice(0, j + 1);
        break;
      }
    }

    const allocatee = nameWords.join(' ').replace(/,?\s*$/, '');
    const city = cityWords.join(' ').replace(/\.$/, '');

    if (allocatee.length > 3) {
      entries.push({
        allocatee,
        city,
        state: stateCode,
        serviceArea,
        amount
      });
    }
  }

  return entries;
}

function main() {
  const ocrPath = 'C:/tcredex.com/tracts/NMTC_OCR_Combined_Raw_Text.txt';

  console.log('Parsing:', ocrPath);
  const entries = parseOCRText(ocrPath);

  console.log(`\nParsed ${entries.length} CDE entries`);

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  console.log(`Total allocation: $${(total / 1e9).toFixed(2)}B`);

  // Group by service area
  const byArea: Record<string, number> = {};
  for (const e of entries) {
    byArea[e.serviceArea] = (byArea[e.serviceArea] || 0) + 1;
  }
  console.log('\nBy Service Area:');
  for (const [area, count] of Object.entries(byArea)) {
    console.log(`  ${area}: ${count}`);
  }

  // Show first 10 entries
  console.log('\nFirst 10 entries:');
  entries.slice(0, 10).forEach((e, i) => {
    console.log(`${i + 1}. ${e.allocatee} | ${e.city}, ${e.state} | ${e.serviceArea} | $${(e.amount / 1e6)}M`);
  });

  // Write to CSV
  const csvPath = 'C:/tcredex.com/tracts/NMTC_Allocations_Parsed.csv';
  const csvContent = [
    'ALLOCATEE,CITY,STATE,SERVICE_AREA,AMOUNT',
    ...entries.map(e => `"${e.allocatee}","${e.city}","${e.state}","${e.serviceArea}",${e.amount}`)
  ].join('\n');

  fs.writeFileSync(csvPath, csvContent);
  console.log(`\nCSV written to: ${csvPath}`);
}

main();
