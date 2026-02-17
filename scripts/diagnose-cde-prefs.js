#!/usr/bin/env node
/**
 * CDE Preference Data Distribution Analysis
 * Shows how many CDEs have non-default values for each preference field
 */
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://xlejizyoggqdedjkyset.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZWppenlvZ2dxZGVkamt5c2V0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY2MjUyMCwiZXhwIjoyMDgxMjM4NTIwfQ._cv7Gg0Sc-qQATifHzKz4AJAQfVFGUf-g2LEa5UyMmg",
);

async function main() {
  const { data: cdes } = await supabase
    .from("cdes_merged")
    .select("*")
    .eq("status", "active");
  console.log("Total active CDEs:", cdes.length);

  const stats = {
    service_area_type: {},
    has_primary_states: 0,
    has_target_sectors: 0,
    rural_focus_true: 0,
    urban_focus_false: 0,
    require_severely_distressed_true: 0,
    min_distress_percentile_nonzero: 0,
    minority_focus_true: 0,
    uts_focus_true: 0,
    underserved_states_focus_true: 0,
    nonprofit_preferred_true: 0,
    forprofit_accepted_false: 0,
    owner_occupied_preferred_true: 0,
    native_american_focus_true: 0,
    small_deal_fund_true: 0,
    has_predominant_market: 0,
    has_predominant_financing: 0,
    allocation_type_state: 0,
    non_default_min_deal: 0,
    non_default_max_deal: 0,
  };

  for (const c of cdes) {
    const sat = c.service_area_type || "NULL";
    stats.service_area_type[sat] = (stats.service_area_type[sat] || 0) + 1;
    if (c.primary_states && c.primary_states.length > 0)
      stats.has_primary_states++;
    if (c.target_sectors && c.target_sectors.length > 0)
      stats.has_target_sectors++;
    if (c.rural_focus === true) stats.rural_focus_true++;
    if (c.urban_focus === false) stats.urban_focus_false++;
    if (c.require_severely_distressed === true)
      stats.require_severely_distressed_true++;
    if ((Number(c.min_distress_percentile) || 0) > 0)
      stats.min_distress_percentile_nonzero++;
    if (c.minority_focus === true) stats.minority_focus_true++;
    if (c.uts_focus === true) stats.uts_focus_true++;
    if (c.underserved_states_focus === true)
      stats.underserved_states_focus_true++;
    if (c.nonprofit_preferred === true) stats.nonprofit_preferred_true++;
    if (c.forprofit_accepted === false) stats.forprofit_accepted_false++;
    if (c.owner_occupied_preferred === true)
      stats.owner_occupied_preferred_true++;
    if (c.native_american_focus === true) stats.native_american_focus_true++;
    if (c.small_deal_fund === true) stats.small_deal_fund_true++;
    if (c.predominant_market) stats.has_predominant_market++;
    if (c.predominant_financing) stats.has_predominant_financing++;
    if (c.allocation_type === "state") stats.allocation_type_state++;
    const minDeal = Number(c.min_deal_size) || 0;
    const maxDeal = Number(c.max_deal_size) || 0;
    if (minDeal !== 0 && minDeal !== 1000000) stats.non_default_min_deal++;
    if (maxDeal !== 0 && maxDeal !== 15000000) stats.non_default_max_deal++;
  }

  console.log("\nSERVICE AREA TYPES:");
  for (const [k, v] of Object.entries(stats.service_area_type)) {
    console.log("  " + k + ": " + v);
  }

  console.log(
    "\nNON-DEFAULT PREFERENCE VALUES (out of " + cdes.length + " CDEs):",
  );
  console.log("  has_primary_states:", stats.has_primary_states);
  console.log("  has_target_sectors:", stats.has_target_sectors);
  console.log("  has_predominant_market:", stats.has_predominant_market);
  console.log("  has_predominant_financing:", stats.has_predominant_financing);
  console.log("  rural_focus=true:", stats.rural_focus_true);
  console.log("  urban_focus=false:", stats.urban_focus_false);
  console.log(
    "  require_severely_distressed=true:",
    stats.require_severely_distressed_true,
  );
  console.log(
    "  min_distress_percentile>0:",
    stats.min_distress_percentile_nonzero,
  );
  console.log("  minority_focus=true:", stats.minority_focus_true);
  console.log("  uts_focus=true:", stats.uts_focus_true);
  console.log(
    "  underserved_states_focus=true (OLD column):",
    stats.underserved_states_focus_true,
  );
  console.log("  nonprofit_preferred=true:", stats.nonprofit_preferred_true);
  console.log("  forprofit_accepted=false:", stats.forprofit_accepted_false);
  console.log(
    "  owner_occupied_preferred=true:",
    stats.owner_occupied_preferred_true,
  );
  console.log(
    "  native_american_focus=true:",
    stats.native_american_focus_true,
  );
  console.log("  small_deal_fund=true:", stats.small_deal_fund_true);
  console.log("  allocation_type=state:", stats.allocation_type_state);
  console.log("  non_default_min_deal:", stats.non_default_min_deal);
  console.log("  non_default_max_deal:", stats.non_default_max_deal);

  // Show predominant_financing distribution
  console.log("\nPREDOMINANT_FINANCING DISTRIBUTION:");
  const finDist = {};
  for (const c of cdes) {
    const f = c.predominant_financing || "NULL";
    finDist[f] = (finDist[f] || 0) + 1;
  }
  for (const [k, v] of Object.entries(finDist).sort((a, b) => b[1] - a[1])) {
    console.log("  " + v + "x  " + k);
  }

  // Show innovative_activities that contain useful keywords
  console.log("\nINNOVATIVE_ACTIVITIES KEYWORDS:");
  const iaDist = {};
  for (const c of cdes) {
    const ia = c.innovative_activities || "";
    const parts = ia
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const p of parts) {
      iaDist[p] = (iaDist[p] || 0) + 1;
    }
  }
  for (const [k, v] of Object.entries(iaDist).sort((a, b) => b[1] - a[1])) {
    console.log("  " + v + "x  " + k);
  }

  // Show non_metro_commitment distribution (could indicate rural focus)
  console.log("\nNON_METRO_COMMITMENT DISTRIBUTION:");
  const nmcDist = {};
  for (const c of cdes) {
    const nmc = c.non_metro_commitment || 0;
    const bucket =
      nmc === 0
        ? "0%"
        : nmc <= 20
          ? "1-20%"
          : nmc <= 40
            ? "21-40%"
            : nmc <= 60
              ? "41-60%"
              : nmc <= 80
                ? "61-80%"
                : "81-100%";
    nmcDist[bucket] = (nmcDist[bucket] || 0) + 1;
  }
  for (const [k, v] of Object.entries(nmcDist)) {
    console.log("  " + k + ": " + v);
  }

  // Show sample columns available
  console.log("\nALL COLUMNS IN cdes_merged:");
  if (cdes.length > 0) {
    const cols = Object.keys(cdes[0]).sort();
    console.log(cols.join(", "));
  }
}
main().catch(console.error);
