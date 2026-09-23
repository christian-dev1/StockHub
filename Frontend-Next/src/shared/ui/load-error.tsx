'use client';

import { useTranslations } from 'next-intl';
import { useErrorMessage } from '../hooks/use-error-message';
import { Alert } from './alert';
import { Button } from './button';

/** Failed query: the reason in plain words and a way to retry. */
export function LoadError({ error, onRetry }: { readonly error: unknown; readonly onRetry: () => void }) {
  const t = useTranslations('common');
  const message = useErrorMessage();
  return (
    <div className="flex flex-col items-start gap-3">
      <Alert tone="danger">
        {t('error')} {message(error)}
      </Alert>
      <Button variant="secondary" onClick={onRetry}>
        {t('retry')}
      </Button>
    </div>
  );
}
