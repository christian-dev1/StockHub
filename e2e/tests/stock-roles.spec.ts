import { expect, test } from '@playwright/test';
import { ACCOUNTS, ANGULAR_URL, choose, loginAngular, uniqueSuffix } from '../support/stack';
import { Api, pickProduct, stockRow } from '../support/stock';

/**
 * A MAGASINIER runs entries, exits and transfers and sees the batches, but has
 * no STOCK_ADJUST: the adjustment is neither offered nor reachable.
 */
test.describe('Stock — MAGASINIER', () => {
  test('two sites: entry, exit, transfer and batches; no adjustment', async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    const id = uniqueSuffix();
    const admin = await Api.as(request, ACCOUNTS.ADMIN);
    const primary = await admin.primaryLocation();
    const depot = `Dépôt Mag ${id}`;
    const depotId = await admin.location(depot, `MAG-${id}`);
    const name = `Farine E2E ${id}`;
    await admin.product(name);

    // A storekeeper assigned to the main store and the new depot.
    const email = `magasinier-${id.toLowerCase()}@alpha.cm`;
    const temporary = `Temporaire${id}1`;
    const password = `Definitif${id}1`;
    await admin.post('/users', {
      email,
      firstName: 'Mag',
      lastName: `E2E ${id}`,
      role: 'MAGASINIER',
      allLocations: false,
      locationIds: [primary.id, depotId],
      temporaryPassword: temporary,
    });
    const first = await Api.as(request, { email, password: temporary });
    await first.post('/auth/change-password', { currentPassword: temporary, newPassword: password }, 204);
    await loginAngular(page, { email, password });

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Stock', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Mouvements' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Lots' })).toBeVisible();

    await nav.getByRole('link', { name: 'Stock', exact: true }).click();
    const header = page.locator('header').filter({ has: page.getByRole('heading', { level: 1 }) });
    await expect(header.getByRole('link', { name: 'Entrée' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Sortie' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Transfert' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Ajustement' })).toHaveCount(0);

    // Entry of 10 into the depot.
    await header.getByRole('link', { name: 'Entrée' }).click();
    await choose(page, 'Emplacement', depot);
    await pickProduct(page, 'op-product', name);
    await page.locator('#op-quantity').pressSequentially('10');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByTestId('document-number')).toHaveText(/^BE-/);

    // Exit of 2 from the depot.
    await page.goto(`${ANGULAR_URL}/stock/exit`);
    await choose(page, 'Emplacement', depot);
    await pickProduct(page, 'op-product', name);
    await expect(page.getByTestId('available-quantity')).toHaveText('10');
    await page.locator('#op-quantity').pressSequentially('2');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByTestId('document-number')).toHaveText(/^BS-/);

    // Transfer of 3 from the depot to the main store.
    await page.goto(`${ANGULAR_URL}/stock/transfer`);
    await choose(page, 'Emplacement source', depot);
    await choose(page, 'Emplacement de destination', primary.name);
    await pickProduct(page, 'op-product', name);
    await expect(page.getByTestId('available-quantity')).toHaveText('8');
    await page.locator('#op-quantity').pressSequentially('3');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByTestId('document-number')).toHaveText(/^TR-/);

    await expect(await stockRow(page, name, depot)).toHaveText('5');
    await expect(await stockRow(page, name, primary.name)).toHaveText('3');

    // Batches are readable; the adjustment screen is forbidden.
    await page.goto(`${ANGULAR_URL}/stock/batches`);
    await expect(page.getByRole('heading', { level: 1, name: 'Lots' })).toBeVisible();
    await page.goto(`${ANGULAR_URL}/stock/adjustment`);
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test('single site: no location selector and no transfer', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.MAGASINIER);
    await page.goto(`${ANGULAR_URL}/stock`);
    const header = page.locator('header').filter({ has: page.getByRole('heading', { level: 1 }) });
    await expect(header.getByRole('link', { name: 'Entrée' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Transfert' })).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Emplacement' })).toHaveCount(0);

    await page.goto(`${ANGULAR_URL}/stock/entry`);
    await expect(page.getByRole('combobox', { name: 'Emplacement' })).toHaveCount(0);
    await expect(page.getByText('Emplacement :')).toBeVisible();

    await page.goto(`${ANGULAR_URL}/stock/transfer`);
    await expect(page.getByText('Le transfert nécessite au moins deux emplacements.')).toBeVisible();
  });
});
