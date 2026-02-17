/**
 * Run a single migration file against the database
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1);
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error("Usage: npx tsx scripts/run-migration.ts <migration-file>");
    console.error(
      "Example: npx tsx scripts/run-migration.ts 033_fix_rpc_column_names.sql",
    );
    process.exit(1);
  }

  // Handle both full path and just filename
  let fullPath = migrationFile;
  if (!migrationFile.includes("/") && !migrationFile.includes("\\")) {
    fullPath = path.join(__dirname, "../supabase/migrations", migrationFile);
  }

  if (!fs.existsSync(fullPath)) {
    console.error("Migration file not found: " + fullPath);
    process.exit(1);
  }

  console.log("Running migration: " + migrationFile);

  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(fullPath, "utf8");
    await client.query(sql);
    console.log("Migration applied successfully");
  } catch (error: unknown) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
