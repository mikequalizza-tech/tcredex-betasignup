#!/usr/bin/env node
/**
 * Substack to MDX Converter for tCredex Blog
 *
 * Usage:
 *   node scripts/substack-to-mdx.js
 *
 * This script fetches posts from the simsc.substack.com archive
 * and converts them to MDX files matching your blog format.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SUBSTACK_BASE = 'https://simsc.substack.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'blog');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'blog');

// Posts to convert (from archive)
const POSTS = [
  {
    slug: 'what-is-affordable-housing-preservation',
    category: 'Education',
  },
  {
    slug: 'what-are-cdfis',
    category: 'Education',
  },
  {
    slug: 'exploring-mass-timber-for-multifamily',
    category: 'Development',
  },
  {
    slug: 'tax-exempt-bonds-the-financial-backbone',
    category: 'Finance',
  },
  {
    slug: 'the-community-reinvestment-act-a',
    category: 'Policy',
  },
  {
    slug: 'the-5-types-of-building-construction',
    category: 'Development',
  },
  {
    slug: 'the-future-is-affordable-and-sustainable',
    category: 'Policy',
  },
  {
    slug: 'the-modular-housing-debate',
    category: 'Development',
  },
  {
    slug: 'the-40-trillion-productivity-gap',
    category: 'Industry',
  },
  {
    slug: 'housing-and-the-social-contract',
    category: 'Policy',
  },
  // Skip: 'the-history-of-the-lawn' - off topic
  // Skip: 'income-taxes-and-economic-growth' - off topic
];

// Fetch HTML from URL
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Extract metadata and content from Substack HTML
function parseSubstackHtml(html, slug) {
  // Extract title
  const titleMatch = html.match(/<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>([^<]+)<\/h1>/i)
    || html.match(/<meta property="og:title" content="([^"]+)"/i);
  const title = titleMatch ? titleMatch[1].trim() : slug.replace(/-/g, ' ');

  // Extract date
  const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/)
    || html.match(/"datePublished":\s*"([^"]+)"/);
  const publishedAt = dateMatch ? dateMatch[1].split('T')[0] : new Date().toISOString().split('T')[0];

  // Extract description/summary
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
    || html.match(/<meta property="og:description" content="([^"]+)"/i);
  const summary = descMatch ? descMatch[1].trim() : '';

  // Extract author
  const authorMatch = html.match(/<meta name="author" content="([^"]+)"/i)
    || html.match(/"author":\s*{\s*"name":\s*"([^"]+)"/);
  const author = authorMatch ? authorMatch[1] : 'Charles Sims';

  // Extract main image
  const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
  const image = imageMatch ? imageMatch[1] : '/images/post-thumb-01.jpg';

  // Extract body content
  let content = '';

  // Try to find the main content div
  const bodyMatch = html.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*post-footer/i)
    || html.match(/<div[^>]*class="[^"]*available-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div/i);

  if (bodyMatch) {
    content = bodyMatch[1];
  }

  // Convert HTML to Markdown
  content = htmlToMarkdown(content);

  return { title, publishedAt, summary, author, image, content };
}

// Simple HTML to Markdown converter
function htmlToMarkdown(html) {
  if (!html) return '';

  let md = html
    // Remove script/style tags
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

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
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')

    // Lists
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '\n$1\n')
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, '\n$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')

    // Blockquotes
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')

    // Code
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')

    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')

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

    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return md;
}

// Generate MDX frontmatter
function generateMdx(data, category) {
  const frontmatter = `---
title: "${data.title.replace(/"/g, '\\"')}"
publishedAt: "${data.publishedAt}"
summary: "${data.summary.replace(/"/g, '\\"')}"
image: "${data.image}"
author: "${data.author}"
authorImg: "/images/post-author-charles.jpg"
authorRole: "Contributing Writer"
category: "${category}"
---

`;

  return frontmatter + data.content;
}

// Convert slug to filename
function slugToFilename(slug) {
  return slug + '.mdx';
}

// Main conversion function
async function convertPost(postConfig) {
  const { slug, category } = postConfig;
  const url = `${SUBSTACK_BASE}/p/${slug}`;

  console.log(`Fetching: ${url}`);

  try {
    const html = await fetchUrl(url);
    const data = parseSubstackHtml(html, slug);
    const mdx = generateMdx(data, category);

    const filename = slugToFilename(slug);
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, mdx, 'utf8');
    console.log(`  ✓ Created: ${filename}`);

    return { success: true, filename };
  } catch (error) {
    console.error(`  ✗ Failed: ${slug} - ${error.message}`);
    return { success: false, slug, error: error.message };
  }
}

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

// Main entry point
async function main() {
  console.log('\n🚀 Substack to MDX Converter for tCredex Blog\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  ensureDirectories();

  const results = [];

  for (const post of POSTS) {
    const result = await convertPost(post);
    results.push(result);

    // Small delay to be nice to the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`  ✓ ${successful} posts converted`);
  if (failed > 0) {
    console.log(`  ✗ ${failed} posts failed`);
  }
  console.log('\nDone!\n');
}

main().catch(console.error);
