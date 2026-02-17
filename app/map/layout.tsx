'use client';

import { AuthProvider } from '@/lib/auth';
import ChatTC from '@/components/chat/ChatTC';
import { DiscordSocketWrapper } from '@/components/discord/DiscordSocketWrapper';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DiscordSocketWrapper>
          {/* Map page is full-screen with its own FilterRail - no AppLayout needed */}
          <div className="h-screen w-screen overflow-hidden">
            {children}
          </div>
          <ChatTC />
        </DiscordSocketWrapper>
      </ProtectedRoute>
    </AuthProvider>
  );
}
