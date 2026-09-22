import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  ACCOUNTS,
  ANGULAR_URL,
  NEXT_URL,
  createProductViaApi,
  loginAngular,
  loginNext,
  rawTranslationKeys,
  type Account,
} from '../support/stack';
import { Api, inDays } from '../support/stock';

/**
 * Responsive, theme, language and accessibility smoke test of every existing
 * page. Each page is rendered at every width in both themes; failures list
 * the offending page, width and theme together.
 */

const WIDTHS = [320, 375, 430, 768, 1024, 1280, 1440] as const;
const THEMES = ['light', 'dark'] as const;
const LANGUAGES = ['fr', 'en'] as const;
/** Minimum touch target on phones (WCAG 2.2 AA 2.5.8 requires 24 px). */
const MIN_TARGET = 24;

type Catalog = { [key: string]: string | Catalog };

function phrases(file: string): Set<string> {
  const out = new Set<string>();
  const walk = (node: Catalog) => {
    for (const value of Object.values(node)) {
      if (typeof value === 'string') out.add(value);
      else walk(value);
    }
  };
  walk(JSON.parse(readFileSync(file, 'utf8')) as Catalog);
  return out;
}

/** Multi-word phrases that exist in one language only: seeing one in the other language is a mix-up. */
function foreignPhrases(app: 'angular' | 'next', lang: 'fr' | 'en'): string[] {
  const file = (l: string) =>
    app === 'angular' ? `../Frontend-Angular/public/i18n/${l}.json` : `../Frontend-Next/messages/${l}.json`;
  const own = phrases(file(lang));
  const other = phrases(file(lang === 'fr' ? 'en' : 'fr'));
  return [...other].filter((p) => !own.has(p) && p.includes(' ') && p.length >= 10 && !/[{}<]/.test(p));
}

interface PageSpec {
  readonly name: string;
  readonly app: 'angular' | 'next';
  readonly path: (lang: string) => string;
  readonly account?: Account;
}

/** A product created once per worker for the detail page, with a stock note for the stock pages. */
let productId = '';
let documentId = '';
test.beforeAll(async ({ request }) => {
  productId = await createProductViaApi(request, ACCOUNTS.ADMIN, {
    name: `Smoke ${Date.now()}`,
    salePrice: 500,
    batchTracked: true,
    expiryTracked: true,
  });
  const api = await Api.as(request, ACCOUNTS.ADMIN);
  const primary = await api.primaryLocation();
  const entry = await api.post<{ id: string }>('/stock/entries', {
    locationId: primary.id,
    reason: 'Smoke',
    lines: [{ productId, quantity: 12, batchNumber: `SMOKE-${Date.now()}`, expirationDate: inDays(10) }],
  });
  documentId = entry.id;
});

const PAGES: readonly PageSpec[] = [
  { name: 'Angular login', app: 'angular', path: () => '/login' },
  { name: 'Angular dashboard', app: 'angular', path: () => '/dashboard', account: ACCOUNTS.ADMIN },
  { name: 'Companies', app: 'angular', path: () => '/platform/companies', account: ACCOUNTS.SUPER_ADMIN },
  { name: 'Users', app: 'angular', path: () => '/users', account: ACCOUNTS.ADMIN },
  { name: 'New user', app: 'angular', path: () => '/users/new', account: ACCOUNTS.ADMIN },
  { name: 'Company settings', app: 'angular', path: () => '/settings/company', account: ACCOUNTS.ADMIN },
  { name: 'Products', app: 'angular', path: () => '/products', account: ACCOUNTS.ADMIN },
  { name: 'New product', app: 'angular', path: () => '/products/new', account: ACCOUNTS.ADMIN },
  { name: 'Product detail', app: 'angular', path: () => `/products/${productId}`, account: ACCOUNTS.ADMIN },
  { name: 'Product import', app: 'angular', path: () => '/products/import', account: ACCOUNTS.ADMIN },
  { name: 'Labels', app: 'angular', path: () => '/products/labels', account: ACCOUNTS.ADMIN },
  { name: 'Categories', app: 'angular', path: () => '/categories', account: ACCOUNTS.ADMIN },
  { name: 'Suppliers', app: 'angular', path: () => '/suppliers', account: ACCOUNTS.ADMIN },
  { name: 'New supplier', app: 'angular', path: () => '/suppliers/new', account: ACCOUNTS.ADMIN },
  { name: 'Locations', app: 'angular', path: () => '/locations', account: ACCOUNTS.ADMIN },
  { name: 'New location', app: 'angular', path: () => '/locations/new', account: ACCOUNTS.ADMIN },
  { name: 'Stock', app: 'angular', path: () => '/stock', account: ACCOUNTS.ADMIN },
  { name: 'Stock (storekeeper)', app: 'angular', path: () => '/stock', account: ACCOUNTS.MAGASINIER },
  { name: 'Stock entry', app: 'angular', path: () => `/stock/entry?productId=${productId}`, account: ACCOUNTS.ADMIN },
  { name: 'Stock exit', app: 'angular', path: () => `/stock/exit?productId=${productId}`, account: ACCOUNTS.ADMIN },
  { name: 'Stock adjustment', app: 'angular', path: () => `/stock/adjustment?productId=${productId}`, account: ACCOUNTS.ADMIN },
  { name: 'Stock transfer', app: 'angular', path: () => `/stock/transfer?productId=${productId}`, account: ACCOUNTS.ADMIN },
  { name: 'Stock movements', app: 'angular', path: () => '/stock/movements', account: ACCOUNTS.ADMIN },
  { name: 'Batches', app: 'angular', path: () => '/stock/batches', account: ACCOUNTS.ADMIN },
  { name: 'Stock notes', app: 'angular', path: () => '/stock/documents', account: ACCOUNTS.ADMIN },
  { name: 'Stock note', app: 'angular', path: () => `/stock/documents/${documentId}`, account: ACCOUNTS.ADMIN },
  { name: 'Next login', app: 'next', path: (lang) => `/${lang}/login` },
  { name: 'Next home', app: 'next', path: (lang) => `/${lang}`, account: ACCOUNTS.VENDEUR },
  { name: 'Change password', app: 'next', path: (lang) => `/${lang}/change-password`, account: ACCOUNTS.VENDEUR },
];

async function openPage(browser: Browser, spec: PageSpec, lang: string, theme: string) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: lang === 'fr' ? 'fr-FR' : 'en-US',
    colorScheme: theme as 'light' | 'dark',
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource.*40[13]/.test(message.text())) {
      errors.push(message.text());
    }
  });
  if (spec.app === 'angular') {
    await context.addInitScript((l) => localStorage.setItem('stockhub.language', l), lang);
    if (spec.account) await loginAngular(page, spec.account);
    await page.goto(`${ANGULAR_URL}${spec.path(lang)}`);
  } else {
    if (spec.account) await loginNext(page, spec.account, lang as 'fr' | 'en');
    await page.goto(`${NEXT_URL}${spec.path(lang)}`);
  }
  await page.waitForLoadState('networkidle');
  return { context, page, errors };
}

async function layoutProblems(page: Page, width: number): Promise<string[]> {
  return page.evaluate(
    ({ width, minTarget }) => {
      const problems: string[] = [];
      const root = document.documentElement;
      if (root.scrollWidth > root.clientWidth) {
        const culprits = [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => el.getBoundingClientRect().right > root.clientWidth + 1)
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
        problems.push(`horizontal scroll ${root.scrollWidth}px > ${root.clientWidth}px (${culprits.join(', ')})`);
      }
      if (width <= 430) {
        const targets = document.querySelectorAll<HTMLElement>(
          'a[href], button, [role="radio"], [role="combobox"], input:not([type="hidden"])',
        );
        for (const el of targets) {
          const box = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          // Hidden, or visually hidden until focused (skip links).
          if (box.width <= 1 || style.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
          // Links inside a sentence are exempt (WCAG 2.5.8 "inline" exception).
          if (el.tagName === 'A' && style.display === 'inline') continue;
          if (box.width < minTarget || box.height < minTarget) {
            const label = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30) ?? '';
            problems.push(`small target ${Math.round(box.width)}x${Math.round(box.height)} <${el.tagName.toLowerCase()}> "${label}"`);
          }
        }
      }
      return problems;
    },
    { width, minTarget: MIN_TARGET },
  );
}

for (const spec of PAGES) {
  test.describe(spec.name, () => {
    for (const theme of THEMES) {
      test(`${theme}: no overflow, small targets, JS errors or a11y violations at any width`, async ({ browser }) => {
        const { context, page, errors } = await openPage(browser, spec, 'fr', theme);
        const problems: string[] = [];
        for (const width of WIDTHS) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForTimeout(150);
          problems.push(...(await layoutProblems(page, width)).map((p) => `${width}px ${p}`));
          if (width === 375 || width === 1280) {
            const axe = await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
              .analyze();
            for (const violation of axe.violations) {
              for (const node of violation.nodes) {
                problems.push(`${width}px axe ${violation.id} ${node.target.join(' ')}`);
              }
            }
          }
        }
        problems.push(...errors.map((e) => `JS error: ${e}`));
        await context.close();
        expect(problems, `${spec.name} (${theme})`).toEqual([]);
      });
    }

    for (const lang of LANGUAGES) {
      test(`${lang}: fully translated`, async ({ browser }) => {
        const { context, page } = await openPage(browser, spec, lang, 'light');
        await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(`^${lang}`));
        expect(await rawTranslationKeys(page)).toEqual([]);
        const text = await page.locator('body').innerText();
        const shown = (phrase: string) =>
          new RegExp(`(^|[^\\p{L}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u').test(text);
        expect(foreignPhrases(spec.app, lang).filter(shown)).toEqual([]);
        await context.close();
      });
    }
  });
}
