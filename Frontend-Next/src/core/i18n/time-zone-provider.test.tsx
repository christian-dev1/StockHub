import { act, render, screen } from '@testing-library/react';
import { NextIntlClientProvider, useFormatter } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';
import messages from '../../../messages/fr.json';
import type { TokenResponse } from '../auth/session';
import { sessionStore } from '../auth/session-store';
import { TimeZoneProvider } from './time-zone-provider';

const INSTANT = new Date('2026-09-21T23:30:00Z');

function Clock() {
  const format = useFormatter();
  return <p>{format.dateTime(INSTANT, { hour: '2-digit', minute: '2-digit' })}</p>;
}

function renderClock() {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages} timeZone="UTC">
      <TimeZoneProvider>
        <Clock />
      </TimeZoneProvider>
    </NextIntlClientProvider>,
  );
}

function signInWithZone(timezone: string) {
  const response = {
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresIn: 900,
    session: {
      id: 'u1',
      email: 'v@x.cm',
      firstName: 'V',
      lastName: 'V',
      role: 'VENDEUR',
      permissions: [],
      mustChangePassword: false,
      allLocations: true,
      locations: [],
      company: { id: 'c1', name: 'Alpha', currency: 'XAF', timezone, locale: 'fr' },
    },
  } satisfies TokenResponse;
  act(() => sessionStore.apply(response));
}

describe('TimeZoneProvider', () => {
  afterEach(() => act(() => sessionStore.clear()));

  it('formats dates in the company time zone, not in UTC', () => {
    signInWithZone('Africa/Douala');
    renderClock();
    expect(screen.getByText('00:30')).toBeInTheDocument();
  });

  it('follows another company zone', () => {
    signInWithZone('Asia/Tokyo');
    renderClock();
    expect(screen.getByText('08:30')).toBeInTheDocument();
  });
});
