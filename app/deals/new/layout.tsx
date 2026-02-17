'use client';

import { AuthProvider } from '@/lib/auth';
import ChatTC from '@/components/chat/ChatTC';

export default function NewDealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Intake form has its own header, uses light theme
  return (
    <AuthProvider>
      {children}
      <ChatTC />
    </AuthProvider>
  );
}
