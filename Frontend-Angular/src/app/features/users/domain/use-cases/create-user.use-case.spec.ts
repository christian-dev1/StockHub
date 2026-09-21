import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NewUser } from '../entities/user';
import { UsersRepository } from '../repositories/users.repository';
import { CreateUserUseCase } from './user.use-cases';

describe('CreateUserUseCase', () => {
  let create: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    create = vi.fn().mockReturnValue(of({}));
    TestBed.configureTestingModule({
      providers: [CreateUserUseCase, { provide: UsersRepository, useValue: { create } }],
    });
  });

  const base: NewUser = {
    email: '  Seller@Shop.CM ',
    firstName: 'S',
    lastName: 'S',
    phone: null,
    role: 'VENDEUR',
    allLocations: false,
    locationIds: ['l1'],
    temporaryPassword: 'Temporary2026',
  };

  it('normalizes the email and keeps explicit locations for restricted roles', () => {
    TestBed.inject(CreateUserUseCase).execute(base).subscribe();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'seller@shop.cm',
        allLocations: false,
        locationIds: ['l1'],
      }),
    );
  });

  it('always grants all locations to administrators', () => {
    TestBed.inject(CreateUserUseCase)
      .execute({ ...base, role: 'ADMIN' })
      .subscribe();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ allLocations: true, locationIds: [] }),
    );
  });
});
