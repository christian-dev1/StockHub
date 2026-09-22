import { Observable } from 'rxjs';
import { Page, PageRequest } from '../../../../shared/utils/page';
import {
  CategoryOption,
  Product,
  ProductDraft,
  ProductFilters,
  SupplierOption,
} from '../entities/product';
import { ImportPreview, ImportResult } from '../entities/product-import';

export abstract class ProductsRepository {
  abstract search(request: PageRequest, filters: ProductFilters): Observable<Page<Product>>;
  abstract get(id: string): Observable<Product>;
  abstract create(draft: ProductDraft): Observable<Product>;
  abstract update(id: string, draft: ProductDraft, version: number): Observable<Product>;
  abstract activate(id: string): Observable<Product>;
  abstract deactivate(id: string): Observable<Product>;
  abstract delete(id: string): Observable<void>;

  /** Always revalidated with the server, so a replaced picture never shows stale. */
  abstract image(id: string): Observable<Blob>;
  abstract uploadImage(id: string, file: File): Observable<void>;
  abstract deleteImage(id: string): Observable<void>;

  abstract categories(): Observable<CategoryOption[]>;
  abstract activeSuppliers(): Observable<SupplierOption[]>;

  abstract importTemplate(): Observable<Blob>;
  abstract previewImport(file: File, createMissingCategories: boolean): Observable<ImportPreview>;
  abstract commitImport(jobId: string): Observable<ImportResult>;
}
