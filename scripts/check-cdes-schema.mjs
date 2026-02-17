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

async function checkSchema() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const result = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'cdes_merged'
    ORDER BY ordinal_position;
  `);

  console.log('cdes_merged columns:');
  console.log('─'.repeat(60));
  result.rows.forEach(col => {
    console.log(`${col.column_name.padEnd(30)} ${col.data_type}`);
  });

  // Check if clerk_id is gone
  const hasClerk = result.rows.some(r => r.column_name === 'clerk_id');
  console.log('\n' + (hasClerk ? '❌ clerk_id still exists' : '✅ clerk_id removed'));

  // Check new columns
  const newCols = ['target_sectors', 'require_severely_distressed', 'minority_focus', 'uts_focus', 'nonprofit_preferred'];
  const missing = newCols.filter(c => !result.rows.some(r => r.column_name === c));
  console.log(missing.length ? `❌ Missing: ${missing.join(', ')}` : '✅ All new AutoMatch columns added');

  await client.end();
}

checkSchema().catch(console.error);
