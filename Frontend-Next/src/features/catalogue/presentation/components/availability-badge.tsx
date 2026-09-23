import { useTranslations } from 'next-intl';
import { useFormatters } from '@/shared/hooks/use-formatters';
import { cn } from '@/shared/utils/cn';

export function AvailabilityBadge({ quantity, unit }: { readonly quantity: number; readonly unit: string }) {
  const t = useTranslations();
  const { quantity: formatQuantity } = useFormatters();
  const inStock = quantity > 0;
  return (
    <span className="border-border text-fg inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap">
      <span aria-hidden="true" className={cn('size-2 rounded-full', inStock ? 'bg-success' : 'bg-danger')} />
      {inStock
        ? t('catalogue.inStock', {
            quantity: `${formatQuantity(quantity)} ${t(`units.${unit}` as never)}`,
          })
        : t('catalogue.outOfStock')}
    </span>
  );
}
