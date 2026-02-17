/**
 * Seed Test Data Script
 * Creates test users in each role table for testing
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

// Test data
const TEST_SPONSOR = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'test-sponsor@tcredex.test',
  company_name: 'Test Development Corp',
  first_name: 'Sarah',
  last_name: 'Sponsor',
  phone: '555-100-1000',
  state: 'MO',
  city: 'St. Louis'
};

const TEST_CDE = {
  organization_id: '22222222-2222-2222-2222-222222222222',
  name: 'Test CDE Capital',
  service_area_type: 'statewide',
  primary_states: ['MO', 'IL', 'KS'],
  predominant_financing: 'Real Estate Financing - Healthcare/Community Facilities',
  total_allocation: 50000000,
  amount_remaining: 35000000,
  rural_focus: true,
  urban_focus: true,
  nonprofit_preferred: true,
  contact_email: 'test-cde@tcredex.test',
  contact_name: 'Chris CDE'
};

const TEST_INVESTOR = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'test-investor@tcredex.test',
  company_name: 'Test Bank Capital',
  first_name: 'Ivan',
  last_name: 'Investor',
  cra_focus_states: ['MO', 'IL', 'KS', 'AR'],
  min_investment: 5000000,
  max_investment: 25000000
};

const TEST_DEAL = {
  id: '44444444-4444-4444-4444-444444444444',
  project_name: 'Test Community Health Center',
  sponsor_id: TEST_SPONSOR.id,
  sponsor_name: TEST_SPONSOR.company_name,
  programs: ['nmtc'],
  state: 'MO',
  city: 'St. Louis',
  census_tract: '29510101100',
  project_type: 'healthcare',
  total_project_cost: 15000000,
  nmtc_financing_requested: 8000000,
  status: 'available',
  visible: true,
  tract_eligible: true,
  tract_severely_distressed: true,
  is_rural: false,
  is_non_profit: true
};

async function seedTestData() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('='.repeat(60));
  console.log('SEEDING TEST DATA');
  console.log('='.repeat(60));

  // First, check existing schemas
  console.log('\n1. Checking table schemas...');

  // Get sponsors columns
  const sponsorCols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'sponsors'
  `);
  console.log('Sponsors columns:', sponsorCols.rows.map(r => r.column_name).join(', '));

  // Get investors columns
  const investorCols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'investors'
  `);
  console.log('Investors columns:', investorCols.rows.map(r => r.column_name).join(', '));

  // Get users columns
  const userCols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'users'
  `);
  console.log('Users columns:', userCols.rows.map(r => r.column_name).slice(0, 15).join(', '), '...');

  // ===== CREATE TEST SPONSOR =====
  console.log('\n2. Creating test Sponsor...');
  try {
    // Check if sponsor exists
    const existingSponsor = await client.query('SELECT id FROM sponsors WHERE email = $1', [TEST_SPONSOR.email]);
    if (existingSponsor.rows.length > 0) {
      console.log('   Test sponsor already exists, skipping');
    } else {
      // Get actual column names
      const cols = sponsorCols.rows.map(r => r.column_name);

      // Build insert dynamically based on available columns
      const insertCols = [];
      const insertVals = [];
      const insertParams = [];
      let paramNum = 1;

      if (cols.includes('id')) { insertCols.push('id'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.id); }
      if (cols.includes('email')) { insertCols.push('email'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.email); }
      if (cols.includes('company_name')) { insertCols.push('company_name'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.company_name); }
      if (cols.includes('name')) { insertCols.push('name'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.company_name); }
      if (cols.includes('first_name')) { insertCols.push('first_name'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.first_name); }
      if (cols.includes('last_name')) { insertCols.push('last_name'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.last_name); }
      if (cols.includes('phone')) { insertCols.push('phone'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.phone); }
      if (cols.includes('state')) { insertCols.push('state'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.state); }
      if (cols.includes('city')) { insertCols.push('city'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_SPONSOR.city); }

      const sql = `INSERT INTO sponsors (${insertCols.join(', ')}) VALUES (${insertVals.join(', ')})`;
      await client.query(sql, insertParams);
      console.log('   ✅ Created test sponsor:', TEST_SPONSOR.email);
    }
  } catch (e) {
    console.log('   ❌ Sponsor error:', e.message);
  }

  // ===== CREATE TEST CDE (in cdes_merged) =====
  console.log('\n3. Creating test CDE...');
  try {
    const existingCDE = await client.query('SELECT id FROM cdes_merged WHERE organization_id = $1', [TEST_CDE.organization_id]);
    if (existingCDE.rows.length > 0) {
      console.log('   Test CDE already exists, skipping');
    } else {
      await client.query(`
        INSERT INTO cdes_merged (
          id, organization_id, name, slug, year,
          service_area_type, primary_states, predominant_financing,
          total_allocation, amount_remaining,
          rural_focus, urban_focus, nonprofit_preferred,
          contact_email, contact_name, status
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 2026,
          $4, $5, $6,
          $7, $8,
          $9, $10, $11,
          $12, $13, 'active'
        )
      `, [
        TEST_CDE.organization_id,
        TEST_CDE.name,
        'test-cde-capital',
        TEST_CDE.service_area_type,
        TEST_CDE.primary_states,
        TEST_CDE.predominant_financing,
        TEST_CDE.total_allocation,
        TEST_CDE.amount_remaining,
        TEST_CDE.rural_focus,
        TEST_CDE.urban_focus,
        TEST_CDE.nonprofit_preferred,
        TEST_CDE.contact_email,
        TEST_CDE.contact_name
      ]);
      console.log('   ✅ Created test CDE:', TEST_CDE.name);
    }
  } catch (e) {
    console.log('   ❌ CDE error:', e.message);
  }

  // ===== CREATE TEST INVESTOR =====
  console.log('\n4. Creating test Investor...');
  try {
    const existingInvestor = await client.query('SELECT id FROM investors WHERE email = $1', [TEST_INVESTOR.email]);
    if (existingInvestor.rows.length > 0) {
      console.log('   Test investor already exists, skipping');
    } else {
      const cols = investorCols.rows.map(r => r.column_name);

      const insertCols = [];
      const insertVals = [];
      const insertParams = [];
      let paramNum = 1;

      if (cols.includes('id')) { insertCols.push('id'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_INVESTOR.id); }
      if (cols.includes('email')) { insertCols.push('email'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_INVESTOR.email); }
      if (cols.includes('company_name')) { insertCols.push('company_name'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_INVESTOR.company_name); }
      if (cols.includes('name')) { insertCols.push('name'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_INVESTOR.company_name); }
      if (cols.includes('first_name')) { insertCols.push('first_name'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_INVESTOR.first_name); }
      if (cols.includes('last_name')) { insertCols.push('last_name'); insertVals.push(`$${paramNum++}`); insertParams.push(TEST_INVESTOR.last_name); }

      if (insertCols.length > 0) {
        const sql = `INSERT INTO investors (${insertCols.join(', ')}) VALUES (${insertVals.join(', ')})`;
        await client.query(sql, insertParams);
        console.log('   ✅ Created test investor:', TEST_INVESTOR.email);
      }
    }
  } catch (e) {
    console.log('   ❌ Investor error:', e.message);
  }

  // ===== CREATE TEST DEAL =====
  console.log('\n5. Creating test Deal...');
  try {
    const existingDeal = await client.query('SELECT id FROM deals WHERE id = $1', [TEST_DEAL.id]);
    if (existingDeal.rows.length > 0) {
      console.log('   Test deal already exists, skipping');
    } else {
      await client.query(`
        INSERT INTO deals (
          id, project_name, sponsor_id, sponsor_name, programs,
          state, city, census_tract, project_type,
          total_project_cost, nmtc_financing_requested,
          status, visible, tract_eligible, tract_severely_distressed,
          is_rural, is_non_profit
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11,
          $12, $13, $14, $15,
          $16, $17
        )
      `, [
        TEST_DEAL.id,
        TEST_DEAL.project_name,
        TEST_DEAL.sponsor_id,
        TEST_DEAL.sponsor_name,
        TEST_DEAL.programs,
        TEST_DEAL.state,
        TEST_DEAL.city,
        TEST_DEAL.census_tract,
        TEST_DEAL.project_type,
        TEST_DEAL.total_project_cost,
        TEST_DEAL.nmtc_financing_requested,
        TEST_DEAL.status,
        TEST_DEAL.visible,
        TEST_DEAL.tract_eligible,
        TEST_DEAL.tract_severely_distressed,
        TEST_DEAL.is_rural,
        TEST_DEAL.is_non_profit
      ]);
      console.log('   ✅ Created test deal:', TEST_DEAL.project_name);
    }
  } catch (e) {
    console.log('   ❌ Deal error:', e.message);
  }

  // ===== VERIFY DATA =====
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION');
  console.log('='.repeat(60));

  const sponsors = await client.query('SELECT COUNT(*) as count FROM sponsors');
  const cdes = await client.query('SELECT COUNT(*) as count FROM cdes_merged WHERE status = $1', ['active']);
  const investors = await client.query('SELECT COUNT(*) as count FROM investors');
  const deals = await client.query('SELECT COUNT(*) as count FROM deals');
  const matchRequests = await client.query('SELECT COUNT(*) as count FROM match_requests');

  console.log(`\nSponsors: ${sponsors.rows[0].count}`);
  console.log(`Active CDEs: ${cdes.rows[0].count}`);
  console.log(`Investors: ${investors.rows[0].count}`);
  console.log(`Deals: ${deals.rows[0].count}`);
  console.log(`Match Requests: ${matchRequests.rows[0].count}`);

  // Show test deal for AutoMatch
  console.log('\n' + '='.repeat(60));
  console.log('TEST DEAL FOR AUTOMATCH');
  console.log('='.repeat(60));
  const testDeal = await client.query('SELECT * FROM deals WHERE id = $1', [TEST_DEAL.id]);
  if (testDeal.rows.length > 0) {
    const d = testDeal.rows[0];
    console.log(`
  ID: ${d.id}
  Name: ${d.project_name}
  State: ${d.state}
  Type: ${d.project_type}
  NMTC Request: $${(d.nmtc_financing_requested/1000000).toFixed(1)}M
  Severely Distressed: ${d.tract_severely_distressed}
  Rural: ${d.is_rural}
  Non-Profit: ${d.is_non_profit}
`);
  }

  await client.end();
  console.log('\n✅ Test data seeding complete!');
}

seedTestData().catch(console.error);
