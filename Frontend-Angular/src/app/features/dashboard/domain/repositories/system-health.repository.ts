import { Observable } from 'rxjs';
import { SystemHealth } from '../entities/system-health';

/** Contract implemented by the data layer; also serves as DI token. */
export abstract class SystemHealthRepository {
  abstract check(): Observable<SystemHealth>;
}
