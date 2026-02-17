/**
 * Load National Register of Historic Places (NRHP) Data from XLSX
 * ================================================================
 * Loads 116K+ historic buildings from Excel into historic_buildings table
 * for Federal HTC eligibility lookups.
 *
 * Usage: npx tsx scripts/load-historic-buildings-xlsx.ts
 *
 * Source: national-register-everything_20250624.xlsx
 */

import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
import * as XLSX from "xlsx";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const STATE_ABBREVS: Record<string, string> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
  "DISTRICT OF COLUMBIA": "DC",
  "PUERTO RICO": "PR",
  GUAM: "GU",
  "VIRGIN ISLANDS": "VI",
  "AMERICAN SAMOA": "AS",
  "NORTHERN MARIANA ISLANDS": "MP",
};

interface HistoricBuilding {
  ref_number?: string;
  prefix?: string;
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
  significance_international: boolean;
  significance_local: boolean;
  significance_national: boolean;
  significance_not_indicated: boolean;
  significance_state: boolean;
  listed_date?: string;
  multiple_property_listing?: string;
  nhl_designated_date?: string;
  other_names?: string;
  park_name?: string;
  periods_of_significance?: string;
  property_id?: string;
  is_htc_eligible: boolean;
  is_nhl: boolean;
}

function formatDate(value: unknown): string | undefined {
  if (!value) return undefined;

  // Handle Excel date serial numbers
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, "0");
      const day = String(date.d).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  // Handle string dates
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }

  return undefined;
}

function parseBool(value: unknown): boolean {
  if (value === true || value === "TRUE" || value === "True" || value === 1)
    return true;
  return false;
}

function cleanString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  return str && str !== "NaN" && str !== "nan" ? str : undefined;
}

async function loadHistoricBuildings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Path to XLSX
  const xlsxPath = path.resolve(
    "C:/tcredex.com/tracts/national-register-everything_20250624.xlsx",
  );

  console.log(`Reading XLSX from: ${xlsxPath}`);
  const workbook = XLSX.readFile(xlsxPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON with header row
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<
    string,
    unknown
  >[];

  console.log(`Total rows: ${rows.length}`);

  // Check for --skip-delete flag
  const skipDelete = process.argv.includes("--skip-delete");

  if (!skipDelete) {
    // First, clear existing data
    console.log("Clearing existing historic_buildings data...");

    // Delete in batches to avoid timeout
    let deletedTotal = 0;
    let hasMore = true;
    while (hasMore) {
      const { data: toDelete } = await supabase
        .from("historic_buildings")
        .select("id")
        .limit(5000);

      if (!toDelete || toDelete.length === 0) {
        hasMore = false;
      } else {
        const ids = toDelete.map((r) => r.id);
        const { error: deleteError } = await supabase
          .from("historic_buildings")
          .delete()
          .in("id", ids);

        if (deleteError) {
          console.error("Error deleting batch:", deleteError);
          break;
        }
        deletedTotal += ids.length;
        console.log(`Deleted ${deletedTotal} records...`);
      }
    }
    console.log(`Cleared ${deletedTotal} existing records.`);
  } else {
    console.log("Skipping delete phase (--skip-delete flag)");
  }

  // Process in batches
  const BATCH_SIZE = 500;
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const records: Partial<HistoricBuilding>[] = [];

    for (const row of batch) {
      try {
        const propertyName = cleanString(row["Property Name"]);
        if (!propertyName) continue;

        const state = cleanString(row["State"]);
        const stateUpper = state?.toUpperCase() || "";
        const stateAbbr = STATE_ABBREVS[stateUpper] || undefined;

        // Note: Column has trailing space in XLSX
        const city = cleanString(row["City "]) || cleanString(row["City"]);
        const streetAddress = cleanString(row["Street & Number"]);
        const county = cleanString(row["County"]);

        // Build full address
        const addressParts = [streetAddress, city, state].filter(Boolean);
        const fullAddress =
          addressParts.length > 0 ? addressParts.join(", ") : undefined;

        const status = cleanString(row["Status"]);
        const nhlDate = formatDate(row["NHL Designated Date"]);

        // HTC eligible if status is "Listed" or "LISTED"
        const isHtcEligible = status?.toUpperCase() === "LISTED";
        const isNHL = !!nhlDate;

        records.push({
          ref_number: cleanString(row["Ref#"]),
          prefix: cleanString(row["Prefix"]),
          property_name: propertyName,
          state: state,
          state_abbr: stateAbbr,
          county: county,
          city: city,
          street_address: streetAddress,
          address: fullAddress,
          status: status,
          request_type: cleanString(row["Request Type"]),
          restricted_address: parseBool(row["Restricted Address"]),
          acreage:
            typeof row["Acreage of Property"] === "number"
              ? row["Acreage of Property"]
              : undefined,
          area_of_significance: cleanString(row["Area of Significance"]),
          category: cleanString(row["Category of Property"]),
          external_link: cleanString(row["External Link"]),
          significance_international: parseBool(
            row["Level of Significance - International"],
          ),
          significance_local: parseBool(row["Level of Significance - Local"]),
          significance_national: parseBool(
            row["Level of Significance - National"],
          ),
          significance_not_indicated: parseBool(
            row["Level of Significance - Not Indicated"],
          ),
          significance_state: parseBool(row["Level of Significance - State"]),
          listed_date: formatDate(row["Listed Date"]),
          multiple_property_listing: cleanString(
            row["Name of Multiple Property Listing"],
          ),
          nhl_designated_date: nhlDate,
          other_names: cleanString(row["Other Names"]),
          park_name: cleanString(row["Park Name"]),
          periods_of_significance: cleanString(row["Periods of Significance"]),
          property_id: cleanString(row["Property ID"]),
          is_htc_eligible: isHtcEligible,
          is_nhl: isNHL,
        });
      } catch (err) {
        errors++;
      }
    }

    if (records.length > 0) {
      // Dedupe records within this batch by ref_number (keep last occurrence)
      const deduped = new Map<string, Partial<HistoricBuilding>>();
      for (const record of records) {
        const key = record.ref_number || `no-ref-${Math.random()}`;
        deduped.set(key, record);
      }
      const uniqueRecords = Array.from(deduped.values());

      // Use upsert to handle duplicates across batches
      const { error } = await supabase
        .from("historic_buildings")
        .upsert(uniqueRecords, { onConflict: "ref_number" });

      if (error) {
        console.error(`Batch ${i} error:`, error.message);
        // Try one by one with upsert
        let batchProcessed = 0;
        for (const record of uniqueRecords) {
          const { error: singleError } = await supabase
            .from("historic_buildings")
            .upsert(record, { onConflict: "ref_number" });
          if (!singleError) {
            batchProcessed++;
          }
        }
        processed += batchProcessed;
        errors += uniqueRecords.length - batchProcessed;
      } else {
        processed += uniqueRecords.length;
      }
    }

    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(
        `Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} (${processed} inserted, ${errors} errors)`,
      );
    }
  }

  console.log("\n=== Load Complete ===");
  console.log(`Total processed: ${processed}`);
  console.log(`Total errors: ${errors}`);

  // Verify count
  const { count } = await supabase
    .from("historic_buildings")
    .select("*", { count: "exact", head: true });

  console.log(`Records in table: ${count}`);

  // Show status breakdown
  const { data: statusData } = await supabase
    .from("historic_buildings")
    .select("status")
    .limit(1);

  console.log("\n=== Verification ===");

  // Count Listed (HTC eligible)
  const { count: listedCount } = await supabase
    .from("historic_buildings")
    .select("*", { count: "exact", head: true })
    .eq("is_htc_eligible", true);

  console.log(`HTC Eligible (Listed): ${listedCount}`);

  // Count NHL
  const { count: nhlCount } = await supabase
    .from("historic_buildings")
    .select("*", { count: "exact", head: true })
    .eq("is_nhl", true);

  console.log(`National Historic Landmarks: ${nhlCount}`);
}

loadHistoricBuildings().catch(console.error);
