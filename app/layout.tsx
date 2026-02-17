import "./globals.css";
import { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@/components/analytics";

export const metadata: Metadata = {
  metadataBase: new URL('https://tcredex.com'),
  title: "tCredex - AI-Powered Tax Credit Marketplace",
  description: "AI-Powered 5-Tax Credit Marketplace including State and Federal Tax Credits for NMTC, LIHTC, HTC, OZ, Brownfield.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "tCredex",
  },
  applicationName: "tCredex",
  keywords: ["NMTC", "LIHTC", "HTC", "Opportunity Zone", "tax credits", "community development", "CDE", "CDFI"],
  authors: [{ name: "American Impact Ventures" }],
  creator: "American Impact Ventures",
  publisher: "American Impact Ventures",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tcredex.com",
    siteName: "tCredex",
    title: "tCredex - AI-Powered Tax Credit Marketplace",
    description: "The first marketplace for all five tax-credit programs: NMTC, LIHTC, HTC, Opportunity Zone, and Brownfield.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "tCredex - Tax Credit Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tCredex - AI-Powered Tax Credit Marketplace",
    description: "The first marketplace for all five tax-credit programs.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="tCredex" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.svg" />
      </head>
      <body className="bg-gray-950 font-inter text-base text-gray-200 antialiased">
        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          {children}
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
