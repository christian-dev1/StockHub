import { httpRequest } from '@/core/api/http-client';
import { withQuery, type Page } from '@/core/api/page';
import { API_ROUTES } from '@/core/config/routes/api.routes';
import type { CatalogueQuery } from '../../domain/entities/sellable-product';
import type { CategoryModel, SellableProductModel } from '../models/catalogue.model';

export function fetchCatalogue(
  query: CatalogueQuery,
  signal?: AbortSignal,
): Promise<Page<SellableProductModel>> {
  return httpRequest(
    withQuery(API_ROUTES.SALES.CATALOGUE, {
      locationId: query.locationId,
      search: query.search?.trim(),
      categoryId: query.categoryId,
      inStock: query.inStock || undefined,
      page: query.page,
      size: query.size,
    }),
    { signal },
  );
}

export function fetchSellableProduct(
  productId: string,
  locationId: string,
  signal?: AbortSignal,
): Promise<SellableProductModel> {
  return httpRequest(withQuery(API_ROUTES.SALES.CATALOGUE_ITEM(productId), { locationId }), { signal });
}

export function fetchCategories(signal?: AbortSignal): Promise<readonly CategoryModel[]> {
  return httpRequest(API_ROUTES.CATEGORIES, { signal });
}
