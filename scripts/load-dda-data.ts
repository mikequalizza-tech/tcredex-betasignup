/**
 * Load DDA CSV data into Supabase
 *
 * Usage: npx tsx scripts/load-dda-data.ts
 *
 * This script:
 * 1. Creates the DDA tables if they don't exist
 * 2. Loads the cleaned CSV files
 * 3. Updates master_tax_credit_sot with DDA flags
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
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

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set (using Supabase)' : 'NOT SET');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CSV_BASE_PATH = 'C:\\tcredex.com\\tracts\\In Supabase CSV';

interface MetroDDA {
  zcta: string;
  cbsasub: string;
  area_name: string;
  population_2020: number;
  population_in_qct: number;
  population_not_in_qct: number;
  safmr_2br: number;
  vlil_4person: number;
  lihtc_max_rent: number;
  sdda_ratio: number;
  pop_over_100: number;
  cumulative_population: number;
  cumulative_percent: number;
  is_sdda: number;
}

interface NonMetroDDA {
  county_fips: string;
  cbsasub: string;
  area_name: string;
  population_2020: number;
  population_in_qct: number;
  effective_population: number;
  fmr_2br: number;
  vlil_4person: number;
  lihtc_max_rent: number;
  dda_ratio: number;
  cumulative_population: number;
  cumulative_percent: number;
  is_nmdda: number;
}

async function createTables() {
  console.log('Creating DDA tables...');

  const client = await pool.connect();
  try {
    // Read and execute migration 031
    const migration031 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/031_dda_tables_and_import.sql'),
      'utf8'
    );
    await client.query(migration031);
    console.log('✓ DDA tables created');
  } finally {
    client.release();
  }
}

async function loadMetroDDA(year: '2025' | '2026') {
  const filename = `dda_metro_${year}_clean.csv`;
  const tableName = `dda_metro_${year}`;

  console.log(`Loading ${filename}...`);

  const csvContent = fs.readFileSync(path.join(CSV_BASE_PATH, filename), 'utf8');
  const { data } = Papa.parse<MetroDDA>(csvContent, { header: true, skipEmptyLines: true });

  const client = await pool.connect();
  try {
    // Clear existing data
    await client.query(`DELETE FROM ${tableName}`);

    // Batch insert
    let inserted = 0;
    const batchSize = 500;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values: string[] = [];
      const params: (string | number | null)[] = [];

      batch.forEach((row, idx) => {
        const offset = idx * 14;
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`);
        params.push(
          row.zcta,
          row.cbsasub,
          row.area_name,
          row.population_2020 || null,
          row.population_in_qct || null,
          row.population_not_in_qct || null,
          row.safmr_2br || null,
          row.vlil_4person || null,
          row.lihtc_max_rent || null,
          row.sdda_ratio || null,
          row.pop_over_100 || null,
          row.cumulative_population || null,
          row.cumulative_percent || null,
          row.is_sdda || null
        );
      });

      await client.query(`
        INSERT INTO ${tableName}
          (zcta, cbsasub, area_name, population_2020, population_in_qct, population_not_in_qct, safmr_2br, vlil_4person, lihtc_max_rent, sdda_ratio, pop_over_100, cumulative_population, cumulative_percent, is_sdda)
        VALUES ${values.join(', ')}
        ON CONFLICT (zcta) DO NOTHING
      `, params);

      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${inserted}/${data.length}`);
    }

    console.log(`\n✓ Loaded ${inserted} rows into ${tableName}`);
  } finally {
    client.release();
  }
}

async function loadNonMetroDDA(year: '2025' | '2026') {
  const filename = `dda_nonmetro_${year}_clean.csv`;
  const tableName = `dda_nonmetro_${year}`;

  console.log(`Loading ${filename}...`);

  const csvContent = fs.readFileSync(path.join(CSV_BASE_PATH, filename), 'utf8');
  const { data } = Papa.parse<NonMetroDDA>(csvContent, { header: true, skipEmptyLines: true });

  const client = await pool.connect();
  try {
    // Clear existing data
    await client.query(`DELETE FROM ${tableName}`);

    // Batch insert
    let inserted = 0;
    const batchSize = 500;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values: string[] = [];
      const params: (string | number | null)[] = [];

      batch.forEach((row, idx) => {
        const offset = idx * 13;
        values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13})`);
        // Parse cumulative_population which may be in scientific notation (e.g., "3.97E+07")
        const cumPop = row.cumulative_population ? Math.round(parseFloat(String(row.cumulative_population))) : null;
        params.push(
          row.county_fips,
          row.cbsasub,
          row.area_name,
          row.population_2020 || null,
          row.population_in_qct || null,
          row.effective_population || null,
          row.fmr_2br || null,
          row.vlil_4person || null,
          row.lihtc_max_rent || null,
          row.dda_ratio || null,
          cumPop,
          row.cumulative_percent || null,
          row.is_nmdda || null
        );
      });

      await client.query(`
        INSERT INTO ${tableName}
          (county_fips, cbsasub, area_name, population_2020, population_in_qct, effective_population, fmr_2br, vlil_4person, lihtc_max_rent, dda_ratio, cumulative_population, cumulative_percent, is_nmdda)
        VALUES ${values.join(', ')}
        ON CONFLICT (county_fips) DO NOTHING
      `, params);

      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${inserted}/${data.length}`);
    }

    console.log(`\n✓ Loaded ${inserted} rows into ${tableName}`);
  } finally {
    client.release();
  }
}

async function updateDDAFlags() {
  console.log('Updating DDA flags in master_tax_credit_sot...');

  const client = await pool.connect();
  try {
    // Read and execute migration 032
    const migration032 = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/032_update_dda_flags.sql'),
      'utf8'
    );
    await client.query(migration032);
    console.log('✓ DDA flags updated');

    // Verify counts
    const result = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_dda_2025) as dda_2025_tracts,
        COUNT(*) FILTER (WHERE is_dda_2026) as dda_2026_tracts,
        COUNT(*) FILTER (WHERE is_dda_2025 AND is_lihtc_qct_2025) as qct_plus_dda_2025,
        COUNT(*) FILTER (WHERE is_dda_2026 AND is_lihtc_qct_2026) as qct_plus_dda_2026
      FROM master_tax_credit_sot
    `);

    console.log('\n=== DDA Summary ===');
    console.log(`DDA 2025 tracts: ${result.rows[0].dda_2025_tracts}`);
    console.log(`DDA 2026 tracts: ${result.rows[0].dda_2026_tracts}`);
    console.log(`QCT + DDA 2025 (30% boost): ${result.rows[0].qct_plus_dda_2025}`);
    console.log(`QCT + DDA 2026 (30% boost): ${result.rows[0].qct_plus_dda_2026}`);
  } finally {
    client.release();
  }
}

async function main() {
  console.log('=== DDA Data Loader ===\n');

  try {
    // Step 1: Create tables
    await createTables();

    // Step 2: Load CSV data
    await loadMetroDDA('2025');
    await loadMetroDDA('2026');
    await loadNonMetroDDA('2025');
    await loadNonMetroDDA('2026');

    // Step 3: Update DDA flags
    await updateDDAFlags();

    console.log('\n=== Done! ===');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
