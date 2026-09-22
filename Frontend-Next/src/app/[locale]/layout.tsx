import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { enableLocale } from '@/core/i18n/locale';
import { routing } from '@/core/i18n/routing';
import { TimeZoneProvider } from '@/core/i18n/time-zone-provider';
import { ThemeProvider } from '@/core/layout/theme-provider';
import { QueryProvider } from '@/core/query/query-provider';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: enableLocale(locale), namespace: 'meta' });
  return { title: { default: 'StockHub', template: '%s · StockHub' }, description: t('description') };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121829' },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = enableLocale((await params).locale);

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <TimeZoneProvider>
            <ThemeProvider>
              <QueryProvider>{children as ReactNode}</QueryProvider>
            </ThemeProvider>
          </TimeZoneProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
