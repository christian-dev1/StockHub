import type { ReactNode } from 'react';
import { AuthGate } from '@/core/auth/auth-gate';
import { AppShell } from '@/core/layout/app-shell';

export default function AppLayout({ children }: { readonly children: ReactNode }) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
