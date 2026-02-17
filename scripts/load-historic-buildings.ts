/**
 * Load National Register of Historic Places (NRHP) Data
 * ======================================================
 * Loads 100K+ historic buildings from CSV into historic_buildings table
 * for Federal HTC eligibility lookups.
 *
 * Usage: npx tsx scripts/load-historic-buildings.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// CSV columns from national-register-fed_htc_locations.csv:
// Ref#, Prefix, Property Name, State, County, City, Street & Number, Status,
// Request Type, Restricted Address, Acreage of Property, Area of Significance,
// Category of Property, External Link, Level of Significance - International,
// Level of Significance - Local, Level of Significance - National,
// Level of Significance - Not Indicated, Level of Significance - State,
// Listed Date, Name of Multiple Property Listing, NHL Designated Date,
// Other Names, Park Name, Property ID

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
  property_id?: string;
  is_htc_eligible: boolean;
  is_nhl: boolean;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === "") return null;

  // Format: DD/MM/YYYY or MM/DD/YYYY
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  // Assuming DD/MM/YYYY format from the CSV
  const paddedMonth = month.padStart(2, "0");
  const paddedDay = day.padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}`;
}

function parseBool(value: string | undefined | null): boolean {
  if (!value || value.trim() === "") return false;
  return value.toUpperCase() === "TRUE" || value === "1";
}

function parseAcreage(value: string): number | null {
  if (!value || value.trim() === "") return null;
  const num = parseFloat(value.replace(/,/g, ""));
  return isNaN(num) ? null : num;
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

  // Path to CSV
  const csvPath = path.resolve(
    "C:/tcredex.com/tracts/national-register-fed_htc_locations.csv",
  );

  console.log(`Reading CSV from: ${csvPath}`);
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());

  console.log(`Total lines: ${lines.length}`);

  // Skip header
  const dataLines = lines.slice(1);
  console.log(`Data rows: ${dataLines.length}`);

  // Process in batches
  const BATCH_SIZE = 500;
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
    const batch = dataLines.slice(i, i + BATCH_SIZE);
    const records: Partial<HistoricBuilding>[] = [];

    for (const line of batch) {
      try {
        const cols = parseCSVLine(line);
        if (cols.length < 25) continue;

        const [
          refNumber,
          prefix,
          propertyName,
          state,
          county,
          city,
          streetAddress,
          status,
          requestType,
          restrictedAddress,
          acreage,
          areaOfSignificance,
          category,
          externalLink,
          sigIntl,
          sigLocal,
          sigNational,
          sigNotIndicated,
          sigState,
          listedDate,
          multiplePropertyListing,
          nhlDate,
          otherNames,
          parkName,
          propertyId,
        ] = cols;

        if (!propertyName || propertyName.trim() === "") continue;

        const stateUpper = state?.toUpperCase().trim() || "";
        const stateAbbr = STATE_ABBREVS[stateUpper] || null;

        // Build full address
        const addressParts = [streetAddress, city, state].filter(
          (p) => p && p.trim(),
        );
        const fullAddress =
          addressParts.length > 0 ? addressParts.join(", ") : null;

        // Check if NHL (National Historic Landmark)
        const isNHL = !!(nhlDate && nhlDate.trim() !== "");
        const isHtcEligible = status?.toUpperCase() === "LISTED";

        records.push({
          ref_number: refNumber || undefined,
          prefix: prefix || undefined,
          property_name: propertyName.trim(),
          state: state || undefined,
          state_abbr: stateAbbr || undefined,
          county: county || undefined,
          city: city || undefined,
          street_address: streetAddress || undefined,
          address: fullAddress || undefined,
          status: status || undefined,
          request_type: requestType || undefined,
          restricted_address: parseBool(restrictedAddress),
          acreage: parseAcreage(acreage) ?? undefined,
          area_of_significance: areaOfSignificance || undefined,
          category: category || undefined,
          external_link: externalLink || undefined,
          significance_international: parseBool(sigIntl),
          significance_local: parseBool(sigLocal),
          significance_national: parseBool(sigNational),
          significance_not_indicated: parseBool(sigNotIndicated),
          significance_state: parseBool(sigState),
          listed_date: parseDate(listedDate) ?? undefined,
          multiple_property_listing: multiplePropertyListing || undefined,
          nhl_designated_date: parseDate(nhlDate) ?? undefined,
          other_names: otherNames || undefined,
          park_name: parkName || undefined,
          property_id: propertyId || undefined,
          is_htc_eligible: isHtcEligible,
          is_nhl: isNHL,
        });
      } catch (err) {
        errors++;
      }
    }

    if (records.length > 0) {
      // Use upsert to handle duplicates (same property with multiple entries)
      const { error } = await supabase
        .from("historic_buildings")
        .upsert(records, {
          onConflict: "ref_number",
          ignoreDuplicates: true,
        });

      if (error) {
        // If upsert fails, try inserting one by one
        let batchProcessed = 0;
        for (const record of records) {
          const { error: singleError } = await supabase
            .from("historic_buildings")
            .insert(record);
          if (!singleError) {
            batchProcessed++;
          }
        }
        processed += batchProcessed;
        errors += records.length - batchProcessed;
        if (batchProcessed < records.length) {
          console.error(
            `Batch ${i}: ${batchProcessed}/${records.length} inserted (duplicates skipped)`,
          );
        }
      } else {
        processed += records.length;
      }
    }

    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= dataLines.length) {
      console.log(
        `Progress: ${Math.min(i + BATCH_SIZE, dataLines.length)}/${dataLines.length} (${processed} inserted, ${errors} errors)`,
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
}

loadHistoricBuildings().catch(console.error);
