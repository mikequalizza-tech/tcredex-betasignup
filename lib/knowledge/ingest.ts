/**
 * ChatTC Knowledge System — Document Ingestion Pipeline
 *
 * Handles:
 * 1. PDF text extraction
 * 2. Document chunking
 * 3. Embedding generation
 * 4. Vector store insertion
 */

import { v4 as uuidv4 } from "uuid";
import {
  DocumentMetadata,
  DocumentChunk,
  KnowledgeCategory,
  IngestResult,
} from "./types";
import { generateEmbeddings } from "./embeddings";
import { storeDocument, storeChunks, deleteDocument } from "./vectorStore";
import {
  chunkText,
  createDocumentChunks,
  getOptimalChunkSize,
  estimateTokens,
} from "./chunker";
import crypto from "crypto";
import Papa from "papaparse";

// Batch size for embedding generation (OpenAI limit is ~2048 per request)
const EMBEDDING_BATCH_SIZE = 20;

/**
 * Calculate checksum for document deduplication
 */
function calculateChecksum(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Extract text from PDF using pdf-parse (server-side)
 * Note: Requires pdf-parse package
 */
export async function extractPDFText(buffer: Buffer): Promise<{
  text: string;
  pages: { pageNumber: number; text: string }[];
  pageCount: number;
}> {
  try {
    // Dynamic import for server-side only
    const pdfParse = (await import("pdf-parse")).default;

    const data = await pdfParse(buffer, {
      // Return page-by-page text
      pagerender: async (pageData: {
        getTextContent: () => Promise<{ items: { str: string }[] }>;
      }) => {
        const textContent = await pageData.getTextContent();
        return textContent.items
          .map((item: { str: string }) => item.str)
          .join(" ");
      },
    });

    // Split by page markers if available, otherwise use full text
    const pages = data.text
      .split(/\f/) // Form feed character often separates pages
      .filter((p: string) => p.trim())
      .map((text: string, index: number) => ({
        pageNumber: index + 1,
        text: text.trim(),
      }));

    return {
      text: data.text,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: data.text }],
      pageCount: data.numpages,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract PDF text: ${error}`);
  }
}

/**
 * Extract text from CSV/Excel using PapaParse
 * Groups rows into logical chunks (pages)
 */
export async function extractCSVText(buffer: Buffer): Promise<{
  text: string;
  pages: { pageNumber: number; text: string }[];
  pageCount: number;
}> {
  return new Promise((resolve, reject) => {
    try {
      const csvContent = buffer.toString("utf-8");

      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn("CSV parsing warnings:", results.errors);
          }

          const rows = results.data as Record<string, string | null>[];
          // Group rows to maintain context (e.g. 10 rows per "page")
          // This creates natural breakpoints for the chunker later
          const ROW_GROUP_SIZE = 10;

          const pages: { pageNumber: number; text: string }[] = [];

          // Process rows into formatted text blocks
          for (let i = 0; i < rows.length; i += ROW_GROUP_SIZE) {
            const chunkRows = rows.slice(i, i + ROW_GROUP_SIZE);
            const chunkText = chunkRows
              .map((row) => {
                // Format each row as "Key: Value" lines
                return Object.entries(row)
                  .filter(([_, value]) => value !== null && value !== "") // Skip empty values
                  .map(([key, value]) => `${key}: ${value}`)
                  .join("\n");
              })
              .join("\n\n---\n\n"); // Separator between rows

            pages.push({
              pageNumber: Math.floor(i / ROW_GROUP_SIZE) + 1,
              text: chunkText,
            });
          }

          // Combine all pages for the full text (used for checksum/search fallback)
          const text = pages.map((p) => p.text).join("\n\n=== SECTION ===\n\n");

          resolve({
            text,
            pages,
            pageCount: pages.length,
          });
        },
        error: (error: Error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
      });
    } catch (error) {
      reject(new Error(`Failed to process CSV buffer: ${error}`));
    }
  });
}

/**
 * Main ingestion function
 */
export async function ingestDocument(
  file: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  },
  options: {
    category: KnowledgeCategory;
    program?: string;
    title?: string;
    source?: string;
    uploadedBy?: string;
  },
): Promise<IngestResult> {
  const documentId = uuidv4();

  try {
    // 1. Extract text based on file type
    let text: string;
    let pageCount = 1;
    let _pages: { pageNumber: number; text: string }[] = [];

    if (file.mimeType === "application/pdf") {
      const extracted = await extractPDFText(file.buffer);
      text = extracted.text;
      _pages = extracted.pages;
      pageCount = extracted.pageCount;
    } else if (
      file.mimeType === "text/csv" ||
      file.mimeType === "application/vnd.ms-excel"
    ) {
      const extracted = await extractCSVText(file.buffer);
      text = extracted.text;
      _pages = extracted.pages;
      pageCount = extracted.pageCount;
    } else if (
      file.mimeType === "text/plain" ||
      file.mimeType === "text/markdown"
    ) {
      text = file.buffer.toString("utf-8");
      _pages = [{ pageNumber: 1, text }];
    } else {
      throw new Error(`Unsupported file type: ${file.mimeType}`);
    }

    // 2. Calculate checksum for deduplication
    const checksum = calculateChecksum(text);

    // 3. Create document metadata
    const docMetadata: DocumentMetadata = {
      id: documentId,
      filename: file.filename,
      category: options.category,
      program: options.program,
      title: options.title || file.filename.replace(/\.[^/.]+$/, ""),
      source: options.source,
      pageCount,
      uploadedAt: new Date().toISOString(),
      uploadedBy: options.uploadedBy,
      checksum,
    };

    // 4. Store document metadata
    await storeDocument(docMetadata);

    // 5. Chunk the document
    const chunkOptions = getOptimalChunkSize(options.category);
    const textChunks = chunkText(text, chunkOptions);

    const chunks = createDocumentChunks(documentId, textChunks, {
      category: options.category,
      program: options.program,
      filename: file.filename,
    });

    console.log(`Created ${chunks.length} chunks for ${file.filename}`);

    // 6. Generate embeddings in batches
    const chunksWithEmbeddings: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const texts = batch.map((c) => c.content);

      console.log(
        `Generating embeddings for batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(chunks.length / EMBEDDING_BATCH_SIZE)}`,
      );

      const embeddings = await generateEmbeddings(texts);

      for (let j = 0; j < batch.length; j++) {
        chunksWithEmbeddings.push({
          ...batch[j],
          embedding: embeddings[j].embedding,
        });
      }
    }

    // 7. Store chunks with embeddings
    await storeChunks(chunksWithEmbeddings);

    console.log(
      `Successfully ingested ${file.filename}: ${chunksWithEmbeddings.length} chunks`,
    );

    return {
      documentId,
      filename: file.filename,
      chunksCreated: chunksWithEmbeddings.length,
      status: "success",
    };
  } catch (error: unknown) {
    console.error(`Ingestion error for ${file.filename}:`, error);

    // Clean up partial ingestion
    try {
      await deleteDocument(documentId);
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }

    return {
      documentId,
      filename: file.filename,
      chunksCreated: 0,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Ingest multiple documents
 */
export async function ingestDocuments(
  files: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    category: KnowledgeCategory;
    program?: string;
  }[],
  uploadedBy?: string,
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];

  for (const file of files) {
    const result = await ingestDocument(
      {
        buffer: file.buffer,
        filename: file.filename,
        mimeType: file.mimeType,
      },
      {
        category: file.category,
        program: file.program,
        uploadedBy,
      },
    );
    results.push(result);
  }

  return results;
}

/**
 * Re-ingest a document (delete and re-create)
 */
export async function reingestDocument(
  documentId: string,
  file: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  },
  options: {
    category: KnowledgeCategory;
    program?: string;
    title?: string;
    source?: string;
    uploadedBy?: string;
  },
): Promise<IngestResult> {
  // Delete existing
  await deleteDocument(documentId);

  // Re-ingest
  return ingestDocument(file, options);
}

/**
 * Estimate ingestion cost (tokens for embeddings)
 */
export function estimateIngestionCost(text: string): {
  estimatedTokens: number;
  estimatedChunks: number;
  estimatedCost: number;
} {
  const chunks = chunkText(text);
  const totalTokens = chunks.reduce(
    (sum, chunk) => sum + estimateTokens(chunk),
    0,
  );

  // OpenAI text-embedding-3-small: $0.00002 per 1K tokens
  const estimatedCost = (totalTokens / 1000) * 0.00002;

  return {
    estimatedTokens: totalTokens,
    estimatedChunks: chunks.length,
    estimatedCost,
  };
}
