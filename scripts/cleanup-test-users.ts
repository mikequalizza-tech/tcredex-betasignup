/**
 * tCredex Test User Cleanup Script
 *
 * Run with: npx tsx scripts/cleanup-test-users.ts
 *
 * This script cleans up test users from both Supabase and shows
 * which Clerk users need manual deletion.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load env vars
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("\n=== tCredex Test Data Cleanup ===\n");

  // 1. List all users
  console.log("Current users in database:");
  console.log("-".repeat(80));

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      name,
      clerk_id,
      role,
      created_at,
      organization:organizations(id, name, type)
    `,
    )
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  interface UserRow {
    id: string;
    email: string;
    name: string;
    clerk_id: string | null;
    role: string;
    created_at: string;
    organization: { id: string; name: string; type: string } | null;
  }

  if (!users || users.length === 0) {
    console.log("No users found in database.");
    return;
  }

  (users as UserRow[]).forEach((user, i: number) => {
    console.log(`${i + 1}. ${user.email}`);
    console.log(`   Name: ${user.name} | Role: ${user.role}`);
    console.log(`   Clerk ID: ${user.clerk_id || "N/A"}`);
    console.log(
      `   Org: ${user.organization?.name || "None"} (${user.organization?.type || "N/A"})`,
    );
    console.log(`   Created: ${user.created_at}`);
    console.log("");
  });

  console.log("-".repeat(80));
  console.log(`\nTotal: ${users.length} users\n`);

  // Check for args
  const args = process.argv.slice(2);

  if (args.includes("--delete-all")) {
    console.log("⚠️  DELETING ALL USERS AND ORGS...\n");

    // Delete in order: users -> cdes/investors -> organizations
    await supabase
      .from("users")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("cdes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("investors")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("organizations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("✅ Database cleared.\n");
    console.log(
      "⚠️  IMPORTANT: You must also delete users from Clerk Dashboard:",
    );
    console.log("   https://dashboard.clerk.com/apps/app_2x.../users\n");

    (users as UserRow[]).forEach((user) => {
      if (user.clerk_id) {
        console.log(`   - Delete Clerk user: ${user.email} (${user.clerk_id})`);
      }
    });
  } else if (args[0] === "--delete-email") {
    const emailToDelete = args[1];
    if (!emailToDelete) {
      console.log("Usage: --delete-email <email>");
      return;
    }

    const userToDelete = (users as UserRow[]).find(
      (u) => u.email === emailToDelete,
    );
    if (!userToDelete) {
      console.log(`User not found: ${emailToDelete}`);
      return;
    }

    console.log(`Deleting user: ${emailToDelete}...`);

    // Delete user
    await supabase.from("users").delete().eq("id", userToDelete.id);

    // Clean up orphaned org if needed
    if (userToDelete.organization?.id) {
      const { data: orgUsers } = await supabase
        .from("users")
        .select("id")
        .eq("organization_id", userToDelete.organization.id);

      if (!orgUsers || orgUsers.length === 0) {
        console.log(`Deleting orphaned org: ${userToDelete.organization.name}`);
        await supabase
          .from("cdes")
          .delete()
          .eq("organization_id", userToDelete.organization.id);
        await supabase
          .from("investors")
          .delete()
          .eq("organization_id", userToDelete.organization.id);
        await supabase
          .from("organizations")
          .delete()
          .eq("id", userToDelete.organization.id);
      }
    }

    console.log(`✅ User deleted from Supabase.`);
    if (userToDelete.clerk_id) {
      console.log(
        `⚠️  Also delete from Clerk Dashboard: ${userToDelete.clerk_id}`,
      );
    }
  } else {
    console.log("Commands:");
    console.log(
      "  npx tsx scripts/cleanup-test-users.ts                    # List all users",
    );
    console.log(
      "  npx tsx scripts/cleanup-test-users.ts --delete-all       # Delete ALL users",
    );
    console.log(
      "  npx tsx scripts/cleanup-test-users.ts --delete-email <email>  # Delete specific user",
    );
  }
}

main().catch(console.error);
