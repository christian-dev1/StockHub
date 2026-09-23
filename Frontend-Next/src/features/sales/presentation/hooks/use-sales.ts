import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogueQueryKey } from '@/features/catalogue/presentation/hooks/use-catalogue';
import type { NewSale, SalesQuery } from '../../domain/entities/sale';
import { sales } from '../../sales.module';

export const salesQueryKey = ['sales'] as const;

export function useMySales(query: SalesQuery) {
  return useQuery({
    queryKey: [...salesQueryKey, 'mine', query],
    queryFn: ({ signal }) => sales.mine(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: [...salesQueryKey, 'one', id],
    queryFn: ({ signal }) => sales.get(id, signal),
  });
}

export function useSellerSummary(days = 7) {
  return useQuery({
    queryKey: [...salesQueryKey, 'summary', days],
    queryFn: ({ signal }) => sales.mySummary(days, signal),
  });
}

export function useSaleSettings() {
  return useQuery({
    queryKey: [...salesQueryKey, 'settings'],
    queryFn: ({ signal }) => sales.settings(signal),
    staleTime: 5 * 60_000,
  });
}

/** After a sale, stock and personal figures are stale: they are refetched. */
export function useCreateSale() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ sale, idempotencyKey }: { sale: NewSale; idempotencyKey: string }) =>
      sales.create(sale, idempotencyKey),
    onSuccess: (sale) => {
      client.setQueryData([...salesQueryKey, 'one', sale.id], sale);
      void client.invalidateQueries({ queryKey: [...salesQueryKey, 'mine'] });
      void client.invalidateQueries({ queryKey: [...salesQueryKey, 'summary'] });
      void client.invalidateQueries({ queryKey: catalogueQueryKey });
    },
  });
}
