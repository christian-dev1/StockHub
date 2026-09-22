import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { withAppErrors, withBlobAppErrors } from '../../../../core/errors/with-app-errors';
import { Page, PageRequest, mapPage, toQueryParams } from '../../../../shared/utils/page';
import {
  CategoryOption,
  Product,
  ProductDraft,
  ProductFilters,
  SupplierOption,
} from '../../domain/entities/product';
import { ImportPreview, ImportResult } from '../../domain/entities/product-import';
import { ProductsRepository } from '../../domain/repositories/products.repository';
import { ProductsDataSource } from '../datasources/products.datasource';
import {
  toCategoryOption,
  toImportPreview,
  toImportResult,
  toProduct,
  toProductRequest,
  toSupplierOption,
} from '../mappers/product.mapper';

@Injectable()
export class HttpProductsRepository extends ProductsRepository {
  private readonly source = inject(ProductsDataSource);

  search(request: PageRequest, filters: ProductFilters): Observable<Page<Product>> {
    return this.source
      .search(
        toQueryParams(request, {
          q: filters.text,
          categoryId: filters.categoryId,
          supplierId: filters.supplierId,
          active: filters.active,
          hasBarcode: filters.hasBarcode,
          batchTracked: filters.batchTracked,
        }),
      )
      .pipe(
        map((page) => mapPage(page, toProduct)),
        withAppErrors(),
      );
  }
  get(id: string): Observable<Product> {
    return this.source.get(id).pipe(map(toProduct), withAppErrors());
  }
  create(draft: ProductDraft): Observable<Product> {
    return this.source.create(toProductRequest(draft)).pipe(map(toProduct), withAppErrors());
  }
  update(id: string, draft: ProductDraft, version: number): Observable<Product> {
    return this.source
      .update(id, { product: toProductRequest(draft), version })
      .pipe(map(toProduct), withAppErrors());
  }
  activate(id: string): Observable<Product> {
    return this.source.activate(id).pipe(map(toProduct), withAppErrors());
  }
  deactivate(id: string): Observable<Product> {
    return this.source.deactivate(id).pipe(map(toProduct), withAppErrors());
  }
  delete(id: string): Observable<void> {
    return this.source.delete(id).pipe(withAppErrors());
  }
  image(id: string): Observable<Blob> {
    return this.source.image(id).pipe(withBlobAppErrors());
  }
  uploadImage(id: string, file: File): Observable<void> {
    return this.source.uploadImage(id, file).pipe(withAppErrors());
  }
  deleteImage(id: string): Observable<void> {
    return this.source.deleteImage(id).pipe(withAppErrors());
  }
  categories(): Observable<CategoryOption[]> {
    return this.source.categories().pipe(
      map((categories) => categories.map(toCategoryOption)),
      withAppErrors(),
    );
  }
  activeSuppliers(): Observable<SupplierOption[]> {
    return this.source.activeSuppliers().pipe(
      map((page) => page.content.map(toSupplierOption)),
      withAppErrors(),
    );
  }
  importTemplate(): Observable<Blob> {
    return this.source.importTemplate().pipe(withBlobAppErrors());
  }
  previewImport(file: File, createMissingCategories: boolean): Observable<ImportPreview> {
    return this.source
      .previewImport(file, createMissingCategories)
      .pipe(map(toImportPreview), withAppErrors());
  }
  commitImport(jobId: string): Observable<ImportResult> {
    return this.source.commitImport(jobId).pipe(map(toImportResult), withAppErrors());
  }
}
