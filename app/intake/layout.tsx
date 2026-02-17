'use client';

import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider } from '@/lib/auth';

function IntakeLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <IntakeLayoutContent>
        {children}
      </IntakeLayoutContent>
    </AuthProvider>
  );
}
