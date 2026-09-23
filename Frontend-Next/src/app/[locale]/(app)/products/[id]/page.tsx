import { RequirePermissions } from '@/core/auth/require-permissions';
import { enableLocale } from '@/core/i18n/locale';
import { ProductDetailView } from '@/features/catalogue/presentation/views/product-detail-view';

export default async function ProductPage({ params }: PageProps<'/[locale]/products/[id]'>) {
  const { locale, id } = await params;
  enableLocale(locale);
  return (
    <RequirePermissions permissions={['PRODUCT_VIEW', 'STOCK_VIEW']}>
      <ProductDetailView productId={id} />
    </RequirePermissions>
  );
}
