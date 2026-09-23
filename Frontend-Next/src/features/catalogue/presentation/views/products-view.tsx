'use client';

import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { Link } from '@/core/i18n/navigation';
import { useSaleLocation } from '@/core/preferences/sale-location';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { LoadError } from '@/shared/ui/load-error';
import { PageHeader } from '@/shared/ui/page-header';
import { Pagination } from '@/shared/ui/pagination';
import { SelectField } from '@/shared/ui/select-field';
import { Skeleton } from '@/shared/ui/skeleton';
import { TextField } from '@/shared/ui/text-field';
import { AvailabilityBadge } from '../components/availability-badge';
import { NoLocation } from '../components/no-location';
import { useCatalogue, useCategories } from '../hooks/use-catalogue';

const PAGE_SIZE = 20;

/** Read-only catalogue: price and availability at the seller's point of sale. */
export function ProductsView() {
  const t = useTranslations('catalogue');
  const { location } = useSaleLocation();
  const { money } = useFormatters();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [inStock, setInStock] = useState(false);
  const [page, setPage] = useState(0);
  const debounced = useDebouncedValue(search);
  const categories = useCategories();
  const query = location
    ? {
        locationId: location.id,
        search: debounced,
        categoryId: categoryId || undefined,
        inStock,
        page,
        size: PAGE_SIZE,
      }
    : null;
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useCatalogue(query);
  const filtered = Boolean(debounced.trim() || categoryId || inStock);

  if (!location) {
    return (
      <>
        <PageHeader title={t('title')} />
        <NoLocation />
      </>
    );
  }

  const reset = () => {
    setSearch('');
    setCategoryId('');
    setInStock(false);
    setPage(0);
  };

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle', { location: location.name })} />
      <div className="mb-4">
        <Alert tone="info">{t('readOnly')}</Alert>
      </div>

      <div className="sh-card mb-4 grid gap-4 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-end">
        <TextField
          label={t('search')}
          type="search"
          value={search}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          trailing={<MagnifyingGlassIcon className="text-fg-muted mr-3 size-5" aria-hidden="true" />}
        />
        <SelectField
          label={t('category')}
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(0);
          }}
        >
          <option value="">{t('allCategories')}</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `— ${category.name}` : category.name}
            </option>
          ))}
        </SelectField>
        <label className="text-fg flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => {
              setInStock(event.target.checked);
              setPage(0);
            }}
            className="accent-primary size-6"
          />
          {t('inStockOnly')}
        </label>
      </div>

      {isPending && (
        <div className="sh-card divide-border divide-y" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      )}

      {isError && <LoadError error={error} onRetry={() => void refetch()} />}

      {data && (
        <>
          <p className="text-fg-muted mb-2 text-sm" aria-live="polite">
            {t('results', { count: data.totalElements })}
          </p>
          {data.content.length === 0 ? (
            <div className="sh-card">
              <EmptyState
                icon={MagnifyingGlassIcon}
                title={filtered ? t('noMatch') : t('empty')}
                description={filtered ? t('noMatchHint') : t('emptyHint')}
              >
                {filtered && (
                  <Button variant="secondary" onClick={reset}>
                    {t('resetFilters')}
                  </Button>
                )}
              </EmptyState>
            </div>
          ) : (
            <ul className={`sh-card divide-border divide-y ${isPlaceholderData ? 'opacity-60' : ''}`}>
              {data.content.map((product) => (
                <li key={product.id}>
                  <Link
                    href={APP_ROUTES.PRODUCT(product.id)}
                    className="hover:bg-surface-muted flex min-h-16 items-center gap-3 px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-fg block truncate font-medium">{product.name}</span>
                      <span className="text-fg-muted block truncate text-xs">
                        {product.sku}
                        {product.categoryName ? ` · ${product.categoryName}` : ''}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-fg font-semibold tabular-nums">{money(product.salePrice)}</span>
                      <AvailabilityBadge quantity={product.availableQuantity} unit={product.unit} />
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
