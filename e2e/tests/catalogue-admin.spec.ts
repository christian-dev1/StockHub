import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { ACCOUNTS, ANGULAR_URL, choose, loginAngular, uniqueSuffix } from '../support/stack';

/**
 * Acceptance scenario of the catalogue: an ADMIN sets up everything needed to
 * sell a product, only through the back-office (no Swagger, no API call).
 */
test('ADMIN builds a product from scratch up to its printed label', async ({ page }) => {
  test.setTimeout(120_000);
  const id = uniqueSuffix();
  const nav = page.getByRole('navigation');
  await loginAngular(page, ACCOUNTS.ADMIN);

  // 1. Location
  await nav.getByRole('link', { name: 'Emplacements' }).click();
  await page.getByRole('link', { name: 'Nouvel emplacement' }).click();
  await page.locator('#loc-name').fill(`Dépôt E2E ${id}`);
  await page.locator('#loc-code').fill(`E2E-${id}`);
  await choose(page, 'Type', 'Entrepôt');
  await page.locator('#loc-city').fill('Douala');
  await page.getByRole('button', { name: "Créer l'emplacement" }).click();
  await expect(page).toHaveURL(/\/locations$/);
  const location = page.getByRole('listitem').filter({ hasText: `Dépôt E2E ${id}` });
  await expect(location).toBeVisible();
  await expect(location.getByText('Entrepôt')).toBeVisible();

  // 2. Category
  await nav.getByRole('link', { name: 'Catégories' }).click();
  await page.getByRole('button', { name: 'Nouvelle catégorie' }).click();
  await page.locator('#cat-name').fill(`Boissons ${id}`);
  await page.getByRole('button', { name: 'Créer la catégorie' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: `Boissons ${id}` })).toBeVisible();

  // 3. Supplier
  await nav.getByRole('link', { name: 'Fournisseurs' }).click();
  await page.getByRole('link', { name: 'Nouveau fournisseur' }).click();
  await page.locator('#sup-name').fill(`Brasseries ${id}`);
  await page.locator('#sup-email').fill(`contact-${id.toLowerCase()}@brasseries.cm`);
  await page.locator('#sup-lead').pressSequentially('5');
  await page.getByRole('button', { name: 'Créer le fournisseur' }).click();
  await expect(page).toHaveURL(/\/suppliers\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1, name: `Brasseries ${id}` })).toBeVisible();

  // 4. Product
  await nav.getByRole('link', { name: 'Produits' }).click();
  await page.getByRole('link', { name: 'Nouveau produit' }).click();
  await page.locator('#p-name').fill(`Jus de mangue ${id}`);
  await choose(page, 'Catégorie', `Boissons ${id}`);
  await choose(page, 'Fournisseur', new RegExp(`Brasseries ${id}`));
  await page.locator('#p-purchase').pressSequentially('300');
  await page.locator('#p-sale').pressSequentially('500');
  await page.getByRole('button', { name: 'Créer le produit' }).click();
  await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1, name: `Jus de mangue ${id}` })).toBeVisible();
  await expect(page.locator('#p-sku')).toHaveValue(/^PRD-\d{6}$/);

  // 5. Picture: local preview first, then upload
  await page.locator('input[type="file"]').setInputFiles('fixtures/product.png');
  await expect(page.getByRole('img', { name: 'Aperçu de la nouvelle photo' })).toBeVisible();
  await page.getByRole('button', { name: 'Enregistrer la photo' }).click();
  await expect(page.getByText('Photo enregistrée.')).toBeVisible();
  await expect(page.getByRole('img', { name: `Jus de mangue ${id}` })).toBeVisible();

  // 6. Barcode
  await page.getByRole('button', { name: 'Générer un EAN-13' }).click();
  const barcode = page.getByTestId('barcode-value');
  await expect(barcode).toHaveText(/^20\d{11}$/);
  await expect(page.getByRole('img', { name: /Code-barres 20\d{11}/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Générer un EAN-13' })).toHaveCount(0);

  // 7. Label
  await page.getByRole('link', { name: "Imprimer l'étiquette" }).click();
  await expect(page).toHaveURL(/\/products\/labels\?products=/);
  await expect(page.getByTestId('label-selection')).toContainText(`Jus de mangue ${id}`);
  await expect(page.getByTestId('label-summary')).toContainText('1 étiquette(s) sur 1 page(s)');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Télécharger le PDF' }).click();
  const file = await (await download).path();
  expect(readFileSync(file).subarray(0, 5).toString()).toBe('%PDF-');

  // The product appears in the catalogue with its category and supplier.
  await page.goto(`${ANGULAR_URL}/products`);
  await page.getByRole('searchbox').fill(`Jus de mangue ${id}`);
  const row = page.getByRole('row').filter({ hasText: `Jus de mangue ${id}` });
  await expect(row).toContainText(`Boissons ${id}`);
  await expect(row).toContainText(`Brasseries ${id}`);
  await expect(row).toContainText(/500\sFCFA/);
});

test('ADMIN imports products only after a clean preview', async ({ page }) => {
  const id = uniqueSuffix();
  await loginAngular(page, ACCOUNTS.ADMIN);
  await page.goto(`${ANGULAR_URL}/products/import`);

  const bad = `sku,name,salePrice\nIMP-${id}-1,Riz ${id},900\nIMP-${id}-1,Doublon,abc\n`;
  await page.locator('input[type="file"]').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from(bad) });
  await page.getByRole('button', { name: 'Analyser le fichier' }).click();
  await expect(page.getByTestId('import-total')).toHaveText('2');
  await expect(page.getByTestId('import-invalid')).toHaveText('1');
  await expect(page.getByText('Ce SKU apparaît plusieurs fois dans le fichier.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Importer les produits' })).toBeDisabled();

  await page.getByRole('button', { name: 'Choisir un autre fichier' }).click();
  const good = `sku,name,salePrice\nIMP-${id}-1,Riz ${id},900\nIMP-${id}-2,Sucre ${id},"1 200"\n`;
  await page.locator('input[type="file"]').setInputFiles({ name: 'good.csv', mimeType: 'text/csv', buffer: Buffer.from(good) });
  await page.getByRole('button', { name: 'Analyser le fichier' }).click();
  await expect(page.getByTestId('import-valid')).toHaveText('2');
  await page.getByRole('button', { name: 'Importer les produits' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Importer les produits' }).click();
  await expect(page.getByRole('heading', { name: 'Import terminé' })).toBeVisible();
  await expect(page.getByText('2 produit(s) créé(s)')).toBeVisible();
});
