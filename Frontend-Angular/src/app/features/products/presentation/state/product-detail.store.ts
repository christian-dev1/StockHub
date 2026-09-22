import { DestroyRef, Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ResourceState } from '../../../../shared/utils/resource-state';
import { Product, ProductDraft } from '../../domain/entities/product';
import {
  ChangeProductStatusUseCase,
  GetProductUseCase,
  SaveProductUseCase,
} from '../../domain/use-cases/product.use-cases';

@Injectable()
export class ProductDetailStore {
  private readonly getProduct = inject(GetProductUseCase);
  private readonly saveProduct = inject(SaveProductUseCase);
  private readonly status = inject(ChangeProductStatusUseCase);

  readonly resource = new ResourceState<Product>(inject(DestroyRef));
  readonly product = this.resource.data;

  load(id: string): void {
    this.resource.load(this.getProduct.execute(id));
  }

  save(draft: ProductDraft): Observable<Product> {
    const product = this.resource.require();
    return this.resource.keep(this.saveProduct.update(product.id, draft, product.version));
  }

  toggleStatus(): Observable<Product> {
    const product = this.resource.require();
    return this.resource.keep(
      product.active ? this.status.deactivate(product.id) : this.status.activate(product.id),
    );
  }

  delete(): Observable<void> {
    return this.status.delete(this.resource.require().id);
  }

  /** Local updates after actions that do not return the product (image, barcode). */
  patch(change: Partial<Pick<Product, 'hasImage' | 'barcode' | 'barcodeFormat'>>): void {
    this.resource.set({ ...this.resource.require(), ...change });
  }
}
