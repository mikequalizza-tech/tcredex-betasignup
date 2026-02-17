"use client";

import { useEffect } from "react";

interface CalendlyEmbedProps {
  url?: string;
  prefill?: {
    name?: string;
    email?: string;
    customAnswers?: Record<string, string>;
  };
  utm?: {
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  styles?: {
    height?: string;
    minWidth?: string;
  };
  className?: string;
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: Record<string, unknown>;
        utm?: Record<string, string>;
      }) => void;
      initPopupWidget: (options: { url: string }) => void;
      initBadgeWidget: (options: {
        url: string;
        text: string;
        color: string;
        textColor: string;
      }) => void;
    };
  }
}

/**
 * Calendly Inline Embed Component
 *
 * Embeds a Calendly scheduling widget inline on the page.
 *
 * Usage:
 * <CalendlyEmbed
 *   url="https://calendly.com/your-link"
 *   prefill={{ name: "John Doe", email: "john@example.com" }}
 * />
 */
export default function CalendlyEmbed({
  url,
  prefill,
  utm,
  styles = { height: "700px", minWidth: "320px" },
  className = "",
}: CalendlyEmbedProps) {
  const calendlyUrl =
    url || process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

  useEffect(() => {
    // Load Calendly script
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    // Load Calendly CSS
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      // Cleanup
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    // Initialize widget after script loads
    const initWidget = () => {
      const container = document.getElementById("calendly-embed");
      if (container && window.Calendly) {
        window.Calendly.initInlineWidget({
          url: calendlyUrl,
          parentElement: container,
          prefill: prefill
            ? {
                name: prefill.name,
                email: prefill.email,
                customAnswers: prefill.customAnswers,
              }
            : undefined,
          utm: utm,
        });
      }
    };

    // Wait for script to load
    const checkCalendly = setInterval(() => {
      if (window.Calendly) {
        clearInterval(checkCalendly);
        initWidget();
      }
    }, 100);

    // Cleanup
    return () => clearInterval(checkCalendly);
  }, [calendlyUrl, prefill, utm]);

  return (
    <div
      id="calendly-embed"
      className={className}
      style={{
        height: styles.height,
        minWidth: styles.minWidth,
      }}
    />
  );
}

/**
 * Calendly Popup Button Component
 *
 * Opens Calendly in a popup when clicked.
 *
 * Usage:
 * <CalendlyButton url="https://calendly.com/your-link">
 *   Schedule a Call
 * </CalendlyButton>
 */
export function CalendlyButton({
  url,
  children,
  className = "",
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const calendlyUrl =
    url || process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

  useEffect(() => {
    // Load Calendly script
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    // Load Calendly CSS
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  const handleClick = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: calendlyUrl });
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

/**
 * Simple Calendly Link
 *
 * Just opens Calendly in a new tab - no script needed.
 */
export function CalendlyLink({
  url,
  children,
  className = "",
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const calendlyUrl =
    url || process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

  return (
    <a
      href={calendlyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
