// Structured logging utility
// Provides consistent log format across all services

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly service: string;
  readonly message: string;
  readonly requestId?: string;
  readonly duration?: number;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function log(level: LogLevel, message: string, meta?: {
  requestId?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'rdi-backend',
    message,
    ...meta,
  };

  const output = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug: (msg: string, meta?: Parameters<typeof log>[2]) => log('debug', msg, meta),
  info: (msg: string, meta?: Parameters<typeof log>[2]) => log('info', msg, meta),
  warn: (msg: string, meta?: Parameters<typeof log>[2]) => log('warn', msg, meta),
  error: (msg: string, meta?: Parameters<typeof log>[2]) => log('error', msg, meta),
};
