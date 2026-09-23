import type { Page } from '@/core/api/page';
import type { NewSale, Sale, SaleListItem, SaleSettings, SalesQuery, SellerSummary } from '../entities/sale';

export interface SalesRepository {
  /** @param idempotencyKey same key for every retry of one checkout */
  create(sale: NewSale, idempotencyKey: string): Promise<Sale>;
  /** The caller's own sales only. */
  mine(query: SalesQuery, signal?: AbortSignal): Promise<Page<SaleListItem>>;
  get(id: string, signal?: AbortSignal): Promise<Sale>;
  mySummary(days: number, signal?: AbortSignal): Promise<SellerSummary>;
  settings(signal?: AbortSignal): Promise<SaleSettings>;
}
