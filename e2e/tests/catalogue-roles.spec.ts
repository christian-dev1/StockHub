import { expect, test } from '@playwright/test';
import {
  ACCOUNTS,
  ANGULAR_URL,
  choose,
  createProductViaApi,
  loginAngular,
  uniqueSuffix,
} from '../support/stack';

const menu = (page: import('@playwright/test').Page) => page.getByRole('navigation');

test.describe('MANAGER', () => {
  test('sees products, categories and suppliers, and creates then updates a product', async ({ page }) => {
    const id = uniqueSuffix();
    await loginAngular(page, ACCOUNTS.MANAGER);
    for (const entry of ['Produits', 'Catégories', 'Fournisseurs']) {
      await expect(menu(page).getByRole('link', { name: entry })).toBeVisible();
    }
    await expect(menu(page).getByRole('link', { name: 'Emplacements' })).toHaveCount(0);

    await menu(page).getByRole('link', { name: 'Produits' }).click();
    await page.getByRole('link', { name: 'Nouveau produit' }).click();
    await page.locator('#p-name').fill(`Savon ${id}`);
    await choose(page, 'Unité', 'Carton');
    await page.locator('#p-sale').pressSequentially('750');
    await page.getByRole('button', { name: 'Créer le produit' }).click();
    await expect(page.getByRole('heading', { level: 1, name: `Savon ${id}` })).toBeVisible();

    await page.locator('#p-name').fill(`Savon parfumé ${id}`);
    await page.getByText('Suivi des dates d\'expiration').click();
    // Expiry tracking turns batch tracking on by itself.
    await expect(page.locator('#p-batch')).toBeChecked();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modifications enregistrées')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: `Savon parfumé ${id}` })).toBeVisible();

    await page.reload();
    await expect(page.locator('#p-expiry')).toBeChecked();
    await expect(page.locator('#p-batch')).toBeChecked();
  });

  test('cannot manage locations', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.MANAGER);
    await page.goto(`${ANGULAR_URL}/locations/new`);
    await expect(page).toHaveURL(/\/forbidden$/);
  });
});

test.describe('MAGASINIER', () => {
  test('consults products and generates a barcode without editing the product', async ({ page, request }) => {
    const id = uniqueSuffix();
    const productId = await createProductViaApi(request, ACCOUNTS.ADMIN, {
      name: `Farine ${id}`,
      salePrice: 1200,
    });

    await loginAngular(page, ACCOUNTS.MAGASINIER);
    await expect(menu(page).getByRole('link', { name: 'Produits' })).toBeVisible();
    for (const hidden of ['Catégories', 'Fournisseurs', 'Emplacements', 'Utilisateurs']) {
      await expect(menu(page).getByRole('link', { name: hidden })).toHaveCount(0);
    }

    await menu(page).getByRole('link', { name: 'Produits' }).click();
    await expect(page.getByRole('link', { name: 'Nouveau produit' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Importer' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Étiquettes' })).toBeVisible();

    await page.goto(`${ANGULAR_URL}/products/${productId}`);
    await expect(page.getByRole('heading', { level: 1, name: `Farine ${id}` })).toBeVisible();
    await expect(page.locator('#p-name')).toHaveAttribute('readonly', '');
    await expect(page.getByText('Consultation seule')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Supprimer' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Désactiver' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Choisir une photo' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Générer un CODE128' }).click();
    await expect(page.getByTestId('barcode-value')).toHaveText(/^SH\d{10}$/);
    await expect(page.getByRole('link', { name: "Imprimer l'étiquette" })).toBeVisible();
  });

  test('is refused the catalogue editing screens', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.MAGASINIER);
    for (const path of ['/products/new', '/products/import', '/suppliers/new', '/locations/new']) {
      await page.goto(`${ANGULAR_URL}${path}`);
      await expect(page).toHaveURL(/\/forbidden$/);
    }
  });
});
