import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const ANGULAR_URL = process.env['ANGULAR_URL'] ?? 'http://localhost:4300';
export const NEXT_URL = process.env['NEXT_URL'] ?? 'http://localhost:3100';

/** Demo accounts created by the `demo` Spring profile (see README). */
const DEMO_PASSWORD = process.env['E2E_DEMO_PASSWORD'] ?? 'StockHub2026';

export interface Account {
  readonly email: string;
  readonly password: string;
}

export const ACCOUNTS = {
  SUPER_ADMIN: {
    email: process.env['STOCKHUB_SUPERADMIN_EMAIL'] || 'superadmin@stockhub.local',
    password: process.env['STOCKHUB_SUPERADMIN_PASSWORD'] || 'SuperAdmin2026',
  },
  ADMIN: { email: 'admin@alpha.cm', password: DEMO_PASSWORD },
  MANAGER: { email: 'manager@alpha.cm', password: DEMO_PASSWORD },
  MAGASINIER: { email: 'magasinier@alpha.cm', password: DEMO_PASSWORD },
  VENDEUR: { email: 'vendeur@alpha.cm', password: DEMO_PASSWORD },
} satisfies Record<string, Account>;

/** Time zone of the demo company "Alpha Market". */
export const DEMO_COMPANY_TIME_ZONE = 'Africa/Douala';

export async function loginAngular(page: Page, account: Account): Promise<void> {
  await page.goto(`${ANGULAR_URL}/login`);
  await page.locator('#login-email').fill(account.email);
  await page.locator('#login-password').fill(account.password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function loginNext(page: Page, account: Account, locale: 'fr' | 'en' = 'fr'): Promise<void> {
  await page.goto(`${NEXT_URL}/${locale}/login`);
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Signs in through the API (same origin as the Angular app) and returns a bearer token. */
export async function apiToken(request: APIRequestContext, account: Account): Promise<string> {
  const response = await request.post(`${ANGULAR_URL}/api/v1/auth/login`, { data: account });
  expect(response.ok()).toBeTruthy();
  return ((await response.json()) as { accessToken: string }).accessToken;
}

/** Text still showing a translation key such as "users.list.title". */
export const RAW_I18N_KEY = /\b[a-z][a-zA-Z]*(\.[a-z][a-zA-Z0-9]*){2,}\b/;

export async function rawTranslationKeys(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText();
  return text
    .split(/\s+/)
    .filter((word) => RAW_I18N_KEY.test(word) && !word.includes('@') && !/^https?:/.test(word));
}
