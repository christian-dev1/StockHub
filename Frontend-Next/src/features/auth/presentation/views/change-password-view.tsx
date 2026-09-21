'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, type FormEvent } from 'react';
import { changePassword, login, logout, refreshSession } from '@/core/auth/auth-api';
import { useSession } from '@/core/auth/use-session';
import { APP_ROUTES } from '@/core/config/routes/app.routes';
import { useRouter } from '@/core/i18n/navigation';
import { useErrorMessage } from '@/shared/hooks/use-error-message';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';
import { AuthCard } from '../components/auth-card';

export function passwordProblem(password: string): 'length' | 'weak' | null {
  if (password.length < 10 || password.length > 128) return 'length';
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'weak';
  return null;
}

/** The backend revokes every session on success; the user is signed in again with the new password. */
export function ChangePasswordView() {
  const t = useTranslations('auth');
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const { status, session } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unknown') refreshSession().catch(() => undefined);
    if (status === 'anonymous') router.replace(APP_ROUTES.LOGIN);
  }, [status, router]);

  const problem = passwordProblem(next);
  const mismatch = next !== confirmation;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (problem || mismatch || !session) return;
    setSubmitting(true);
    setError(null);
    try {
      await changePassword(current, next);
      await login(session.email, next);
      router.replace(APP_ROUTES.HOME);
    } catch (failure) {
      setError(errorMessage(failure));
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t('changePassword.title')}
      subtitle={
        session?.mustChangePassword ? t('changePassword.requiredSubtitle') : t('changePassword.subtitle')
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}
        <TextField
          label={t('fields.currentPassword')}
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <TextField
          label={t('fields.newPassword')}
          type="password"
          autoComplete="new-password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
          hint={t('passwordRules')}
          error={submitted && problem ? t(`passwordProblem.${problem}`) : null}
        />
        <TextField
          label={t('fields.confirmPassword')}
          type="password"
          autoComplete="new-password"
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={submitted && mismatch ? t('passwordProblem.mismatch') : null}
        />
        <Button type="submit" block loading={submitting} disabled={!session}>
          {t('changePassword.submit')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          block
          onClick={() => logout().finally(() => router.replace(APP_ROUTES.LOGIN))}
        >
          {t('logout')}
        </Button>
      </form>
    </AuthCard>
  );
}
