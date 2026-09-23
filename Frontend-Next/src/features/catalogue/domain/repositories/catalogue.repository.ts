import type { Page } from '@/core/api/page';
import type { CatalogueQuery, Category, SellableProduct } from '../entities/sellable-product';

export interface CatalogueRepository {
  search(query: CatalogueQuery, signal?: AbortSignal): Promise<Page<SellableProduct>>;
  get(productId: string, locationId: string, signal?: AbortSignal): Promise<SellableProduct>;
  categories(signal?: AbortSignal): Promise<readonly Category[]>;
}
