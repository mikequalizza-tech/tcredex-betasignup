import "./globals.css";
import AOSProvider from "@/components/aosprovider";
import { OrganizationSchema, WebsiteSchema, SoftwareApplicationSchema } from "@/components/StructuredData";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://beta.tcredex.com'),
  title: {
    default: "tCredex - AI-Powered Tax Credit Marketplace | NMTC, LIHTC, HTC, OZ, Brownfield",
    template: "%s | tCredex",
  },
  description: "The first AI-powered marketplace for all 5 tax credit programs: NMTC, LIHTC, HTC, Opportunity Zones, and Brownfield. Free census tract eligibility lookup for 85,000+ tracts. Connect sponsors with CDEs and investors.",
  keywords: [
    "NMTC", "New Markets Tax Credit", "NMTC marketplace",
    "LIHTC", "Low Income Housing Tax Credit", "LIHTC QCT", "qualified census tract",
    "HTC", "Historic Tax Credit", "historic preservation",
    "Opportunity Zone", "OZ investment", "qualified opportunity zone",
    "Brownfield", "brownfield tax credit", "environmental remediation",
    "tax credit marketplace", "tax credit financing",
    "CDE", "Community Development Entity", "CDFI",
    "QALICB", "qualified active low-income community business",
    "census tract eligibility", "census tract lookup",
    "community development finance", "affordable housing finance",
    "tax credit exchange", "CDE matching", "deal pipeline",
    "DDA", "difficult development area",
    "severely distressed community", "low-income community",
  ],
  authors: [{ name: "American Impact Ventures" }],
  creator: "American Impact Ventures",
  publisher: "American Impact Ventures",
  category: "Finance",
  classification: "Tax Credit Marketplace",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://beta.tcredex.com",
    siteName: "tCredex",
    title: "tCredex - AI-Powered Tax Credit Marketplace | NMTC, LIHTC, HTC, OZ",
    description: "The first marketplace for all 5 tax credit programs. Free census tract eligibility lookup. AI-powered CDE matching. Join the beta.",
    images: [
      {
        url: "/brand/logo-tcredex-cropped.png",
        width: 512,
        height: 512,
        alt: "tCredex - AI-Powered Tax Credit Marketplace for NMTC, LIHTC, HTC, Opportunity Zones, and Brownfield Credits",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "tCredex - AI-Powered Tax Credit Marketplace",
    description: "Free census tract eligibility lookup for 85,000+ tracts. AI-powered CDE matching for NMTC, LIHTC, HTC, OZ. Join the beta.",
    images: ["/brand/logo-tcredex-cropped.png"],
  },
  icons: {
    icon: [{ url: "/brand/logo-tcredex-cropped.png" }],
    apple: [{ url: "/brand/logo-tcredex-cropped.png" }],
  },
  alternates: {
    canonical: "https://beta.tcredex.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {},
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
        <OrganizationSchema />
        <WebsiteSchema />
        <SoftwareApplicationSchema />
      </head>
      <body className="bg-gray-950 font-inter text-base text-gray-200 antialiased">
        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          <AOSProvider>{children}</AOSProvider>
        </div>
      </body>
    </html>
  );
}
