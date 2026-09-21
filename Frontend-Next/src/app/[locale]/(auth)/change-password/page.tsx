import { enableLocale } from '@/core/i18n/locale';
import { ChangePasswordView } from '@/features/auth/presentation/views/change-password-view';

export default async function ChangePasswordPage({ params }: PageProps<'/[locale]/change-password'>) {
  enableLocale((await params).locale);
  return <ChangePasswordView />;
}
