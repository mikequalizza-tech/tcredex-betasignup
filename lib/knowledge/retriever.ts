/**
 * ChatTC Knowledge System — RAG Retriever
 *
 * Handles retrieval-augmented generation for chat:
 * 1. Analyze user query to determine relevant categories
 * 2. Retrieve relevant chunks from vector store
 * 3. Format context for injection into system prompt
 * 4. Track citations for transparency
 */

import { searchKnowledge } from "./vectorStore";
import { RAGContext, SearchResult, KnowledgeCategory, Citation } from "./types";

// Query analysis patterns
const CATEGORY_PATTERNS: {
  pattern: RegExp;
  categories: KnowledgeCategory[];
}[] = [
  // Platform queries
  {
    pattern:
      /\b(tcredex|platform|intake|form|submit|deal|marketplace|closing room|readiness|match)\b/i,
    categories: ["platform"],
  },

  // NMTC queries
  {
    pattern:
      /\b(nmtc|new markets?|qalicb|qlici|qei|cde|low.?income community|qualified active)\b/i,
    categories: ["nmtc"],
  },
  { pattern: /\b(allocation|39%|7.year)\b/i, categories: ["nmtc"] },

  // HTC queries
  {
    pattern:
      /\b(htc|historic|rehabilitation|qre|part.?[123]|national register|shpo|preservation)\b/i,
    categories: ["htc"],
  },
  { pattern: /\b(20% credit|substantial rehab)\b/i, categories: ["htc"] },

  // LIHTC queries
  {
    pattern:
      /\b(lihtc|low.?income housing|affordable|ami|area median|9%|4%|housing credit)\b/i,
    categories: ["lihtc"],
  },
  {
    pattern: /\b(set.?aside|income averaging|qap|housing finance)\b/i,
    categories: ["lihtc"],
  },

  // OZ queries
  {
    pattern:
      /\b(oz|opportunity zone|qof|qozb|capital gains?|180.?day|substantial improvement)\b/i,
    categories: ["oz"],
  },
  { pattern: /\b(deferral|exclusion|10.?year)\b/i, categories: ["oz"] },

  // Compliance queries
  {
    pattern:
      /\b(compliance|audit|report|deadline|timeline|recapture|violation)\b/i,
    categories: ["compliance"],
  },

  // State credit queries
  {
    pattern: /\b(state credit|state tax|state incentive)\b/i,
    categories: ["state"],
  },
];

// Program keywords for filtering
const PROGRAM_KEYWORDS: { pattern: RegExp; program: string }[] = [
  { pattern: /\bnmtc\b/i, program: "NMTC" },
  { pattern: /\bhtc\b/i, program: "HTC" },
  { pattern: /\blihtc\b/i, program: "LIHTC" },
  { pattern: /\boz\b/i, program: "OZ" },
  { pattern: /\bopportunity zone/i, program: "OZ" },
  { pattern: /\bhistoric/i, program: "HTC" },
  { pattern: /\bhousing credit/i, program: "LIHTC" },
  { pattern: /\bnew markets/i, program: "NMTC" },
];

/**
 * Analyze query to determine relevant categories
 */
export function analyzeQuery(query: string): {
  categories: KnowledgeCategory[];
  programs: string[];
  isGeneral: boolean;
} {
  const categories = new Set<KnowledgeCategory>();
  const programs = new Set<string>();

  // Check category patterns
  for (const { pattern, categories: cats } of CATEGORY_PATTERNS) {
    if (pattern.test(query)) {
      cats.forEach((c) => categories.add(c));
    }
  }

  // Check program keywords
  for (const { pattern, program } of PROGRAM_KEYWORDS) {
    if (pattern.test(query)) {
      programs.add(program);
    }
  }

  // If no specific categories detected, search broadly
  const isGeneral = categories.size === 0;

  return {
    categories: Array.from(categories),
    programs: Array.from(programs),
    isGeneral,
  };
}

/**
 * Retrieve relevant context for a query
 */
export async function retrieveContext(
  query: string,
  options: {
    maxChunks?: number;
    minScore?: number;
    includeAllCategories?: boolean;
  } = {},
): Promise<RAGContext> {
  const {
    maxChunks = 5,
    minScore = 0.7,
    includeAllCategories = false,
  } = options;

  // Analyze query
  const { categories, programs, isGeneral } = analyzeQuery(query);

  // Search parameters
  const searchParams = {
    categories: includeAllCategories || isGeneral ? undefined : categories,
    programs: programs.length > 0 ? programs : undefined,
    limit: maxChunks,
    minScore,
  };

  // Search knowledge base
  const results = await searchKnowledge(query, searchParams);

  // If no results with category filter, try broader search
  if (results.length === 0 && !isGeneral && !includeAllCategories) {
    const broadResults = await searchKnowledge(query, {
      limit: maxChunks,
      minScore: minScore - 0.1, // Lower threshold for broad search
    });
    return formatRAGContext(broadResults);
  }

  return formatRAGContext(results);
}

/**
 * Format search results into RAG context
 */
function formatRAGContext(results: SearchResult[]): RAGContext {
  if (results.length === 0) {
    return {
      chunks: [],
      systemPromptAddition: "",
      citations: [],
    };
  }

  // Build citations
  const citations: Citation[] = results.map((result, index) => ({
    id: `[${index + 1}]`,
    source: result.chunk.metadata.filename,
    page: result.chunk.metadata.page,
    text: result.chunk.content.slice(0, 200) + "...",
  }));

  // Build context string for system prompt
  const contextParts = results.map((result, index) => {
    const { chunk, score } = result;
    const source = chunk.metadata.filename;
    const page = chunk.metadata.page ? ` (page ${chunk.metadata.page})` : "";
    const category = chunk.metadata.category;

    return `[${index + 1}] Source: ${source}${page} [${category}] (relevance: ${(score * 100).toFixed(0)}%)
${chunk.content}`;
  });

  const systemPromptAddition = `
<knowledge_context>
The following information from the tCredex knowledge base is relevant to this query. Use this information to provide accurate, specific answers. Cite sources using [1], [2], etc. when referencing specific information.

${contextParts.join("\n\n---\n\n")}
</knowledge_context>

Important instructions for using this context:
- Prioritize information from the knowledge context over general knowledge
- If the context contains specific numbers, dates, or requirements, use those exact values
- Cite sources when providing specific facts or requirements
- If the context doesn't contain enough information to fully answer, say so and provide what you can
- For platform questions, reference the tCredex-specific information
- For program questions (NMTC, HTC, LIHTC, OZ), use the official guidance provided`;

  return {
    chunks: results,
    systemPromptAddition,
    citations,
  };
}

/**
 * Get enhanced system prompt with RAG context
 */
export async function getEnhancedSystemPrompt(
  basePrompt: string,
  userQuery: string,
): Promise<{
  systemPrompt: string;
  citations: Citation[];
  chunksUsed: number;
}> {
  // Retrieve relevant context
  const context = await retrieveContext(userQuery);

  // Combine base prompt with context
  const systemPrompt = context.systemPromptAddition
    ? `${basePrompt}\n\n${context.systemPromptAddition}`
    : basePrompt;

  return {
    systemPrompt,
    citations: context.citations,
    chunksUsed: context.chunks.length,
  };
}

/**
 * Format citations for display to user
 */
export function formatCitationsForDisplay(citations: Citation[]): string {
  if (citations.length === 0) return "";

  const formatted = citations.map((c) => {
    const page = c.page ? `, page ${c.page}` : "";
    return `${c.id} ${c.source}${page}`;
  });

  return "\n\n---\nSources:\n" + formatted.join("\n");
}

/**
 * Check if knowledge base has content for a category
 */
export async function hasKnowledgeFor(
  category: KnowledgeCategory,
): Promise<boolean> {
  try {
    const results = await searchKnowledge("test query", {
      categories: [category],
      limit: 1,
      minScore: 0.0, // Any score
    });
    return results.length > 0;
  } catch {
    return false;
  }
}
