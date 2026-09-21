'use client';

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { login } from '@/core/auth/auth-api';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { useRouter } from '@/core/i18n/navigation';
import { useErrorMessage } from '@/shared/hooks/use-error-message';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';
import { AuthCard } from '../components/auth-card';

/** Only same-app relative paths are accepted (prevents open redirects). */
export function safeReturnUrl(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : APP_ROUTES.HOME;
}

export function LoginView() {
  const t = useTranslations('auth');
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { session } = await login(email.trim(), password);
      router.replace(
        session.mustChangePassword ? APP_ROUTES.CHANGE_PASSWORD : safeReturnUrl(params.get('returnUrl')),
      );
    } catch (failure) {
      setError(errorMessage(failure));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title={t('login.title')} subtitle={t('login.subtitle')}>
      <form onSubmit={submit} className="space-y-5" noValidate={false}>
        {error && <Alert tone="danger">{error}</Alert>}
        <TextField
          label={t('fields.email')}
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label={t('fields.password')}
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              aria-pressed={showPassword}
              className="text-fg-muted hover:text-fg flex size-11 items-center justify-center"
            >
              {showPassword ? (
                <EyeSlashIcon className="size-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="size-5" aria-hidden="true" />
              )}
            </button>
          }
        />
        <Button type="submit" block loading={submitting}>
          {t('login.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
