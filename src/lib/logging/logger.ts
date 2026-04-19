/**
 * 统一日志系统
 * 
 * 提供结构化的日志记录功能，支持不同级别、格式和输出目标
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  source?: string;
}

class Logger {
  private minLevel: LogLevel;
  private source: string;
  private defaultContext: LogContext;

  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(
    source: string = 'app',
    minLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    defaultContext: LogContext = {}
  ) {
    this.source = source;
    this.minLevel = minLevel;
    this.defaultContext = defaultContext;
  }

  /**
   * 检查是否应该记录指定级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    return Logger.levelPriority[level] >= Logger.levelPriority[this.minLevel];
  }

  /**
   * 格式化日志条目
   */
  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.defaultContext, ...context },
      source: this.source,
    };
  }

  /**
   * 输出日志
   */
  private output(entry: LogEntry): void {
    const logMessage = JSON.stringify(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }

    // 生产环境可以发送到日志服务
    if (process.env.NODE_ENV === 'production') {
      this.sendToService(entry);
    }
  }

  /**
   * 发送到日志服务（如 Sentry、LogRocket 等）
   */
  private sendToService(entry: LogEntry): void {
    // 仅在错误级别时发送
    if (entry.level === 'error') {
      // 这里可以集成 Sentry 或其他日志服务
      // Sentry.captureException(new Error(entry.message), { extra: entry.context });
    }
  }

  /**
   * 记录 debug 级别日志
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, context));
    }
  }

  /**
   * 记录 info 级别日志
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, context));
    }
  }

  /**
   * 记录 warn 级别日志
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, context));
    }
  }

  /**
   * 记录 error 级别日志
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const entry = this.formatEntry('error', message, {
        ...context,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      });
      this.output(entry);
    }
  }

  /**
   * 创建子日志器，继承父级配置
   */
  child(childSource: string, additionalContext?: LogContext): Logger {
    return new Logger(
      `${this.source}.${childSource}`,
      this.minLevel,
      { ...this.defaultContext, ...additionalContext }
    );
  }
}

/**
 * 创建日志器实例
 */
export function createLogger(source: string, minLevel?: LogLevel): Logger {
  return new Logger(source, minLevel);
}

/**
 * 默认应用日志器
 */
export const appLogger = createLogger('app');

/**
 * API 请求日志中间件
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void {
  const logger = createLogger('api.request');
  
  const logContext = {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...context,
  };

  if (statusCode >= 500) {
    logger.error(`API request failed: ${method} ${path}`, undefined, logContext);
  } else if (statusCode >= 400) {
    logger.warn(`API client error: ${method} ${path}`, logContext);
  } else {
    logger.info(`API request: ${method} ${path}`, logContext);
  }
}

/**
 * 数据库查询日志
 */
export function logDatabaseQuery(
  query: string,
  duration: number,
  params?: unknown[],
  context?: LogContext
): void {
  const logger = createLogger('db.query');
  
  const logContext = {
    query,
    duration: `${duration}ms`,
    params: params?.slice(0, 10), // 限制参数数量防止日志过大
    ...context,
  };

  // 慢查询警告
  if (duration > 1000) {
    logger.warn('Slow database query detected', logContext);
  } else {
    logger.debug('Database query executed', logContext);
  }
}

/**
 * 性能监控日志
 */
export function logPerformance(
  operation: string,
  duration: number,
  threshold: number = 1000,
  context?: LogContext
): void {
  const logger = createLogger('performance');
  
  const logContext = {
    operation,
    duration: `${duration}ms`,
    threshold: `${threshold}ms`,
    ...context,
  };

  if (duration > threshold) {
    logger.warn(`Performance warning: ${operation} took ${duration}ms`, logContext);
  } else {
    logger.debug(`Performance: ${operation} completed in ${duration}ms`, logContext);
  }
}

export default Logger;
