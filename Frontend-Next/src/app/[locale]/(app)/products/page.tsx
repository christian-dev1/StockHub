import { RequirePermissions } from '@/core/auth/require-permissions';
import { enableLocale } from '@/core/i18n/locale';
import { ProductsView } from '@/features/catalogue/presentation/views/products-view';

export default async function ProductsPage({ params }: PageProps<'/[locale]/products'>) {
  enableLocale((await params).locale);
  return (
    <RequirePermissions permissions={['PRODUCT_VIEW', 'STOCK_VIEW']}>
      <ProductsView />
    </RequirePermissions>
  );
}
