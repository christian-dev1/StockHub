import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TokenResponse } from './session';
import { sessionStore } from './session-store';

const replace = vi.fn();
vi.mock('../i18n/navigation', () => ({ useRouter: () => ({ replace }) }));

const { RequirePermissions } = await import('./require-permissions');

function signIn(role: 'VENDEUR' | 'MAGASINIER', permissions: string[]) {
  const response: TokenResponse = {
    accessToken: 't',
    tokenType: 'Bearer',
    expiresIn: 900,
    session: {
      id: 'u1',
      email: 'u@x.cm',
      firstName: 'U',
      lastName: 'Ser',
      role,
      permissions,
      mustChangePassword: false,
      allLocations: false,
      locations: [],
      company: null,
    },
  };
  act(() => sessionStore.apply(response));
}

describe('RequirePermissions', () => {
  afterEach(() => {
    act(() => sessionStore.clear());
    replace.mockReset();
  });

  it('renders the page when every permission is granted', () => {
    signIn('VENDEUR', ['SALE_CREATE', 'SALE_VIEW']);
    render(
      <RequirePermissions permissions={['SALE_CREATE']}>
        <p>Caisse</p>
      </RequirePermissions>,
    );
    expect(screen.getByText('Caisse')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('sends a user typing the URL of a forbidden page to the 403 page', () => {
    signIn('MAGASINIER', ['PRODUCT_VIEW']);
    render(
      <RequirePermissions permissions={['SALE_CREATE']}>
        <p>Caisse</p>
      </RequirePermissions>,
    );
    expect(screen.queryByText('Caisse')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/forbidden');
  });
});
