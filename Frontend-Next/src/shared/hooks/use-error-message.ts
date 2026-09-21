import { useTranslations } from 'next-intl';
import { AppError } from '@/core/api/api-error';

/** Maps any failure to a user-facing message: known API code, then backend text, then kind. */
export function useErrorMessage() {
  const t = useTranslations('errors');
  return (error: unknown): string => {
    if (!(error instanceof AppError)) return t('kind.server');
    const key = `api.${error.code}`;
    if (t.has(key as never)) return t(key as never);
    if (error.message && error.kind !== 'server' && error.kind !== 'network') return error.message;
    return t(`kind.${error.kind}` as never);
  };
}
