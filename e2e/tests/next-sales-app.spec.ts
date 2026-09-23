import { expect, test } from '@playwright/test';
import { ACCOUNTS, DEMO_COMPANY_TIME_ZONE, NEXT_URL, loginNext } from '../support/stack';

// French is the default locale and has no prefix ("as-needed"): /, /login…
const HOME = new RegExp(`^${NEXT_URL}/(fr/?)?$`);
const LOGIN = /\/login(\?|$)/;

test.describe('Sales app (Next.js)', () => {
  test('VENDEUR signs in and uses the sales app', async ({ page }) => {
    await loginNext(page, ACCOUNTS.VENDEUR);
    await expect(page).toHaveURL(HOME);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu utilisateur' })).toBeVisible();
  });

  test('the session survives a browser refresh', async ({ page }) => {
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.reload();
    await expect(page).toHaveURL(HOME);
    await expect(page.getByRole('button', { name: 'Menu utilisateur' })).toBeVisible();
  });

  test('a protected route without session goes to the login page', async ({ page }) => {
    await page.goto(`${NEXT_URL}/fr/change-password`);
    await expect(page).toHaveURL(LOGIN);
    await page.goto(`${NEXT_URL}/fr`);
    await expect(page).toHaveURL(LOGIN);
  });

  test('logout from the user menu ends the session', async ({ page }) => {
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.getByRole('button', { name: 'Menu utilisateur' }).click();
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(LOGIN);
    await page.goto(`${NEXT_URL}/fr`);
    await expect(page).toHaveURL(LOGIN);
  });

  test('back-office roles are refused by the sales app', async ({ page }) => {
    await loginNext(page, ACCOUNTS.SUPER_ADMIN);
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test('on a phone, language and theme stay reachable from the user menu', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: 'fr-FR' });
    const page = await context.newPage();
    await loginNext(page, ACCOUNTS.VENDEUR);

    await page.getByRole('button', { name: 'Menu utilisateur' }).click();
    const menu = page.locator('[id^="headlessui-popover-panel"]');
    await menu.getByRole('radio', { name: 'Sombre' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await menu.getByRole('radio', { name: 'Anglais' }).click();
    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
    await context.close();
  });

  test('times are shown in the company time zone, not in UTC', async ({ page }) => {
    // The browser runs in Europe/Paris and the server in UTC; the company is in Africa/Douala.
    // Sellers do not get the platform status card: a manager does (sale times: next-seller.spec).
    await loginNext(page, ACCOUNTS.MANAGER);
    const checked = page.getByText(/Vérifié à/);
    await expect(checked).toBeVisible();
    const shown = (await checked.innerText()).match(/(\d{2}):(\d{2})/);
    expect(shown).not.toBeNull();
    const expected = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DEMO_COMPANY_TIME_ZONE,
    }).format(new Date());
    const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
    const drift = Math.abs(minutes(`${shown![1]}:${shown![2]}`) - minutes(expected));
    expect(Math.min(drift, 1440 - drift)).toBeLessThanOrEqual(2);
  });
});
