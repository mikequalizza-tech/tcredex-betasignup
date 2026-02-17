/**
 * Knowledge Base Setup SQL
 * Separated to avoid bundling pdf-parse in client components
 */

export const SETUP_SQL = `
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

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

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

-- Row Level Security (optional but recommended)
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

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
