'use client';

import { AppLayout } from '@/components/layout';
import { AuthProvider } from '@/lib/auth';
import ChatTC from '@/components/chat/ChatTC';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AutomatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </ProtectedRoute>
    </AuthProvider>
  );
}
