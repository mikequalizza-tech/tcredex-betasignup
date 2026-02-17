#!/usr/bin/env node
/**
 * Substack Export to MDX Converter for tCredex Blog
 *
 * Usage:
 *   1. Export your Substack posts from Settings > Export
 *   2. Unzip the export to: scripts/substack-export/
 *   3. Run: node scripts/substack-export-to-mdx.js
 *
 * The script reads the posts.csv and HTML files from the export
 * and converts them to MDX files matching your blog format.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const EXPORT_DIR = path.join(__dirname, 'substack-export');
const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'blog');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'blog');

// Posts to SKIP (off-topic)
const SKIP_SLUGS = [
  'the-history-of-the-lawn',
  'income-taxes-and-economic-growth',
];

// Category mapping based on content keywords
function detectCategory(title, content) {
  const text = (title + ' ' + content).toLowerCase();

  if (text.includes('lihtc') || text.includes('tax credit') || text.includes('nmtc') || text.includes('htc')) {
    return 'Tax Credits';
  }
  if (text.includes('bond') || text.includes('finance') || text.includes('capital') || text.includes('cdfi') || text.includes('cra')) {
    return 'Finance';
  }
  if (text.includes('construction') || text.includes('timber') || text.includes('modular') || text.includes('building')) {
    return 'Development';
  }
  if (text.includes('preservation') || text.includes('affordable housing') || text.includes('housing')) {
    return 'Housing';
  }
  if (text.includes('policy') || text.includes('social') || text.includes('sustainable')) {
    return 'Policy';
  }
  return 'Industry';
}

// Parse CSV (simple implementation)
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = parseCSVLine(lines[0]);
  const posts = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const post = {};
    headers.forEach((header, idx) => {
      post[header] = values[idx] || '';
    });
    posts.push(post);
  }

  return posts;
}

// Parse a single CSV line (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Convert HTML to Markdown
function htmlToMarkdown(html) {
  if (!html) return '';

  let md = html
    // Remove script/style tags
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

    // Remove Substack-specific elements
    .replace(/<div class="captioned-image-container">[\s\S]*?<\/div>/gi, (match) => {
      // Extract image and caption
      const imgMatch = match.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
      const captionMatch = match.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
      let result = '';
      if (imgMatch) result += `![](${imgMatch[1]})\n`;
      if (captionMatch) result += `*${captionMatch[1].replace(/<[^>]+>/g, '').trim()}*\n`;
      return result;
    })

    // Headers
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')

    // Paragraphs
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')

    // Bold/Italic
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')

    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')

    // Images
    .replace(/<figure[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/gi, '![$2]($1)\n')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')

    // Lists
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '\n$1\n')
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '\n$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')

    // Blockquotes
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
      return '\n> ' + content.replace(/<[^>]+>/g, '').trim().split('\n').join('\n> ') + '\n';
    })

    // Code
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')

    // Dividers
    .replace(/<hr[^>]*\/?>/gi, '\n---\n')

    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')

    // Remove divs but keep content
    .replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, '\n$1\n')

    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')

    // Clean up entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')

    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return md;
}

// Generate slug from title
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

// Generate MDX file content
function generateMdx(post, content, category) {
  const title = post.title || 'Untitled';
  const date = post.post_date ? post.post_date.split(' ')[0] : new Date().toISOString().split('T')[0];
  const summary = (post.subtitle || post.description || '').replace(/"/g, '\\"').substring(0, 200);

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
publishedAt: "${date}"
summary: "${summary}"
image: "/images/post-thumb-01.jpg"
author: "Charles Sims"
authorImg: "/images/post-author-charles.jpg"
authorRole: "Contributing Writer"
category: "${category}"
---

`;

  return frontmatter + content;
}

// Process a single post
function processPost(post) {
  const slug = post.post_id ? `post-${post.post_id}` : titleToSlug(post.title);

  // Check if we should skip this post
  const titleSlug = titleToSlug(post.title);
  if (SKIP_SLUGS.some(skip => titleSlug.includes(skip.replace(/-/g, '')))) {
    console.log(`  ⏭  Skipping (off-topic): ${post.title}`);
    return null;
  }

  // Only process published posts
  if (post.is_published !== 'true' && post.is_published !== true) {
    console.log(`  ⏭  Skipping (not published): ${post.title}`);
    return null;
  }

  // Get HTML content
  let htmlContent = post.body_html || post.body || '';

  // If there's an HTML file reference, try to read it
  if (post.html_file) {
    const htmlPath = path.join(EXPORT_DIR, post.html_file);
    if (fs.existsSync(htmlPath)) {
      htmlContent = fs.readFileSync(htmlPath, 'utf8');
    }
  }

  // Convert to markdown
  const content = htmlToMarkdown(htmlContent);

  // Detect category
  const category = detectCategory(post.title, content);

  // Generate MDX
  const mdx = generateMdx(post, content, category);

  // Generate filename
  const filename = titleSlug + '.mdx';

  return { filename, mdx, title: post.title };
}

// Main function
async function main() {
  console.log('\n🚀 Substack Export to MDX Converter\n');

  // Check if export directory exists
  if (!fs.existsSync(EXPORT_DIR)) {
    console.log(`❌ Export directory not found: ${EXPORT_DIR}`);
    console.log('\nPlease:');
    console.log('  1. Export your Substack from Settings > Export');
    console.log('  2. Unzip to: scripts/substack-export/');
    console.log('  3. Run this script again\n');
    process.exit(1);
  }

  // Find CSV file
  const files = fs.readdirSync(EXPORT_DIR);
  const csvFile = files.find(f => f.endsWith('.csv'));

  if (!csvFile) {
    console.log('❌ No CSV file found in export directory');
    process.exit(1);
  }

  console.log(`📄 Reading: ${csvFile}\n`);

  // Parse CSV
  const csvContent = fs.readFileSync(path.join(EXPORT_DIR, csvFile), 'utf8');
  const posts = parseCSV(csvContent);

  console.log(`📝 Found ${posts.length} posts\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Process each post
  let converted = 0;
  let skipped = 0;

  for (const post of posts) {
    const result = processPost(post);

    if (result) {
      const filepath = path.join(OUTPUT_DIR, result.filename);

      // Check if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`  ⚠  Already exists: ${result.filename}`);
        skipped++;
        continue;
      }

      fs.writeFileSync(filepath, result.mdx, 'utf8');
      console.log(`  ✓ Created: ${result.filename}`);
      converted++;
    } else {
      skipped++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✓ ${converted} posts converted`);
  console.log(`  ⏭  ${skipped} posts skipped`);
  console.log(`\n📁 Output: ${OUTPUT_DIR}\n`);
}

main().catch(console.error);
