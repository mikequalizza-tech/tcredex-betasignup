"use client";

import Script from "next/script";

const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

/**
 * LinkedIn Insight Tag Component
 *
 * Add to your root layout to enable LinkedIn Ads tracking.
 * Set NEXT_PUBLIC_LINKEDIN_PARTNER_ID in .env.local
 */
export default function LinkedInInsight() {
  if (!LINKEDIN_PARTNER_ID) {
    return null;
  }

  return (
    <>
      <Script id="linkedin-insight" strategy="afterInteractive">
        {`
          _linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);

          (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);
          })(window.lintrk);
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://px.ads.linkedin.com/collect/?pid=${LINKEDIN_PARTNER_ID}&fmt=gif`}
        />
      </noscript>
    </>
  );
}

/**
 * Track LinkedIn conversion events
 *
 * @param conversionId - The conversion ID from LinkedIn Campaign Manager
 */
export function trackLinkedInConversion(conversionId: string) {
  if (typeof window !== "undefined" && window.lintrk) {
    window.lintrk("track", { conversion_id: conversionId });
  }
}

// Extend window type for lintrk
declare global {
  interface Window {
    lintrk?: ((action: string, data: { conversion_id: string }) => void) & {
      q?: unknown[];
    };
    _linkedin_data_partner_ids?: string[];
  }
}
