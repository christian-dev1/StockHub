import { toUser } from './user.mapper';

describe('toUser', () => {
  it('maps the API model and derives display fields', () => {
    const user = toUser({
      id: '1',
      email: 'a@b.cm',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: null,
      role: 'MANAGER',
      allLocations: false,
      locationIds: ['l1'],
      status: 'ACTIVE',
      mustChangePassword: true,
      lastLoginAt: '2026-09-21T08:00:00Z',
      version: 3,
    });
    expect(user.fullName).toBe('Ada Lovelace');
    expect(user.lastLoginAt).toEqual(new Date('2026-09-21T08:00:00Z'));
    expect(user.locationIds).toEqual(['l1']);
  });

  it('keeps a missing last login as null', () => {
    const user = toUser({
      id: '1',
      email: 'a@b.cm',
      firstName: 'A',
      lastName: 'B',
      phone: null,
      role: 'VENDEUR',
      allLocations: true,
      locationIds: [],
      status: 'DISABLED',
      mustChangePassword: false,
      lastLoginAt: null,
      version: 0,
    });
    expect(user.lastLoginAt).toBeNull();
  });
});
