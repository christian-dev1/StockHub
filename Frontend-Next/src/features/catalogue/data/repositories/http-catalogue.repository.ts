import { mapPage } from '@/core/api/page';
import type { CatalogueRepository } from '../../domain/repositories/catalogue.repository';
import { fetchCatalogue, fetchCategories, fetchSellableProduct } from '../datasources/catalogue.datasource';
import { toCategory, toSellableProduct } from '../mappers/catalogue.mapper';

export const httpCatalogueRepository: CatalogueRepository = {
  async search(query, signal) {
    return mapPage(await fetchCatalogue(query, signal), toSellableProduct);
  },
  async get(productId, locationId, signal) {
    return toSellableProduct(await fetchSellableProduct(productId, locationId, signal));
  },
  async categories(signal) {
    return (await fetchCategories(signal)).map(toCategory);
  },
};
