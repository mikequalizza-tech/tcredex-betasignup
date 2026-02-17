import { Suspense } from "react";
import { CustomMDX } from "./mdx";

interface SafeMDXProps {
  source: string;
  fallback?: React.ReactNode;
}

const ErrorFallback = ({ message }: { message: string }) => (
  <div className="text-red-400 p-4 border border-red-500/50 rounded-lg">
    <p className="font-semibold mb-2">Error rendering content</p>
    <p className="text-sm">{message}</p>
  </div>
);

/**
 * Safe wrapper for MDX content that handles errors gracefully
 * Wraps MDX in Suspense to handle async rendering errors
 */
export function SafeMDX({ source, fallback }: SafeMDXProps) {
  // #region agent log
  console.log("[SafeMDX] Rendering", {
    hasSource: !!source,
    sourceType: typeof source,
    sourceLength: source?.length || 0,
  });
  // #endregion

  // Validate source before rendering
  if (!source || typeof source !== "string" || source.trim().length === 0) {
    // #region agent log
    console.warn("[SafeMDX] Source validation failed", {
      hasSource: !!source,
      sourceType: typeof source,
      sourceLength: source?.length || 0,
    });
    // #endregion
    return fallback || <ErrorFallback message="Content is missing or empty" />;
  }

  // #region agent log
  console.log("[SafeMDX] Rendering CustomMDX", {
    sourceLength: source.length,
  });
  // #endregion

  return (
    <Suspense
      fallback={
        fallback || <div className="text-gray-400">Loading content...</div>
      }
    >
      <CustomMDX source={source} />
    </Suspense>
  );
}
