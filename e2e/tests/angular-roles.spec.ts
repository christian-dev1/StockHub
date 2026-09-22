import { expect, test } from '@playwright/test';
import { ACCOUNTS, ANGULAR_URL, loginAngular } from '../support/stack';

/** Back-office access per role, against the real API and the demo data. */

test.describe('SUPER_ADMIN', () => {
  test('signs in, sees the dashboard and manages companies', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.SUPER_ADMIN);
    await expect(page).toHaveURL(/\/(dashboard|platform\/companies)/);

    await page.goto(`${ANGULAR_URL}/dashboard`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'Entreprises' }).click();
    await expect(page).toHaveURL(/\/platform\/companies$/);
    await expect(page.getByRole('link', { name: 'Alpha Market' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nouvelle entreprise' })).toBeVisible();
  });
});

test.describe('ADMIN', () => {
  test('signs in and reaches dashboard, users and editable settings', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.ADMIN);
    await expect(page).toHaveURL(/\/dashboard$/);

    const nav = page.getByRole('navigation');
    await nav.getByRole('link', { name: 'Utilisateurs' }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('link', { name: 'Nouvel utilisateur' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'manager@alpha.cm' })).toBeVisible();

    await nav.getByRole('link', { name: "Paramètres de l'entreprise" }).click();
    await expect(page).toHaveURL(/\/settings\/company$/);
    await expect(page.locator('#s-name')).toBeEditable();
    await expect(page.getByRole('button', { name: 'Enregistrer' }).first()).toBeVisible();
  });

  test('the create form submits with "Créer l\'utilisateur"', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.ADMIN);
    await page.goto(`${ANGULAR_URL}/users/new`);
    await expect(page.getByRole('button', { name: "Créer l'utilisateur" })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Rôle/ })).toBeVisible();
  });
});

test.describe('MANAGER', () => {
  test('reads users and settings without edit actions', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.MANAGER);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`${ANGULAR_URL}/users`);
    await expect(page.getByRole('cell', { name: 'admin@alpha.cm' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nouvel utilisateur' })).toHaveCount(0);

    await page.goto(`${ANGULAR_URL}/users/new`);
    await expect(page).toHaveURL(/\/forbidden$/);

    await page.goto(`${ANGULAR_URL}/settings/company`);
    await expect(page.locator('#s-name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toHaveCount(0);
  });
});

test.describe('MAGASINIER', () => {
  test('reaches the dashboard but not user management', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.MAGASINIER);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Utilisateurs' })).toHaveCount(0);

    await page.goto(`${ANGULAR_URL}/users`);
    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(page.getByText('403')).toBeVisible();
  });
});

test.describe('VENDEUR', () => {
  test('is refused by the back-office and pointed to the sales app', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.VENDEUR);
    await expect(page).toHaveURL(/\/sales-app-only$/);
    await expect(page.getByRole('heading', { name: 'Espace réservé au back-office' })).toBeVisible();

    for (const path of ['/dashboard', '/users', '/settings/company', '/platform/companies']) {
      await page.goto(`${ANGULAR_URL}${path}`);
      await expect(page).toHaveURL(/\/sales-app-only$/);
    }

    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
