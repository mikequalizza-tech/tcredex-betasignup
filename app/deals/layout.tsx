'use client';

import { usePathname } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider, useCurrentUser } from '@/lib/auth';
import { ChatTC } from '@/components/chat';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

function DealsLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { isAuthenticated, isLoading: _isLoading } = useCurrentUser();

  // Routes that always require authentication
  const protectedPaths = ['/deals/new'];
  const requiresAuth = protectedPaths.some(path => pathname.startsWith(path));

  // The marketplace page (/deals) has its own complete layout with sidebar
  // Don't add Header/Footer for it
  const isMarketplacePage = pathname === '/deals';

  // Protected routes (e.g., /deals/new) - always use AppLayout with auth
  if (requiresAuth) {
    return (
      <ProtectedRoute>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </ProtectedRoute>
    );
  }

  // Marketplace page - use its own layout (it has MapFilterRail sidebar)
  // REQUIRES AUTHENTICATION
  if (isMarketplacePage) {
    return (
      <ProtectedRoute>
        {children}
        <ChatTC />
      </ProtectedRoute>
    );
  }

  // Deal detail pages (/deals/[id], /deals/[id]/profile, /deals/[id]/card)
  // Use AppLayout with sidebar for consistent app experience - REQUIRES AUTHENTICATION
  const isDealDetailPage = pathname.match(/^\/deals\/[^/]+/);

  if (isDealDetailPage) {
    return (
      <ProtectedRoute>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </ProtectedRoute>
    );
  }

  // Fallback for any other deal routes
  if (isAuthenticated) {
    return (
      <>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header />
      <main className="grow">
        {children}
      </main>
      <Footer />
      <ChatTC />
    </div>
  );
}

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DealsLayoutContent>{children}</DealsLayoutContent>
    </AuthProvider>
  );
}
