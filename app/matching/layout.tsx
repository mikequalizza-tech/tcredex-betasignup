"use client";

import { AppLayout } from "@/components/layout";
import { AuthProvider } from "@/lib/auth";
import ChatTC from "@/components/chat/ChatTC";

export default function MatchingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
      <ChatTC />
    </AuthProvider>
  );
}
