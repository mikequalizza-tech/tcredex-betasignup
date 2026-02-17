/**
 * Setup Knowledge Base Tables
 * Creates pgvector extension and knowledge tables in Supabase
 * Run: node scripts/setup-knowledge-tables.js
 */

const { Client } = require('pg');
const { config } = require('dotenv');
const { resolve } = require('path');

config({ path: resolve(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set in .env.local');
  process.exit(1);
}

const SETUP_SQL = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table (metadata)
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  category TEXT NOT NULL,
  program TEXT,
  title TEXT,
  source TEXT,
  page_count INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by TEXT,
  checksum TEXT,
  UNIQUE(checksum)
);

-- Chunks table (with embeddings)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS knowledge_chunks_category_idx
ON knowledge_chunks ((metadata->>'category'));

-- Similarity search function
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_categories TEXT[] DEFAULT NULL,
  filter_programs TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    kc.metadata,
    kc.created_at,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE
    (filter_categories IS NULL OR kc.metadata->>'category' = ANY(filter_categories))
    AND (filter_programs IS NULL OR kc.metadata->>'program' = ANY(filter_programs))
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Row Level Security
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Service role can manage documents" ON knowledge_documents;
DROP POLICY IF EXISTS "Service role can manage chunks" ON knowledge_chunks;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON knowledge_documents;
DROP POLICY IF EXISTS "Authenticated users can read chunks" ON knowledge_chunks;

-- Allow service role full access
CREATE POLICY "Service role can manage documents" ON knowledge_documents
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage chunks" ON knowledge_chunks
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read documents" ON knowledge_documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read chunks" ON knowledge_chunks
  FOR SELECT USING (auth.role() = 'authenticated');
`;

async function setup() {
  console.log('Connecting to database...');
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected. Creating knowledge base tables...\n');

    await client.query(SETUP_SQL);

    console.log('SUCCESS: Knowledge base tables created!');
    console.log('  - knowledge_documents table');
    console.log('  - knowledge_chunks table (with pgvector)');
    console.log('  - search_knowledge() RPC function');
    console.log('  - RLS policies');

    // Verify
    const { rows } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'knowledge%'"
    );
    console.log('\nVerified tables:', rows.map(r => r.table_name).join(', '));

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
