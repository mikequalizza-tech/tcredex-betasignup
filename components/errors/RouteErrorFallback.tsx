'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  backHref?: string;
  backLabel?: string;
}

/**
 * Shared error fallback for route-segment error boundaries.
 * Renders inside the parent layout (NOT full-screen) so nav stays intact.
 * Reports errors to Sentry automatically.
 */
export default function RouteErrorFallback({
  error,
  reset,
  title = 'Something went wrong',
  backHref = '/dashboard',
  backLabel = 'Back to Dashboard',
}: RouteErrorFallbackProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="w-full max-w-md rounded-xl bg-gray-900/50 border border-gray-800 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>

        <p className="text-sm text-gray-400 mb-6">
          An error occurred loading this page. Our team has been notified.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="text-xs text-red-400/70 bg-red-500/5 rounded-lg p-3 mb-6 text-left overflow-x-auto">
            {error.message}
          </pre>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link
            href={backHref}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
