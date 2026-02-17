/**
 * Check users table structure and contents
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

async function checkUsers() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Get columns
  const columns = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position;
  `);

  console.log('USERS TABLE COLUMNS:');
  console.log('─'.repeat(60));
  for (const col of columns.rows) {
    const isClerk = col.column_name.toLowerCase().includes('clerk') ||
                   col.column_name === 'external_id' ||
                   col.column_name === 'primary_email_address_id' ||
                   col.column_name === 'primary_phone_number_id' ||
                   col.column_name === 'primary_web3_wallet_id';
    const flag = isClerk ? '🗑️' : '  ';
    console.log(`${flag} ${col.column_name.padEnd(35)} ${col.data_type}`);
  }

  // Get actual user data
  const users = await client.query(`
    SELECT id, email, role, first_name, last_name, organization_id
    FROM users
    LIMIT 10;
  `);

  console.log('\n\nUSERS DATA:');
  console.log('─'.repeat(80));
  for (const user of users.rows) {
    console.log(`${user.email || 'no-email'} | ${user.role || 'no-role'} | ${user.first_name || ''} ${user.last_name || ''} | org: ${user.organization_id || 'none'}`);
  }

  // Check sponsors table
  console.log('\n\nSPONSORS TABLE:');
  console.log('─'.repeat(80));
  const sponsors = await client.query('SELECT * FROM sponsors LIMIT 5');
  const sponsorCols = Object.keys(sponsors.rows[0] || {});
  console.log('Columns:', sponsorCols.join(', '));
  for (const s of sponsors.rows) {
    console.log(`${s.name || s.company_name || 'no-name'} | ${s.email} | org: ${s.organization_id || s.user_id || 'none'}`);
  }

  // Check investors table
  console.log('\n\nINVESTORS TABLE:');
  console.log('─'.repeat(80));
  const investors = await client.query('SELECT * FROM investors LIMIT 5');
  const invCols = Object.keys(investors.rows[0] || {});
  console.log('Columns:', invCols.join(', '));
  for (const i of investors.rows) {
    console.log(`${i.name || i.company_name || 'no-name'} | ${i.email} | org: ${i.organization_id || 'none'}`);
  }

  // Check deals table for organization references
  console.log('\n\nDEALS - ORGANIZATION REFERENCES:');
  console.log('─'.repeat(80));
  const deals = await client.query('SELECT id, project_name, sponsor_id, sponsor_name, state FROM deals LIMIT 10');
  for (const d of deals.rows) {
    console.log(`${d.project_name} | sponsor_id: ${d.sponsor_id} | ${d.state}`);
  }

  await client.end();
}

checkUsers().catch(console.error);
