/**
 * Production-ready logger utility
 * Provides different log levels and can be disabled in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isProduction: boolean;
  private isDevelopment: boolean;
  private enableLogs: boolean;

  constructor() {
    this.isProduction = import.meta.env.MODE === 'production';
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.enableLogs = import.meta.env.VITE_ENABLE_LOGGING === 'true' || this.isDevelopment;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enableLogs) return false;
    
    // In production, only log warnings and errors
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    
    return true;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, data);
    const prefix = `[${logEntry.timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data || '');
        break;
      case 'info':
        console.info(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'error':
        console.error(prefix, message, data || '');
        break;
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  // Group related logs
  group(label: string, collapsed: boolean = false): void {
    if (!this.enableLogs) return;
    
    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (!this.enableLogs) return;
    console.groupEnd();
  }

  // Performance logging
  time(label: string): void {
    if (!this.enableLogs) return;
    console.time(label);
  }

  timeEnd(label: string): void {
    if (!this.enableLogs) return;
    console.timeEnd(label);
  }

  // Table logging for structured data
  table(data: unknown[], columns?: string[]): void {
    if (!this.enableLogs || !this.isDevelopment) return;
    console.table(data, columns);
  }

  // Clear console
  clear(): void {
    if (!this.enableLogs) return;
    console.clear();
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Export convenience methods for backward compatibility
export const log = {
  debug: (message: string, data?: unknown) => logger.debug(message, data),
  info: (message: string, data?: unknown) => logger.info(message, data),
  warn: (message: string, data?: unknown) => logger.warn(message, data),
  error: (message: string, data?: unknown) => logger.error(message, data),
  group: (label: string, collapsed?: boolean) => logger.group(label, collapsed),
  groupEnd: () => logger.groupEnd(),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label),
  table: (data: unknown[], columns?: string[]) => logger.table(data, columns),
  clear: () => logger.clear()
};
