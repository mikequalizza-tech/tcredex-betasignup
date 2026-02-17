import logger from "@/lib/utils/logger";

/**
 * NMTC Census Tract Eligibility Data
 *
 * Data source: CDFI Fund 2016-2020 ACS Low-Income Community Data
 * Total eligible tracts: 35,167 out of 85,395 nationwide
 */

// State FIPS to name mapping
export const STATE_FIPS: Record<string, string> = {
  "01": "Alabama",
  "02": "Alaska",
  "04": "Arizona",
  "05": "Arkansas",
  "06": "California",
  "08": "Colorado",
  "09": "Connecticut",
  "10": "Delaware",
  "11": "District of Columbia",
  "12": "Florida",
  "13": "Georgia",
  "15": "Hawaii",
  "16": "Idaho",
  "17": "Illinois",
  "18": "Indiana",
  "19": "Iowa",
  "20": "Kansas",
  "21": "Kentucky",
  "22": "Louisiana",
  "23": "Maine",
  "24": "Maryland",
  "25": "Massachusetts",
  "26": "Michigan",
  "27": "Minnesota",
  "28": "Mississippi",
  "29": "Missouri",
  "30": "Montana",
  "31": "Nebraska",
  "32": "Nevada",
  "33": "New Hampshire",
  "34": "New Jersey",
  "35": "New Mexico",
  "36": "New York",
  "37": "North Carolina",
  "38": "North Dakota",
  "39": "Ohio",
  "40": "Oklahoma",
  "41": "Oregon",
  "42": "Pennsylvania",
  "44": "Rhode Island",
  "45": "South Carolina",
  "46": "South Dakota",
  "47": "Tennessee",
  "48": "Texas",
  "49": "Utah",
  "50": "Vermont",
  "51": "Virginia",
  "53": "Washington",
  "54": "West Virginia",
  "55": "Wisconsin",
  "56": "Wyoming",
  "72": "Puerto Rico",
};

// State abbreviation to name mapping
export const STATE_ABBR_TO_NAME: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  PR: "Puerto Rico",
};

// Classification mapping
const CLASSIFICATION_MAP: Record<string, string> = {
  N: "Neither",
  S: "Sellable",
  R: "Refundable",
  B: "Both",
};

// Parsed tract data interface
export interface TractEligibilityData {
  geoid: string;
  state: string;
  stateAbbr: string;
  county: string;
  poverty: number;
  income: number;
  unemployment: number;
  povertyQualifies: boolean;
  incomeQualifies: boolean;
  eligible: boolean;
  severelyDistressed: boolean;
  classification: string;
}

// Raw data format: [stateAbbr, county, poverty, income, unemployment, povertyQualifies, incomeQualifies, classificationLetter]
type RawTractData = [
  string,
  string,
  number,
  number,
  number,
  number,
  number,
  string,
];

// In-memory cache
let tractDataCache: Map<string, RawTractData> | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Get the base URL for fetching static files
 */
function getBaseUrl(): string {
  // In server-side rendering, use the VERCEL_URL or default to localhost
  if (typeof window === "undefined") {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      return `https://${vercelUrl}`;
    }
    // Check for custom domain
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      return siteUrl;
    }
    return "http://localhost:3000";
  }
  // In browser, use relative URL
  return "";
}

/**
 * Load tract data from JSON file via HTTP (cached in memory)
 */
async function loadTractData(): Promise<Map<string, RawTractData>> {
  if (tractDataCache) {
    return tractDataCache;
  }

  if (loadPromise) {
    await loadPromise;
    return tractDataCache!;
  }

  loadPromise = (async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/data/tract_eligible.json`);

      if (!response.ok) {
        logger.warn(
          `Failed to load tract data: ${response.status}`,
          null,
          "TractData",
        );
        tractDataCache = new Map();
        return;
      }

      const parsed = (await response.json()) as Record<string, RawTractData>;
      tractDataCache = new Map(Object.entries(parsed));

      logger.info(
        `Loaded ${tractDataCache.size} eligible tracts`,
        null,
        "TractData",
      );
    } catch (error) {
      logger.error("Error loading tract data", error, "TractData");
      tractDataCache = new Map();
    }
  })();

  await loadPromise;
  return tractDataCache!;
}

/**
 * Parse raw tract data into structured format
 */
function parseRawTract(geoid: string, raw: RawTractData): TractEligibilityData {
  const [
    stateAbbr,
    county,
    poverty,
    income,
    unemployment,
    povertyQ,
    incomeQ,
    classLetter,
  ] = raw;

  const povertyQualifies = povertyQ === 1;
  const incomeQualifies = incomeQ === 1;

  return {
    geoid,
    state: STATE_ABBR_TO_NAME[stateAbbr] || stateAbbr,
    stateAbbr,
    county,
    poverty,
    income,
    unemployment,
    povertyQualifies,
    incomeQualifies,
    eligible: true, // All tracts in this file are eligible
    severelyDistressed:
      poverty >= 30 ||
      (povertyQualifies && incomeQualifies && unemployment >= 10),
    classification: CLASSIFICATION_MAP[classLetter] || "Neither",
  };
}

/**
 * Look up a single tract by GEOID
 */
export async function lookupTract(
  geoid: string,
): Promise<TractEligibilityData | null> {
  const data = await loadTractData();

  // Normalize GEOID (pad to 11 chars)
  const normalizedGeoid = geoid.padStart(11, "0");

  const raw = data.get(normalizedGeoid);
  if (!raw) {
    return null; // Tract not in eligible list (either doesn't exist or not eligible)
  }

  return parseRawTract(normalizedGeoid, raw);
}

/**
 * Look up multiple tracts by GEOID
 */
export async function lookupTracts(
  geoids: string[],
): Promise<Map<string, TractEligibilityData>> {
  const data = await loadTractData();
  const results = new Map<string, TractEligibilityData>();

  for (const geoid of geoids) {
    const normalizedGeoid = geoid.padStart(11, "0");
    const raw = data.get(normalizedGeoid);
    if (raw) {
      results.set(normalizedGeoid, parseRawTract(normalizedGeoid, raw));
    }
  }

  return results;
}

/**
 * Get all tracts for a state (by state FIPS code or abbreviation)
 */
export async function getTractsByState(
  stateCode: string,
): Promise<TractEligibilityData[]> {
  const data = await loadTractData();
  const results: TractEligibilityData[] = [];

  // Determine state filter
  let stateAbbr: string;
  if (stateCode.length === 2 && /^\d{2}$/.test(stateCode)) {
    // FIPS code - convert to abbreviation
    const stateName = STATE_FIPS[stateCode];
    stateAbbr =
      Object.entries(STATE_ABBR_TO_NAME).find(
        ([, name]) => name === stateName,
      )?.[0] || "";
  } else {
    stateAbbr = stateCode.toUpperCase();
  }

  if (!stateAbbr) return results;

  for (const [geoid, raw] of data) {
    if (raw[0] === stateAbbr) {
      results.push(parseRawTract(geoid, raw));
    }
  }

  return results;
}

/**
 * Get all tracts for a county
 */
export async function getTractsByCounty(
  stateAbbr: string,
  countyName: string,
): Promise<TractEligibilityData[]> {
  const data = await loadTractData();
  const results: TractEligibilityData[] = [];

  const normalizedCounty = countyName.toLowerCase().trim();

  for (const [geoid, raw] of data) {
    if (
      raw[0] === stateAbbr.toUpperCase() &&
      raw[1].toLowerCase().includes(normalizedCounty)
    ) {
      results.push(parseRawTract(geoid, raw));
    }
  }

  return results;
}

/**
 * Search tracts by criteria
 */
export async function searchTracts(criteria: {
  minPoverty?: number;
  maxPoverty?: number;
  minIncome?: number;
  maxIncome?: number;
  severelyDistressed?: boolean;
  classification?: string;
  limit?: number;
}): Promise<TractEligibilityData[]> {
  const data = await loadTractData();
  const results: TractEligibilityData[] = [];
  const limit = criteria.limit || 100;

  for (const [geoid, raw] of data) {
    const tract = parseRawTract(geoid, raw);

    if (
      criteria.minPoverty !== undefined &&
      tract.poverty < criteria.minPoverty
    )
      continue;
    if (
      criteria.maxPoverty !== undefined &&
      tract.poverty > criteria.maxPoverty
    )
      continue;
    if (criteria.minIncome !== undefined && tract.income < criteria.minIncome)
      continue;
    if (criteria.maxIncome !== undefined && tract.income > criteria.maxIncome)
      continue;
    if (
      criteria.severelyDistressed !== undefined &&
      tract.severelyDistressed !== criteria.severelyDistressed
    )
      continue;
    if (
      criteria.classification &&
      tract.classification !== criteria.classification
    )
      continue;

    results.push(tract);
    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Get statistics for loaded data
 */
export async function getTractStats(): Promise<{
  totalEligible: number;
  byState: Record<string, number>;
  byClassification: Record<string, number>;
  severelyDistressed: number;
}> {
  const data = await loadTractData();

  const byState: Record<string, number> = {};
  const byClassification: Record<string, number> = {};
  let severelyDistressed = 0;

  for (const [, raw] of data) {
    const [stateAbbr, , poverty, , , povertyQ, incomeQ, classLetter] = raw;

    byState[stateAbbr] = (byState[stateAbbr] || 0) + 1;

    const classification = CLASSIFICATION_MAP[classLetter] || "Neither";
    byClassification[classification] =
      (byClassification[classification] || 0) + 1;

    if (poverty >= 30 || (povertyQ === 1 && incomeQ === 1)) {
      severelyDistressed++;
    }
  }

  return {
    totalEligible: data.size,
    byState,
    byClassification,
    severelyDistressed,
  };
}

/**
 * Check if data is loaded
 */
export function isDataLoaded(): boolean {
  return tractDataCache !== null && tractDataCache.size > 0;
}

/**
 * Preload data (call on server startup)
 */
export async function preloadTractData(): Promise<void> {
  await loadTractData();
}
