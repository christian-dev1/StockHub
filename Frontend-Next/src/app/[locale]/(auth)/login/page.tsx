import { Suspense } from 'react';
import { enableLocale } from '@/core/i18n/locale';
import { LoginView } from '@/features/auth/presentation/views/login-view';

export default async function LoginPage({ params }: PageProps<'/[locale]/login'>) {
  enableLocale((await params).locale);
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
