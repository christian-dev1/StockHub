import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogue } from '../../catalogue.module';
import type { CatalogueQuery } from '../../domain/entities/sellable-product';

export const catalogueQueryKey = ['catalogue'] as const;

export function useCatalogue(query: CatalogueQuery | null) {
  return useQuery({
    queryKey: [...catalogueQueryKey, 'search', query],
    queryFn: ({ signal }) => catalogue.search(query!, signal),
    enabled: query !== null,
    placeholderData: keepPreviousData,
  });
}

export function useSellableProduct(productId: string, locationId: string | undefined) {
  return useQuery({
    queryKey: [...catalogueQueryKey, 'product', productId, locationId],
    queryFn: ({ signal }) => catalogue.get(productId, locationId!, signal),
    enabled: Boolean(locationId),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: [...catalogueQueryKey, 'categories'],
    queryFn: ({ signal }) => catalogue.categories(signal),
    staleTime: 5 * 60_000,
  });
}
