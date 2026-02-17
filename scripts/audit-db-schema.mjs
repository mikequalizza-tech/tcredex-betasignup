/**
 * Database Schema Audit Script
 * Lists all tables, their columns, and identifies potential cleanup targets
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) env[trimmed.substring(0, eqIndex)] = trimmed.substring(eqIndex + 1);
  }
  return env;
}

const envLocal = loadEnvFile(join(projectRoot, '.env.local'));
const databaseUrl = process.env.DATABASE_URL || envLocal.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

async function auditSchema() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('='.repeat(80));
  console.log('DATABASE SCHEMA AUDIT');
  console.log('='.repeat(80));

  // Get all public tables
  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log(`\nFound ${tables.rows.length} tables in public schema:\n`);

  // Key tables we care about
  const keyTables = [
    'deals', 'organizations', 'profiles', 'cdes_merged',
    'deal_matches', 'match_requests', 'dd_documents',
    'messages', 'notifications', 'closing_rooms'
  ];

  // Potential garbage patterns
  const garbagePatterns = [
    'clerk_', '_old', '_backup', '_test', '_temp',
    'deprecated', 'legacy', 'unused'
  ];

  for (const table of tables.rows) {
    const tableName = table.table_name;
    const isKey = keyTables.includes(tableName);

    // Get columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);

    // Get row count
    const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    const rowCount = countResult.rows[0].count;

    // Check for garbage columns
    const garbageCols = columns.rows.filter(col =>
      garbagePatterns.some(p => col.column_name.toLowerCase().includes(p))
    );

    const marker = isKey ? '***' : '   ';
    console.log(`${marker} ${tableName} (${rowCount} rows, ${columns.rows.length} columns)`);

    if (garbageCols.length > 0) {
      console.log(`    ⚠️  Potential garbage columns: ${garbageCols.map(c => c.column_name).join(', ')}`);
    }
  }

  // Detailed view of key tables
  console.log('\n' + '='.repeat(80));
  console.log('KEY TABLES DETAIL');
  console.log('='.repeat(80));

  for (const tableName of keyTables) {
    const exists = tables.rows.some(t => t.table_name === tableName);
    if (!exists) {
      console.log(`\n❌ ${tableName} - TABLE NOT FOUND`);
      continue;
    }

    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);

    const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);

    console.log(`\n✅ ${tableName} (${countResult.rows[0].count} rows)`);
    console.log('─'.repeat(60));
    for (const col of columns.rows) {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(15)} ${nullable}`);
    }
  }

  // Check for orphaned references
  console.log('\n' + '='.repeat(80));
  console.log('DATA INTEGRITY CHECK');
  console.log('='.repeat(80));

  // Check deals with missing organizations
  try {
    const orphanedDeals = await client.query(`
      SELECT COUNT(*) as count FROM deals d
      LEFT JOIN organizations o ON d.organization_id = o.id
      WHERE d.organization_id IS NOT NULL AND o.id IS NULL;
    `);
    console.log(`\nDeals with missing organization: ${orphanedDeals.rows[0].count}`);
  } catch (e) {
    console.log('\nDeals/organizations check: Could not run');
  }

  // Check profiles without organizations
  try {
    const orphanedProfiles = await client.query(`
      SELECT COUNT(*) as count FROM profiles p
      WHERE p.organization_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = p.organization_id);
    `);
    console.log(`Profiles with missing organization: ${orphanedProfiles.rows[0].count}`);
  } catch (e) {
    console.log('Profiles/organizations check: Could not run');
  }

  await client.end();
}

auditSchema().catch(console.error);
