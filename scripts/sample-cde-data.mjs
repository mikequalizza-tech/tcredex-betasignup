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

async function sampleData() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Get sample of key matching fields
  const result = await client.query(`
    SELECT
      name,
      service_area_type,
      primary_states,
      predominant_financing,
      predominant_market,
      non_metro_commitment,
      rural_focus,
      urban_focus,
      innovative_activities
    FROM cdes_merged
    WHERE status = 'active'
    LIMIT 10;
  `);

  console.log('Sample CDE Data for Matching:\n');
  result.rows.forEach((row, i) => {
    console.log(`─── CDE ${i+1}: ${row.name} ───`);
    console.log(`  Service Area: ${row.service_area_type}`);
    console.log(`  States: ${row.primary_states?.join(', ') || 'N/A'}`);
    console.log(`  Financing: ${row.predominant_financing || 'N/A'}`);
    console.log(`  Market: ${row.predominant_market?.substring(0, 100) || 'N/A'}...`);
    console.log(`  Non-Metro %: ${row.non_metro_commitment}`);
    console.log(`  Rural/Urban: ${row.rural_focus ? 'Rural' : ''} ${row.urban_focus ? 'Urban' : ''}`);
    console.log(`  Activities: ${row.innovative_activities?.substring(0, 100) || 'N/A'}...`);
    console.log('');
  });

  // Count totals
  const counts = await client.query(`
    SELECT
      COUNT(*) as total,
      COUNT(DISTINCT service_area_type) as service_types,
      COUNT(*) FILTER (WHERE predominant_financing IS NOT NULL) as has_financing,
      COUNT(*) FILTER (WHERE predominant_market IS NOT NULL) as has_market
    FROM cdes_merged WHERE status = 'active';
  `);

  console.log('─── Totals ───');
  console.log(`Total Active CDEs: ${counts.rows[0].total}`);
  console.log(`With Financing Type: ${counts.rows[0].has_financing}`);
  console.log(`With Market Description: ${counts.rows[0].has_market}`);

  await client.end();
}

sampleData().catch(console.error);
