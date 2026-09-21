type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = process.env.NODE_ENV === 'production';

function log(level: LogLevel, message: string, context?: unknown): void {
  if (isProduction && level === 'debug') return;
  // Never pass tokens, passwords or personal data as context.
  // eslint-disable-next-line no-console
  console[level](`[StockHub] ${message}`, { level, timestamp: new Date().toISOString(), context });
}

export const logger = {
  debug: (message: string, context?: unknown) => log('debug', message, context),
  info: (message: string, context?: unknown) => log('info', message, context),
  warn: (message: string, context?: unknown) => log('warn', message, context),
  error: (message: string, context?: unknown) => log('error', message, context),
};
