"use client";

import Script from "next/script";

const BING_UET_ID = process.env.NEXT_PUBLIC_BING_UET_ID;

/**
 * Microsoft/Bing UET (Universal Event Tracking) Component
 *
 * Add to your root layout to enable Bing Ads tracking.
 * Set NEXT_PUBLIC_BING_UET_ID in .env.local
 */
export default function BingUET() {
  if (!BING_UET_ID) {
    return null;
  }

  return (
    <Script id="bing-uet" strategy="afterInteractive">
      {`
        (function(w,d,t,r,u){
          var f,n,i;
          w[u]=w[u]||[],f=function(){
            var o={ti:"${BING_UET_ID}", enableAutoSpaTracking: true};
            o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")
          },
          n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){
            var s=this.readyState;
            s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)
          },
          i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)
        })(window,document,"script","//bat.bing.com/bat.js","uetq");
      `}
    </Script>
  );
}

/**
 * Track Bing UET events
 */
export function trackBingEvent(
  eventAction: string,
  eventCategory?: string,
  eventLabel?: string,
  eventValue?: number,
) {
  if (typeof window !== "undefined" && window.uetq) {
    window.uetq.push("event", eventAction, {
      event_category: eventCategory,
      event_label: eventLabel,
      event_value: eventValue,
    });
  }
}

/**
 * Track Bing conversions
 */
export function trackBingConversion(
  goalId: string,
  revenue?: number,
  currency = "USD",
) {
  if (typeof window !== "undefined" && window.uetq) {
    window.uetq.push("event", "conversion", {
      goal_id: goalId,
      revenue_value: revenue,
      currency: currency,
    });
  }
}

// Extend window type for uetq
declare global {
  interface Window {
    uetq?: unknown[];
    UET?: new (options: {
      ti: string;
      enableAutoSpaTracking?: boolean;
      q?: unknown[];
    }) => unknown[];
  }
}
