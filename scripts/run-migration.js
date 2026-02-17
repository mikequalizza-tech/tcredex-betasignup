// Simple script to run a SQL migration file against Supabase
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local manually without dotenv
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
  if (!line || line.trim().startsWith('#')) return;
  // Split on first = only
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.substring(0, idx).trim();
    const value = line.substring(idx + 1).trim();
    process.env[key] = value;
  }
});

async function runMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file.sql>');
    process.exit(1);
  }

  const migrationPath = path.resolve(migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  const connectionString = process.env.DATABASE_URL;
  console.log('Database URL found:', connectionString ? 'Yes' : 'No');

  const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`Running migration: ${path.basename(migrationFile)}`);
    console.log('Connecting to database...');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      console.log('Executing SQL...');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Migration completed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
