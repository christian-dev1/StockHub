import { RequirePermissions } from '@/core/auth/require-permissions';
import { enableLocale } from '@/core/i18n/locale';
import { SaleDetailView } from '@/features/sales/presentation/views/sale-detail-view';

export default async function SalePage({ params, searchParams }: PageProps<'/[locale]/sales/[id]'>) {
  const { locale, id } = await params;
  enableLocale(locale);
  const { created } = await searchParams;
  return (
    <RequirePermissions permissions={['SALE_VIEW']}>
      <SaleDetailView saleId={id} created={created === '1'} />
    </RequirePermissions>
  );
}
