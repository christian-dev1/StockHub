import { useTranslations } from 'next-intl';
import { PageHeader } from '@/shared/ui/page-header';
import { SystemStatusCard } from '../components/system-status-card';

export function HomeView() {
  const t = useTranslations('home');
  return (
    <>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SystemStatusCard />
      </div>
    </>
  );
}
