"use client";

import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/lib/auth";
import { ChatTC } from "@/components/chat";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute allowedOrgTypes={["investor"]}>
        <AppLayout>{children}</AppLayout>
        <ChatTC />
      </ProtectedRoute>
    </AuthProvider>
  );
}
