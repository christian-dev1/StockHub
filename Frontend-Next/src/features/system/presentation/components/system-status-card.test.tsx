import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { SystemStatusCard } from './system-status-card';

describe('SystemStatusCard', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the operational status', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ status: 'UP' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
    );
    renderWithProviders(<SystemStatusCard />);
    expect(await screen.findByText('Opérationnelle')).toBeInTheDocument();
  });

  it('shows an accessible alert when the server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    renderWithProviders(<SystemStatusCard />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Le serveur est injoignable');
  });
});
