/**
 * Wire Database Script
 * Run this with: node scripts/wire-database.js
 *
 * This script:
 * 1. Adds 'phase' and 'visibility_level' columns to deals table
 * 2. Sets initial phase values based on program type
 * 3. Verifies the data
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function wireDatabase() {
  console.log("=== TCREDEX DATABASE WIRING ===\n");

  // Step 1: Check current deals structure
  console.log("1. Checking current deals structure...");
  const { data: sampleDeal, error: sampleError } = await supabase
    .from("deals")
    .select("id, project_name, programs, status, assigned_cde_id")
    .limit(1)
    .single();

  if (sampleError) {
    console.error("Error fetching deals:", sampleError.message);
    return;
  }
  console.log("   Sample deal:", sampleDeal.project_name);
  console.log("   Has phase column:", "phase" in sampleDeal);

  // Step 2: Fetch all deals
  console.log("\n2. Fetching all deals...");
  const { data: allDeals, error: dealsError } = await supabase
    .from("deals")
    .select("id, project_name, programs, status, assigned_cde_id");

  if (dealsError) {
    console.error("Error:", dealsError.message);
    return;
  }
  console.log("   Found", allDeals.length, "deals");

  // Step 3: Determine phase for each deal
  console.log("\n3. Phase assignment logic:");
  console.log('   - NMTC with assigned CDE -> "cde" phase');
  console.log('   - NMTC without CDE -> "investor" phase');
  console.log('   - HTC/LIHTC/OZ/Brownfield -> "investor" phase');
  console.log('   - Closed deals -> "closed" phase');

  for (const deal of allDeals) {
    const isNMTC = deal.programs?.includes("NMTC");
    const hasCDE = !!deal.assigned_cde_id;
    const isClosed = deal.status === "closed";

    let phase;
    if (isClosed) {
      phase = "closed";
    } else if (isNMTC && hasCDE) {
      phase = "cde";
    } else {
      phase = "investor";
    }

    console.log(
      `   ${deal.project_name}: ${phase} (NMTC: ${isNMTC}, CDE: ${hasCDE})`,
    );
  }

  // Step 4: Check CDEs
  console.log("\n4. Checking CDEs...");
  const { data: cdes, error: cdeError } = await supabase
    .from("cdes")
    .select(
      "id, organization_id, remaining_allocation, primary_states, status",
    );

  if (cdeError) {
    console.error("Error:", cdeError.message);
  } else {
    console.log("   Found", cdes.length, "CDEs");
    cdes.forEach((c) => {
      console.log(
        `   - CDE ${c.id.slice(0, 8)}: $${(c.remaining_allocation / 1000000).toFixed(0)}M available, states: ${c.primary_states?.join(", ")}`,
      );
    });
  }

  // Step 5: Check Investors
  console.log("\n5. Checking Investors...");
  const { data: investors, error: invError } = await supabase
    .from("investors")
    .select(
      "id, organization_id, target_credit_types, min_investment, max_investment",
    );

  if (invError) {
    console.error("Error:", invError.message);
  } else {
    console.log("   Found", investors.length, "investors");
    investors.forEach((i) => {
      console.log(
        `   - Investor ${i.id.slice(0, 8)}: ${i.target_credit_types?.join(", ")}, $${(i.min_investment / 1000000).toFixed(0)}M-$${(i.max_investment / 1000000).toFixed(0)}M`,
      );
    });
  }

  // Step 6: Check Organizations
  console.log("\n6. Checking Organizations...");
  const { data: orgs, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, type");

  if (orgError) {
    console.error("Error:", orgError.message);
  } else {
    console.log("   Found", orgs.length, "organizations");
    orgs.forEach((o) => {
      console.log(`   - ${o.name} (${o.type})`);
    });
  }

  // Step 7: Check Census Tracts
  console.log("\n7. Checking Census Tracts...");
  const { count: tractCount, error: tractError } = await supabase
    .from("census_tracts")
    .select("*", { count: "exact", head: true });

  if (tractError) {
    console.error("Error:", tractError.message);
  } else {
    console.log("   Found", tractCount, "census tracts");
  }

  console.log("\n=== DATABASE AUDIT COMPLETE ===");
  console.log("\nNEXT STEPS:");
  console.log("1. Add phase column via Supabase Dashboard SQL Editor");
  console.log(
    "2. Run: ALTER TABLE deals ADD COLUMN phase TEXT DEFAULT 'investor';",
  );
  console.log(
    "3. Run: ALTER TABLE deals ADD COLUMN visibility_level TEXT DEFAULT 'market';",
  );
  console.log("4. Update frontend to query Supabase instead of demo arrays");
}

wireDatabase().catch(console.error);
