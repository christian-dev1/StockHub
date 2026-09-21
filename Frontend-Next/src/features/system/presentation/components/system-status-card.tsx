'use client';

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useFormatter, useTranslations } from 'next-intl';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/utils/cn';
import { useSystemHealth } from '../hooks/use-system-health';

export function SystemStatusCard() {
  const t = useTranslations('system');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const { data, isPending, isError, refetch, isFetching } = useSystemHealth();

  return (
    <section aria-labelledby="system-status-title" aria-live="polite" className="sh-card p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 id="system-status-title" className="text-fg-muted text-sm font-medium">
          {t('title')}
        </h2>
        <button
          type="button"
          onClick={() => void refetch()}
          aria-label={tCommon('refresh')}
          className="text-fg-muted hover:bg-surface-muted hover:text-fg flex size-9 items-center justify-center rounded-md"
        >
          <ArrowPathIcon className={cn('size-5', isFetching && 'animate-spin')} aria-hidden="true" />
        </button>
      </div>

      {isPending && (
        <div className="mt-3 space-y-2" aria-label={tCommon('loading')}>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      )}

      {isError && (
        <p role="alert" className="text-danger mt-3 flex items-center gap-2 text-base font-medium">
          <ExclamationCircleIcon className="size-5" aria-hidden="true" />
          {t('unreachable')}
        </p>
      )}

      {data && !isError && (
        <>
          <p
            className={cn(
              'mt-3 flex items-center gap-2 text-2xl font-semibold',
              data.status === 'UP' ? 'text-success' : 'text-danger',
            )}
          >
            {data.status === 'UP' ? (
              <CheckCircleIcon className="size-7" aria-hidden="true" />
            ) : (
              <XCircleIcon className="size-7" aria-hidden="true" />
            )}
            {t(`status.${data.status}`)}
          </p>
          <p className="text-fg-muted mt-1 text-xs">
            {t('checkedAt')} {format.dateTime(data.checkedAt, { timeStyle: 'medium' })}
          </p>
        </>
      )}
    </section>
  );
}
