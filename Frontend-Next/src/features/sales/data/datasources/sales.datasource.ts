import { httpRequest } from '@/core/api/http-client';
import { withQuery, type Page } from '@/core/api/page';
import { API_ROUTES } from '@/core/config/routes/api.routes';
import type { NewSale, SalesQuery } from '../../domain/entities/sale';
import type {
  SaleListItemModel,
  SaleModel,
  SaleSettingsModel,
  SellerSummaryModel,
} from '../models/sale.model';

export function postSale(sale: NewSale, idempotencyKey: string): Promise<SaleModel> {
  return httpRequest(API_ROUTES.SALES.ROOT, {
    method: 'POST',
    body: sale,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

/** mine=true: the backend forces it anyway for a VENDEUR. */
export function fetchMySales(query: SalesQuery, signal?: AbortSignal): Promise<Page<SaleListItemModel>> {
  return httpRequest(
    withQuery(API_ROUTES.SALES.ROOT, {
      mine: true,
      search: query.search?.trim(),
      from: query.from,
      to: query.to,
      paymentMethod: query.paymentMethod,
      page: query.page,
      size: query.size,
      sort: 'createdAt,desc',
    }),
    { signal },
  );
}

export function fetchSale(id: string, signal?: AbortSignal): Promise<SaleModel> {
  return httpRequest(API_ROUTES.SALES.ONE(id), { signal });
}

export function fetchMySummary(days: number, signal?: AbortSignal): Promise<SellerSummaryModel> {
  return httpRequest(withQuery(API_ROUTES.SALES.MY_SUMMARY, { days }), { signal });
}

export function fetchSaleSettings(signal?: AbortSignal): Promise<SaleSettingsModel> {
  return httpRequest(API_ROUTES.SALES.SETTINGS, { signal });
}
