import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import {
  ACCOUNTS,
  ANGULAR_URL,
  DEMO_COMPANY_TIME_ZONE,
  NEXT_URL,
  apiToken,
  loginNext,
  uniqueSuffix,
  type Account,
} from '../support/stack';
import { Api } from '../support/stock';

/**
 * The VENDEUR space of the sales app (Next.js): dashboard, read-only
 * catalogue, point of sale, own sales and receipts, profile and preferences,
 * and everything he must not reach (UI and API).
 */

interface SeededProduct {
  readonly id: string;
  readonly name: string;
  readonly barcode: string;
}

/** A product with a sale price and stock in the seller's store (the demo primary location). */
async function seedProduct(
  request: APIRequestContext,
  label: string,
  price: number,
  stock: number,
): Promise<SeededProduct> {
  const admin = await Api.as(request, ACCOUNTS.ADMIN);
  const suffix = uniqueSuffix();
  const name = `${label} ${suffix}`;
  const barcode = `E2E${suffix}`;
  const id = await admin.product(name, {
    salePrice: price,
    purchasePrice: Math.round(price / 2),
    barcode,
  });
  if (stock > 0) await admin.enter((await admin.primaryLocation()).id, id, stock);
  return { id, name, barcode };
}

async function searchAndAdd(page: Page, product: SeededProduct) {
  await page.getByLabel('Rechercher ou scanner un produit').fill(product.name);
  await page.getByRole('button', { name: `Ajouter ${product.name} au panier` }).click();
  await expect(page.getByRole('list', { name: 'Panier' })).toContainText(product.name);
}

async function available(request: APIRequestContext, productId: string): Promise<number> {
  const api = await Api.as(request, ACCOUNTS.VENDEUR);
  const store = await api.get<{ id: string; primary: boolean }[]>('/locations');
  const location = store.find((l) => l.primary) ?? store[0]!;
  const product = await api.get<{ availableQuantity: number }>(
    `/sales/catalogue/${productId}?locationId=${location.id}`,
  );
  return Number(product.availableQuantity);
}

/**
 * A second seller of the same store, created once and reused by later runs
 * (the demo company must not grow at every run).
 */
async function secondSeller(request: APIRequestContext): Promise<Account> {
  const account = { email: 'vendeur2-e2e@alpha.cm', password: 'Definitive2026pass' };
  const existing = await request.post(`${ANGULAR_URL}/api/v1/auth/login`, { data: account });
  if (existing.ok()) return account;

  const admin = await Api.as(request, ACCOUNTS.ADMIN);
  const store = await admin.primaryLocation();
  const temporary = 'Temporary2026pass';
  await admin.post('/users', {
    email: account.email,
    firstName: 'Second',
    lastName: 'Vendeur',
    role: 'VENDEUR',
    allLocations: false,
    locationIds: [store.id],
    temporaryPassword: temporary,
  });
  const token = await apiToken(request, { email: account.email, password: temporary });
  const changed = await request.post(`${ANGULAR_URL}/api/v1/auth/change-password`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { currentPassword: temporary, newPassword: account.password },
  });
  expect(changed.status()).toBe(204);
  return account;
}

test.describe('VENDEUR space (Next.js)', () => {
  test('1-2. signs in on a personal dashboard with only the sales menu', async ({ page }) => {
    await loginNext(page, ACCOUNTS.VENDEUR);
    await expect(page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();
    await expect(page.getByText('Votre activité personnelle.')).toBeVisible();
    for (const kpi of ["Chiffre d'affaires du jour", 'Ventes du jour', 'Panier moyen du jour']) {
      await expect(page.getByText(kpi)).toBeVisible();
    }
    await expect(page.getByText('État de la plateforme')).toHaveCount(0);

    const menu = page.getByRole('complementary').getByRole('navigation', { name: 'Navigation principale' });
    await expect(menu.getByRole('link')).toHaveText([
      'Tableau de bord',
      'Produits',
      'Nouvelle vente',
      'Mes ventes',
      'Mon profil',
      'Préférences',
    ]);
    for (const forbidden of [
      'Utilisateurs',
      'Emplacements',
      'Paramètres',
      'Stock',
      'Ajustement',
      'Administration',
    ]) {
      await expect(menu.getByRole('link', { name: forbidden })).toHaveCount(0);
    }
  });

  test('3-6. searches the read-only catalogue by name and barcode and opens a product', async ({
    page,
    request,
  }) => {
    const product = await seedProduct(request, 'Catalogue', 1250, 7);
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.getByRole('complementary').getByRole('link', { name: 'Produits' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Produits' })).toBeVisible();
    await expect(page.getByText('Consultation seule')).toBeVisible();

    await page.getByLabel('Rechercher un produit').fill(product.name);
    const row = page.getByRole('link', { name: new RegExp(product.name) });
    await expect(row).toContainText('1 250');
    await expect(row).toContainText('7 unité en stock');

    await page.getByLabel('Rechercher un produit').fill(product.barcode);
    await expect(page.getByRole('link', { name: new RegExp(product.name) })).toHaveCount(1);
    await page.getByRole('link', { name: new RegExp(product.name) }).click();

    await expect(page.getByRole('heading', { level: 1, name: product.name })).toBeVisible();
    await expect(page.getByText('Prix de vente')).toBeVisible();
    await expect(page.getByText(product.barcode)).toBeVisible();
    await expect(page.getByText(/prix d'achat/i)).toHaveCount(0);
    for (const action of [/modifier/i, /supprimer/i, /désactiver/i, /ajuster/i]) {
      await expect(page.getByRole('button', { name: action })).toHaveCount(0);
    }

    // 6. Changing a product is refused by the API, whatever the UI shows.
    const token = await apiToken(request, ACCOUNTS.VENDEUR);
    const headers = { Authorization: `Bearer ${token}` };
    const update = await request.put(`${ANGULAR_URL}/api/v1/products/${product.id}`, {
      headers,
      data: {
        version: 0,
        product: { name: 'Piraté', unit: 'UNIT', salePrice: 1 },
      },
    });
    expect(update.status()).toBe(403);
    expect(
      (
        await request.delete(`${ANGULAR_URL}/api/v1/products/${product.id}`, {
          headers,
        })
      ).status(),
    ).toBe(403);
  });

  test('7, 9, 15-16, 20. sells one product without customer name and prints the receipt', async ({
    page,
    request,
  }) => {
    const product = await seedProduct(request, 'Eau', 500, 10);
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.getByRole('link', { name: 'Nouvelle vente' }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Nouvelle vente' })).toBeVisible();

    await searchAndAdd(page, product);
    await expect(page.locator('#checkout')).toContainText('500');
    await page.getByRole('button', { name: 'Valider la vente' }).click();

    await expect(page).toHaveURL(/\/sales\/[0-9a-f-]{36}\?created=1$/);
    await expect(page.getByText('Vente enregistrée')).toBeVisible();
    const receipt = page.locator('.sh-receipt');
    await expect(receipt).toContainText(/VT-\d{4}-\d{6}/);
    await expect(receipt).toContainText(product.name);
    await expect(receipt).toContainText('Espèces');
    await expect(receipt).toContainText('Vanessa Vendeur');
    await expect(receipt).not.toContainText('Client');
    await expect(receipt).toContainText('Alpha Market');
    expect(await available(request, product.id)).toBe(9);

    await page.evaluate(() => {
      (window as unknown as { printed: boolean }).printed = false;
      window.print = () => {
        (window as unknown as { printed: boolean }).printed = true;
      };
    });
    await page.getByRole('button', { name: 'Imprimer le reçu' }).click();
    expect(await page.evaluate(() => (window as unknown as { printed: boolean }).printed)).toBe(true);
  });

  test('8, 10-12, 17, 19. sells several products for a named customer after editing the cart', async ({
    page,
    request,
  }) => {
    const rice = await seedProduct(request, 'Riz', 4500, 5);
    const oil = await seedProduct(request, 'Huile', 2000, 5);
    const soap = await seedProduct(request, 'Savon', 300, 5);
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.goto(`${NEXT_URL}/fr/sales/new`);

    await searchAndAdd(page, rice);
    await searchAndAdd(page, oil);
    await searchAndAdd(page, soap);
    await page.getByRole('button', { name: `Augmenter la quantité de ${oil.name}` }).click();
    await page.getByRole('button', { name: `Augmenter la quantité de ${oil.name}` }).click();
    await page.getByRole('button', { name: `Diminuer la quantité de ${oil.name}` }).click();
    await page.getByRole('textbox', { name: `Quantité de ${rice.name}` }).fill('3');
    await page.getByRole('button', { name: `Retirer ${soap.name} du panier` }).click();
    await expect(page.getByRole('list', { name: 'Panier' })).not.toContainText(soap.name);
    // 3 × 4 500 + 2 × 2 000
    await expect(page.locator('#checkout')).toContainText('17 500');

    await page.getByLabel('Nom du client (optionnel)').fill('Mme Ngo Bassa');
    await page.getByLabel('Moyen de paiement').selectOption('MOBILE_MONEY');
    await page.getByRole('button', { name: 'Valider la vente' }).click();

    const receipt = page.locator('.sh-receipt');
    await expect(receipt).toContainText('Mme Ngo Bassa');
    await expect(receipt).toContainText('Mobile money');
    await expect(receipt).toContainText('17 500');
    await expect(receipt).not.toContainText(soap.name);
    const number = (await receipt.textContent())!.match(/VT-\d{4}-\d{6}/)![0];
    expect(await available(request, rice.id)).toBe(2);
    expect(await available(request, oil.id)).toBe(3);
    expect(await available(request, soap.id)).toBe(5);

    // 17. It is in "Mes ventes", searchable by customer name and number, with its detail.
    await page.getByRole('link', { name: 'Retour à mes ventes' }).click();
    await page.getByLabel('Rechercher').fill('Ngo Bassa');
    await expect(page.getByRole('link', { name: new RegExp(number) })).toBeVisible();
    await page.getByLabel('Rechercher').fill(number);
    await expect(page.getByText('1 vente')).toBeVisible();
    await page.getByLabel('Paiement').selectOption('CASH');
    await expect(page.getByText('Aucune vente ne correspond aux filtres')).toBeVisible();
    await page.getByRole('button', { name: 'Réinitialiser les filtres' }).click();
    await page.getByRole('link', { name: new RegExp(number) }).click();
    await expect(page.locator('.sh-receipt')).toContainText('Mme Ngo Bassa');
  });

  test('13-14. an empty cart or a quantity above the stock cannot be confirmed', async ({
    page,
    request,
  }) => {
    const product = await seedProduct(request, 'Rare', 1000, 2);
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.goto(`${NEXT_URL}/fr/sales/new`);
    await expect(page.getByText('Le panier est vide')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Valider la vente' })).toBeDisabled();

    await searchAndAdd(page, product);
    await page.getByRole('textbox', { name: `Quantité de ${product.name}` }).fill('3');
    await expect(page.getByText('Stock insuffisant : 2 disponible(s).')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Valider la vente' })).toBeDisabled();
    await page.getByRole('textbox', { name: `Quantité de ${product.name}` }).fill('0');
    await expect(page.getByText('Quantité invalide')).toBeVisible();

    // The server refuses it too, even if a client skipped the checks.
    const api = await Api.as(request, ACCOUNTS.VENDEUR);
    const store = (await api.get<{ id: string; primary: boolean }[]>('/locations')).find((l) => l.primary)!;
    const response = await request.post(`${ANGULAR_URL}/api/v1/sales`, {
      headers: {
        Authorization: `Bearer ${await apiToken(request, ACCOUNTS.VENDEUR)}`,
      },
      data: {
        locationId: store.id,
        paymentMethod: 'CASH',
        lines: [{ productId: product.id, quantity: 3 }],
      },
    });
    expect(response.status()).toBe(422);
    expect((await response.json()).code).toBe('INSUFFICIENT_STOCK');
    expect(await available(request, product.id)).toBe(2);
  });

  test('a barcode scanner (code + Enter) adds the product directly', async ({ page, request }) => {
    const product = await seedProduct(request, 'Scan', 750, 3);
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.goto(`${NEXT_URL}/fr/sales/new`);
    await page.getByLabel('Rechercher ou scanner un produit').fill(product.barcode);
    await page.getByLabel('Rechercher ou scanner un produit').press('Enter');
    await expect(page.getByRole('list', { name: 'Panier' })).toContainText(product.name);
    await expect(page.getByLabel('Rechercher ou scanner un produit')).toHaveValue('');
  });

  test('18. a seller never sees the sales of another seller', async ({ page, request, browser }) => {
    const product = await seedProduct(request, 'Isolation', 800, 3);
    const other = await secondSeller(request);
    const api = await Api.as(request, other);
    const store = (await api.get<{ id: string; primary: boolean }[]>('/locations')).find((l) => l.primary)!;
    const theirs = await api.post<{ id: string; number: string }>('/sales', {
      locationId: store.id,
      customerName: 'Client confidentiel',
      paymentMethod: 'CARD',
      lines: [{ productId: product.id, quantity: 1 }],
    });

    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.goto(`${NEXT_URL}/fr/sales`);
    await page.getByLabel('Rechercher').fill(theirs.number);
    await expect(page.getByText('Aucune vente ne correspond aux filtres')).toBeVisible();
    await page.goto(`${NEXT_URL}/fr/sales/${theirs.id}`);
    await expect(page.getByText('Cette vente est introuvable.')).toBeVisible();
    await expect(page.getByText('Client confidentiel')).toHaveCount(0);

    const mine = await Api.as(request, ACCOUNTS.VENDEUR);
    const all = await mine.get<{
      content: { id: string }[];
      totalElements: number;
    }>('/sales?mine=false&size=100');
    expect(all.content.map((s) => s.id)).not.toContain(theirs.id);
    const direct = await request.get(`${ANGULAR_URL}/api/v1/sales/${theirs.id}`, {
      headers: {
        Authorization: `Bearer ${await apiToken(request, ACCOUNTS.VENDEUR)}`,
      },
    });
    expect(direct.status()).toBe(404);

    // And the other seller sees it.
    const context = await browser.newContext({ locale: 'fr-FR' });
    const second = await context.newPage();
    await loginNext(second, other);
    await second.goto(`${NEXT_URL}/fr/sales/${theirs.id}`);
    await expect(second.locator('.sh-receipt')).toContainText('Client confidentiel');
    await context.close();
  });

  test('sale times are shown in the company time zone', async ({ page, request }) => {
    const product = await seedProduct(request, 'Heure', 100, 1);
    const api = await Api.as(request, ACCOUNTS.VENDEUR);
    const store = (await api.get<{ id: string; primary: boolean }[]>('/locations')).find((l) => l.primary)!;
    const sale = await api.post<{ id: string }>('/sales', {
      locationId: store.id,
      paymentMethod: 'CASH',
      lines: [{ productId: product.id, quantity: 1 }],
    });
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.goto(`${NEXT_URL}/fr/sales/${sale.id}`);
    const text = await page.locator('.sh-receipt').innerText();
    const shown = text.match(/(\d{2}):(\d{2})/);
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

  test('profile is read-only with password change and logout', async ({ page }) => {
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.goto(`${NEXT_URL}/fr/profile`);
    await expect(page.getByRole('heading', { level: 1, name: 'Mon profil' })).toBeVisible();
    await expect(page.getByText('vendeur@alpha.cm')).toBeVisible();
    await expect(page.getByText('Vendeur', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.getByRole('combobox')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Changer le mot de passe' })).toBeVisible();
    await page.getByRole('main').getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('21-23. preferences: language, theme and a read-only company currency', async ({ page }) => {
    await loginNext(page, ACCOUNTS.VENDEUR);
    await page.goto(`${NEXT_URL}/fr/preferences`);
    await expect(page.getByRole('heading', { level: 1, name: 'Préférences' })).toBeVisible();
    await expect(page.getByText('XAF')).toBeVisible();
    await expect(page.getByText("Définie par l'administrateur")).toBeVisible();

    const main = page.getByRole('main');
    await main.getByRole('radio', { name: 'Sombre' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await main.getByRole('radio', { name: 'Clair' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await main.getByRole('radio', { name: 'Anglais' }).click();
    await expect(page).toHaveURL(/\/en\/preferences$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Preferences' })).toBeVisible();
    await expect(page.getByText('Set by the company administrator')).toBeVisible();
    await page.getByRole('complementary').getByRole('link', { name: 'My sales' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'My sales' })).toBeVisible();
  });

  test('24. administrative URLs typed by hand lead nowhere in the sales app', async ({ page }) => {
    await loginNext(page, ACCOUNTS.VENDEUR);
    for (const path of ['/users', '/settings/company', '/locations/new', '/stock/adjustment', '/admin']) {
      await page.goto(`${NEXT_URL}/fr${path}`);
      await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
    }
  });

  test('24. a role without sale permission typing a sale URL gets the 403 page', async ({ page }) => {
    await loginNext(page, ACCOUNTS.MAGASINIER);
    await page.goto(`${NEXT_URL}/fr/sales/new`);
    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(page.getByRole('heading', { name: 'Accès refusé' })).toBeVisible();
  });

  test('25. the API refuses administrative resources to a seller', async ({ request }) => {
    const headers = {
      Authorization: `Bearer ${await apiToken(request, ACCOUNTS.VENDEUR)}`,
    };
    const api = `${ANGULAR_URL}/api/v1`;
    const checks = [
      request.get(`${api}/users`, { headers }),
      request.get(`${api}/roles`, { headers }),
      request.get(`${api}/company`, { headers }),
      request.put(`${api}/company/settings`, { headers, data: {} }),
      request.post(`${api}/locations`, {
        headers,
        data: { name: 'X', code: 'X', type: 'STORE' },
      }),
      request.post(`${api}/products`, {
        headers,
        data: { name: 'X', unit: 'UNIT' },
      }),
      request.post(`${api}/categories`, { headers, data: { name: 'X' } }),
      request.post(`${api}/stock/adjustments`, { headers, data: {} }),
      request.post(`${api}/stock/transfers`, { headers, data: {} }),
      request.post(`${api}/stock/entries`, { headers, data: {} }),
      request.post(`${api}/stock/exits`, { headers, data: {} }),
      request.get(`${api}/suppliers`, { headers }),
      request.get(`${api}/platform/companies`, { headers }),
    ];
    for (const response of await Promise.all(checks)) {
      expect(response.status(), response.url()).toBe(403);
    }
  });
});
