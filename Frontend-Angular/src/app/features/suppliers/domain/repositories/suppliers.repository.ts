import { Observable } from 'rxjs';
import { Page, PageRequest } from '../../../../shared/utils/page';
import { Supplier, SupplierDraft, SupplierFilters } from '../entities/supplier';

export abstract class SuppliersRepository {
  abstract search(request: PageRequest, filters: SupplierFilters): Observable<Page<Supplier>>;
  abstract get(id: string): Observable<Supplier>;
  abstract create(draft: SupplierDraft): Observable<Supplier>;
  abstract update(id: string, draft: SupplierDraft, version: number): Observable<Supplier>;
  abstract activate(id: string): Observable<Supplier>;
  abstract deactivate(id: string): Observable<Supplier>;
}
