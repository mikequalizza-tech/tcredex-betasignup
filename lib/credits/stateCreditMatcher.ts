/**
 * State Credit Matcher
 * Queries state_credit_matrix and returns eligible state-level credits
 * based on project state and selected programs.
 */

import { createClient } from "@supabase/supabase-js";

// =============================================================================
// TYPES
// =============================================================================

export type CreditProgram = "NMTC" | "HTC" | "LIHTC" | "OZ" | "Brownfield";

export interface ProjectInput {
  state: string; // 2-letter state code or full name
  programs: CreditProgram[]; // Selected federal programs
  totalProjectCost?: number;
  qreAmount?: number; // Qualified Rehabilitation Expenditures (HTC)
}

export interface StateCreditMatch {
  program: string; // e.g., "MO State HTC"
  state: string;
  creditType: CreditProgram;
  rate: number | null; // Credit rate percentage
  maxCredit?: number; // Cap if applicable
  transferable: boolean;
  refundable: boolean;
  stackableWithNMTC: boolean;
  stackableWithFederalHTC: boolean;
  stackableWithLIHTC: boolean;
  notes?: string;
  url?: string;
  tags?: string[];
  expirationDate?: string; // Program sunset
}

interface RawCreditRow {
  state_name: string;
  // State NMTC
  state_nmtc?: boolean;
  state_nmtc_program_name?: string;
  state_nmtc_admin_agency?: string;
  state_nmtc_credit_structure?: string;
  state_nmtc_transferable?: boolean;
  state_nmtc_notes?: string;
  // State LIHTC
  state_lihtc?: boolean;
  state_lihtc_program_size?: string;
  state_lihtc_credit_pct_years?: string;
  state_lihtc_refundable_transferable?: string;
  state_lihtc_admin_agency?: string;
  // State HTC
  state_htc?: boolean;
  state_htc_credit_pct?: string;
  state_htc_annual_cap?: string;
  state_htc_transferable?: boolean;
  state_htc_refundable?: boolean;
  state_htc_admin_agency?: string;
  // State OZ
  oz_federal_conformity?: boolean;
  state_oz_program?: boolean;
  state_oz_program_type?: string;
  state_oz_admin_agency?: string;
  // Brownfield
  brownfield_credit?: boolean;
  brownfield_credit_type?: string;
  brownfield_credit_amount?: string;
  brownfield_transferable?: boolean;
  brownfield_refundable?: boolean;
  brownfield_admin_agency?: string;
  brownfield_notes?: string;
  // Stacking
  stacking_notes?: string;
  [key: string]: unknown;
}

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }

  return createClient(url, key);
};

// =============================================================================
// MAIN MATCHER FUNCTION
// =============================================================================

export async function matchEligibleCredits(
  project: ProjectInput,
): Promise<StateCreditMatch[]> {
  const supabase = getSupabaseClient();
  const { state, programs } = project;

  if (!state || programs.length === 0) {
    return [];
  }

  // Convert state abbreviation to full state name if needed
  const stateName = getStateNameFromAbbrev(state);
  const stateUpper = state.toUpperCase();

  // Query all rows first, then filter client-side for exact match
  // This is necessary because Supabase ilike with % wildcards can match incorrectly
  // (e.g., "AL" matches both "Alabama" and "California")
  const { data, error } = await supabase
    .from("state_tax_credit_programs_staging")
    .select("*");

  if (error) {
    console.error(
      "[matchEligibleCredits] Supabase query failed:",
      error.message,
    );
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Client-side filtering to ensure exact state match
  // Filter out any rows that don't match the exact state name or abbreviation
  const filteredData = (data as RawCreditRow[]).filter((row) => {
    if (!row.state_name) return false;

    const rowStateName = row.state_name.trim();
    const rowStateLower = rowStateName.toLowerCase();
    const targetStateName = stateName.toLowerCase();
    const targetStateAbbrev = stateUpper;

    // Exact match on full state name (case-insensitive)
    if (rowStateLower === targetStateName) {
      return true;
    }

    // Match by abbreviation: get the abbreviation for the row's state name
    // and compare with the target abbreviation
    const rowAbbrev = getStateAbbrev(rowStateName);
    if (rowAbbrev === targetStateAbbrev && targetStateAbbrev.length === 2) {
      return true;
    }

    return false;
  });

  if (filteredData.length === 0) {
    return [];
  }

  const matches: StateCreditMatch[] = [];

  for (const row of filteredData) {
    // Check each program type using correct column names from state_tax_credit_programs_staging
    if (programs.includes("HTC") && row.state_htc) {
      matches.push(buildCreditMatch(row, "HTC", project));
    }

    if (programs.includes("NMTC") && row.state_nmtc) {
      matches.push(buildCreditMatch(row, "NMTC", project));
    }

    if (programs.includes("Brownfield") && row.brownfield_credit) {
      matches.push(buildCreditMatch(row, "Brownfield", project));
    }

    if (programs.includes("LIHTC") && row.state_lihtc) {
      matches.push(buildCreditMatch(row, "LIHTC", project));
    }

    if (programs.includes("OZ") && row.state_oz_program) {
      matches.push(buildCreditMatch(row, "OZ", project));
    }
  }

  return matches;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildCreditMatch(
  row: RawCreditRow,
  creditType: CreditProgram,
  project: ProjectInput,
): StateCreditMatch {
  // Get state abbreviation from state name (first 2 chars of each word)
  const stateAbbrev = getStateAbbrev(row.state_name);

  return {
    program: `${stateAbbrev} State ${creditType}`,
    state: row.state_name || stateAbbrev,
    creditType,
    rate: getRate(row, creditType),
    maxCredit: calculateMaxCredit(row, creditType, project),
    transferable: getTransferability(row, creditType),
    refundable: getRefundability(row, creditType),
    stackableWithNMTC: checkStackability(row.stacking_notes, "nmtc"),
    stackableWithFederalHTC: checkStackability(row.stacking_notes, "htc"),
    stackableWithLIHTC: checkStackability(row.stacking_notes, "lihtc"),
    notes: row.stacking_notes || undefined,
    url: getUrl(row, creditType),
  };
}

// State name to abbreviation mapping
const STATE_ABBREVS: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
  "Puerto Rico": "PR",
};

function getStateAbbrev(stateName?: string): string {
  if (!stateName) return "XX";
  return STATE_ABBREVS[stateName] || stateName.slice(0, 2).toUpperCase();
}

// Reverse mapping: abbreviation to full state name
const STATE_ABBREV_TO_NAME: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
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
  DC: "District of Columbia",
  PR: "Puerto Rico",
};

function getStateNameFromAbbrev(stateInput: string): string {
  // If it's already a full state name, return it
  if (STATE_ABBREVS[stateInput]) {
    return stateInput;
  }

  // If it's an abbreviation, convert to full name
  const upperInput = stateInput.toUpperCase();
  if (STATE_ABBREV_TO_NAME[upperInput]) {
    return STATE_ABBREV_TO_NAME[upperInput];
  }

  // Fallback: return input as-is (might be a partial name)
  return stateInput;
}

function getRate(row: RawCreditRow, creditType: CreditProgram): number | null {
  switch (creditType) {
    case "HTC":
      return parseRateFromString(row.state_htc_credit_pct);
    case "NMTC":
      return parseRateFromString(row.state_nmtc_credit_structure);
    case "Brownfield":
      return parseRateFromString(row.brownfield_credit_amount);
    case "LIHTC":
      return parseRateFromString(row.state_lihtc_credit_pct_years);
    default:
      return null;
  }
}

function parseRateFromString(value?: string): number | null {
  if (!value) return null;
  const match = value.match(/(\d{1,3})%/);
  return match ? parseInt(match[1], 10) : null;
}

function getTransferability(
  row: RawCreditRow,
  creditType: CreditProgram,
): boolean {
  switch (creditType) {
    case "HTC":
      return row.state_htc_transferable === true;
    case "NMTC":
      return row.state_nmtc_transferable === true;
    case "Brownfield":
      return row.brownfield_transferable === true;
    case "LIHTC":
      // Parse from state_lihtc_refundable_transferable field
      return (
        row.state_lihtc_refundable_transferable
          ?.toLowerCase()
          .includes("transferable") ?? false
      );
    default:
      return false;
  }
}

function getRefundability(
  row: RawCreditRow,
  creditType: CreditProgram,
): boolean {
  switch (creditType) {
    case "HTC":
      return row.state_htc_refundable === true;
    case "NMTC":
      // NMTC doesn't have a refundable column in staging table
      return false;
    case "Brownfield":
      return row.brownfield_refundable === true;
    case "LIHTC":
      // Parse from state_lihtc_refundable_transferable field
      return (
        row.state_lihtc_refundable_transferable
          ?.toLowerCase()
          .includes("refundable") ?? false
      );
    default:
      return false;
  }
}

function getUrl(
  row: RawCreditRow,
  creditType: CreditProgram,
): string | undefined {
  let notesField: string | undefined;

  switch (creditType) {
    case "HTC":
      notesField = row.state_htc_admin_agency;
      break;
    case "NMTC":
      notesField = row.state_nmtc_notes;
      break;
    case "Brownfield":
      notesField = row.brownfield_notes;
      break;
    case "LIHTC":
      notesField = row.state_lihtc_admin_agency;
      break;
    case "OZ":
      notesField = row.state_oz_admin_agency;
      break;
  }

  if (!notesField) return undefined;

  const match = notesField.match(/https?:\/\/[^\s)]+/);
  return match ? match[0] : undefined;
}

function checkStackability(
  notes: string | undefined,
  program: string,
): boolean {
  if (!notes) return false;
  return notes.toLowerCase().includes(program.toLowerCase());
}

function calculateMaxCredit(
  row: RawCreditRow,
  creditType: CreditProgram,
  project: ProjectInput,
): number | undefined {
  const rate = getRate(row, creditType);
  if (!rate) return undefined;

  // For HTC, calculate based on QRE
  if (creditType === "HTC" && project.qreAmount) {
    return Math.round(project.qreAmount * (rate / 100));
  }

  // For other credits, calculate based on total project cost
  if (project.totalProjectCost) {
    return Math.round(project.totalProjectCost * (rate / 100));
  }

  return undefined;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get all available state credits for a state (regardless of programs)
 */
export async function getStateCredits(
  state: string,
): Promise<StateCreditMatch[]> {
  return matchEligibleCredits({
    state,
    programs: ["NMTC", "HTC", "LIHTC", "OZ", "Brownfield"],
  });
}

/**
 * Check if a state has any tax credit programs
 */
export async function hasStateCredits(state: string): Promise<boolean> {
  const credits = await getStateCredits(state);
  return credits.length > 0;
}

/**
 * Get stackable credits for a specific combination
 */
export async function getStackableCredits(
  state: string,
  primaryProgram: CreditProgram,
): Promise<StateCreditMatch[]> {
  const allCredits = await getStateCredits(state);

  return allCredits.filter((credit) => {
    if (primaryProgram === "NMTC") return credit.stackableWithNMTC;
    if (primaryProgram === "HTC") return credit.stackableWithFederalHTC;
    if (primaryProgram === "LIHTC") return credit.stackableWithLIHTC;
    return true;
  });
}
