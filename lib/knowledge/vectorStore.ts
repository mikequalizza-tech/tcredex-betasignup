/**
 * ChatTC Knowledge System — Vector Store
 *
 * Uses Supabase with pgvector extension for similarity search
 *
 * Required Supabase setup:
 * 1. Enable pgvector extension
 * 2. Create documents table
 * 3. Create document_chunks table with vector column
 * 4. Create similarity search function
 */

import {
  DocumentMetadata,
  DocumentChunk,
  SearchResult,
  KnowledgeCategory,
} from "./types";
import { generateEmbedding } from "./embeddings";

// Supabase client config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** A row returned from Supabase REST API */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRestRow = any;

/**
 * Execute a Supabase query via REST API
 */
async function supabaseQuery(
  table: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
  query?: string,
): Promise<SupabaseRestRow[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: method === "POST" ? "return=representation" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${error}`);
  }

  if (method === "DELETE") return [];
  return response.json();
}

/**
 * Execute a Supabase RPC (stored procedure)
 */
async function supabaseRPC(
  functionName: string,
  params: Record<string, unknown>,
): Promise<SupabaseRestRow[]> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase RPC error: ${error}`);
  }

  return response.json();
}

// ============================================================
// DOCUMENT OPERATIONS
// ============================================================

/**
 * Store document metadata
 */
export async function storeDocument(
  doc: DocumentMetadata,
): Promise<DocumentMetadata> {
  // Map camelCase to snake_case for Supabase REST API
  const result = await supabaseQuery("knowledge_documents", "POST", {
    id: doc.id,
    filename: doc.filename,
    category: doc.category,
    program: doc.program,
    title: doc.title,
    source: doc.source,
    page_count: doc.pageCount,
    uploaded_at: doc.uploadedAt,
    uploaded_by: doc.uploadedBy,
    checksum: doc.checksum,
  });
  return result[0];
}

/**
 * Get document by ID
 */
export async function getDocument(
  id: string,
): Promise<DocumentMetadata | null> {
  const result = await supabaseQuery(
    "knowledge_documents",
    "GET",
    null,
    `id=eq.${id}`,
  );
  return result[0] || null;
}

/**
 * List all documents
 */
export async function listDocuments(
  category?: KnowledgeCategory,
): Promise<DocumentMetadata[]> {
  const query = category
    ? `category=eq.${category}&order=uploadedAt.desc`
    : "order=uploadedAt.desc";
  return supabaseQuery("knowledge_documents", "GET", null, query);
}

/**
 * Delete document and its chunks
 */
export async function deleteDocument(id: string): Promise<void> {
  // Delete chunks first (foreign key)
  await supabaseQuery(
    "knowledge_chunks",
    "DELETE",
    null,
    `document_id=eq.${id}`,
  );
  // Delete document
  await supabaseQuery("knowledge_documents", "DELETE", null, `id=eq.${id}`);
}

// ============================================================
// CHUNK OPERATIONS
// ============================================================

/**
 * Store a document chunk with embedding
 */
export async function storeChunk(chunk: DocumentChunk): Promise<DocumentChunk> {
  const result = await supabaseQuery("knowledge_chunks", "POST", {
    id: chunk.id,
    document_id: chunk.documentId,
    content: chunk.content,
    embedding: chunk.embedding,
    metadata: chunk.metadata,
    created_at: chunk.createdAt,
  });
  return result[0];
}

/**
 * Store multiple chunks (batch)
 */
export async function storeChunks(chunks: DocumentChunk[]): Promise<void> {
  const records = chunks.map((chunk) => ({
    id: chunk.id,
    document_id: chunk.documentId,
    content: chunk.content,
    embedding: chunk.embedding,
    metadata: chunk.metadata,
    created_at: chunk.createdAt,
  }));

  await supabaseQuery("knowledge_chunks", "POST", records);
}

/**
 * Get chunks for a document
 */
export async function getChunksForDocument(
  documentId: string,
): Promise<DocumentChunk[]> {
  const result = await supabaseQuery(
    "knowledge_chunks",
    "GET",
    null,
    `document_id=eq.${documentId}&order=metadata->>chunkIndex.asc`,
  );

  return result.map((r) => ({
    id: r.id as string,
    documentId: r.document_id as string,
    content: r.content as string,
    embedding: r.embedding as number[] | undefined,
    metadata: r.metadata as DocumentChunk["metadata"],
    createdAt: r.created_at as string,
  }));
}

// ============================================================
// SIMILARITY SEARCH
// ============================================================

/**
 * Search for similar chunks using vector similarity
 */
export async function searchSimilar(
  queryEmbedding: number[],
  options: {
    categories?: KnowledgeCategory[];
    programs?: string[];
    limit?: number;
    minScore?: number;
  } = {},
): Promise<SearchResult[]> {
  const { categories, programs, limit = 5, minScore = 0.7 } = options;

  // Use pgvector similarity search via RPC
  const results = await supabaseRPC("search_knowledge", {
    query_embedding: queryEmbedding,
    match_threshold: minScore,
    match_count: limit,
    filter_categories: categories || null,
    filter_programs: programs || null,
  });

  return results.map((r) => ({
    chunk: {
      id: r.id as string,
      documentId: r.document_id as string,
      content: r.content as string,
      metadata: r.metadata as DocumentChunk["metadata"],
      createdAt: r.created_at as string,
    },
    score: r.similarity as number,
  }));
}

/**
 * High-level search function - generates embedding and searches
 */
export async function searchKnowledge(
  query: string,
  options: {
    categories?: KnowledgeCategory[];
    programs?: string[];
    limit?: number;
    minScore?: number;
  } = {},
): Promise<SearchResult[]> {
  // Generate embedding for query
  const { embedding } = await generateEmbedding(query);

  // Search for similar chunks
  return searchSimilar(embedding, options);
}

// ============================================================
// DATABASE SETUP SQL
// ============================================================

/**
 * Get knowledge base statistics
 */
export async function getKnowledgeStats(): Promise<{
  totalSources: number;
  totalChunks: number;
  byCategory: Record<string, number>;
}> {
  try {
    const docs = await listDocuments();
    const byCategory: Record<string, number> = {};

    for (const doc of docs) {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    }

    // Get total chunks count
    const chunks = await supabaseQuery(
      "knowledge_chunks",
      "GET",
      null,
      "select=id",
    );

    return {
      totalSources: docs.length,
      totalChunks: Array.isArray(chunks) ? chunks.length : 0,
      byCategory,
    };
  } catch (error) {
    console.error("Failed to get knowledge stats:", error);
    return {
      totalSources: 0,
      totalChunks: 0,
      byCategory: {},
    };
  }
}

/**
 * SQL to set up the knowledge base tables in Supabase
 * Run this in Supabase SQL Editor
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
