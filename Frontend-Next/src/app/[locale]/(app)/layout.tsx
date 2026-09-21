import type { ReactNode } from 'react';
import { AppShell } from '@/core/layout/app-shell';

export default function AppLayout({ children }: { readonly children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
