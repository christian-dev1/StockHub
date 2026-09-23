import { httpSalesRepository } from './data/repositories/http-sales.repository';

/** Composition root of the feature: binds the domain to its data implementation. */
export const sales = httpSalesRepository;
