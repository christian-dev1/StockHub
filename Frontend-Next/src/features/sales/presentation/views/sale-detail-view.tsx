'use client';

import { ArrowLeftIcon, PlusCircleIcon, PrinterIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { AppError } from '@/core/api/api-error';
import { useSession } from '@/core/auth/use-session';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { Link } from '@/core/i18n/navigation';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { LoadError } from '@/shared/ui/load-error';
import { Skeleton } from '@/shared/ui/skeleton';
import { Receipt } from '../components/receipt';
import { useSale } from '../hooks/use-sales';

/** Sale detail = its receipt, printable; also the confirmation shown right after a sale. */
export function SaleDetailView({ saleId, created }: { readonly saleId: string; readonly created: boolean }) {
  const t = useTranslations('sales.detail');
  const { can } = useSession();
  const { data: sale, isPending, isError, error, refetch } = useSale(saleId);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={APP_ROUTES.SALES}
        className="text-fg-muted hover:text-fg mb-4 inline-flex min-h-11 items-center gap-1 text-sm print:hidden"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        {t('back')}
      </Link>

      {isPending && (
        <div className="sh-card space-y-3 p-6" aria-busy="true">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-1/3" />
        </div>
      )}

      {isError &&
        (error instanceof AppError && error.kind === 'not-found' ? (
          <div className="sh-card">
            <EmptyState title={t('notFound')} />
          </div>
        ) : (
          <LoadError error={error} onRetry={() => void refetch()} />
        ))}

      {sale && (
        <>
          <h1 className="sr-only">{sale.number}</h1>
          {created && (
            <div className="mb-4 print:hidden">
              <Alert tone="success">
                <strong className="block">{t('created')}</strong>
                {t('createdHint')}
              </Alert>
            </div>
          )}
          <Receipt sale={sale} />
          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
            {can('RECEIPT_REPRINT') && (
              <Button variant={created ? 'primary' : 'secondary'} onClick={() => window.print()}>
                <PrinterIcon className="size-5" aria-hidden="true" />
                {t('print')}
              </Button>
            )}
            {can('SALE_CREATE') && (
              <Link
                href={APP_ROUTES.NEW_SALE}
                className="border-border bg-surface text-fg hover:bg-surface-muted inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"
              >
                <PlusCircleIcon className="size-5" aria-hidden="true" />
                {t('newSale')}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
