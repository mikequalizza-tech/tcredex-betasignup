'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth';
import { Role, hasMinimumRole } from '@/lib/auth/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  allowedOrgTypes?: ('cde' | 'sponsor' | 'investor' | 'admin')[];
  fallbackUrl?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  allowedOrgTypes,
  fallbackUrl = '/signin'
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, orgType } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`${fallbackUrl}?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoading, isAuthenticated, router, fallbackUrl]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null; // useEffect will redirect
  }

  // Check role requirement
  if (requiredRole && !hasMinimumRole(user.role, requiredRole)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You don&apos;t have permission to access this page. 
            Required role: <span className="text-indigo-400">{requiredRole}</span>
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check org type restriction
  if (allowedOrgTypes && orgType && !allowedOrgTypes.includes(orgType)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Restricted Area</h1>
          <p className="text-gray-400 mb-6">
            This section is only available to {allowedOrgTypes.join(' or ')} accounts.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component version
export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: Role;
    allowedOrgTypes?: ('cde' | 'sponsor' | 'investor')[];
    fallbackUrl?: string;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
