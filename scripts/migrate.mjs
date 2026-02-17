/**
 * Execute Supabase Migration via Direct PostgreSQL Connection
 * Run: node scripts/migrate.mjs
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase PostgreSQL connection string
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.xlejizyoggqdedjkyset:MQ19712024@!@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  console.log('🚀 tCredex Supabase Migration\n');
  console.log('Connecting to database...\n');

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL!\n');

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    
    // Execute schema first
    const schemaFile = path.join(migrationsDir, '001_complete_schema.sql');
    console.log('📋 Reading schema migration...');
    const schemaSql = fs.readFileSync(schemaFile, 'utf8');
    
    console.log('⚙️  Executing schema (this may take a moment)...\n');
    await client.query(schemaSql);
    console.log('✅ Schema migration complete!\n');

    // Execute seed data
    const seedFile = path.join(migrationsDir, '002_seed_data.sql');
    console.log('🌱 Reading seed data...');
    const seedSql = fs.readFileSync(seedFile, 'utf8');
    
    console.log('⚙️  Executing seed data...\n');
    await client.query(seedSql);
    console.log('✅ Seed data complete!\n');

    // Verify
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Created ${result.rows.length} tables:`);
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));

    // Count seed data
    const orgsResult = await client.query('SELECT COUNT(*) FROM organizations');
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    const cdesResult = await client.query('SELECT COUNT(*) FROM cdes');
    const dealsResult = await client.query('SELECT COUNT(*) FROM deals');

    console.log(`\n📈 Seed data counts:`);
    console.log(`   - Organizations: ${orgsResult.rows[0].count}`);
    console.log(`   - Users: ${usersResult.rows[0].count}`);
    console.log(`   - CDEs: ${cdesResult.rows[0].count}`);
    console.log(`   - Deals: ${dealsResult.rows[0].count}`);

    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some tables already exist. To reset:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Run: DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      console.log('   3. Re-run this migration');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
