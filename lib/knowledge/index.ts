/**
 * ChatTC Knowledge System
 * 
 * Provides RAG (Retrieval Augmented Generation) capabilities for ChatTC
 * 
 * Usage:
 * 1. Ingest documents: ingestDocument(file, options)
 * 2. Search knowledge: searchKnowledge(query, options)
 * 3. Get RAG context: retrieveContext(query)
 * 4. Enhanced chat: getEnhancedSystemPrompt(basePrompt, userQuery)
 */

// Types
export type {
  KnowledgeCategory,
  DocumentMetadata,
  DocumentChunk,
  SearchResult,
  KnowledgeSearchParams,
  IngestResult,
  RAGContext,
  Citation,
} from './types';

// Ingestion
export {
  ingestDocument,
  ingestDocuments,
  reingestDocument,
  extractPDFText,
  estimateIngestionCost,
} from './ingest';

// Vector Store
export {
  storeDocument,
  getDocument,
  listDocuments,
  deleteDocument,
  storeChunk,
  storeChunks,
  getChunksForDocument,
  searchKnowledge,
  searchSimilar,
  SETUP_SQL,
} from './vectorStore';

// Embeddings
export {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from './embeddings';

// Chunking
export {
  chunkText,
  createDocumentChunks,
  chunkPagesText,
  getOptimalChunkSize,
  estimateTokens,
} from './chunker';

// RAG Retrieval
export {
  analyzeQuery,
  retrieveContext,
  getEnhancedSystemPrompt,
  formatCitationsForDisplay,
  hasKnowledgeFor,
} from './retriever';
