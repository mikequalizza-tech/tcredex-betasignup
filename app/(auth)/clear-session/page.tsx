'use client';

import { useEffect, useState } from 'react';

export default function ClearSession() {
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Clear all auth-related localStorage that might cause conflicts
    const keysToRemove = [
      'tcredex_session',
      'tcredex_demo_role', 
      'tcredex_registered_user',
      'tcredex_draft', // Also clear any draft data
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove ${key}:`, e);
      }
    });

    setCleared(true);
    
    // Redirect to signin for proper authentication
    setTimeout(() => {
      window.location.href = '/signin';
    }, 1500);
  }, []);

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="text-center">
            {cleared ? (
              <>
                <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-gray-200">Session Cleared</h1>
                <p className="text-gray-400 mt-2">Redirecting to sign in...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h1 className="text-2xl font-semibold text-gray-200">Clearing session...</h1>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
