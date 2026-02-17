-- ChatTC Knowledge System — Supabase Tables
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Sources (document metadata)
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  program TEXT,
  source_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  chunk_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Chunks (text + embeddings)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_category ON knowledge_sources(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON knowledge_sources(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source_id ON knowledge_chunks(source_id);

-- Vector similarity index (IVFFlat for large datasets)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function for semantic search with filters
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL,
  filter_program TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_id UUID,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  similarity FLOAT,
  source_filename TEXT,
  source_title TEXT,
  source_category TEXT,
  source_program TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.source_id,
    c.content,
    c.metadata,
    c.created_at,
    1 - (c.embedding <=> query_embedding) AS similarity,
    s.filename AS source_filename,
    s.title AS source_title,
    s.category AS source_category,
    s.program AS source_program
  FROM knowledge_chunks c
  JOIN knowledge_sources s ON c.source_id = s.id
  WHERE 
    s.status = 'ready'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR s.category = filter_category)
    AND (filter_program IS NULL OR s.program = filter_program)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Row Level Security (optional - enable if needed)
-- ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_sources_updated_at
  BEFORE UPDATE ON knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant permissions for service role
GRANT ALL ON knowledge_sources TO service_role;
GRANT ALL ON knowledge_chunks TO service_role;
GRANT EXECUTE ON FUNCTION search_knowledge TO service_role;
