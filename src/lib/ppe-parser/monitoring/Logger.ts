/**
 * 日志系统
 * Phase 2: 智能解析模型开发
 *
 * 提供结构化的日志记录功能
 */

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  /** 最小日志级别 */
  minLevel: LogLevel;
  /** 是否启用控制台输出 */
  enableConsole: boolean;
  /** 是否启用文件输出 */
  enableFile: boolean;
  /** 日志文件路径 */
  logFilePath?: string;
  /** 是否包含时间戳 */
  includeTimestamp: boolean;
  /** 是否包含上下文 */
  includeContext: boolean;
  /** 上下文名称 */
  context?: string;
  /** 自定义格式化函数 */
  formatter?: (entry: LogEntry) => string;
}

/**
 * 日志处理器
 */
export interface LogHandler {
  handle(entry: LogEntry): void;
}

/**
 * 控制台日志处理器
 */
export class ConsoleHandler implements LogHandler {
  handle(entry: LogEntry): void {
    const { levelName, message, metadata, error } = entry;
    const timestamp = new Date(entry.timestamp).toISOString();
    const context = entry.context ? `[${entry.context}]` : '';

    const logMessage = `${timestamp} ${context} ${levelName}: ${message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, metadata || '', error || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, metadata || '', error || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, metadata || '', error || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, metadata || '', error || '');
        break;
    }
  }
}

/**
 * 内存日志处理器
 * 用于临时存储日志，便于调试
 */
export class MemoryHandler implements LogHandler {
  private logs: LogEntry[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  handle(entry: LogEntry): void {
    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxSize) {
      this.logs.shift();
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level === undefined) {
      return [...this.logs];
    }
    return this.logs.filter((log) => log.level >= level);
  }

  clear(): void {
    this.logs = [];
  }

  get size(): number {
    return this.logs.length;
  }
}

/**
 * 日志记录器
 */
export class Logger {
  private config: LoggerConfig;
  private handlers: LogHandler[] = [];

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      includeTimestamp: true,
      includeContext: true,
      ...config,
    };

    // 默认添加控制台处理器
    if (this.config.enableConsole) {
      this.addHandler(new ConsoleHandler());
    }
  }

  /**
   * 添加日志处理器
   */
  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  /**
   * 移除日志处理器
   */
  removeHandler(handler: LogHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * 设置上下文
   */
  setContext(context: string): Logger {
    return new Logger({
      ...this.config,
      context,
    });
  }

  /**
   * 记录日志
   */
  log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (level < this.config.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      message,
      context: this.config.context,
      metadata,
      error,
    };

    // 分发到所有处理器
    for (const handler of this.handlers) {
      try {
        handler.handle(entry);
      } catch (handlerError) {
        console.error('Log handler error:', handlerError);
      }
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * 信息日志
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * 警告日志
   */
  warn(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.WARN, message, metadata, error);
  }

  /**
   * 错误日志
   */
  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  /**
   * 致命错误日志
   */
  fatal(message: string, metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.FATAL, message, metadata, error);
  }

  /**
   * 创建子日志记录器
   */
  child(context: string): Logger {
    const childLogger = new Logger(this.config);
    childLogger.handlers = [...this.handlers];
    childLogger.config.context = this.config.context
      ? `${this.config.context}.${context}`
      : context;
    return childLogger;
  }
}

/**
 * 全局日志记录器实例
 */
let globalLogger: Logger | null = null;

/**
 * 获取全局日志记录器
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

/**
 * 设置全局日志记录器
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * 创建日志记录器
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}
