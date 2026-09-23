import { enableLocale } from '@/core/i18n/locale';
import { PreferencesView } from '@/features/account/presentation/views/preferences-view';

export default async function PreferencesPage({ params }: PageProps<'/[locale]/preferences'>) {
  enableLocale((await params).locale);
  return <PreferencesView />;
}
