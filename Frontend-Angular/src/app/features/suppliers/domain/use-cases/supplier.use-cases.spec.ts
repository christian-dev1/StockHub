import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_ROUTES } from '../../../../core/config/routes/api.routes';
import { SuppliersDataSource } from '../../data/datasources/suppliers.datasource';
import { HttpSuppliersRepository } from '../../data/repositories/http-suppliers.repository';
import { normalizeSupplier } from './supplier.use-cases';

describe('normalizeSupplier', () => {
  it('trims, sends blanks as null and normalises code, country and email', () => {
    expect(
      normalizeSupplier({
        code: ' sup-1 ',
        name: ' SABC ',
        contactName: ' ',
        email: ' Contact@SABC.cm ',
        phone: '',
        addressLine: null,
        city: 'Douala',
        country: 'cm',
        taxId: '',
        leadTimeDays: null,
        notes: ' ',
      }),
    ).toEqual({
      code: 'SUP-1',
      name: 'SABC',
      contactName: null,
      email: 'contact@sabc.cm',
      phone: null,
      addressLine: null,
      city: 'Douala',
      country: 'CM',
      taxId: null,
      leadTimeDays: null,
      notes: null,
    });
  });
});

describe('HttpSuppliersRepository', () => {
  it('searches with the status filter and sends updates with their version', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SuppliersDataSource,
        HttpSuppliersRepository,
      ],
    });
    const repository = TestBed.inject(HttpSuppliersRepository);
    const http = TestBed.inject(HttpTestingController);

    repository.search({ page: 0, size: 20 }, { text: '', active: true }).subscribe();
    const search = http.expectOne((r) => r.url === API_ROUTES.SUPPLIERS.ROOT);
    expect(search.request.params.get('active')).toBe('true');
    expect(search.request.params.has('q')).toBe(false);
    search.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });

    repository.update('s1', { name: 'A' } as never, 7).subscribe();
    expect(http.expectOne(API_ROUTES.SUPPLIERS.ONE('s1')).request.body).toEqual({
      supplier: { name: 'A' },
      version: 7,
    });
    http.verify();
  });
});
