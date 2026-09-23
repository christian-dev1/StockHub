import { httpCatalogueRepository } from './data/repositories/http-catalogue.repository';

/** Composition root of the feature: binds the domain to its data implementation. */
export const catalogue = httpCatalogueRepository;
