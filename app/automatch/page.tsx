'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AutoMatch Page - Redirects to MAP page
 *
 * AutoMatch functionality has been integrated directly into the MAP page
 * for a better Sponsor experience. This page now redirects users to the
 * MAP page with AutoMatch pre-enabled via query parameter.
 */
export default function AutoMatchPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to MAP page with automatch query param
    router.replace('/map?automatch=true');
  }, [router]);

  // Show brief loading state while redirecting
  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">Redirecting to Map with AutoMatch...</p>
      </div>
    </main>
  );
}
