import { httpSystemHealthRepository } from './data/repositories/http-system-health.repository';
import { makeGetSystemHealth } from './domain/use-cases/get-system-health';

/** Composition root of the feature: binds use cases to their data implementations. */
export const getSystemHealth = makeGetSystemHealth(httpSystemHealthRepository);
