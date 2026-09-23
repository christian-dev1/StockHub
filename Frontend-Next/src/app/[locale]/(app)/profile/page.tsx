import { enableLocale } from '@/core/i18n/locale';
import { ProfileView } from '@/features/account/presentation/views/profile-view';

export default async function ProfilePage({ params }: PageProps<'/[locale]/profile'>) {
  enableLocale((await params).locale);
  return <ProfileView />;
}
