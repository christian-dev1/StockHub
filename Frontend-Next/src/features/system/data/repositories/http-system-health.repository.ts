import type { SystemHealthRepository } from '../../domain/repositories/system-health.repository';
import { fetchHealth } from '../datasources/system-health.datasource';
import { toSystemHealth } from '../mappers/system-health.mapper';

export const httpSystemHealthRepository: SystemHealthRepository = {
  async check(signal) {
    return toSystemHealth(await fetchHealth(signal), new Date());
  },
};
