import { expect, test } from '@playwright/test';
import {
  ACCOUNTS,
  ANGULAR_URL,
  DEMO_COMPANY_TIME_ZONE,
  apiToken,
  loginAngular,
} from '../support/stack';

test.describe('Back-office session', () => {
  test('a protected route without session goes to the login page', async ({ page }) => {
    await page.goto(`${ANGULAR_URL}/users`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('the session survives a browser refresh', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.ADMIN);
    await page.goto(`${ANGULAR_URL}/users`);
    await expect(page.getByRole('cell', { name: 'manager@alpha.cm' })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('cell', { name: 'manager@alpha.cm' })).toBeVisible();
  });

  test('logout ends the session', async ({ page }) => {
    await loginAngular(page, ACCOUNTS.ADMIN);
    await page.getByRole('button', { name: 'Menu utilisateur' }).click();
    await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto(`${ANGULAR_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('dates are shown in the company time zone', async ({ page }) => {
    // The browser runs in Europe/Paris; the demo company is in Africa/Douala.
    await loginAngular(page, ACCOUNTS.ADMIN);
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

test.describe('First sign-in', () => {
  test('a new user must replace the temporary password before using the app', async ({
    page,
    request,
  }) => {
    const token = await apiToken(request, ACCOUNTS.ADMIN);
    const auth = { Authorization: `Bearer ${token}` };
    // One reusable account, so that repeated runs do not fill the demo company with test users.
    const email = 'e2e-first-signin@alpha.cm';
    const temporaryPassword = `Temporary${Date.now()}`;
    const found = await request.get(`${ANGULAR_URL}/api/v1/users`, {
      headers: auth,
      params: { q: email },
    });
    expect(found.ok()).toBeTruthy();
    const existing = ((await found.json()) as { content: { id: string; email: string }[] }).content.find(
      (user) => user.email === email,
    );
    let userId: string;
    if (existing) {
      userId = existing.id;
      await request.post(`${ANGULAR_URL}/api/v1/users/${userId}/activate`, { headers: auth });
      const reset = await request.post(`${ANGULAR_URL}/api/v1/users/${userId}/reset-password`, {
        headers: auth,
        data: { temporaryPassword },
      });
      expect(reset.status()).toBe(204);
    } else {
      const created = await request.post(`${ANGULAR_URL}/api/v1/users`, {
        headers: auth,
        data: {
          email,
          firstName: 'E2E',
          lastName: 'First sign-in',
          role: 'MAGASINIER',
          allLocations: true,
          locationIds: [],
          temporaryPassword,
        },
      });
      expect(created.status()).toBe(201);
      userId = ((await created.json()) as { id: string }).id;
    }

    try {
      await loginAngular(page, { email, password: temporaryPassword });
      await expect(page).toHaveURL(/\/change-password$/);

      // Any other page stays locked until the password is changed.
      await page.goto(`${ANGULAR_URL}/dashboard`);
      await expect(page).toHaveURL(/\/change-password$/);

      await page.locator('#cp-current').fill(temporaryPassword);
      await page.locator('#cp-new').fill(`Definitive${Date.now()}`);
      await page.locator('#cp-confirm').fill(await page.locator('#cp-new').inputValue());
      await page.locator('form button[type="submit"]').click();
      await expect(page).toHaveURL(/\/dashboard$/);
    } finally {
      // Keep the demo data clean: the test account cannot sign in afterwards.
      await request.post(`${ANGULAR_URL}/api/v1/users/${userId}/disable`, { headers: auth });
    }
  });
});
