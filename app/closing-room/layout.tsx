"use client";

import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/lib/auth";
import { ChatTC } from "@/components/chat";
import { DiscordSocketWrapper } from "@/components/discord/DiscordSocketWrapper";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ClosingRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DiscordSocketWrapper>
          <AppLayout>{children}</AppLayout>
          <ChatTC />
        </DiscordSocketWrapper>
      </ProtectedRoute>
    </AuthProvider>
  );
}
