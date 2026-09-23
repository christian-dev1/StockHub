'use client';

import { useTranslations } from 'next-intl';
import { useSession } from '@/core/auth/use-session';
import { OWN_SALES_ONLY_ROLES } from '@/core/config/permissions/permissions';
import { SellerDashboard } from '@/features/sales/presentation/components/seller-dashboard';
import { PageHeader } from '@/shared/ui/page-header';
import { SystemStatusCard } from '../components/system-status-card';

/**
 * Home: personal sales figures for whoever sells; the platform status card is
 * technical information that sellers do not get.
 */
export function HomeView() {
  const t = useTranslations();
  const { session, can } = useSession();
  const seller = session !== null && OWN_SALES_ONLY_ROLES.includes(session.role);
  const sells = can('SALE_VIEW');

  return (
    <>
      <PageHeader
        title={t('home.title')}
        subtitle={sells ? t('sellerDashboard.subtitle') : t('home.subtitle')}
      />
      {sells && <SellerDashboard />}
      {!seller && (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${sells ? 'mt-4' : ''}`}>
          <SystemStatusCard />
        </div>
      )}
    </>
  );
}
