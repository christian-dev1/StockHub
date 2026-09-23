import { RequirePermissions } from '@/core/auth/require-permissions';
import { enableLocale } from '@/core/i18n/locale';
import { MySalesView } from '@/features/sales/presentation/views/my-sales-view';

export default async function MySalesPage({ params }: PageProps<'/[locale]/sales'>) {
  enableLocale((await params).locale);
  return (
    <RequirePermissions permissions={['SALE_VIEW']}>
      <MySalesView />
    </RequirePermissions>
  );
}
