"use client";

import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/lib/auth";
import { ChatTC } from "@/components/chat";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CDELayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* No org type restriction - CDE profiles are viewable by all authenticated users */}
      {/* Individual pages (like /cde/profile/edit) add their own CDE-only protection */}
      <ProtectedRoute>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </ProtectedRoute>
    </AuthProvider>
  );
}
