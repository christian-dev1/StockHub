import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { Location, formatAddress } from '../entities/location';
import { LocationsRepository } from '../repositories/locations.repository';
import { ListLocationsUseCase, SaveLocationUseCase } from './location.use-cases';

const location = (overrides: Partial<Location>): Location => ({
  id: 'x',
  code: 'X',
  name: 'X',
  type: 'STORE',
  addressLine: null,
  city: null,
  phone: null,
  primary: false,
  active: true,
  version: 0,
  ...overrides,
});

describe('location use cases', () => {
  let repository: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    repository = {
      list: vi.fn(),
      create: vi.fn().mockReturnValue(of({})),
      update: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      providers: [
        ListLocationsUseCase,
        SaveLocationUseCase,
        { provide: LocationsRepository, useValue: repository },
      ],
    });
  });

  it('lists the primary first, then active ones, then by name', async () => {
    repository['list'].mockReturnValue(
      of([
        location({ id: 'b', name: 'B', active: false }),
        location({ id: 'c', name: 'C' }),
        location({ id: 'a', name: 'A', primary: true }),
        location({ id: 'd', name: 'Aa' }),
      ]),
    );
    const list = await firstValueFrom(TestBed.inject(ListLocationsUseCase).execute(true));
    expect(list.map((l) => l.id)).toEqual(['a', 'd', 'c', 'b']);
  });

  it('upper-cases the code and sends blank fields as null', () => {
    TestBed.inject(SaveLocationUseCase)
      .update(
        'l1',
        {
          code: ' dep-1 ',
          name: ' Dépôt ',
          type: 'DEPOT',
          addressLine: ' ',
          city: 'Douala',
          phone: '',
        },
        2,
      )
      .subscribe();
    expect(repository['update']).toHaveBeenCalledWith(
      'l1',
      {
        code: 'DEP-1',
        name: 'Dépôt',
        type: 'DEPOT',
        addressLine: null,
        city: 'Douala',
        phone: null,
      },
      2,
    );
  });

  it('formats an address on one line', () => {
    expect(formatAddress({ addressLine: 'Rue 1', city: 'Douala' })).toBe('Rue 1, Douala');
    expect(formatAddress({ addressLine: null, city: null })).toBe('');
  });
});
