/**
 * Make Deals Visible
 * Run: node scripts/make-deals-visible.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function updateDeals() {
  console.log("Updating deals to be visible...\n");

  // Update all deals to visible=true and status=available
  const { data, error } = await supabase
    .from("deals")
    .update({
      visible: true,
      status: "available",
    })
    .neq("id", "00000000-0000-0000-0000-000000000000") // update all
    .select("id, project_name, visible, status");

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("Updated deals:");
  data.forEach((d) => {
    console.log(
      `  ✓ ${d.project_name}: visible=${d.visible}, status=${d.status}`,
    );
  });

  console.log(`\n${data.length} deals updated.`);
}

updateDeals();
