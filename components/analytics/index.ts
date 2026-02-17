// tCredex Analytics Components
// All-in-one tracking for Google, Meta, Bing, and LinkedIn

export { default as Analytics } from "./Analytics";
export {
  default as GoogleAnalytics,
  trackEvent,
  trackPageView,
  trackConversion,
} from "./GoogleAnalytics";
export {
  default as MetaPixel,
  trackMetaEvent,
  trackMetaCustomEvent,
} from "./MetaPixel";
export {
  default as BingUET,
  trackBingEvent,
  trackBingConversion,
} from "./BingUET";
export {
  default as LinkedInInsight,
  trackLinkedInConversion,
} from "./LinkedInInsight";

// Re-export types
export type { MetaEventName } from "./MetaPixel";
