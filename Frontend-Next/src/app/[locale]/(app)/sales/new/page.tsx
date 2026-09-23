import { RequirePermissions } from '@/core/auth/require-permissions';
import { enableLocale } from '@/core/i18n/locale';
import { NewSaleView } from '@/features/sales/presentation/views/new-sale-view';

export default async function NewSalePage({ params }: PageProps<'/[locale]/sales/new'>) {
  enableLocale((await params).locale);
  return (
    <RequirePermissions permissions={['SALE_CREATE', 'PRODUCT_VIEW', 'STOCK_VIEW']}>
      <NewSaleView />
    </RequirePermissions>
  );
}
