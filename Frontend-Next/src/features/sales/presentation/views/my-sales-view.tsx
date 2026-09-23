'use client';

import { ChevronRightIcon, MagnifyingGlassIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { ReceiptPercentIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useSession } from '@/core/auth/use-session';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { Link } from '@/core/i18n/navigation';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { LoadError } from '@/shared/ui/load-error';
import { PageHeader } from '@/shared/ui/page-header';
import { Pagination } from '@/shared/ui/pagination';
import { SelectField } from '@/shared/ui/select-field';
import { Skeleton } from '@/shared/ui/skeleton';
import { TextField } from '@/shared/ui/text-field';
import { PAYMENT_METHODS, type PaymentMethod } from '../../domain/entities/sale';
import { useMySales } from '../hooks/use-sales';

const PAGE_SIZE = 20;

/** The signed-in user's own sales (the backend enforces it for sellers). */
export function MySalesView() {
  const t = useTranslations('sales');
  const { can } = useSession();
  const { money, dateTime } = useFormatters();
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [page, setPage] = useState(0);
  const debounced = useDebouncedValue(search.trim());
  const filtered = Boolean(debounced || from || to || paymentMethod);
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useMySales({
    search: debounced,
    from: from || undefined,
    to: to || undefined,
    paymentMethod: paymentMethod || undefined,
    page,
    size: PAGE_SIZE,
  });

  const reset = () => {
    setSearch('');
    setFrom('');
    setTo('');
    setPaymentMethod('');
    setPage(0);
  };
  const newSale = can('SALE_CREATE') && (
    <Link
      href={APP_ROUTES.NEW_SALE}
      className="bg-primary text-primary-fg hover:bg-primary-hover inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
    >
      <PlusCircleIcon className="size-5" aria-hidden="true" />
      {t('new.title')}
    </Link>
  );

  return (
    <>
      <PageHeader title={t('mine.title')} subtitle={t('mine.subtitle')} actions={newSale} />

      <div className="sh-card mb-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="sm:col-span-2 lg:col-span-1">
          <TextField
            label={t('mine.search')}
            type="search"
            value={search}
            placeholder={t('mine.searchPlaceholder')}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            trailing={<MagnifyingGlassIcon className="text-fg-muted mr-3 size-5" aria-hidden="true" />}
          />
        </div>
        <TextField
          label={t('mine.from')}
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => {
            setFrom(event.target.value);
            setPage(0);
          }}
        />
        <TextField
          label={t('mine.to')}
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => {
            setTo(event.target.value);
            setPage(0);
          }}
        />
        <SelectField
          label={t('mine.payment')}
          value={paymentMethod}
          onChange={(event) => {
            setPaymentMethod(event.target.value as PaymentMethod | '');
            setPage(0);
          }}
        >
          <option value="">{t('mine.allPayments')}</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {t(`payment.${method}`)}
            </option>
          ))}
        </SelectField>
      </div>

      {isPending && (
        <div className="sh-card divide-border divide-y" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-4 p-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      )}
      {isError && <LoadError error={error} onRetry={() => void refetch()} />}

      {data && (
        <>
          <p className="text-fg-muted mb-2 text-sm" aria-live="polite">
            {t('mine.count', { count: data.totalElements })}
          </p>
          {data.content.length === 0 ? (
            <div className="sh-card">
              <EmptyState
                icon={ReceiptPercentIcon}
                title={filtered ? t('mine.noMatch') : t('mine.empty')}
                description={filtered ? t('mine.noMatchHint') : t('mine.emptyHint')}
              >
                {filtered ? (
                  <Button variant="secondary" onClick={reset}>
                    {t('mine.reset')}
                  </Button>
                ) : (
                  newSale
                )}
              </EmptyState>
            </div>
          ) : (
            <ul className={`sh-card divide-border divide-y ${isPlaceholderData ? 'opacity-60' : ''}`}>
              {data.content.map((sale) => (
                <li key={sale.id}>
                  <Link
                    href={APP_ROUTES.SALE(sale.id)}
                    className="hover:bg-surface-muted flex min-h-16 items-center gap-3 px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-fg block font-medium">{sale.number}</span>
                      <span className="text-fg-muted block truncate text-xs">
                        {dateTime(sale.createdAt)} · {sale.customerName ?? t('mine.walkIn')}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-0.5">
                      <span className="text-fg font-semibold tabular-nums">
                        {money(sale.totalAmount, sale.currency)}
                      </span>
                      <span className="text-fg-muted text-xs">
                        {t(`payment.${sale.paymentMethod}`)} · {t('mine.items', { count: sale.itemCount })}
                      </span>
                    </span>
                    <ChevronRightIcon className="text-fg-muted size-5 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
