/** @type {import('next').NextConfig} */

// Optional bundle analyzer - only load if installed
let withBundleAnalyzer;
try {
  withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
  });
} catch (_e) {
  // Bundle analyzer not installed, use identity function
  withBundleAnalyzer = (config) => config;
}

const nextConfig = {
  outputFileTracingRoot: __dirname,
  eslint: {
    // TODO: Set to false once existing warnings are resolved (~300 warnings)
    // ESLint rules are enforced in IDE + `pnpm lint` — build bypasses for now
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      "mapbox-gl",
      "react-map-gl",
      "@supabase/supabase-js",
    ],
  },

  // Server external packages — keep heavy binaries out of webpack bundling
  serverExternalPackages: ["puppeteer", "puppeteer-core"],

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize for production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              maxSize: 244000, // 244KB chunks
            },
            mapbox: {
              test: /[\\/]node_modules[\\/](mapbox-gl|react-map-gl)[\\/]/,
              name: "mapbox",
              chunks: "all",
              priority: 10,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: "supabase",
              chunks: "all",
              priority: 10,
            },
          },
        },
      };
    }

    // Exclude heavy dependencies from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("mapbox-gl");
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Compression - Enable gzip/brotli compression for all responses
  compress: true,

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Security + caching headers
  async headers() {
    const securityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self)",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/tiles/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
