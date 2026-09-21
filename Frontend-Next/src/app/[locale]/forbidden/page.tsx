import { useTranslations } from 'next-intl';
import { ErrorStatus } from '@/shared/ui/error-status';
import { HomeLink } from '../not-found';

export default function ForbiddenPage() {
  const t = useTranslations('errors.page');
  return (
    <ErrorStatus
      status={403}
      title={t('403.title')}
      description={t('403.description')}
      action={<HomeLink label={t('backHome')} />}
    />
  );
}
