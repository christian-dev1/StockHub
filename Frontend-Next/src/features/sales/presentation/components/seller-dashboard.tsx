'use client';

import { ChevronRightIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { useSession } from '@/core/auth/use-session';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { Link } from '@/core/i18n/navigation';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { LoadError } from '@/shared/ui/load-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { useSellerSummary } from '../hooks/use-sales';

const DAYS = 7;

/** Personal figures only: the backend computes them for the signed-in user. */
export function SellerDashboard() {
  const t = useTranslations();
  const { can } = useSession();
  const { money, quantity, dateTime } = useFormatters();
  const { data, isPending, isError, error, refetch } = useSellerSummary(DAYS);

  return (
    <div className="grid grid-cols-1 gap-4">
      {can('SALE_CREATE') && (
        <Link
          href={APP_ROUTES.NEW_SALE}
          className="bg-primary text-primary-fg hover:bg-primary-hover shadow-card flex min-h-16 items-center justify-center gap-2 rounded-xl text-lg font-semibold sm:w-fit sm:px-8"
        >
          <PlusCircleIcon className="size-6" aria-hidden="true" />
          {t('sellerDashboard.newSale')}
        </Link>
      )}

      {isPending && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}
      {isError && <LoadError error={error} onRetry={() => void refetch()} />}

      {data && (
        <>
          <dl className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
            <Kpi label={t('sellerDashboard.todayRevenue')} value={money(data.today.revenue, data.currency)} />
            <Kpi label={t('sellerDashboard.todaySales')} value={String(data.today.salesCount)} />
            <Kpi
              label={t('sellerDashboard.averageBasket')}
              value={money(data.today.averageBasket, data.currency)}
            />
            <Kpi
              label={t('sellerDashboard.periodRevenue', { days: data.days })}
              value={money(data.lastDays.revenue, data.currency)}
              hint={t('sellerDashboard.periodSales', { count: data.lastDays.salesCount })}
            />
          </dl>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="sh-card p-4" aria-labelledby="recent-sales">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2">
                <h2 id="recent-sales" className="text-fg text-base font-semibold">
                  {t('sellerDashboard.recent')}
                </h2>
                <Link
                  href={APP_ROUTES.SALES}
                  className="text-primary min-h-11 content-center text-sm font-medium"
                >
                  {t('sellerDashboard.viewAll')}
                </Link>
              </div>
              {data.recentSales.length === 0 ? (
                <p className="text-fg-muted py-6 text-center text-sm">{t('sellerDashboard.noSales')}</p>
              ) : (
                <ul className="divide-border divide-y">
                  {data.recentSales.map((sale) => (
                    <li key={sale.id}>
                      <Link
                        href={APP_ROUTES.SALE(sale.id)}
                        className="hover:bg-surface-muted -mx-2 flex min-h-14 items-center gap-3 rounded-lg px-2 py-2"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="text-fg block text-sm font-medium">{sale.number}</span>
                          <span className="text-fg-muted block truncate text-xs">
                            {dateTime(sale.createdAt)} · {sale.customerName ?? t('sales.mine.walkIn')}
                          </span>
                        </span>
                        <span className="text-fg text-sm font-semibold tabular-nums">
                          {money(sale.totalAmount, sale.currency)}
                        </span>
                        <ChevronRightIcon className="text-fg-muted size-4" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="sh-card p-4" aria-labelledby="top-products">
              <h2 id="top-products" className="text-fg mb-2 text-base font-semibold">
                {t('sellerDashboard.topProducts', { days: data.days })}
              </h2>
              {data.topProducts.length === 0 ? (
                <p className="text-fg-muted py-6 text-center text-sm">{t('sellerDashboard.noTopProducts')}</p>
              ) : (
                <ol className="divide-border divide-y">
                  {data.topProducts.map((product, index) => (
                    <li key={product.productId} className="flex min-h-12 items-center gap-3 py-2">
                      <span className="bg-surface-muted text-fg-muted flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-fg block truncate text-sm font-medium">
                          {product.productName}
                        </span>
                        <span className="text-fg-muted text-xs">
                          {t('sellerDashboard.sold', { quantity: quantity(product.quantity) })}
                        </span>
                      </span>
                      <span className="text-fg text-sm tabular-nums">
                        {money(product.revenue, data.currency)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}) {
  return (
    <div className="sh-card min-w-0 p-4">
      <dt className="text-fg-muted text-xs font-medium">{label}</dt>
      <dd className="text-fg mt-1 text-xl font-semibold break-words tabular-nums sm:text-2xl">{value}</dd>
      {hint && <dd className="text-fg-muted mt-0.5 text-xs">{hint}</dd>}
    </div>
  );
}
