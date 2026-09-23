'use client';

import { ArrowLeftIcon, ShoppingCartIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { AppError } from '@/core/api/api-error';
import { useSession } from '@/core/auth/use-session';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { Link, useRouter } from '@/core/i18n/navigation';
import { useSaleLocation } from '@/core/preferences/sale-location';
import { useCart } from '@/features/sales/presentation/state/cart-store';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { LoadError } from '@/shared/ui/load-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { AvailabilityBadge } from '../components/availability-badge';
import { NoLocation } from '../components/no-location';
import { useSellableProduct } from '../hooks/use-catalogue';

export function ProductDetailView({ productId }: { readonly productId: string }) {
  const t = useTranslations();
  const { can } = useSession();
  const { location } = useSaleLocation();
  const { money } = useFormatters();
  const cart = useCart();
  const router = useRouter();
  const { data: product, isPending, isError, error, refetch } = useSellableProduct(productId, location?.id);

  const back = (
    <Link
      href={APP_ROUTES.PRODUCTS}
      className="text-fg-muted hover:text-fg mb-4 inline-flex min-h-11 items-center gap-1 text-sm"
    >
      <ArrowLeftIcon className="size-4" aria-hidden="true" />
      {t('catalogue.back')}
    </Link>
  );

  if (!location) return <NoLocation />;
  if (isPending && location) {
    return (
      <>
        {back}
        <div className="sh-card space-y-3 p-6" aria-busy="true">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-40" />
        </div>
      </>
    );
  }
  if (isError) {
    return (
      <>
        {back}
        {error instanceof AppError && error.kind === 'not-found' ? (
          <div className="sh-card">
            <EmptyState title={t('catalogue.notFound')} />
          </div>
        ) : (
          <LoadError error={error} onRetry={() => void refetch()} />
        )}
      </>
    );
  }
  if (!product) return null;

  const details: [string, string | null][] = [
    [t('catalogue.sku'), product.sku],
    [t('catalogue.barcode'), product.barcode],
    [t('catalogue.category'), product.categoryName],
    [t('catalogue.unit'), t(`units.${product.unit}` as never)],
  ];

  return (
    <>
      {back}
      <article className="sh-card p-5 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-fg text-2xl font-semibold tracking-tight">{product.name}</h1>
            <p className="text-fg-muted mt-1 text-sm">{product.sku}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-fg-muted text-xs">{t('catalogue.salePrice')}</p>
            <p className="text-primary text-3xl font-semibold tabular-nums">{money(product.salePrice)}</p>
          </div>
        </header>

        <section className="bg-surface-muted mt-5 flex flex-wrap items-center justify-between gap-2 rounded-lg p-3">
          <span className="text-fg text-sm">{t('catalogue.availability', { location: location.name })}</span>
          <AvailabilityBadge quantity={product.availableQuantity} unit={product.unit} />
        </section>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {details
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="text-fg-muted text-xs">{label}</dt>
                <dd className="text-fg mt-0.5 font-medium break-all">{value}</dd>
              </div>
            ))}
        </dl>
        {product.description && (
          <section className="mt-5">
            <h2 className="text-fg-muted text-xs">{t('catalogue.description')}</h2>
            <p className="text-fg mt-1 text-sm whitespace-pre-line">{product.description}</p>
          </section>
        )}

        {can('SALE_CREATE') && (
          <div className="mt-6">
            <Button
              onClick={() => {
                cart.add(product);
                router.push(APP_ROUTES.NEW_SALE);
              }}
            >
              <ShoppingCartIcon className="size-5" aria-hidden="true" />
              {t('catalogue.sell')}
            </Button>
          </div>
        )}
      </article>
    </>
  );
}
