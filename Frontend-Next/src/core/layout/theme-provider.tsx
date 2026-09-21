'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { THEMES, THEME_STORAGE_KEY } from '../config/theme/theme';

/** Light / dark / system, persisted per device, applied as a class before paint. */
export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={[...THEMES.filter((t) => t !== 'system')]}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
