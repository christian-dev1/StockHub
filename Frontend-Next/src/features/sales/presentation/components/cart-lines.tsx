'use client';

import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { EmptyState } from '@/shared/ui/empty-state';
import { cn } from '@/shared/utils/cn';
import { lineIssue, lineTotal, type CartLine } from '../../domain/entities/cart';

interface CartLinesProps {
  readonly lines: readonly CartLine[];
  readonly allowNegativeStock: boolean;
  readonly disabled: boolean;
  readonly onStep: (productId: string, delta: 1 | -1) => void;
  readonly onSet: (productId: string, quantity: number) => void;
  readonly onRemove: (productId: string) => void;
}

export function CartLines({ lines, allowNegativeStock, disabled, onStep, onSet, onRemove }: CartLinesProps) {
  const t = useTranslations('sales.new');
  if (lines.length === 0) {
    return <EmptyState icon={ShoppingCartIcon} title={t('emptyCart')} description={t('emptyCartHint')} />;
  }
  return (
    <ul className="divide-border divide-y" aria-label={t('cart')}>
      {lines.map((line) => (
        <CartLineRow
          key={line.product.id}
          line={line}
          issue={lineIssue(line, allowNegativeStock)}
          disabled={disabled}
          onStep={onStep}
          onSet={onSet}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}

function CartLineRow({
  line,
  issue,
  disabled,
  onStep,
  onSet,
  onRemove,
}: Omit<CartLinesProps, 'lines' | 'allowNegativeStock'> & {
  readonly line: CartLine;
  readonly issue: ReturnType<typeof lineIssue>;
}) {
  const t = useTranslations();
  const { money, quantity } = useFormatters();
  const { product } = line;
  // The text lets the seller type "1," or clear the field without it jumping back.
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? String(line.quantity);
  const iconButton =
    'border-border text-fg hover:bg-surface-muted flex size-11 items-center justify-center rounded-lg border disabled:opacity-50';

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-fg truncate text-sm font-medium">{product.name}</p>
          <p className="text-fg-muted text-xs">
            {money(product.salePrice)} ·{' '}
            {t('sales.new.stock', { quantity: quantity(product.availableQuantity) })}
          </p>
        </div>
        <p className="text-fg text-sm font-semibold tabular-nums">{money(lineTotal(line))}</p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className={iconButton}
          disabled={disabled || line.quantity <= 1}
          aria-label={t('sales.new.decrease', { name: product.name })}
          onClick={() => {
            setText(null);
            onStep(product.id, -1);
          }}
        >
          <MinusIcon className="size-5" aria-hidden="true" />
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={shown}
          disabled={disabled}
          aria-label={t('sales.new.quantity', { name: product.name })}
          aria-invalid={issue !== null}
          onChange={(event) => {
            const value = event.target.value;
            setText(value);
            const parsed = Number(value.replace(',', '.'));
            onSet(product.id, value.trim() === '' || Number.isNaN(parsed) ? 0 : parsed);
          }}
          onBlur={() => setText(null)}
          className={cn(
            'border-border bg-surface text-fg h-11 w-20 rounded-lg border text-center text-base tabular-nums',
            issue && 'border-danger',
          )}
        />
        <button
          type="button"
          className={iconButton}
          disabled={disabled}
          aria-label={t('sales.new.increase', { name: product.name })}
          onClick={() => {
            setText(null);
            onStep(product.id, 1);
          }}
        >
          <PlusIcon className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="text-danger hover:bg-danger/10 ml-auto flex size-11 items-center justify-center rounded-lg disabled:opacity-50"
          disabled={disabled}
          aria-label={t('sales.new.remove', { name: product.name })}
          onClick={() => onRemove(product.id)}
        >
          <TrashIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
      {issue && (
        <p className="text-danger mt-1 text-xs" role="alert">
          {t(`sales.new.issue.${issue}`, { available: quantity(product.availableQuantity) })}
        </p>
      )}
    </li>
  );
}
