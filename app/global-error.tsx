'use client';

/**
 * Global Error Boundary
 * Catches errors that occur in the root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string } | undefined;
  reset: () => void;
}) {
  // #region agent log
  console.error('[GlobalError] Error boundary triggered', {
    hasError: !!error,
    errorType: error?.constructor?.name,
    errorMessage: error?.message,
    hasStack: !!error?.stack,
    digest: error?.digest,
  });
  // #endregion

  // Safely handle undefined error - this is the root cause of "Cannot read properties of undefined (reading 'stack')"
  const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred';
  const errorDigest = error?.digest;

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h1>
            <p className="text-gray-400 mb-6">
              {errorMessage}
            </p>
            {errorDigest && (
              <p className="text-xs text-gray-600 mb-4">
                Error ID: {errorDigest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
