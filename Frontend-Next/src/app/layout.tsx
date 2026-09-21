import type { ReactNode } from 'react';

/** The real <html> lives in app/[locale]/layout.tsx; this root only passes through. */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return children;
}
