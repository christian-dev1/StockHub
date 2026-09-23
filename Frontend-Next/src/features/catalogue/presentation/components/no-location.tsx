import { MapPinIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/shared/ui/empty-state';

/** A user without any location cannot sell nor see availability. */
export function NoLocation() {
  const t = useTranslations('location');
  return (
    <div className="sh-card">
      <EmptyState icon={MapPinIcon} title={t('none')} description={t('noneHint')} />
    </div>
  );
}
