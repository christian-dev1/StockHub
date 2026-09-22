import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { ANGULAR_URL, type Account, apiToken } from './stack';

/** Thin authenticated client over the StockHub API, for test setup only. */
export class Api {
  private constructor(
    private readonly request: APIRequestContext,
    private readonly token: string,
  ) {}

  static async as(request: APIRequestContext, account: Account): Promise<Api> {
    return new Api(request, await apiToken(request, account));
  }

  async post<T>(path: string, data: unknown, status = 201): Promise<T> {
    const response = await this.request.post(`${ANGULAR_URL}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      data,
    });
    expect(response.status(), await response.text()).toBe(status);
    return (await response.json().catch(() => null)) as T;
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.request.get(`${ANGULAR_URL}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    return (await response.json()) as T;
  }

  async location(name: string, code: string): Promise<string> {
    return (await this.post<{ id: string }>('/locations', { code, name, type: 'WAREHOUSE' })).id;
  }

  async primaryLocation(): Promise<{ id: string; name: string }> {
    const locations = await this.get<{ id: string; name: string; primary: boolean }[]>('/locations');
    const primary = locations.find((l) => l.primary);
    expect(primary).toBeDefined();
    return primary!;
  }

  async product(name: string, extra: Record<string, unknown> = {}): Promise<string> {
    return (await this.post<{ id: string }>('/products', { name, unit: 'UNIT', ...extra })).id;
  }

  async enter(locationId: string, productId: string, quantity: number): Promise<void> {
    await this.post('/stock/entries', {
      locationId,
      reason: 'Préparation E2E',
      lines: [{ productId, quantity }],
    });
  }
}

/** Picks a product in the stock product picker by typing part of its name. */
export async function pickProduct(page: Page, inputId: string, name: string): Promise<void> {
  const input = page.locator(`#${inputId}`);
  await input.click();
  await input.pressSequentially(name.slice(-8));
  await page.getByRole('option', { name: new RegExp(escape(name)) }).first().click();
  await expect(input).toHaveValue(name);
}

/** Quantity shown in the stock list for a product (optionally in one location). */
export async function stockRow(page: Page, product: string, location?: string) {
  await page.goto(`${ANGULAR_URL}/stock`);
  await page.getByRole('searchbox').fill(product);
  let row = page.getByRole('row').filter({ hasText: product });
  if (location) row = row.filter({ hasText: location });
  await expect(row).toHaveCount(1);
  return row.getByTestId('stock-quantity');
}

export function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** ISO date (YYYY-MM-DD) `days` from today. */
export function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}
