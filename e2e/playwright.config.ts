import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Reuse the stack's .env (super admin credentials) when it is present.
if (existsSync('../.env')) {
  process.loadEnvFile('../.env');
}

/**
 * Runs against the real Docker stack (`docker compose up -d --build --wait`),
 * started with the `demo` Spring profile. URLs can be overridden with
 * ANGULAR_URL and NEXT_URL.
 */
export default defineConfig({
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  // Every login hashes a password (Argon2): more workers make the stack itself the bottleneck.
  workers: 2,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'e2e', testDir: './tests' },
    { name: 'smoke', testDir: './smoke', timeout: 180_000 },
  ],
});
