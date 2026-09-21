import { enableLocale } from '@/core/i18n/locale';
import { HomeView } from '@/features/system/presentation/views/home-view';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  enableLocale((await params).locale);
  return <HomeView />;
}
