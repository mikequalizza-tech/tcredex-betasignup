/**
 * ChatTC Knowledge System — Type Definitions
 */

export type KnowledgeCategory = 
  | 'platform'      // tCredex platform docs, WPs, specs
  | 'nmtc'          // New Markets Tax Credit
  | 'htc'           // Historic Tax Credit
  | 'lihtc'         // Low-Income Housing Tax Credit
  | 'oz'            // Opportunity Zones
  | 'state'         // State-specific credits
  | 'compliance'    // General compliance guidance
  | 'general';      // General tax credit info

export const CATEGORY_INFO: Record<KnowledgeCategory, { label: string; color: string; description: string }> = {
  platform: { label: 'Platform Docs', color: 'bg-purple-100 text-purple-700', description: 'tCredex platform documentation and specifications' },
  nmtc: { label: 'NMTC', color: 'bg-emerald-100 text-emerald-700', description: 'New Markets Tax Credit resources and guides' },
  htc: { label: 'HTC', color: 'bg-blue-100 text-blue-700', description: 'Historic Tax Credit documentation' },
  lihtc: { label: 'LIHTC', color: 'bg-violet-100 text-violet-700', description: 'Low-Income Housing Tax Credit materials' },
  oz: { label: 'Opportunity Zone', color: 'bg-amber-100 text-amber-700', description: 'Opportunity Zone program information' },
  state: { label: 'State Credits', color: 'bg-cyan-100 text-cyan-700', description: 'State-specific credit documentation' },
  compliance: { label: 'Compliance', color: 'bg-red-100 text-red-700', description: 'Compliance and regulatory guidance' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-700', description: 'General tax credit information' },
};

export interface DocumentMetadata {
  id: string;
  filename: string;
  category: KnowledgeCategory;
  program?: string;
  title?: string;
  source?: string;
  pageCount?: number;
  uploadedAt: string;
  uploadedBy?: string;
  checksum?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    category: KnowledgeCategory;
    program?: string;
    filename: string;
    page?: number;
    section?: string;
    chunkIndex: number;
  };
  createdAt: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document?: DocumentMetadata;
}

export interface KnowledgeSearchParams {
  query: string;
  categories?: KnowledgeCategory[];
  programs?: string[];
  limit?: number;
  minScore?: number;
}

export interface IngestResult {
  documentId: string;
  filename: string;
  chunksCreated: number;
  status: 'success' | 'error';
  error?: string;
}

// RAG context for chat
export interface RAGContext {
  chunks: SearchResult[];
  systemPromptAddition: string;
  citations: Citation[];
}

export interface Citation {
  id: string;
  source: string;
  page?: number;
  text: string;
}
