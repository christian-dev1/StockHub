import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TokenResponse } from '@/core/auth/session';
import { sessionStore } from '@/core/auth/session-store';
import { renderWithProviders } from '@/test/render';

const push = vi.fn();
const replace = vi.fn();
const logout = vi.fn();

vi.mock('@/core/i18n/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/',
}));
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'system', setTheme: vi.fn() }) }));
vi.mock('../auth/auth-api', () => ({ logout: () => logout() }));

const { UserMenu } = await import('./user-menu');

function signIn() {
  const response = {
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 900,
    session: {
      id: 'u1',
      email: 'v@x.cm',
      firstName: 'Vera',
      lastName: 'Seller',
      role: 'VENDEUR',
      permissions: [],
      mustChangePassword: false,
      allLocations: true,
      locations: [],
      company: { id: 'c1', name: 'Alpha', currency: 'XAF', timezone: 'Africa/Douala', locale: 'fr' },
    },
  } satisfies TokenResponse;
  act(() => sessionStore.apply(response));
}

describe('UserMenu', () => {
  afterEach(() => act(() => sessionStore.clear()));

  it('gives access to language, theme, profile and logout from one menu', async () => {
    signIn();
    renderWithProviders(<UserMenu />);

    await userEvent.click(screen.getByRole('button', { name: 'Menu utilisateur' }));

    const panel = screen.getByText('Vera Seller').closest('[id]') as HTMLElement;
    expect(within(panel).getByRole('radiogroup', { name: 'Langue' })).toBeInTheDocument();
    expect(within(panel).getByRole('radiogroup', { name: 'Thème' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Changer le mot de passe' })).toBeInTheDocument();

    logout.mockResolvedValue(undefined);
    await userEvent.click(within(panel).getByRole('button', { name: 'Se déconnecter' }));
    expect(logout).toHaveBeenCalled();
  });

  it('renders nothing without a session', () => {
    const { container } = renderWithProviders(<UserMenu />);
    expect(container).toBeEmptyDOMElement();
  });
});
