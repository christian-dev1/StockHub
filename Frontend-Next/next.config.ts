import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  // Camera is required by the barcode scanner.
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // Same-origin API: the browser only ever talks to this app, which forwards to Spring Boot.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/actuator/health', destination: `${backendUrl}/actuator/health` },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin('./src/core/i18n/request.ts');

export default withNextIntl(nextConfig);
