'use client';

import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { AppError } from '@/core/api/api-error';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { useRouter } from '@/core/i18n/navigation';
import { useSaleLocation } from '@/core/preferences/sale-location';
import { catalogue } from '@/features/catalogue/catalogue.module';
import { NoLocation } from '@/features/catalogue/presentation/components/no-location';
import { useErrorMessage } from '@/shared/hooks/use-error-message';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { LoadError } from '@/shared/ui/load-error';
import { PageHeader } from '@/shared/ui/page-header';
import { SelectField } from '@/shared/ui/select-field';
import { Skeleton } from '@/shared/ui/skeleton';
import { TextField } from '@/shared/ui/text-field';
import { randomId } from '@/shared/utils/random-id';
import { canCheckout, cartTotal, itemCount } from '../../domain/entities/cart';
import type { NewSale, PaymentMethod } from '../../domain/entities/sale';
import { CartLines } from '../components/cart-lines';
import { ProductSearch } from '../components/product-search';
import { useCreateSale, useSaleSettings } from '../hooks/use-sales';
import { useCart } from '../state/cart-store';

const CUSTOMER_NAME_MAX = 120;

/**
 * Point of sale: search/scan → cart → customer (optional) → payment → confirm.
 * Only products and quantities are sent; the server prices the sale.
 */
export function NewSaleView() {
  const t = useTranslations('sales');
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const { money } = useFormatters();
  const { location } = useSaleLocation();
  const settings = useSaleSettings();
  const cart = useCart();
  const createSale = useCreateSale();
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const submission = useRef<{ payload: string; key: string } | null>(null);

  if (!location) {
    return (
      <>
        <PageHeader title={t('new.title')} />
        <NoLocation />
      </>
    );
  }
  if (settings.isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (settings.isError) {
    return <LoadError error={settings.error} onRetry={() => void settings.refetch()} />;
  }

  const { allowNegativeStock, currency, paymentMethods } = settings.data;
  const total = cartTotal(cart.lines);
  const ready = canCheckout(cart.lines, allowNegativeStock);
  const busy = createSale.isPending;

  const submit = () => {
    if (!ready || busy) return;
    const sale: NewSale = {
      locationId: location.id,
      customerName: customerName.trim() || null,
      paymentMethod,
      lines: cart.lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
    };
    // A retry of the very same sale (e.g. after a network error) reuses its key: never sold twice.
    const payload = JSON.stringify(sale);
    if (submission.current?.payload !== payload) submission.current = { payload, key: randomId() };
    createSale.mutate(
      { sale, idempotencyKey: submission.current.key },
      {
        onSuccess: (created) => {
          submission.current = null;
          cart.clear();
          setCustomerName('');
          router.push(`${APP_ROUTES.SALE(created.id)}?created=1`);
        },
        onError: async (error) => {
          if (error instanceof AppError && error.code === 'INSUFFICIENT_STOCK') {
            const fresh = await Promise.all(
              cart.lines.map((line) => catalogue.get(line.product.id, location.id).catch(() => line.product)),
            );
            cart.refresh(fresh);
          }
        },
      },
    );
  };

  return (
    <>
      <PageHeader title={t('new.title')} subtitle={t('new.subtitle')} />
      <div className="grid gap-4 pb-20 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:pb-0">
        <div className="grid gap-4">
          <section className="sh-card p-4">
            <ProductSearch locationId={location.id} onAdd={cart.add} />
          </section>
          <section className="sh-card p-4" aria-labelledby="cart-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="cart-title" className="text-fg text-base font-semibold">
                {t('new.cart')}{' '}
                <span className="text-fg-muted text-sm font-normal">
                  ({t('new.items', { count: itemCount(cart.lines) })})
                </span>
              </h2>
              {cart.lines.length > 0 && (
                <Button variant="ghost" onClick={cart.clear} disabled={busy}>
                  {t('new.clear')}
                </Button>
              )}
            </div>
            <CartLines
              lines={cart.lines}
              allowNegativeStock={allowNegativeStock}
              disabled={busy}
              onStep={cart.step}
              onSet={cart.set}
              onRemove={cart.remove}
            />
          </section>
        </div>

        <section
          id="checkout"
          className="sh-card grid gap-4 p-4 lg:sticky lg:top-20"
          aria-labelledby="checkout-title"
        >
          <h2 id="checkout-title" className="sr-only">
            {t('new.confirm')}
          </h2>
          <TextField
            label={t('new.customer')}
            hint={t('new.customerHint')}
            value={customerName}
            maxLength={CUSTOMER_NAME_MAX}
            autoComplete="off"
            disabled={busy}
            onChange={(event) => setCustomerName(event.target.value)}
          />
          <SelectField
            label={t('new.payment')}
            value={paymentMethod}
            disabled={busy}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {t(`payment.${method}`)}
              </option>
            ))}
          </SelectField>

          <dl className="border-border grid gap-1 border-t pt-4">
            <div className="flex justify-between text-sm">
              <dt className="text-fg-muted">{t('new.subtotal')}</dt>
              <dd className="text-fg tabular-nums">{money(total, currency)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-fg text-lg font-semibold">{t('new.total')}</dt>
              <dd className="text-primary text-3xl font-bold tabular-nums" aria-live="polite">
                {money(total, currency)}
              </dd>
            </div>
          </dl>
          <p className="text-fg-muted text-xs">
            {t('new.noTax')} {t('new.serverPrices')}
          </p>

          {createSale.isError && <Alert tone="danger">{errorMessage(createSale.error)}</Alert>}
          {cart.lines.length > 0 && !ready && <Alert tone="danger">{t('new.fixIssues')}</Alert>}

          <Button block loading={busy} disabled={!ready} onClick={submit} className="min-h-14 text-base">
            <CheckCircleIcon className="size-5" aria-hidden="true" />
            {t('new.confirm')}
          </Button>
        </section>
      </div>

      {/* Phones: the total stays visible above the tab bar, one tap from the checkout. */}
      <div className="border-border bg-surface fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-between gap-3 border-t px-4 py-2 lg:hidden">
        <span className="text-fg text-sm">
          {t('new.total')}{' '}
          <strong className="text-primary text-lg tabular-nums">{money(total, currency)}</strong>
        </span>
        <a
          href="#checkout"
          className="bg-primary text-primary-fg inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold"
        >
          {t('new.confirm')}
        </a>
      </div>
    </>
  );
}
