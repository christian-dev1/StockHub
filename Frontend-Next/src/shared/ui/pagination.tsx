import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { useTranslations } from 'next-intl';
import { Button } from './button';

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  readonly page: number;
  readonly totalPages: number;
  readonly onChange: (page: number) => void;
}) {
  const t = useTranslations('common');
  if (totalPages <= 1) return null;
  return (
    <nav
      className="mt-4 flex items-center justify-between gap-3"
      aria-label={t('pageOf', { page: page + 1, total: totalPages })}
    >
      <Button variant="secondary" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeftIcon className="size-4" aria-hidden="true" />
        {t('previous')}
      </Button>
      <span className="text-fg-muted text-sm">{t('pageOf', { page: page + 1, total: totalPages })}</span>
      <Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
        {t('next')}
        <ChevronRightIcon className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
