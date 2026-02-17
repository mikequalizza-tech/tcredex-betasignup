// Delete incomplete CDE data that was imported without contact info
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  if (!line || line.trim().startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx > 0) {
    const key = line.substring(0, idx).trim();
    const value = line.substring(idx + 1).trim();
    process.env[key] = value;
  }
});

async function deleteIncompleteCDEs() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('Deleting incomplete CDE data...\n');

    // First, get the count of CDE organizations and records we're about to delete
    const countResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM organizations WHERE type = 'cde') as org_count,
        (SELECT COUNT(*) FROM cdes) as cde_count
    `);

    console.log(`Found ${countResult.rows[0].org_count} CDE organizations`);
    console.log(`Found ${countResult.rows[0].cde_count} CDE records`);

    await client.query('BEGIN');

    // Delete CDE records first (they reference organizations)
    const deletedCDEs = await client.query('DELETE FROM cdes RETURNING id');
    console.log(`\nDeleted ${deletedCDEs.rowCount} CDE records`);

    // Delete organizations of type 'cde' that were imported without proper data
    // Keep any that have primary_contact_email set (those have been properly filled out)
    const deletedOrgs = await client.query(`
      DELETE FROM organizations
      WHERE type = 'cde'
        AND (primary_contact_email IS NULL OR primary_contact_email = '')
      RETURNING id, name
    `);

    console.log(`Deleted ${deletedOrgs.rowCount} CDE organizations`);

    await client.query('COMMIT');

    console.log('\n=== Deletion Complete ===');
    console.log('The incomplete CDE data has been removed.');
    console.log('Please re-import with a complete dataset that includes contact information.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Deletion failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

deleteIncompleteCDEs().catch(console.error);
