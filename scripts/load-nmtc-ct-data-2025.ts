/**
 * Load NMTC Census Tract Data 2025 - SOURCE OF TRUTH
 * ====================================================
 * Loads 85K+ census tracts from CDFI Fund's official 2025 data
 * into nmtc_ct_data_2025 table for Scoring and Matching engines.
 *
 * Source: NMTC_2016-2020_ACS_LIC_2025.csv
 *
 * Usage: npx tsx scripts/load-nmtc-ct-data-2025.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

interface NMTCTractRecord {
  geoid: string;
  metro_status: string;
  is_non_metro: boolean;
  is_lic_eligible: boolean;
  poverty_rate: number | null;
  qualifies_poverty: boolean;
  mfi_pct: number | null;
  qualifies_mfi: boolean;
  unemployment_rate: number | null;
  unemployment_ratio: number | null;
  county_fips: string;
  state_name: string;
  county_name: string;
  population: number | null;
  is_high_migration: boolean;
  is_severely_distressed: boolean;
  is_deeply_distressed: boolean;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
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

function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;
  // Handle percentage format like "104%" -> 104
  const cleaned = value.replace("%", "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseBoolean(value: string): boolean {
  return value?.toUpperCase() === "YES";
}

async function loadNMTCData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const csvPath = "C:/tcredex.com/tracts/NMTC_2016-2020_ACS_LIC_2025.csv";
  console.log(`Reading CSV from: ${csvPath}`);

  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());

  console.log(`Total lines: ${lines.length}`);
  console.log(`Data rows: ${lines.length - 1}`);

  // Parse header
  const headers = parseCSVLine(lines[0]);
  console.log(`\nHeaders (${headers.length} columns):`);
  headers.forEach((h, i) => console.log(`  ${i}: ${h.substring(0, 60)}`));

  // Clear existing data
  console.log("\nClearing existing nmtc_ct_data_2025 data...");
  const { error: deleteError } = await supabase
    .from("nmtc_ct_data_2025")
    .delete()
    .neq("geoid", ""); // Delete all

  if (deleteError) {
    console.log("Table may be empty or not exist yet, continuing...");
  }

  // Process in batches
  const BATCH_SIZE = 1000;
  let processed = 0;
  let errors = 0;
  let skipped = 0;

  const stats = {
    total: 0,
    lic_eligible: 0,
    severely_distressed: 0,
    high_migration: 0,
    non_metro: 0,
  };

  for (let i = 1; i < lines.length; i += BATCH_SIZE) {
    const batchLines = lines.slice(i, i + BATCH_SIZE);
    const records: NMTCTractRecord[] = [];

    for (const line of batchLines) {
      try {
        const cols = parseCSVLine(line);

        const geoid = cols[0]?.trim();
        if (!geoid || geoid.length !== 11) {
          skipped++;
          continue;
        }

        const metroStatus = cols[1]?.trim() || "";
        const isNonMetro = metroStatus.toLowerCase().includes("non");

        const isLicEligible = parseBoolean(cols[2]);
        const povertyRate = parseNumber(cols[3]);
        const qualifiesPoverty = parseBoolean(cols[4]);
        const mfiPct = parseNumber(cols[5]);
        const qualifiesMfi = parseBoolean(cols[6]);
        const unemploymentRate = parseNumber(cols[7]);
        const countyFips = cols[8]?.trim() || "";
        const stateName = cols[9]?.trim() || "";
        const countyName = cols[10]?.trim() || "";
        const unemploymentRatio = parseNumber(cols[11]);
        const population = parseNumber(cols[12]);
        const isHighMigration = parseBoolean(cols[13]);
        const isSeverelyDistressed = parseBoolean(cols[14]);
        const isDeeplyDistressed = parseBoolean(cols[15]);

        // Track stats
        stats.total++;
        if (isLicEligible) stats.lic_eligible++;
        if (isSeverelyDistressed) stats.severely_distressed++;
        if (isHighMigration) stats.high_migration++;
        if (isNonMetro) stats.non_metro++;

        records.push({
          geoid,
          metro_status: metroStatus,
          is_non_metro: isNonMetro,
          is_lic_eligible: isLicEligible,
          poverty_rate: povertyRate,
          qualifies_poverty: qualifiesPoverty,
          mfi_pct: mfiPct,
          qualifies_mfi: qualifiesMfi,
          unemployment_rate: unemploymentRate,
          unemployment_ratio: unemploymentRatio,
          county_fips: countyFips,
          state_name: stateName,
          county_name: countyName,
          population: population ? Math.round(population) : null,
          is_high_migration: isHighMigration,
          is_severely_distressed: isSeverelyDistressed,
          is_deeply_distressed: isDeeplyDistressed,
        });
      } catch (err) {
        errors++;
      }
    }

    if (records.length > 0) {
      const { error } = await supabase
        .from("nmtc_ct_data_2025")
        .upsert(records, { onConflict: "geoid" });

      if (error) {
        console.error(`Batch ${i} error:`, error.message);
        // Try one by one
        for (const record of records) {
          const { error: singleError } = await supabase
            .from("nmtc_ct_data_2025")
            .upsert(record, { onConflict: "geoid" });
          if (!singleError) processed++;
          else errors++;
        }
      } else {
        processed += records.length;
      }
    }

    // Progress update
    if (
      (i + BATCH_SIZE) % 10000 < BATCH_SIZE ||
      i + BATCH_SIZE >= lines.length
    ) {
      const pct = Math.round(
        (Math.min(i + BATCH_SIZE, lines.length - 1) / (lines.length - 1)) * 100,
      );
      console.log(
        `Progress: ${pct}% (${processed} inserted, ${errors} errors, ${skipped} skipped)`,
      );
    }
  }

  console.log("\n========================================");
  console.log("LOAD COMPLETE");
  console.log("========================================");
  console.log(`Total processed: ${processed}`);
  console.log(`Total errors: ${errors}`);
  console.log(`Total skipped: ${skipped}`);

  console.log("\n========================================");
  console.log("DATA STATISTICS");
  console.log("========================================");
  console.log(`Total tracts: ${stats.total.toLocaleString()}`);
  console.log(
    `LIC Eligible: ${stats.lic_eligible.toLocaleString()} (${((stats.lic_eligible / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Severely Distressed: ${stats.severely_distressed.toLocaleString()} (${((stats.severely_distressed / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `High Migration: ${stats.high_migration.toLocaleString()} (${((stats.high_migration / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Non-Metro: ${stats.non_metro.toLocaleString()} (${((stats.non_metro / stats.total) * 100).toFixed(1)}%)`,
  );

  // Verify count in database
  const { count } = await supabase
    .from("nmtc_ct_data_2025")
    .select("*", { count: "exact", head: true });

  console.log(`\nVerified records in table: ${count?.toLocaleString()}`);

  // Sample by state
  console.log("\n========================================");
  console.log("SAMPLE BY STATE (Top 10 by LIC count)");
  console.log("========================================");

  const { data: stateStats } = await supabase
    .from("nmtc_ct_data_2025")
    .select("state_name")
    .eq("is_lic_eligible", true);

  if (stateStats) {
    const byState: Record<string, number> = {};
    for (const row of stateStats) {
      const state = row.state_name?.trim() || "Unknown";
      byState[state] = (byState[state] || 0) + 1;
    }

    const sorted = Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [state, count] of sorted) {
      console.log(`  ${state}: ${count.toLocaleString()} LIC tracts`);
    }
  }
}

loadNMTCData().catch(console.error);
