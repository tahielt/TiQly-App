type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  private currentLogLevel: number;
  private logHistory: LogEntry[] = [];
  private readonly MAX_LOG_HISTORY = 1000;

  private constructor(level: LogLevel = 'debug') {
    this.currentLogLevel = this.logLevels[level];
    
    // In development, log to console by default
    if (__DEV__) {
      this.addConsoleTransport();
    }
  }

  public static getInstance(level?: LogLevel): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(level);
    }
    return Logger.instance;
  }

  public setLevel(level: LogLevel): void {
    this.currentLogLevel = this.logLevels[level];
  }

  public debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  public info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  public error(message: string, error?: Error | unknown, data?: unknown): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...(data as object) }
      : data;
    
    this.log('error', message, errorData);
  }

  public getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter(entry => entry.level === level);
    }
    return [...this.logHistory];
  }

  public clearLogs(): void {
    this.logHistory = [];
  }

  public addTransport(transport: (entry: LogEntry) => void): void {
    this.transports.push(transport);
  }

  private transports: ((entry: LogEntry) => void)[] = [];

  private addConsoleTransport(): void {
    this.addTransport((entry: LogEntry) => {
      const { timestamp, level, message, data, stack } = entry;
      const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      switch (level) {
        case 'debug':
          console.debug(logMessage, data || '');
          break;
        case 'info':
          console.info(logMessage, data || '');
          break;
        case 'warn':
          console.warn(logMessage, data || '');
          break;
        case 'error':
          console.error(logMessage, data || '');
          if (stack) {
            console.error(stack);
          }
          break;
      }
    });
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (this.logLevels[level] < this.currentLogLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    let stack: string | undefined;
    
    if (level === 'error' && data instanceof Error) {
      stack = data.stack;
    }

    const entry: LogEntry = {
      timestamp,
      level,
      message,
      data: data instanceof Error ? undefined : data,
      stack,
    };

    // Add to history
    this.logHistory.push(entry);
    
    // Keep log history within limits
    if (this.logHistory.length > this.MAX_LOG_HISTORY) {
      this.logHistory.shift();
    }

    // Send to all transports
    this.transports.forEach(transport => {
      try {
        transport(entry);
      } catch (error) {
        console.error('Error in logger transport:', error);
      }
    });
  }
}

// Create a default instance
export const logger = Logger.getInstance();

export default logger;
