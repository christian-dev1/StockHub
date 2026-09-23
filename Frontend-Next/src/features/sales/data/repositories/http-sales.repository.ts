import { mapPage } from '@/core/api/page';
import type { SalesRepository } from '../../domain/repositories/sales.repository';
import {
  fetchMySales,
  fetchMySummary,
  fetchSale,
  fetchSaleSettings,
  postSale,
} from '../datasources/sales.datasource';
import { toSale, toSaleListItem, toSaleSettings, toSellerSummary } from '../mappers/sale.mapper';

export const httpSalesRepository: SalesRepository = {
  async create(sale, idempotencyKey) {
    return toSale(await postSale(sale, idempotencyKey));
  },
  async mine(query, signal) {
    return mapPage(await fetchMySales(query, signal), toSaleListItem);
  },
  async get(id, signal) {
    return toSale(await fetchSale(id, signal));
  },
  async mySummary(days, signal) {
    return toSellerSummary(await fetchMySummary(days, signal));
  },
  async settings(signal) {
    return toSaleSettings(await fetchSaleSettings(signal));
  },
};
