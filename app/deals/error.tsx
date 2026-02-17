'use client';

import RouteErrorFallback from '@/components/errors/RouteErrorFallback';

export default function DealsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback error={error} reset={reset} title="Error loading deals" backHref="/dashboard" />;
}
