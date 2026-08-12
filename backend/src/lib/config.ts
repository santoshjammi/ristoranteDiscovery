// Configuration management
// Environment-aware, validated configuration

export interface AppConfig {
  readonly port: number;
  readonly nodeEnv: string;
  readonly appVersion: string;
  readonly databaseUrl: string;
  readonly corsOrigins: string[];
  readonly logLevel: string;
  readonly requestTimeout: number;
  readonly rateLimitWindow: number;
  readonly rateLimitMax: number;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(optionalEnv('PORT', '5001'), 10),
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    appVersion: optionalEnv('APP_VERSION', '1.0.0'),
    databaseUrl: requireEnv('DATABASE_URL'),
    corsOrigins: optionalEnv('CORS_ORIGINS', '*').split(',').map(s => s.trim()),
    logLevel: optionalEnv('LOG_LEVEL', 'info'),
    requestTimeout: parseInt(optionalEnv('REQUEST_TIMEOUT', '30000'), 10),
    rateLimitWindow: parseInt(optionalEnv('RATE_LIMIT_WINDOW', '60000'), 10),
    rateLimitMax: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),
  };
}
