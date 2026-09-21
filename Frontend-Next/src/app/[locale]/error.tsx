'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { logger } from '@/core/logging/logger';
import { ErrorStatus } from '@/shared/ui/error-status';

/** 500 page for unexpected render errors; the raw error is logged, never shown. */
export default function ErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  const t = useTranslations('errors.page');
  useEffect(() => {
    logger.error('Unhandled render error', { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <ErrorStatus
      status={500}
      title={t('500.title')}
      description={t('500.description')}
      action={
        <button
          type="button"
          onClick={reset}
          className="bg-primary text-primary-fg hover:bg-primary-hover rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          {t('retry')}
        </button>
      }
    />
  );
}
