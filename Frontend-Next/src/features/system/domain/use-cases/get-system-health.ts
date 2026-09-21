import type { SystemHealth } from '../entities/system-health';
import type { SystemHealthRepository } from '../repositories/system-health.repository';

export function makeGetSystemHealth(repository: SystemHealthRepository) {
  return (signal?: AbortSignal): Promise<SystemHealth> => repository.check(signal);
}
