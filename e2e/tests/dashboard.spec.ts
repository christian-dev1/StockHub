import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { ACCOUNTS, ANGULAR_URL, apiToken, loginAngular, rawTranslationKeys } from '../support/stack';
import { Api } from '../support/stock';

/**
 * Dashboards per role, against the real API. Every figure is checked against
 * the backend response; the fixtures live in their own location so that no
 * other test can move the numbers mid-run.
 *
 * Dataset created here (company Alpha, location "Dashboard <id>"):
 *
 *   Product Low   price 100, min 100, entry 5   → low stock (5 ≤ 100)
 *   Product Full  price 50,  min 0,   entry 10  → normal stock
 *
 * Stock value of that location: 5 × 100 + 10 × 50 = 1000.
 */

/** Digits of a formatted figure ("1 250,5" → 1250.5 is never needed: KPIs are integers). */
function digits(text: string): number {
  return Number(text.replace(/\D/g, ''));
}

interface Fixtures {
  readonly locationId: string;
  readonly locationName: string;
  readonly lowName: string;
  readonly fullName: string;
}

async function createFixtures(request: APIRequestContext, id: string): Promise<Fixtures> {
  const admin = await Api.as(request, ACCOUNTS.ADMIN);
  const locationName = `Dashboard ${id}`;
  const locationId = await admin.location(locationName, `DBH-${id}`);
  const lowName = `Kpi Low ${id}`;
  const fullName = `Kpi Full ${id}`;
  const low = await admin.product(lowName, { purchasePrice: 100, minStock: 100 });
  const full = await admin.product(fullName, { purchasePrice: 50, minStock: 0 });
  await admin.enter(locationId, low, 5);
  await admin.enter(locationId, full, 10);
  return { locationId, locationName, lowName, fullName };
}

/** Picks the dashboard location filter (multi-site users only). */
async function chooseLocation(page: Page, locationName: string): Promise<void> {
  await page.getByRole('combobox', { name: 'Emplacement' }).click();
  await page.getByRole('option', { name: locationName }).first().click();
}

test.describe('Dashboard — ADMIN', () => {
  test('real KPIs, period and location filters, flow chart, recent activity', async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`.toUpperCase();
    const f = await createFixtures(request, id);
    const admin = await Api.as(request, ACCOUNTS.ADMIN);

    await loginAngular(page, ACCOUNTS.ADMIN);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bonjour');

    // Location filter narrows every figure to the fixtures' site.
    await chooseLocation(page, f.locationName);
    const summary = await admin.get<{
      catalogue: { totalQuantity: number; stockValue?: number; activeProducts: number };
      status: { normal: number; low: number; out: number };
      activity: { today: { entries: number }; period: { entries: number; exits: number } };
    }>(`/dashboard/summary?period=30D&locationId=${f.locationId}`);

    expect(summary.catalogue.totalQuantity).toBe(15);
    expect(summary.catalogue.stockValue).toBe(1000);
    expect(summary.status).toEqual({ normal: 1, low: 1, out: 0, negative: 0 });

    // The cards show exactly what the backend computed.
    await expect(page.getByTestId('kpi-stock-value')).toContainText('1');
    await expect(page.getByTestId('kpi-stock-value')).toHaveText(/\d/);
    expect(digits(await page.getByTestId('kpi-stock-value').innerText())).toBe(1000);
    expect(digits(await page.getByTestId('kpi-quantity').innerText())).toBe(
      digits(String(summary.catalogue.totalQuantity)),
    );
    expect(digits(await page.getByTestId('kpi-low').innerText())).toBe(1);
    expect(digits(await page.getByTestId('kpi-out').innerText())).toBe(0);
    expect(digits(await page.getByTestId('kpi-entries-today').innerText())).toBe(
      summary.activity.today.entries,
    );

    // Entries vs exits chart totals = sum of the API buckets over the period.
    const flow = await admin.get<{ points: { entries: number; exits: number }[] }>(
      `/dashboard/stock-flow?period=30D&locationId=${f.locationId}`,
    );
    const entries = flow.points.reduce((sum, p) => sum + p.entries, 0);
    const exits = flow.points.reduce((sum, p) => sum + p.exits, 0);
    await expect(page.getByTestId('flow-total-entries')).toHaveText(String(entries));
    await expect(page.getByTestId('flow-total-exits')).toHaveText(String(exits));
    expect(entries).toBe(2);
    expect(exits).toBe(0);

    // Period filter: today only, figures still matching the API.
    await page.getByRole('radio', { name: "Aujourd'hui" }).click();
    await expect(page.getByRole('radio', { name: "Aujourd'hui" })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const today = await admin.get<{ activity: { period: { entries: number } } }>(
      `/dashboard/summary?period=TODAY&locationId=${f.locationId}`,
    );
    await expect
      .poll(async () => digits(await page.getByTestId('kpi-entries-period').innerText()))
      .toBe(today.activity.period.entries);

    // Recent activity shows the fixtures' notes, newest first.
    await expect(page.getByTestId('recent-activity')).toContainText(f.lowName);
    await expect(page.getByTestId('recent-activity')).toContainText('Entrée');

    // The technical platform card never appears on the business dashboard.
    await expect(page.getByText('État de la plateforme')).toHaveCount(0);
    await expect(page.getByText('Vérifié à')).toHaveCount(0);

    // The low-stock card leads to the filtered stock list.
    await page.getByTestId('kpi-low').click();
    await expect(page).toHaveURL(/\/stock\?state=LOW/);

    // No untranslated key on the page (FR).
    expect(await rawTranslationKeys(page)).toEqual([]);
  });
});

test.describe('Dashboard — MANAGER', () => {
  test('business figures with stock value, no administration', async ({ page, request }) => {
    test.setTimeout(150_000);
    const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`.toUpperCase();
    const f = await createFixtures(request, id);
    const manager = await Api.as(request, ACCOUNTS.MANAGER);

    await loginAngular(page, ACCOUNTS.MANAGER);
    await expect(page).toHaveURL(/\/dashboard$/);

    // The manager holds STOCK_VALUE_VIEW: the financial card exists and is real.
    const summary = await manager.get<{
      catalogue: { stockValue?: number };
      status: { low: number };
    }>(`/dashboard/summary?period=30D&locationId=${f.locationId}`);
    expect(summary.catalogue.stockValue).toBe(1000);

    await chooseLocation(page, f.locationName);
    await expect(page.getByTestId('kpi-stock-value')).toBeVisible();
    expect(digits(await page.getByTestId('kpi-stock-value').innerText())).toBe(1000);
    expect(digits(await page.getByTestId('kpi-low').innerText())).toBe(1);

    // No technical card from the old dashboard: it is platform-only.
    await expect(page.getByText('État de la plateforme')).toHaveCount(0);
    await expect(page.getByText('Vérifié à')).toHaveCount(0);

    // Business dashboard: stock widgets, no company administration.
    await expect(page.getByRole('heading', { name: 'État du stock' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Produits les plus mouvementés' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Activités de stock récentes' })).toBeVisible();
    await expect(page.getByTestId('recent-activity').getByText(f.lowName).first()).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Entreprises' })).toHaveCount(
      0,
    );
    await page.goto(`${ANGULAR_URL}/platform/companies`);
    await expect(page).toHaveURL(/\/forbidden$/);
  });
});

test.describe('Dashboard — MAGASINIER', () => {
  test('operational view of his single location, no financial figure', async ({
    page,
    request,
  }) => {
    test.setTimeout(150_000);
    const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`.toUpperCase();
    const f = await createFixtures(request, id);
    const admin = await Api.as(request, ACCOUNTS.ADMIN);

    // A storekeeper assigned to the fixtures' location only.
    const email = `mag-dashboard-${id.toLowerCase()}@alpha.cm`;
    const temporary = `Temporaire${id}1`;
    const password = `Definitif${id}1`;
    await admin.post('/users', {
      email,
      firstName: 'Mag',
      lastName: `Dash ${id}`,
      role: 'MAGASINIER',
      allLocations: false,
      locationIds: [f.locationId],
      temporaryPassword: temporary,
    });
    const first = await Api.as(request, { email, password: temporary });
    await first.post(
      '/auth/change-password',
      { currentPassword: temporary, newPassword: password },
      204,
    );
    // Changing the password invalidates the previous token: sign in again.
    const storekeeper = await Api.as(request, { email, password });

    // The backend never computes a stock value for this role.
    const summary = await storekeeper.get<{
      scope: { financial: boolean };
      catalogue: { stockValue?: number };
      status: { low: number; out: number };
      activity: { today: { entries: number } };
    }>(`/dashboard/summary?period=30D&locationId=${f.locationId}`);
    expect(summary.scope.financial).toBe(false);
    expect('stockValue' in summary.catalogue).toBe(false);
    expect(summary.status).toEqual({ normal: 1, low: 1, out: 0, negative: 0 });

    await loginAngular(page, { email, password });
    await expect(page).toHaveURL(/\/dashboard$/);

    // Operational KPIs of his one location.
    expect(digits(await page.getByTestId('kpi-low').innerText())).toBe(1);
    expect(digits(await page.getByTestId('kpi-out').innerText())).toBe(0);
    expect(digits(await page.getByTestId('kpi-operations-today').innerText())).toBe(
      summary.activity.today.entries,
    );

    // No financial card, no value anywhere in the KPI row.
    await expect(page.getByTestId('kpi-stock-value')).toHaveCount(0);
    await expect(page.getByTestId('kpi-quantity')).toHaveCount(0);
    await expect(page.getByText('Valeur du stock')).toHaveCount(0);
    // No technical platform card either: operational view only.
    await expect(page.getByText('État de la plateforme')).toHaveCount(0);

    // Single site: no location filter to waste space.
    await expect(page.getByRole('combobox', { name: 'Emplacement' })).toHaveCount(0);

    // Quick actions allowed by his permissions.
    await expect(page.getByRole('link', { name: 'Nouvelle entrée' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nouvelle sortie' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nouveau produit' })).toHaveCount(0);

    // Activity tabs reload the timeline with the type filter.
    const tabs = page.getByRole('group', { name: "Type d'opération" });
    await tabs.getByRole('button', { name: 'Entrées' }).click();
    await expect(tabs.getByRole('button', { name: 'Entrées' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByTestId('recent-activity')).toContainText('Entrée');
    await expect(page.getByTestId('recent-activity').getByText('Sortie')).toHaveCount(0);

    // Operational page still lists what needs handling.
    await expect(page.getByTestId('attention-list')).toContainText(f.lowName);
  });
});

test.describe('Dashboard — SUPER_ADMIN', () => {
  test('platform totals, activity chart and recent administrative events', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const platform = await Api.as(request, ACCOUNTS.SUPER_ADMIN);
    const dashboard = await platform.get<{
      totals: { companies: number; users: number };
      recentEvents: unknown[];
    }>('/platform/dashboard?period=7D');
    // Companies are only created by the onboarding: this figure is stable.
    expect(dashboard.totals.companies).toBeGreaterThanOrEqual(2);

    await loginAngular(page, ACCOUNTS.SUPER_ADMIN);
    await page.goto(`${ANGULAR_URL}/dashboard`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bonjour');

    // Real platform totals.
    expect(digits(await page.getByTestId('kpi-companies').innerText())).toBe(dashboard.totals.companies);
    expect(digits(await page.getByTestId('kpi-users').innerText())).toBeGreaterThanOrEqual(
      dashboard.totals.users,
    );
    await expect(page.getByTestId('kpi-platform-operations')).toBeVisible();

    // Technical health is available through Actuator, not as a dashboard card.
    await expect(page.getByText('État de la plateforme')).toHaveCount(0);
    await expect(page.getByText('Vérifié à')).toHaveCount(0);

    // Chart (new companies) and administrative timeline come from the backend.
    await expect(page.getByTestId('platform-chart-total')).toBeVisible();
    await expect(page.getByTestId('platform-events').locator('li').first()).toBeVisible();
    await expect(page.getByTestId('platform-events')).not.toHaveText('LOGIN');

    // Period filter of the platform view.
    await page.getByRole('radio', { name: '7 jours' }).click();
    await expect(page.getByRole('radio', { name: '7 jours' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByTestId('kpi-companies')).toBeVisible();

    // No location filter, no company KPI cards on the platform view.
    await expect(page.getByRole('combobox', { name: 'Emplacement' })).toHaveCount(0);
    await expect(page.getByTestId('kpi-stock-value')).toHaveCount(0);

    expect(await rawTranslationKeys(page)).toEqual([]);
  });
});
