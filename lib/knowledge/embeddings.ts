/**
 * ChatTC Knowledge System — Embeddings
 *
 * Uses OpenAI text-embedding-3-small for vector generation
 * Dimension: 1536 (can be reduced to 512 for cost savings)
 */

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
  text: string,
): Promise<EmbeddingResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Validate key format (should start with sk- or sk-proj-)
  if (!apiKey.startsWith("sk-")) {
    throw new Error(
      'OPENAI_API_KEY format invalid: must start with "sk-" or "sk-proj-"',
    );
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Embedding API error: ${errorText}`;

    // Provide helpful guidance for common errors
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.code === "invalid_api_key") {
        errorMessage = `Invalid OpenAI API key. Project keys (sk-proj-*) may not work for embeddings. Please use a standard API key (sk-*) from https://platform.openai.com/account/api-keys`;
      }
    } catch {
      // If error isn't JSON, use the original message
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  return {
    embedding: data.data[0].embedding,
    tokens: data.usage.total_tokens,
  };
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<EmbeddingResult[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Validate key format (should start with sk- or sk-proj-)
  if (!apiKey.startsWith("sk-")) {
    throw new Error(
      'OPENAI_API_KEY format invalid: must start with "sk-" or "sk-proj-"',
    );
  }

  // OpenAI supports batch embedding
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Embedding API error: ${errorText}`;

    // Provide helpful guidance for common errors
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.code === "invalid_api_key") {
        errorMessage = `Invalid OpenAI API key. Project keys (sk-proj-*) may not work for embeddings. Please use a standard API key (sk-*) from https://platform.openai.com/account/api-keys`;
      }
    } catch {
      // If error isn't JSON, use the original message
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  return data.data.map((item: { embedding: number[] }, _index: number) => ({
    embedding: item.embedding,
    tokens: Math.round(data.usage.total_tokens / texts.length), // Approximate per-text
  }));
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
