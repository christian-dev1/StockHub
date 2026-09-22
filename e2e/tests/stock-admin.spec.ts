import { expect, test } from '@playwright/test';
import { ACCOUNTS, ANGULAR_URL, choose, loginAngular, uniqueSuffix } from '../support/stack';
import { Api, escape, inDays, pickProduct, stockRow } from '../support/stock';

/**
 * Stock screens of the back-office, driven by an ADMIN. Setup data (products,
 * locations) goes through the API; every stock operation under test goes
 * through the UI, and every check reads what the backend recorded.
 */
test.describe('Stock — ADMIN', () => {
  test('entry +20, exit 5, then an exit above the stock is refused', async ({ page, request }) => {
    test.setTimeout(120_000);
    const id = uniqueSuffix();
    const api = await Api.as(request, ACCOUNTS.ADMIN);
    const name = `Savon E2E ${id}`;
    await api.product(name);
    const primary = await api.primaryLocation();
    await loginAngular(page, ACCOUNTS.ADMIN);

    // Entry of 20 from the stock page.
    await page.getByRole('navigation').getByRole('link', { name: 'Stock', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Stock' })).toBeVisible();
    await page.getByRole('link', { name: 'Entrée' }).first().click();
    await expect(page).toHaveURL(/\/stock\/entry$/);
    await expect(page.getByRole('combobox', { name: 'Emplacement' })).toContainText(primary.name);
    await pickProduct(page, 'op-product', name);
    await expect(page.getByTestId('available-quantity')).toHaveText('0');
    await page.locator('#op-quantity').pressSequentially('20');
    await page.locator('#op-reference').fill(`BL-${id}`);
    await page.getByRole('button', { name: "Enregistrer l'entrée" }).click();
    const result = page.getByTestId('operation-result');
    await expect(result.getByRole('heading', { name: 'Entrée enregistrée' })).toBeVisible();
    await expect(result.getByTestId('document-number')).toHaveText(/^BE-\d{4}-\d{6}$/);
    await expect(await stockRow(page, name, primary.name)).toHaveText('20');

    // Exit of 5, from the quick action of the row.
    await page
      .getByRole('link', { name: new RegExp(`Sortie — ${escape(name)}`) })
      .first()
      .click();
    await expect(page).toHaveURL(/\/stock\/exit\?productId=/);
    await expect(page.locator('#op-product')).toHaveValue(name);
    await expect(page.getByTestId('available-quantity')).toHaveText('20');
    await page.locator('#op-quantity').pressSequentially('5');
    await page.getByRole('button', { name: 'Enregistrer la sortie' }).click();
    await expect(page.getByTestId('operation-result').getByTestId('document-number')).toHaveText(
      /^BS-\d{4}-\d{6}$/,
    );
    await expect(await stockRow(page, name, primary.name)).toHaveText('15');

    // Exit above the stock: translated refusal, nothing changes.
    await page.goto(`${ANGULAR_URL}/stock/exit`);
    await pickProduct(page, 'op-product', name);
    await expect(page.getByTestId('available-quantity')).toHaveText('15');
    await page.locator('#op-quantity').pressSequentially('40');
    await expect(page.getByText('La quantité demandée dépasse le stock disponible (15).')).toBeVisible();
    await page.getByRole('button', { name: 'Enregistrer la sortie' }).click();
    const error = page.getByTestId('operation-error');
    await expect(error).toContainText('Stock insuffisant pour cette opération.');
    await expect(error).toContainText('Disponible : 15 — demandé : 40.');
    await expect(error).not.toContainText('INSUFFICIENT_STOCK');
    await expect(await stockRow(page, name, primary.name)).toHaveText('15');

    // The ledger shows both movements, with the author.
    await page.goto(`${ANGULAR_URL}/stock/movements`);
    await page.locator('#mv-product').click();
    await page.locator('#mv-product').pressSequentially(name.slice(-8));
    await page.getByRole('option', { name: new RegExp(escape(name)) }).click();
    const rows = page.getByRole('row').filter({ hasText: name });
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Sortie' })).toContainText('-5');
    await expect(rows.filter({ hasText: 'Entrée' })).toContainText('+20');
    await expect(rows.first()).toContainText('Aline Admin');
  });

  test('transfer 7 from A (20) to B (5) gives A = 13 and B = 12', async ({ page, request }) => {
    test.setTimeout(120_000);
    const id = uniqueSuffix();
    const api = await Api.as(request, ACCOUNTS.ADMIN);
    const a = await api.location(`Site A ${id}`, `A-${id}`);
    const b = await api.location(`Site B ${id}`, `B-${id}`);
    const name = `Eau E2E ${id}`;
    const productId = await api.product(name);
    await api.enter(a, productId, 20);
    await api.enter(b, productId, 5);
    await loginAngular(page, ACCOUNTS.ADMIN);

    await page.goto(`${ANGULAR_URL}/stock/transfer?productId=${productId}&locationId=${a}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Transfert entre emplacements' })).toBeVisible();
    await expect(page.locator('#op-product')).toHaveValue(name);
    await choose(page, 'Emplacement de destination', `Site B ${id}`);
    await expect(page.getByTestId('available-quantity')).toHaveText('20');
    await page.locator('#op-quantity').pressSequentially('7');
    await page.locator('#op-reason').fill('Réassort E2E');
    await page.locator('form button[type="submit"]').click();

    const balances = page.getByTestId('transfer-balances');
    await expect(page.getByTestId('document-number')).toHaveText(/^TR-\d{4}-\d{6}$/);
    await expect(balances).toContainText(`Site A ${id}`);
    await expect(balances.locator('div').filter({ hasText: `Site A ${id}` })).toContainText('20 → 13');
    await expect(balances.locator('div').filter({ hasText: `Site B ${id}` })).toContainText('5 → 12');

    await expect(await stockRow(page, name, `Site A ${id}`)).toHaveText('13');
    await expect(await stockRow(page, name, `Site B ${id}`)).toHaveText('12');
  });

  test('FEFO: an exit of 4 empties LOT-A (nearest expiry) then takes 1 from LOT-B', async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    const id = uniqueSuffix();
    const api = await Api.as(request, ACCOUNTS.ADMIN);
    const name = `Yaourt E2E ${id}`;
    await api.product(name, { batchTracked: true, expiryTracked: true });
    const lotA = `LOT-A-${id}`;
    const lotB = `LOT-B-${id}`;
    await loginAngular(page, ACCOUNTS.ADMIN);

    // Entries through the UI; LOT-B first so that FEFO is not "first in".
    for (const [lot, quantity, expiry] of [
      [lotB, '5', inDays(200)],
      [lotA, '3', inDays(20)],
    ] as const) {
      await page.goto(`${ANGULAR_URL}/stock/entry`);
      await pickProduct(page, 'op-product', name);
      await expect(page.locator('#op-batch-number')).toBeVisible();
      await page.locator('#op-quantity').pressSequentially(quantity);
      await page.locator('#op-batch-number').fill(lot.toLowerCase());
      await page.locator('#op-expiration').fill(expiry);
      await page.getByRole('button', { name: "Enregistrer l'entrée" }).click();
      await expect(page.getByTestId('operation-result')).toContainText(lot);
    }

    // Exit of 4: no batch to choose, FEFO explained, then shown in the result.
    await page.goto(`${ANGULAR_URL}/stock/exit`);
    await pickProduct(page, 'op-product', name);
    await expect(page.getByTestId('fefo-hint')).toContainText(
      "StockHub utilise en priorité les lots dont la date d'expiration est la plus proche.",
    );
    await expect(page.locator('#op-batch')).toHaveCount(0);
    await page.locator('#op-quantity').pressSequentially('4');
    await page.getByRole('button', { name: 'Enregistrer la sortie' }).click();
    const result = page.getByTestId('operation-result');
    const lines = result.getByRole('row');
    await expect(lines.filter({ hasText: lotA })).toContainText('-3');
    await expect(lines.filter({ hasText: lotB })).toContainText('-1');

    // The batches page shows what the backend kept.
    await page.goto(`${ANGULAR_URL}/stock/batches`);
    await page.getByRole('searchbox').fill(lotA);
    const a = page.getByRole('row').filter({ hasText: lotA });
    await expect(a).toContainText('Épuisé');
    await page.getByRole('searchbox').fill(lotB);
    const b = page.getByRole('row').filter({ hasText: lotB });
    await expect(b).toContainText('4');
    await expect(b).toContainText('Valide');
  });

  test('adjustment shows current, change and result before confirming', async ({
    page,
    request,
  }) => {
    const id = uniqueSuffix();
    const api = await Api.as(request, ACCOUNTS.ADMIN);
    const name = `Riz E2E ${id}`;
    const productId = await api.product(name);
    const primary = await api.primaryLocation();
    await api.enter(primary.id, productId, 12);
    await loginAngular(page, ACCOUNTS.ADMIN);

    await page.goto(`${ANGULAR_URL}/stock/adjustment?productId=${productId}`);
    await expect(page.getByTestId('available-quantity')).toHaveText('12');
    await page.getByText('Retirer', { exact: true }).click();
    await expect(page.getByRole('radio', { name: 'Retirer' })).toBeChecked();
    await page.locator('#op-quantity').pressSequentially('3');
    const preview = page.getByTestId('adjustment-preview');
    await expect(preview).toContainText('12');
    await expect(preview).toContainText('-3');
    await expect(preview).toContainText('9');
    await page.getByRole('button', { name: 'Ajuster le stock' }).click();
    await expect(page.locator('#op-reason-message')).toHaveText('Ce champ est obligatoire.');
    await page.locator('#op-reason').fill('Casse constatée');
    await page.getByRole('button', { name: 'Ajuster le stock' }).click();
    const dialog = page.getByRole('alertdialog').filter({ hasText: "Confirmer l'ajustement" });
    await expect(dialog).toContainText('stock actuel 12, ajustement -3, stock après opération 9');
    await dialog.getByRole('button', { name: 'Ajuster' }).click();
    await expect(page.getByTestId('document-number')).toHaveText(/^AJ-\d{4}-\d{6}$/);
    await expect(await stockRow(page, name, primary.name)).toHaveText('9');
  });
});
