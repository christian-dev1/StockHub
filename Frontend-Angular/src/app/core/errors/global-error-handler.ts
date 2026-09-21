import { ErrorHandler, Injectable, inject } from '@angular/core';
import { Logger } from '../logging/logger';

/** Last-resort handler: logs unexpected client errors without exposing them to users. */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(Logger);

  handleError(error: unknown): void {
    this.logger.error(
      'Unhandled client error',
      error instanceof Error ? { name: error.name, message: error.message } : error,
    );
  }
}
