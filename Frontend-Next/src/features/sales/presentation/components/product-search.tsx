'use client';

import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { useRef, useState, type KeyboardEvent } from 'react';
import { catalogue } from '@/features/catalogue/catalogue.module';
import { AvailabilityBadge } from '@/features/catalogue/presentation/components/availability-badge';
import { useCatalogue } from '@/features/catalogue/presentation/hooks/use-catalogue';
import type { SellableProduct } from '@/features/catalogue/domain/entities/sellable-product';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { TextField } from '@/shared/ui/text-field';

const RESULTS = 8;

/**
 * Search as you type (name, SKU, barcode). A barcode scanner types the code
 * and presses Enter: the exact match (or the only result) goes straight to
 * the cart, so that scanning needs no click.
 */
export function ProductSearch({
  locationId,
  onAdd,
}: {
  readonly locationId: string;
  readonly onAdd: (product: SellableProduct) => void;
}) {
  const t = useTranslations('sales.new');
  const { money } = useFormatters();
  const [text, setText] = useState('');
  const [announce, setAnnounce] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(text.trim(), 200);
  const { data, isFetching } = useCatalogue(
    debounced ? { locationId, search: debounced, size: RESULTS } : null,
  );
  // Hidden as soon as the field is cleared (after an add), not 200 ms later.
  const open = Boolean(debounced && text.trim());
  const results = open ? (data?.content ?? []) : [];

  const add = (product: SellableProduct) => {
    onAdd(product);
    setAnnounce(t('added', { name: product.name }));
    setText('');
    input.current?.focus();
  };

  const onKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const code = text.trim();
    if (!code) return;
    const page = await catalogue.search({ locationId, search: code, size: 2 });
    const exact = page.content.find((p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
    const match = exact ?? (page.content.length === 1 ? page.content[0] : undefined);
    if (match) add(match);
  };

  return (
    <div>
      <TextField
        ref={input}
        label={t('search')}
        hint={t('searchHint')}
        type="search"
        value={text}
        placeholder={t('searchPlaceholder')}
        autoComplete="off"
        autoFocus
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => void onKeyDown(event)}
        trailing={<MagnifyingGlassIcon className="text-fg-muted mr-3 size-5" aria-hidden="true" />}
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {open && (
        <div className="mt-2" aria-busy={isFetching}>
          {results.length === 0 && !isFetching ? (
            <p className="text-fg-muted px-1 py-3 text-sm">{t('noResult')}</p>
          ) : (
            <ul className="border-border divide-border divide-y rounded-lg border">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => add(product)}
                    aria-label={t('add', { name: product.name })}
                    className="hover:bg-surface-muted focus-visible:bg-surface-muted flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-fg block truncate text-sm font-medium">{product.name}</span>
                      <span className="text-fg-muted block truncate text-xs">{product.sku}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-fg text-sm font-semibold tabular-nums">
                        {money(product.salePrice)}
                      </span>
                      <AvailabilityBadge quantity={product.availableQuantity} unit={product.unit} />
                    </span>
                    <PlusIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
