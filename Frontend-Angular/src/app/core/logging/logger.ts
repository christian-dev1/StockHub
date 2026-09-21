import { Injectable, inject } from '@angular/core';
import { APP_ENVIRONMENT } from '../config/environment/app-environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Thin logging facade. Never pass tokens, passwords or personal data here.
 * Debug output is suppressed in production builds.
 */
@Injectable({ providedIn: 'root' })
export class Logger {
  private readonly env = inject(APP_ENVIRONMENT);

  debug(message: string, context?: unknown): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: unknown): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: unknown): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: unknown): void {
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: unknown): void {
    if (this.env.production && level === 'debug') {
      return;
    }
    const entry = { level, message, timestamp: new Date().toISOString(), context };
    console[level](`[StockHub] ${message}`, entry);
  }
}
