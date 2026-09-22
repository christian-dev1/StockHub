import { expect, test, type Page } from '@playwright/test';
import { ACCOUNTS, ANGULAR_URL, NEXT_URL, loginAngular, loginNext } from '../support/stack';

const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('dark'));

test.describe('Theme (Angular)', () => {
  test('light, dark and system survive refresh and navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await loginAngular(page, ACCOUNTS.ADMIN);
    const theme = page.getByRole('radiogroup', { name: 'Thème' }).first();

    await theme.getByRole('radio', { name: 'Clair' }).click();
    await expect.poll(() => isDark(page)).toBe(false);
    await page.reload();
    await expect.poll(() => isDark(page)).toBe(false);

    await theme.getByRole('radio', { name: 'Sombre' }).click();
    await expect.poll(() => isDark(page)).toBe(true);
    await page.getByRole('navigation').getByRole('link', { name: 'Utilisateurs' }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect.poll(() => isDark(page)).toBe(true);
    await page.reload();
    await expect.poll(() => isDark(page)).toBe(true);

    await theme.getByRole('radio', { name: 'Système' }).click();
    await expect.poll(() => isDark(page)).toBe(true);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => isDark(page)).toBe(false);
  });
});

test.describe('Theme (Next.js)', () => {
  test('light, dark and system survive refresh and navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await loginNext(page, ACCOUNTS.VENDEUR);
    const theme = page.getByRole('radiogroup', { name: 'Thème' }).first();

    await theme.getByRole('radio', { name: 'Clair' }).click();
    await expect.poll(() => isDark(page)).toBe(false);
    await page.reload();
    await expect.poll(() => isDark(page)).toBe(false);

    await page.getByRole('radiogroup', { name: 'Thème' }).first().getByRole('radio', { name: 'Sombre' }).click();
    await expect.poll(() => isDark(page)).toBe(true);
    await page.goto(`${NEXT_URL}/fr/change-password`);
    await expect.poll(() => isDark(page)).toBe(true);
    await page.reload();
    await expect.poll(() => isDark(page)).toBe(true);

    await page.getByRole('radiogroup', { name: 'Thème' }).first().getByRole('radio', { name: 'Système' }).click();
    await expect.poll(() => isDark(page)).toBe(true);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => isDark(page)).toBe(false);
  });
});

test.describe('Empty states (Angular)', () => {
  test('a search without match is not presented as an empty list', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.SUPER_ADMIN);
    await page.goto(`${ANGULAR_URL}/platform/companies`);
    await expect(page.getByRole('link', { name: 'Alpha Market' }).first()).toBeVisible();

    const search = page.getByRole('searchbox');
    await search.fill('zzzz-no-such-company');
    await expect(page.getByRole('heading', { name: 'Aucun résultat' })).toBeVisible();
    await expect(page.getByText("Aucune entreprise n'a encore été créée")).toHaveCount(0);

    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click();
    await expect(search).toHaveValue('');
    await expect(page.getByRole('link', { name: 'Alpha Market' }).first()).toBeVisible();
  });
});
