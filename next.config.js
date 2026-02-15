/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tcredex.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Include content files in Vercel serverless function bundles
  // Required because API routes use fs.readFileSync to read MDX content
  outputFileTracingIncludes: {
    '/api/blog': ['./content/blog/**/*'],
    '/api/blog/[slug]': ['./content/blog/**/*'],
    '/api/help/[slug]': ['./content/help/**/*'],
    '/sitemap.xml': ['./content/blog/**/*', './content/help/**/*'],
  },
};

module.exports = nextConfig;
