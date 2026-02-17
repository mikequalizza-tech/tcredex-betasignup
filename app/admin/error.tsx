'use client';

import RouteErrorFallback from '@/components/errors/RouteErrorFallback';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback error={error} reset={reset} title="Error loading admin panel" backHref="/dashboard" />;
}
