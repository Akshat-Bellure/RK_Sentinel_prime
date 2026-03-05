export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];

  private createEntry(level: LogLevel, message: string, metadata?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };
  }

  log(level: LogLevel, message: string, metadata?: any) {
    const entry = this.createEntry(level, message, metadata);
    this.logs.push(entry);
    
    // In a real app, this might send to a backend or monitoring service
    console.log(`[${entry.timestamp}] [${level}] ${message}`, metadata || '');
  }

  info(message: string, metadata?: any) {
    this.log('INFO', message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log('WARN', message, metadata);
  }

  error(message: string, metadata?: any) {
    this.log('ERROR', message, metadata);
  }

  getLogs() {
    return this.logs;
  }
}

export const logger = new LoggerService();
