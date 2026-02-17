'use client';

import RouteErrorFallback from '@/components/errors/RouteErrorFallback';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback error={error} reset={reset} title="Error loading dashboard" backHref="/" backLabel="Back to Home" />;
}
