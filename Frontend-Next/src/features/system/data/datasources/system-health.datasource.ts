import { httpRequest } from '@/core/api/http-client';
import { API_ROUTES } from '@/core/config/routes/api.routes';
import type { HealthResponseModel } from '../models/health-response.model';

export function fetchHealth(signal?: AbortSignal): Promise<HealthResponseModel> {
  // Actuator answers 503 with a DOWN body: that is data, not a transport failure.
  return httpRequest<HealthResponseModel>(API_ROUTES.SYSTEM.HEALTH, { signal, acceptStatuses: [503] });
}
