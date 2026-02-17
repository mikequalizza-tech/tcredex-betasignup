'use client';

import RouteErrorFallback from '@/components/errors/RouteErrorFallback';

export default function IntakeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback error={error} reset={reset} title="Error loading intake form" backHref="/dashboard" />;
}
