import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SystemHealth } from '../entities/system-health';
import { SystemHealthRepository } from '../repositories/system-health.repository';

@Injectable()
export class GetSystemHealthUseCase {
  private readonly repository = inject(SystemHealthRepository);

  execute(): Observable<SystemHealth> {
    return this.repository.check();
  }
}
