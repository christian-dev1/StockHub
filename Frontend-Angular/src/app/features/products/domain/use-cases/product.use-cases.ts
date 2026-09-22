import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { Page, PageRequest } from '../../../../shared/utils/page';
import {
  CategoryOption,
  Product,
  ProductDraft,
  ProductFilters,
  SupplierOption,
  consistentTracking,
} from '../entities/product';
import { ImportPreview, ImportResult } from '../entities/product-import';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class SearchProductsUseCase {
  private readonly repository = inject(ProductsRepository);
  execute(request: PageRequest, filters: ProductFilters): Observable<Page<Product>> {
    return this.repository.search(request, { ...filters, text: filters.text.trim() });
  }
}

@Injectable()
export class GetProductUseCase {
  private readonly repository = inject(ProductsRepository);
  execute(id: string): Observable<Product> {
    return this.repository.get(id);
  }
}

@Injectable()
export class SaveProductUseCase {
  private readonly repository = inject(ProductsRepository);

  /** New products are active; an inactive creation is deactivated right after. */
  create(draft: ProductDraft, active = true): Observable<Product> {
    return this.repository
      .create(normalizeProduct(draft))
      .pipe(
        switchMap((product) => (active ? of(product) : this.repository.deactivate(product.id))),
      );
  }

  update(id: string, draft: ProductDraft, version: number): Observable<Product> {
    return this.repository.update(id, normalizeProduct(draft), version);
  }
}

@Injectable()
export class ChangeProductStatusUseCase {
  private readonly repository = inject(ProductsRepository);
  activate(id: string): Observable<Product> {
    return this.repository.activate(id);
  }
  deactivate(id: string): Observable<Product> {
    return this.repository.deactivate(id);
  }
  delete(id: string): Observable<void> {
    return this.repository.delete(id);
  }
}

@Injectable()
export class ProductImageUseCase {
  private readonly repository = inject(ProductsRepository);
  get(id: string): Observable<Blob> {
    return this.repository.image(id);
  }
  upload(id: string, file: File): Observable<void> {
    return this.repository.uploadImage(id, file);
  }
  remove(id: string): Observable<void> {
    return this.repository.deleteImage(id);
  }
}

@Injectable()
export class GetProductReferencesUseCase {
  private readonly repository = inject(ProductsRepository);
  categories(): Observable<CategoryOption[]> {
    return this.repository.categories();
  }
  suppliers(): Observable<SupplierOption[]> {
    return this.repository.activeSuppliers();
  }
}

@Injectable()
export class ProductImportUseCase {
  private readonly repository = inject(ProductsRepository);
  template(): Observable<Blob> {
    return this.repository.importTemplate();
  }
  preview(file: File, createMissingCategories: boolean): Observable<ImportPreview> {
    return this.repository.previewImport(file, createMissingCategories);
  }
  commit(jobId: string): Observable<ImportResult> {
    return this.repository.commitImport(jobId);
  }
}

/** Trims text, keeps tracking consistent, and turns empty amounts into zero. */
export function normalizeProduct(draft: ProductDraft): ProductDraft {
  return {
    ...draft,
    ...consistentTracking(draft),
    sku: draft.sku.trim().toUpperCase(),
    barcode: draft.barcode.trim(),
    barcodeFormat: draft.barcode.trim() ? draft.barcodeFormat : null,
    name: draft.name.trim(),
    description: draft.description.trim(),
    purchasePrice: draft.purchasePrice ?? 0,
    salePrice: draft.salePrice ?? 0,
    minStock: draft.minStock ?? 0,
  };
}
