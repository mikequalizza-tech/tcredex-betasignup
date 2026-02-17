'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/lib/auth';

export default function SignOut() {
  const { logout, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) {
      logout();
    }
  }, [logout, isLoading]);

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-200">Signing out...</h1>
            <p className="text-gray-400 mt-2">You will be redirected to the home page.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
