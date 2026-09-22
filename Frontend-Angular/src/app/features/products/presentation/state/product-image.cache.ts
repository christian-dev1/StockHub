import { DestroyRef, Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { ProductImageUseCase } from '../../domain/use-cases/product.use-cases';

export type ProductImage =
  | { readonly status: 'none' | 'loading' | 'error'; readonly url: null }
  | { readonly status: 'ready'; readonly url: string };

const NONE: ProductImage = { status: 'none', url: null };

/**
 * Product pictures for the catalogue screens. The endpoint needs the bearer
 * token, so pictures are fetched as blobs and exposed as object URLs, loaded
 * once per product and revoked when the catalogue area is left. `refresh`
 * after an upload fetches the new picture (the request bypasses HTTP caches).
 */
@Injectable()
export class ProductImageCache {
  private readonly images = inject(ProductImageUseCase);
  private readonly entries = new Map<string, WritableSignal<ProductImage>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.entries.forEach((entry) => revoke(entry())));
  }

  /** Picture of a product (read-only signal; see {@link ensure} to load it). */
  image(productId: string): Signal<ProductImage> {
    return this.entry(productId).asReadonly();
  }

  /** Loads the picture on first use, or forgets it when the product has none. */
  ensure(productId: string, hasImage: boolean): void {
    const entry = this.entry(productId);
    if (!hasImage) {
      if (entry().status !== 'none') this.clear(productId);
    } else if (entry().status === 'none') {
      this.fetch(entry, productId);
    }
  }

  refresh(productId: string): void {
    this.fetch(this.entry(productId), productId);
  }

  clear(productId: string): void {
    const entry = this.entry(productId);
    revoke(entry());
    entry.set(NONE);
  }

  private fetch(entry: WritableSignal<ProductImage>, productId: string): void {
    const previous = entry();
    entry.set({ status: 'loading', url: null });
    this.images.get(productId).subscribe({
      next: (blob) => {
        revoke(previous);
        entry.set({ status: 'ready', url: URL.createObjectURL(blob) });
      },
      error: () => entry.set({ status: 'error', url: null }),
    });
  }

  private entry(productId: string): WritableSignal<ProductImage> {
    let entry = this.entries.get(productId);
    if (!entry) {
      entry = signal<ProductImage>(NONE);
      this.entries.set(productId, entry);
    }
    return entry;
  }
}

function revoke(image: ProductImage): void {
  if (image.url) URL.revokeObjectURL(image.url);
}
