import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://beta.tcredex.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Dynamic blog post pages
  const blogDir = path.join(process.cwd(), 'content/blog');
  let blogPages: MetadataRoute.Sitemap = [];
  if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));
    blogPages = blogFiles.map(file => ({
      url: `${BASE_URL}/blog/${path.basename(file, '.mdx')}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  }

  // Dynamic help article pages
  const helpDir = path.join(process.cwd(), 'content/help');
  let helpPages: MetadataRoute.Sitemap = [];
  if (fs.existsSync(helpDir)) {
    const helpFiles = fs.readdirSync(helpDir).filter(f => f.endsWith('.mdx'));
    helpPages = helpFiles.map(file => ({
      url: `${BASE_URL}/help/${path.basename(file, '.mdx')}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  }

  return [...staticPages, ...blogPages, ...helpPages];
}
