import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors } from '../../../../core/errors/with-app-errors';
import { Page, PageRequest, mapPage, toQueryParams } from '../../../../shared/utils/page';
import { Supplier, SupplierDraft, SupplierFilters } from '../../domain/entities/supplier';
import { SuppliersRepository } from '../../domain/repositories/suppliers.repository';
import { SuppliersDataSource } from '../datasources/suppliers.datasource';
import { toSupplier } from '../mappers/supplier.mapper';

@Injectable()
export class HttpSuppliersRepository extends SuppliersRepository {
  private readonly source = inject(SuppliersDataSource);

  search(request: PageRequest, filters: SupplierFilters): Observable<Page<Supplier>> {
    return this.source
      .search(toQueryParams(request, { q: filters.text, active: filters.active }))
      .pipe(
        map((page) => mapPage(page, toSupplier)),
        withAppErrors(),
      );
  }
  get(id: string): Observable<Supplier> {
    return this.source.get(id).pipe(map(toSupplier), withAppErrors());
  }
  create(draft: SupplierDraft): Observable<Supplier> {
    return this.source.create(draft).pipe(map(toSupplier), withAppErrors());
  }
  update(id: string, draft: SupplierDraft, version: number): Observable<Supplier> {
    return this.source
      .update(id, { supplier: draft, version })
      .pipe(map(toSupplier), withAppErrors());
  }
  activate(id: string): Observable<Supplier> {
    return this.source.activate(id).pipe(map(toSupplier), withAppErrors());
  }
  deactivate(id: string): Observable<Supplier> {
    return this.source.deactivate(id).pipe(map(toSupplier), withAppErrors());
  }
}
