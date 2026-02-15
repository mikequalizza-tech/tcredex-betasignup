/**
 * Pre-build script: generates static JSON from MDX content files.
 * This ensures blog/help data is available on Vercel without fs.readFileSync at runtime.
 *
 * Outputs:
 *   public/data/blog-index.json   — all post metadata (for /blog listing)
 *   public/data/blog/[slug].json  — individual post with content
 *   public/data/help-index.json   — all help metadata
 *   public/data/help/[slug].json  — individual help article with content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseFrontmatter(fileContent, filename = '') {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);

  if (!match) {
    console.warn(`  Warning: No frontmatter found in ${filename}`);
    return {
      metadata: { title: 'Untitled', publishedAt: new Date().toISOString().split('T')[0] },
      content: fileContent.trim(),
    };
  }

  const frontMatterBlock = match[1];
  const content = fileContent.replace(frontmatterRegex, '').trim();
  const metadata = {};

  frontMatterBlock.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    value = value.replace(/^['"](.*)['"]$/, '$1');
    if (value.startsWith('[')) return;
    if (!value) return;
    metadata[key] = value;
  });

  // Validate required fields for blog posts
  if (!metadata.title) {
    console.warn(`  Warning: Missing title in ${filename}`);
    metadata.title = 'Untitled';
  }

  return { metadata, content };
}

function processDirectory(contentDir, outputDir, type) {
  const inputPath = path.join(ROOT, contentDir);
  const outputPath = path.join(ROOT, 'public/data', outputDir);

  if (!fs.existsSync(inputPath)) {
    console.log(`  Skipping ${contentDir} (not found)`);
    return;
  }

  // Ensure output dirs exist
  fs.mkdirSync(outputPath, { recursive: true });

  const files = fs.readdirSync(inputPath).filter(f => f.endsWith('.mdx'));
  const index = [];

  files.forEach(file => {
    try {
      const raw = fs.readFileSync(path.join(inputPath, file), 'utf-8');
      const { metadata, content } = parseFrontmatter(raw, file);
      const slug = path.basename(file, '.mdx');

      // Individual post JSON
      fs.writeFileSync(
        path.join(outputPath, `${slug}.json`),
        JSON.stringify({ slug, metadata, content }, null, 0)
      );

      // Index entry (no content — just metadata)
      index.push({ slug, metadata });
    } catch (error) {
      console.error(`  Error processing ${file}:`, error.message);
    }
  });

  // Sort by date (newest first)
  index.sort((a, b) => {
    const dateA = new Date(a.metadata.publishedAt || '1970-01-01');
    const dateB = new Date(b.metadata.publishedAt || '1970-01-01');
    return dateB.getTime() - dateA.getTime();
  });

  // Write index
  fs.writeFileSync(
    path.join(ROOT, `public/data/${outputDir}-index.json`),
    JSON.stringify({ posts: index }, null, 0)
  );

  console.log(`  ${type}: ${files.length} files → public/data/${outputDir}/`);
}

console.log('Generating static content JSON...');
processDirectory('content/blog', 'blog', 'Blog');
processDirectory('content/help', 'help', 'Help');
console.log('Done.');
