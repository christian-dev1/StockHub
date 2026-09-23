'use client';

import { useTranslations } from 'next-intl';
import { useSession } from '@/core/auth/use-session';
import { useFormatters } from '@/shared/hooks/use-formatters';
import type { Sale } from '../../domain/entities/sale';

/**
 * The sale as a receipt. On screen it is a card; when printed (browser print,
 * no extra technology) only this block is printed, sized for ticket printers.
 */
export function Receipt({ sale }: { readonly sale: Sale }) {
  const t = useTranslations('sales');
  const { session } = useSession();
  const { money, quantity, dateTime } = useFormatters();

  const facts: [string, string][] = [
    [t('receipt.number'), sale.number],
    [t('receipt.date'), dateTime(sale.createdAt)],
    [t('receipt.location'), sale.locationName],
    [t('receipt.seller'), sale.sellerName],
    ...(sale.customerName ? ([[t('receipt.customer'), sale.customerName]] as [string, string][]) : []),
    [t('receipt.payment'), t(`payment.${sale.paymentMethod}`)],
    [t('receipt.status'), t(`status.${sale.status}`)],
  ];

  return (
    <article className="sh-card sh-receipt p-5 sm:p-6" aria-labelledby="receipt-title">
      <header className="border-border border-b border-dashed pb-3 text-center">
        {session?.company && <p className="text-fg text-lg font-semibold">{session.company.name}</p>}
        <h2 id="receipt-title" className="text-fg-muted text-sm">
          {t('receipt.title')}
        </h2>
      </header>

      <dl className="border-border grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-dashed py-3 text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="text-fg text-right font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>

      <table className="w-full py-3 text-sm">
        <caption className="sr-only">{t('receipt.title')}</caption>
        <thead>
          <tr className="text-fg-muted text-xs">
            <th scope="col" className="py-2 text-left font-medium">
              {t('receipt.product')}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {t('receipt.quantity')}
            </th>
            <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell print:table-cell">
              {t('receipt.unitPrice')}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {t('receipt.amount')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sale.lines.map((line) => (
            <tr key={line.position} className="border-border border-t align-top">
              <td className="text-fg py-2 pr-2">
                {line.productName}
                <span className="text-fg-muted block text-xs sm:hidden print:hidden">
                  {quantity(line.quantity)} × {money(line.unitPrice, sale.currency)}
                </span>
              </td>
              <td className="text-fg py-2 text-right tabular-nums">{quantity(line.quantity)}</td>
              <td className="text-fg hidden py-2 text-right tabular-nums sm:table-cell print:table-cell">
                {money(line.unitPrice, sale.currency)}
              </td>
              <td className="text-fg py-2 text-right font-medium tabular-nums">
                {money(line.lineTotal, sale.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="border-border flex items-baseline justify-between border-t border-dashed pt-3">
        <span className="text-fg text-base font-semibold">{t('receipt.total')}</span>
        <span className="text-fg text-2xl font-bold tabular-nums">
          {money(sale.totalAmount, sale.currency)}
        </span>
      </p>
      <p className="text-fg-muted mt-4 text-center text-xs">{t('receipt.thanks')}</p>
    </article>
  );
}
