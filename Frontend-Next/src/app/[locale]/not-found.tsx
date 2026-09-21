import { useTranslations } from 'next-intl';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { Link } from '@/core/i18n/navigation';
import { ErrorStatus } from '@/shared/ui/error-status';

export default function NotFound() {
  const t = useTranslations('errors.page');
  return (
    <ErrorStatus
      status={404}
      title={t('404.title')}
      description={t('404.description')}
      action={<HomeLink label={t('backHome')} />}
    />
  );
}

export function HomeLink({ label }: { readonly label: string }) {
  return (
    <Link
      href={APP_ROUTES.HOME}
      className="bg-primary text-primary-fg hover:bg-primary-hover inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium"
    >
      {label}
    </Link>
  );
}
