export type ServiceStatus = 'UP' | 'DOWN' | 'UNKNOWN';

export interface SystemHealth {
  readonly status: ServiceStatus;
  readonly checkedAt: Date;
}
