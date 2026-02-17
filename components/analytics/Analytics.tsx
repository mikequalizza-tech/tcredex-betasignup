'use client';

import GoogleAnalytics from './GoogleAnalytics';
import MetaPixel from './MetaPixel';
import BingUET from './BingUET';
import LinkedInInsight from './LinkedInInsight';

/**
 * Unified Analytics Component
 *
 * Loads all configured analytics/tracking scripts.
 * Add this to your root layout.tsx:
 *
 * import { Analytics } from '@/components/analytics';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Analytics />
 *       </body>
 *     </html>
 *   );
 * }
 *
 * Configure in .env.local:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID (Google Analytics 4)
 * - NEXT_PUBLIC_META_PIXEL_ID (Facebook/Instagram)
 * - NEXT_PUBLIC_BING_UET_ID (Microsoft/Bing Ads)
 * - NEXT_PUBLIC_LINKEDIN_PARTNER_ID (LinkedIn Ads)
 */
export default function Analytics() {
  return (
    <>
      <GoogleAnalytics />
      <MetaPixel />
      <BingUET />
      <LinkedInInsight />
    </>
  );
}
