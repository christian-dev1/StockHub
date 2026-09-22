import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Location } from '../../domain/entities/location';
import {
  ChangeLocationStatusUseCase,
  ListLocationsUseCase,
} from '../../domain/use-cases/location.use-cases';
import { LocationsStore } from './locations.store';

const primary = { id: 'a', name: 'A', primary: true, active: true } as Location;
const other = { id: 'b', name: 'B', primary: false, active: true } as Location;

describe('LocationsStore', () => {
  let list: ReturnType<typeof vi.fn>;
  let status: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    list = vi.fn().mockReturnValue(of([primary, other]));
    status = {
      deactivate: vi.fn().mockReturnValue(of({ ...other, active: false })),
      setPrimary: vi.fn().mockReturnValue(of({ ...other, primary: true })),
    };
    TestBed.configureTestingModule({
      providers: [
        LocationsStore,
        { provide: ListLocationsUseCase, useValue: { execute: list } },
        { provide: ChangeLocationStatusUseCase, useValue: status },
      ],
    });
  });

  it('knows whether the company has a single site', () => {
    const store = TestBed.inject(LocationsStore);
    list.mockReturnValueOnce(of([primary]));
    store.load(true);
    expect(store.singleSite()).toBe(true);
    store.load(true);
    expect(store.singleSite()).toBe(false);
  });

  it('updates the list after a deactivation and reloads after a primary change', () => {
    const store = TestBed.inject(LocationsStore);
    store.load(true);
    store.deactivate('b').subscribe();
    expect(store.locations().find((l) => l.id === 'b')?.active).toBe(false);
    store.setPrimary('b').subscribe();
    expect(list).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenLastCalledWith(true);
  });
});
