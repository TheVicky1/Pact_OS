/**
 * PACT Phase 11: Enterprise Observability & Privacy-Safe Structured Logger
 *
 * Implements strict zero-leak structured logging for server and edge environments.
 * Automatically redacts:
 * - Authorization Bearer tokens
 * - Passkey private keys and signatures
 * - Stripe / Payment secrets
 * - Webhook signing keys
 * - User consequence statements / punishment details
 *
 * All logs are output as single-line JSON records formatted for standard log aggregators.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogRecord {
  level: LogLevel;
  message: string;
  timestamp: string;
  module?: string;
  userId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9_\-.]+/gi,
  /sk_live_[a-zA-Z0-9]+/gi,
  /sk_test_[a-zA-Z0-9]+/gi,
  /whsec_[a-zA-Z0-9]+/gi,
  /sbp_[a-zA-Z0-9]+/gi,
  /key=[a-zA-Z0-9_\-]+/gi,
  /password["':\s]+[^"',\s]+/gi,
  /consequence["':\s]+[^"',\s]+/gi,
];

/**
 * Recursively sanitizes data structures to prevent accidental secret or consequence leakage.
 */
export function sanitizeLogData(value: unknown): unknown {
  if (typeof value === 'string') {
    let sanitized = value;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_CONFIDENTIAL]');
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogData(item));
  }

  if (value !== null && typeof value === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = k.toLowerCase();
      if (
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('password') ||
        lowerKey.includes('key') ||
        lowerKey.includes('consequence') ||
        lowerKey.includes('signature')
      ) {
        sanitizedObj[k] = '[REDACTED_CONFIDENTIAL]';
      } else {
        sanitizedObj[k] = sanitizeLogData(v);
      }
    }
    return sanitizedObj;
  }

  return value;
}

class PrivacyLogger {
  private moduleName: string;

  constructor(moduleName: string = 'pact-core') {
    this.moduleName = moduleName;
  }

  public forModule(name: string): PrivacyLogger {
    return new PrivacyLogger(name);
  }

  public debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      this.write('debug', message, metadata);
    }
  }

  public info(message: string, metadata?: Record<string, unknown>): void {
    this.write('info', message, metadata);
  }

  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.write('warn', message, metadata);
  }

  public error(message: string, err?: unknown, metadata?: Record<string, unknown>): void {
    let errorObj: { name: string; message: string; stack?: string } | undefined;

    if (err instanceof Error) {
      errorObj = {
        name: err.name,
        message: String(sanitizeLogData(err.message)),
        stack: process.env.NODE_ENV !== 'production' ? String(sanitizeLogData(err.stack || '')) : undefined,
      };
    } else if (err) {
      errorObj = {
        name: 'UnknownError',
        message: String(sanitizeLogData(String(err))),
      };
    }

    this.write('error', message, metadata, errorObj);
  }

  private write(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: { name: string; message: string; stack?: string }
  ): void {
    const record: StructuredLogRecord = {
      level,
      message: String(sanitizeLogData(message)),
      timestamp: new Date().toISOString(),
      module: this.moduleName,
      metadata: metadata ? (sanitizeLogData(metadata) as Record<string, unknown>) : undefined,
      error,
    };

    const serialized = JSON.stringify(record);

    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }
}

export const logger = new PrivacyLogger('pact-os');
