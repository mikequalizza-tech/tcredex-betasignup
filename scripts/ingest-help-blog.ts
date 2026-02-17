/**
 * Ingest Help and Blog Content into ChatTC Knowledge Base
 *
 * This script reads all MDX files from content/help and content/blog,
 * extracts the content, and ingests it into the vector store for RAG retrieval.
 *
 * Usage: npx tsx scripts/ingest-help-blog.ts
 *
 * Prerequisites:
 * 1. OPENAI_API_KEY must be set (for embeddings)
 * 2. NEXT_PUBLIC_SUPABASE_URL must be set
 * 3. SUPABASE_SERVICE_ROLE_KEY must be set
 * 4. Knowledge tables must be created (run SETUP_SQL from vectorStore.ts)
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

// Import knowledge system
import { ingestDocument } from "../lib/knowledge/ingest";
import { KnowledgeCategory } from "../lib/knowledge/types";
import { SETUP_SQL, getKnowledgeStats } from "../lib/knowledge/vectorStore";

const CONTENT_DIR = path.join(process.cwd(), "content");
const HELP_DIR = path.join(CONTENT_DIR, "help");
const BLOG_DIR = path.join(CONTENT_DIR, "blog");

interface MDXFile {
  filename: string;
  filepath: string;
  content: string;
  frontmatter: Record<string, string>;
}

/**
 * Parse MDX file and extract frontmatter + content
 */
function parseMDXFile(filepath: string): MDXFile | null {
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const filename = path.basename(filepath);

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let frontmatter: Record<string, string> = {};
    let markdownContent = content;

    if (frontmatterMatch) {
      // Simple YAML parsing
      const yamlContent = frontmatterMatch[1];
      const lines = yamlContent.split("\n");
      for (const line of lines) {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          let value = line.slice(colonIndex + 1).trim();
          // Remove quotes
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          frontmatter[key] = value;
        }
      }
      markdownContent = content.slice(frontmatterMatch[0].length).trim();
    }

    return {
      filename,
      filepath,
      content: markdownContent,
      frontmatter,
    };
  } catch (error) {
    console.error(`Error parsing ${filepath}:`, error);
    return null;
  }
}

/**
 * Get all MDX files in a directory
 */
function getMDXFiles(dir: string): MDXFile[] {
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir);
  const mdxFiles: MDXFile[] = [];

  for (const file of files) {
    if (file.endsWith(".mdx") || file.endsWith(".md")) {
      const filepath = path.join(dir, file);
      const stat = fs.statSync(filepath);
      if (stat.isFile()) {
        const parsed = parseMDXFile(filepath);
        if (parsed) {
          mdxFiles.push(parsed);
        }
      }
    }
  }

  return mdxFiles;
}

/**
 * Convert MDX content to plain text
 * Removes MDX components and formatting for better embedding
 */
function mdxToText(mdxContent: string): string {
  // Remove MDX imports
  let text = mdxContent.replace(/^import\s+.*$/gm, "");

  // Remove JSX components but keep text inside
  text = text.replace(/<[A-Z][a-zA-Z]*[^>]*>/g, "");
  text = text.replace(/<\/[A-Z][a-zA-Z]*>/g, "");

  // Remove self-closing JSX components
  text = text.replace(/<[A-Z][a-zA-Z]*\s*\/>/g, "");

  // Convert markdown links to just text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Convert markdown headers
  text = text.replace(/^#{1,6}\s+/gm, "");

  // Remove bold/italic markers
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");

  // Remove code blocks but keep content
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/, "").replace(/```/, "");
  });

  // Remove inline code markers
  text = text.replace(/`([^`]+)`/g, "$1");

  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
}

/**
 * Main ingestion function
 */
async function main() {
  console.log("=".repeat(60));
  console.log("ChatTC Knowledge Base Ingestion");
  console.log("=".repeat(60));

  // Check environment variables
  const requiredEnvVars = [
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = requiredEnvVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error("\nMissing required environment variables:");
    missing.forEach((v) => console.error(`  - ${v}`));
    console.error("\nPlease set these in .env.local and try again.");
    process.exit(1);
  }

  console.log("\nEnvironment check passed.");
  console.log(
    `\nOpenAI API Key: ${process.env.OPENAI_API_KEY?.slice(0, 20)}...`,
  );
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

  // Get current stats
  console.log("\n--- Current Knowledge Base Stats ---");
  try {
    const stats = await getKnowledgeStats();
    console.log(`Total Sources: ${stats.totalSources}`);
    console.log(`Total Chunks: ${stats.totalChunks}`);
    if (Object.keys(stats.byCategory).length > 0) {
      console.log("By Category:", stats.byCategory);
    }
  } catch (error) {
    console.log("Could not get stats (tables may not exist yet)");
    console.log(
      "\nTo create tables, run the following SQL in Supabase SQL Editor:",
    );
    console.log("---");
    console.log(SETUP_SQL.slice(0, 500) + "...");
    console.log("---");
    console.log("\n(Full SQL available in lib/knowledge/vectorStore.ts)");
  }

  // Get Help files
  console.log("\n--- Reading Help Content ---");
  const helpFiles = getMDXFiles(HELP_DIR);
  console.log(`Found ${helpFiles.length} help articles`);

  // Get Blog files
  console.log("\n--- Reading Blog Content ---");
  const blogFiles = getMDXFiles(BLOG_DIR);
  console.log(`Found ${blogFiles.length} blog posts`);

  // Ingest Help content
  console.log("\n--- Ingesting Help Articles ---");
  let helpSuccess = 0;
  let helpErrors = 0;

  for (const file of helpFiles) {
    try {
      const text = mdxToText(file.content);
      const title = file.frontmatter.title || file.filename;

      // Skip index.mdx or empty files
      if (file.filename === "index.mdx" || text.length < 100) {
        console.log(`  Skipping ${file.filename} (too short or index)`);
        continue;
      }

      console.log(`  Ingesting: ${title}`);

      const result = await ingestDocument(
        {
          buffer: Buffer.from(text, "utf-8"),
          filename: file.filename,
          mimeType: "text/markdown",
        },
        {
          category: "platform" as KnowledgeCategory,
          title: title,
          source: "help",
        },
      );

      if (result.status === "success") {
        console.log(`    ✓ Created ${result.chunksCreated} chunks`);
        helpSuccess++;
      } else {
        console.error(`    ✗ Error: ${result.error}`);
        helpErrors++;
      }
    } catch (error) {
      console.error(`    ✗ Failed: ${error}`);
      helpErrors++;
    }
  }

  // Ingest Blog content
  console.log("\n--- Ingesting Blog Posts ---");
  let blogSuccess = 0;
  let blogErrors = 0;

  for (const file of blogFiles) {
    try {
      const text = mdxToText(file.content);
      const title = file.frontmatter.title || file.filename;

      // Skip empty files
      if (text.length < 100) {
        console.log(`  Skipping ${file.filename} (too short)`);
        continue;
      }

      // Determine category based on content
      let category: KnowledgeCategory = "platform";
      const lowerText = text.toLowerCase();
      if (lowerText.includes("nmtc") || lowerText.includes("new markets")) {
        category = "nmtc";
      } else if (lowerText.includes("htc") || lowerText.includes("historic")) {
        category = "htc";
      } else if (
        lowerText.includes("lihtc") ||
        lowerText.includes("housing credit")
      ) {
        category = "lihtc";
      } else if (
        lowerText.includes("opportunity zone") ||
        lowerText.includes(" oz ")
      ) {
        category = "oz";
      }

      console.log(`  Ingesting: ${title} [${category}]`);

      const result = await ingestDocument(
        {
          buffer: Buffer.from(text, "utf-8"),
          filename: file.filename,
          mimeType: "text/markdown",
        },
        {
          category,
          title: title,
          source: "blog",
        },
      );

      if (result.status === "success") {
        console.log(`    ✓ Created ${result.chunksCreated} chunks`);
        blogSuccess++;
      } else {
        console.error(`    ✗ Error: ${result.error}`);
        blogErrors++;
      }
    } catch (error) {
      console.error(`    ✗ Failed: ${error}`);
      blogErrors++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("INGESTION COMPLETE");
  console.log("=".repeat(60));
  console.log(`\nHelp Articles: ${helpSuccess} success, ${helpErrors} errors`);
  console.log(`Blog Posts: ${blogSuccess} success, ${blogErrors} errors`);

  // Final stats
  console.log("\n--- Updated Knowledge Base Stats ---");
  try {
    const stats = await getKnowledgeStats();
    console.log(`Total Sources: ${stats.totalSources}`);
    console.log(`Total Chunks: ${stats.totalChunks}`);
    if (Object.keys(stats.byCategory).length > 0) {
      console.log("By Category:", stats.byCategory);
    }
  } catch (error) {
    console.log("Could not get final stats");
  }

  console.log("\nDone!");
}

main().catch(console.error);
