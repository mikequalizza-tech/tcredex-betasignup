/**
 * Run a specific migration
 * Usage: node scripts/run-migration.mjs <migration-file>
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load .env.local manually
function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex);
      const value = trimmed.substring(eqIndex + 1);
      env[key] = value;
    }
  }
  return env;
}

const envLocal = loadEnvFile(join(projectRoot, '.env.local'));
const databaseUrl = process.env.DATABASE_URL || envLocal.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const migrationFile = process.argv[2] || '110_drop_clerk_columns.sql';
const migrationPath = join(projectRoot, 'supabase/migrations', migrationFile);

if (!existsSync(migrationPath)) {
  console.error(`Migration not found: ${migrationPath}`);
  process.exit(1);
}

async function runMigration() {
  console.log(`Running migration: ${migrationFile}`);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sql = readFileSync(migrationPath, 'utf-8');
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
