import type { SystemHealth } from '../entities/system-health';

export interface SystemHealthRepository {
  check(signal?: AbortSignal): Promise<SystemHealth>;
}
