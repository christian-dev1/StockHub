import type { ServiceStatus, SystemHealth } from '../../domain/entities/system-health';
import type { HealthResponseModel } from '../models/health-response.model';

const KNOWN: readonly ServiceStatus[] = ['UP', 'DOWN'];

export function toSystemHealth(model: HealthResponseModel | null | undefined, checkedAt: Date): SystemHealth {
  const status = KNOWN.includes(model?.status as ServiceStatus)
    ? (model?.status as ServiceStatus)
    : 'UNKNOWN';
  return { status, checkedAt };
}
