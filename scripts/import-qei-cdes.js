/**
 * Import QEI CDE Data - Consolidates multiple allocation years into single CDE records
 *
 * This script:
 * 1. Reads the QEI CSV data
 * 2. Groups by CDE name (normalized)
 * 3. Sums allocations across years
 * 4. Uses most recent year's contact info
 * 5. Creates/updates CDE organizations in database
 */

require("dotenv").config({
  path: require("path").join(__dirname, "../.env.local"),
});

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV line handling quoted fields with commas
function parseCSVLine(line) {
  const result = [];
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

// Clean currency string to number
function parseCurrency(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[$,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Clean percentage string to number
function parsePercentage(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[%\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Normalize CDE name for matching
function normalizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ") // Multiple spaces to single
    .replace(/,\s*$/, "") // Trailing commas
    .replace(/\s*(LLC|Inc\.|Inc|L\.L\.C\.|Corporation|Corp\.|Corp)\.?\s*$/i, "") // Remove common suffixes for matching
    .trim();
}

// Create URL-safe slug
function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

// Clean phone number
function cleanPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === "1") {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone.trim() || null;
}

// Clean email
function cleanEmail(email) {
  if (!email) return null;
  const cleaned = email.trim().toLowerCase();
  // Basic email validation
  if (cleaned.includes("@") && cleaned.includes(".")) {
    return cleaned;
  }
  return null;
}

// Clean contact name
function cleanContactName(name) {
  if (!name) return null;
  return (
    name
      .replace(/,\s*$/, "") // Remove trailing comma
      .replace(/\s+/g, " ")
      .trim() || null
  );
}

// Determine service area type
function getServiceAreaType(serviceArea) {
  if (!serviceArea) return "national";
  const lower = serviceArea.toLowerCase();
  if (lower.includes("national")) return "national";
  if (lower.includes("statewide") || lower.includes("territory-wide"))
    return "statewide";
  if (lower.includes("multi-state")) return "multi-state";
  if (lower.includes("local")) return "local";
  return "national";
}

async function importCDEs() {
  console.log("Starting QEI CDE Import...\n");

  // Read CSV file
  const csvPath = path.join(
    __dirname,
    "../../NMTC_Allocatee_Data_with_Contact_Split.csv",
  );

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());

  // Parse header
  const headers = parseCSVLine(lines[0]);
  console.log("Headers:", headers);
  console.log(`\nTotal rows: ${lines.length - 1}\n`);

  // Find column indices
  const colIndex = {
    name: headers.findIndex((h) =>
      h.toLowerCase().includes("name of allocatee"),
    ),
    year: headers.findIndex((h) => h.toLowerCase().includes("year of award")),
    totalAllocation: headers.findIndex((h) =>
      h.toLowerCase().includes("total allocation"),
    ),
    amountFinalized: headers.findIndex((h) =>
      h.toLowerCase().includes("amount finalized"),
    ),
    amountRemaining: headers.findIndex((h) =>
      h.toLowerCase().includes("amount remaining"),
    ),
    nonMetro: headers.findIndex((h) => h.toLowerCase().includes("non-metro")),
    serviceArea: headers.findIndex((h) =>
      h.toLowerCase().includes("service area"),
    ),
    controllingEntity: headers.findIndex((h) =>
      h.toLowerCase().includes("controlling entity"),
    ),
    predominantFinancing: headers.findIndex((h) =>
      h.toLowerCase().includes("predominant financing"),
    ),
    predominantMarket: headers.findIndex((h) =>
      h.toLowerCase().includes("predominant market"),
    ),
    innovativeActivities: headers.findIndex((h) =>
      h.toLowerCase().includes("innovative"),
    ),
    contactName: headers.findIndex((h) => h.toLowerCase() === "contact name"),
    contactPhone: headers.findIndex((h) => h.toLowerCase() === "contact phone"),
    contactEmail: headers.findIndex((h) => h.toLowerCase() === "contact email"),
  };

  console.log("Column indices:", colIndex);

  // Group by CDE name
  const cdeMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 5) continue;

    const rawName = values[colIndex.name] || "";
    const normalizedName = normalizeName(rawName);

    if (!normalizedName) continue;

    const year = parseInt(values[colIndex.year]) || 0;
    const allocation = {
      year,
      totalAllocation: parseCurrency(values[colIndex.totalAllocation]),
      amountFinalized: parseCurrency(values[colIndex.amountFinalized]),
      amountRemaining: parseCurrency(values[colIndex.amountRemaining]),
      nonMetroCommitment: parsePercentage(values[colIndex.nonMetro]),
    };

    if (!cdeMap.has(normalizedName)) {
      cdeMap.set(normalizedName, {
        name: rawName.trim().replace(/\s+/g, " "),
        normalizedName,
        allocations: [],
        serviceArea: values[colIndex.serviceArea]?.trim() || "",
        controllingEntity: values[colIndex.controllingEntity]?.trim() || "",
        predominantFinancing:
          values[colIndex.predominantFinancing]?.trim() || "",
        predominantMarket: values[colIndex.predominantMarket]?.trim() || "",
        innovativeActivities:
          values[colIndex.innovativeActivities]?.trim() || "",
        contactName: cleanContactName(values[colIndex.contactName]),
        contactPhone: cleanPhone(values[colIndex.contactPhone]),
        contactEmail: cleanEmail(values[colIndex.contactEmail]),
        latestYear: year,
      });
    }

    const cde = cdeMap.get(normalizedName);
    cde.allocations.push(allocation);

    // Update with more recent data
    if (year > cde.latestYear) {
      cde.latestYear = year;
      cde.serviceArea = values[colIndex.serviceArea]?.trim() || cde.serviceArea;
      cde.controllingEntity =
        values[colIndex.controllingEntity]?.trim() || cde.controllingEntity;
      cde.predominantFinancing =
        values[colIndex.predominantFinancing]?.trim() ||
        cde.predominantFinancing;
      cde.predominantMarket =
        values[colIndex.predominantMarket]?.trim() || cde.predominantMarket;
      cde.innovativeActivities =
        values[colIndex.innovativeActivities]?.trim() ||
        cde.innovativeActivities;

      // Update contact info if available
      const newName = cleanContactName(values[colIndex.contactName]);
      const newPhone = cleanPhone(values[colIndex.contactPhone]);
      const newEmail = cleanEmail(values[colIndex.contactEmail]);

      if (newName) cde.contactName = newName;
      if (newPhone) cde.contactPhone = newPhone;
      if (newEmail) cde.contactEmail = newEmail;
    }
  }

  console.log(`\nUnique CDEs found: ${cdeMap.size}\n`);

  // Calculate totals and prepare for insert
  const cdesToInsert = [];

  for (const [normalizedName, cde] of cdeMap) {
    // Sum up allocations
    const totals = cde.allocations.reduce(
      (acc, alloc) => ({
        totalAllocation: acc.totalAllocation + alloc.totalAllocation,
        amountFinalized: acc.amountFinalized + alloc.amountFinalized,
        amountRemaining: acc.amountRemaining + alloc.amountRemaining,
      }),
      { totalAllocation: 0, amountFinalized: 0, amountRemaining: 0 },
    );

    // Average non-metro commitment (weighted by allocation would be better, but this is simpler)
    const avgNonMetro =
      cde.allocations.reduce((sum, a) => sum + a.nonMetroCommitment, 0) /
      cde.allocations.length;

    cdesToInsert.push({
      name: cde.name,
      slug: createSlug(cde.name),
      type: "cde",
      service_area: getServiceAreaType(cde.serviceArea),
      service_area_description: cde.serviceArea,
      controlling_entity: cde.controllingEntity || null,
      primary_contact_name: cde.contactName,
      primary_contact_email: cde.contactEmail,
      phone: cde.contactPhone,
      predominant_financing: cde.predominantFinancing || null,
      predominant_market: cde.predominantMarket || null,
      innovative_activities: cde.innovativeActivities || null,
      nmtc_allocation_total: totals.totalAllocation,
      nmtc_allocation_deployed: totals.amountFinalized,
      nmtc_allocation_remaining: totals.amountRemaining,
      non_metro_commitment: avgNonMetro,
      allocation_years: cde.allocations.map((a) => a.year).sort(),
      allocation_details: JSON.stringify(cde.allocations),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Sort by remaining allocation (highest first)
  cdesToInsert.sort(
    (a, b) => b.nmtc_allocation_remaining - a.nmtc_allocation_remaining,
  );

  // Print summary
  console.log("Top 10 CDEs by Remaining Allocation:");
  console.log("=====================================");
  cdesToInsert.slice(0, 10).forEach((cde, i) => {
    console.log(`${i + 1}. ${cde.name}`);
    console.log(
      `   Remaining: $${(cde.nmtc_allocation_remaining / 1000000).toFixed(1)}M | Total: $${(cde.nmtc_allocation_total / 1000000).toFixed(1)}M`,
    );
    console.log(
      `   Contact: ${cde.primary_contact_name || "N/A"} | ${cde.primary_contact_email || "N/A"}`,
    );
    console.log(`   Years: ${cde.allocation_years.join(", ")}`);
    console.log("");
  });

  // Ask for confirmation
  console.log(`\nReady to insert ${cdesToInsert.length} CDE organizations.`);
  console.log("Run with --execute flag to actually insert into database.\n");

  if (!process.argv.includes("--execute")) {
    // Export to JSON for review
    const outputPath = path.join(__dirname, "../../cde-import-preview.json");
    fs.writeFileSync(outputPath, JSON.stringify(cdesToInsert, null, 2));
    console.log(`Preview saved to: ${outputPath}`);
    return;
  }

  // Insert into database
  console.log("Inserting into database...\n");

  let orgsInserted = 0;
  let orgsUpdated = 0;
  let allocationsInserted = 0;
  let errors = 0;

  // We need to keep the original allocations data
  const cdeAllocationsMap = new Map();
  for (const [normalizedName, cde] of cdeMap) {
    cdeAllocationsMap.set(cde.name, cde.allocations);
  }

  for (const cde of cdesToInsert) {
    try {
      let orgId;

      // Check if CDE already exists by name (fuzzy match)
      const { data: existing } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("type", "cde")
        .ilike("name", `%${cde.name.substring(0, 30)}%`)
        .limit(1);

      // Remove allocation_details from the org insert (we'll put it in cde_allocations)
      const orgData = { ...cde };
      delete orgData.allocation_details;

      if (existing && existing.length > 0) {
        // Update existing
        orgId = existing[0].id;
        const { error } = await supabase
          .from("organizations")
          .update({
            service_area: cde.service_area,
            service_area_description: cde.service_area_description,
            controlling_entity: cde.controlling_entity,
            primary_contact_name: cde.primary_contact_name,
            primary_contact_email: cde.primary_contact_email,
            phone: cde.phone,
            predominant_financing: cde.predominant_financing,
            predominant_market: cde.predominant_market,
            innovative_activities: cde.innovative_activities,
            nmtc_allocation_total: cde.nmtc_allocation_total,
            nmtc_allocation_deployed: cde.nmtc_allocation_deployed,
            nmtc_allocation_remaining: cde.nmtc_allocation_remaining,
            non_metro_commitment: cde.non_metro_commitment,
            allocation_years: cde.allocation_years,
            updated_at: cde.updated_at,
          })
          .eq("id", orgId);

        if (error) throw error;
        orgsUpdated++;
        console.log(`Updated org: ${cde.name}`);
      } else {
        // Insert new organization
        const { data: newOrg, error } = await supabase
          .from("organizations")
          .insert(orgData)
          .select("id")
          .single();

        if (error) throw error;
        orgId = newOrg.id;
        orgsInserted++;
        console.log(`Inserted org: ${cde.name}`);
      }

      // Now insert allocations for this CDE
      const allocations = cdeAllocationsMap.get(cde.name) || [];

      for (const alloc of allocations) {
        // Check if allocation for this year already exists
        const { data: existingAlloc } = await supabase
          .from("cde_allocations")
          .select("id")
          .eq("organization_id", orgId)
          .eq("year", alloc.year)
          .limit(1);

        if (existingAlloc && existingAlloc.length > 0) {
          // Update existing allocation
          const { error: allocError } = await supabase
            .from("cde_allocations")
            .update({
              total_allocation: alloc.totalAllocation,
              amount_finalized: alloc.amountFinalized,
              amount_remaining: alloc.amountRemaining,
              non_metro_commitment: alloc.nonMetroCommitment,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingAlloc[0].id);

          if (allocError) {
            console.error(
              `  Error updating allocation ${alloc.year}:`,
              allocError.message,
            );
          }
        } else {
          // Insert new allocation
          const { error: allocError } = await supabase
            .from("cde_allocations")
            .insert({
              organization_id: orgId,
              year: alloc.year,
              total_allocation: alloc.totalAllocation,
              amount_finalized: alloc.amountFinalized,
              amount_remaining: alloc.amountRemaining,
              non_metro_commitment: alloc.nonMetroCommitment,
            });

          if (allocError) {
            console.error(
              `  Error inserting allocation ${alloc.year}:`,
              allocError.message,
            );
          } else {
            allocationsInserted++;
          }
        }
      }
    } catch (err) {
      console.error(`Error with ${cde.name}:`, err.message);
      errors++;
    }
  }

  console.log("\n========================================");
  console.log(`Import Complete!`);
  console.log(`  Organizations Inserted: ${orgsInserted}`);
  console.log(`  Organizations Updated: ${orgsUpdated}`);
  console.log(`  Allocations Inserted: ${allocationsInserted}`);
  console.log(`  Errors: ${errors}`);
  console.log("========================================\n");
}

// Run
importCDEs().catch(console.error);
