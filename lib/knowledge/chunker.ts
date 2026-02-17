/**
 * ChatTC Knowledge System — Document Chunker
 * 
 * Splits documents into chunks suitable for embedding
 * Preserves context and metadata for each chunk
 */

import { DocumentChunk, KnowledgeCategory } from './types';
import { v4 as uuidv4 } from 'uuid';

// Chunking configuration
const DEFAULT_CHUNK_SIZE = 1000;      // Target characters per chunk
const DEFAULT_CHUNK_OVERLAP = 200;    // Overlap between chunks
const MIN_CHUNK_SIZE = 100;           // Minimum chunk size
const MAX_CHUNK_SIZE = 2000;          // Maximum chunk size

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  preserveParagraphs?: boolean;
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): string[] {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
    preserveParagraphs = true,
  } = options;

  // Clean the text
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanedText.length <= chunkSize) {
    return [cleanedText];
  }

  const chunks: string[] = [];

  if (preserveParagraphs) {
    // Split by paragraphs first
    const paragraphs = cleanedText.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      
      if (!trimmedPara) continue;

      // If paragraph alone is too big, split it by sentences
      if (trimmedPara.length > MAX_CHUNK_SIZE) {
        // Flush current chunk
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        // Split large paragraph by sentences
        const sentences = splitBySentences(trimmedPara);
        let sentenceChunk = '';
        
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length > chunkSize && sentenceChunk) {
            chunks.push(sentenceChunk.trim());
            // Keep overlap
            const words = sentenceChunk.split(' ');
            const overlapWords = words.slice(-Math.floor(chunkOverlap / 5));
            sentenceChunk = overlapWords.join(' ') + ' ' + sentence;
          } else {
            sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
          }
        }
        if (sentenceChunk) {
          currentChunk = sentenceChunk;
        }
        continue;
      }

      // Check if adding paragraph exceeds chunk size
      if (currentChunk.length + trimmedPara.length + 2 > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        // Start new chunk with overlap from previous
        if (chunks.length > 0) {
          const lastChunk = chunks[chunks.length - 1];
          const overlapText = getOverlapText(lastChunk, chunkOverlap);
          currentChunk = overlapText + '\n\n' + trimmedPara;
        } else {
          currentChunk = trimmedPara;
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Simple character-based chunking with overlap
    let start = 0;
    while (start < cleanedText.length) {
      const end = Math.min(start + chunkSize, cleanedText.length);
      let chunk = cleanedText.slice(start, end);
      
      // Try to end at a sentence boundary
      if (end < cleanedText.length) {
        const lastPeriod = chunk.lastIndexOf('. ');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > chunkSize * 0.5) {
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }
      
      chunks.push(chunk.trim());
      start = start + chunk.length - chunkOverlap;
    }
  }

  // Filter out chunks that are too small
  return chunks.filter(chunk => chunk.length >= MIN_CHUNK_SIZE);
}

/**
 * Split text by sentences (simple heuristic)
 */
function splitBySentences(text: string): string[] {
  // Match sentence-ending punctuation followed by space or end
  return text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
}

/**
 * Get overlap text from end of chunk
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) return text;
  
  // Try to start at a sentence boundary
  const lastPart = text.slice(-overlapSize);
  const firstSentence = lastPart.indexOf('. ');
  
  if (firstSentence > 0 && firstSentence < overlapSize * 0.5) {
    return lastPart.slice(firstSentence + 2);
  }
  
  return lastPart;
}

/**
 * Create DocumentChunk objects from text chunks
 */
export function createDocumentChunks(
  documentId: string,
  textChunks: string[],
  metadata: {
    category: KnowledgeCategory;
    program?: string;
    filename: string;
    section?: string;
  }
): DocumentChunk[] {
  return textChunks.map((content, index) => ({
    id: uuidv4(),
    documentId,
    content,
    metadata: {
      ...metadata,
      chunkIndex: index,
    },
    createdAt: new Date().toISOString(),
  }));
}

/**
 * Chunk a document with page awareness (for PDFs)
 */
export function chunkPagesText(
  pages: { pageNumber: number; text: string }[],
  documentId: string,
  metadata: {
    category: KnowledgeCategory;
    program?: string;
    filename: string;
  },
  options: ChunkingOptions = {}
): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkText(page.text, options);
    
    for (const content of pageChunks) {
      allChunks.push({
        id: uuidv4(),
        documentId,
        content,
        metadata: {
          ...metadata,
          page: page.pageNumber,
          chunkIndex: globalChunkIndex++,
        },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return allChunks;
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Get optimal chunk size based on content type
 */
export function getOptimalChunkSize(category: KnowledgeCategory): ChunkingOptions {
  switch (category) {
    case 'platform':
      // Platform docs: smaller chunks for precise answers
      return { chunkSize: 800, chunkOverlap: 150 };
    case 'nmtc':
    case 'htc':
    case 'lihtc':
    case 'oz':
      // Program docs: medium chunks with good context
      return { chunkSize: 1000, chunkOverlap: 200 };
    case 'compliance':
      // Compliance: larger chunks for full context
      return { chunkSize: 1200, chunkOverlap: 250 };
    default:
      return { chunkSize: DEFAULT_CHUNK_SIZE, chunkOverlap: DEFAULT_CHUNK_OVERLAP };
  }
}
