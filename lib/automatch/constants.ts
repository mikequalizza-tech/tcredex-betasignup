/**
 * Shared AutoMatch Constants
 *
 * Single source of truth for constants used across frontend AutoMatch engines.
 * Backend (nest-automatch) maintains its own copy — changes here must be synced manually.
 */

export const TOTAL_CRITERIA = 15;

// CDFI Fund Underserved/Targeted States by NMTC Allocation Round
// These states aren't receiving population-proportional share of NMTC
// Deals in these states get bonus points when matched with CDEs allocated from that year
export const UNDERSERVED_STATES_BY_YEAR: Record<number, string[]> = {
  2025: ['AZ', 'CA', 'CO', 'CT', 'FL', 'KS', 'NC', 'TX', 'VA', 'WV', 'PR'],
  2024: ['AZ', 'CA', 'CO', 'CT', 'FL', 'KS', 'NC', 'TX', 'VA', 'WV', 'PR'],
  2023: ['AZ', 'CA', 'CO', 'FL', 'KS', 'NV', 'NC', 'TX', 'VA', 'WV', 'PR'],
  2022: ['AZ', 'CA', 'CO', 'FL', 'NV', 'NC', 'TN', 'TX', 'VA', 'WV', 'VI', 'AS', 'GU', 'MP'],
};

// State abbreviation <-> full name mappings
export const ABBREV_TO_NAME: Record<string, string> = {
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

export const NAME_TO_ABBREV: Record<string, string> = Object.fromEntries(
  Object.entries(ABBREV_TO_NAME).map(([abbrev, name]) => [name, abbrev])
);

// Match strength thresholds (score = points/15 × 100%)
export const MATCH_THRESHOLDS = {
  excellent: 80,
  good: 65,
  fair: 50,
  weak: 0,
} as const;

// Shared helper: normalize text for comparison (replace underscores/hyphens with spaces)
export function normalizeText(value?: string | null): string {
  if (!value) return '';
  return value.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Shared helper: resolve state abbreviation and full name
export function getStateInfo(state: string): { abbrev: string; name: string } | null {
  const upper = state.toUpperCase().trim();
  const lower = state.toLowerCase().trim();
  if (ABBREV_TO_NAME[upper]) return { abbrev: upper, name: ABBREV_TO_NAME[upper] };
  if (NAME_TO_ABBREV[lower]) return { abbrev: NAME_TO_ABBREV[lower], name: lower };
  return null;
}
