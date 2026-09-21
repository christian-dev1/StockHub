import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/core/api/api-error';
import { renderWithProviders } from '@/test/render';

const replace = vi.fn();
const login = vi.fn();

vi.mock('@/core/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/login',
}));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('returnUrl=/sales') }));
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light', setTheme: vi.fn() }) }));
vi.mock('@/core/auth/auth-api', () => ({ login: (...args: unknown[]) => login(...args) }));

const { LoginView } = await import('./login-view');

describe('LoginView', () => {
  beforeEach(() => {
    replace.mockReset();
    login.mockReset();
  });

  it('signs in and goes to the requested page', async () => {
    login.mockResolvedValue({ session: { mustChangePassword: false } });
    renderWithProviders(<LoginView />);

    await userEvent.type(screen.getByLabelText(/Adresse e-mail/), ' seller@shop.cm ');
    await userEvent.type(screen.getByLabelText(/^Mot de passe/), 'Secret2026pass');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(login).toHaveBeenCalledWith('seller@shop.cm', 'Secret2026pass');
    expect(replace).toHaveBeenCalledWith('/sales');
  });

  it('shows a translated error on bad credentials', async () => {
    login.mockRejectedValue(new AppError('unauthorized', 401, 'AUTH_INVALID_CREDENTIALS', 'Invalid'));
    renderWithProviders(<LoginView />);

    await userEvent.type(screen.getByLabelText(/Adresse e-mail/), 'a@b.cm');
    await userEvent.type(screen.getByLabelText(/^Mot de passe/), 'wrong-pass-1');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou mot de passe incorrect.');
    expect(replace).not.toHaveBeenCalled();
  });

  it('sends users with a temporary password to the change-password page', async () => {
    login.mockResolvedValue({ session: { mustChangePassword: true } });
    renderWithProviders(<LoginView />);
    await userEvent.type(screen.getByLabelText(/Adresse e-mail/), 'a@b.cm');
    await userEvent.type(screen.getByLabelText(/^Mot de passe/), 'Temporary2026');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(replace).toHaveBeenCalledWith('/change-password');
  });
});
