/**
 * Pino 结构化日志配置
 * 
 * 用于 MDLooker 项目的统一日志管理
 * 文档：https://getpino.io/
 */

import pino from 'pino';

// 日志级别定义
export const LogLevel = {
  fatal: 60,    // 系统不可用
  error: 50,    // 严重错误
  warn: 40,     // 警告信息
  info: 30,     // 一般信息
  debug: 20,    // 调试信息
  trace: 10,    // 追踪信息
} as const;

// 日志配置
const baseConfig = {
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => ({ level: label.toUpperCase() }),
  },
  base: {
    env: process.env.NODE_ENV,
    version: process.env.npm_package_version || '5.0.0',
  },
};

// 开发环境配置（美化输出）
const developmentConfig = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
};

// 生产环境配置（JSON 格式）
const productionConfig = {
  ...baseConfig,
  // 添加 requestId 支持
  mixin: () => ({
    requestId: generateRequestId(),
  }),
};

// 生成请求 ID
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15);
}

// 创建日志实例
const logger = pino(
  process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig
);

// 导出日志工具
export { logger };

// 创建带上下文的日志记录器
export function createLogger(context: {
  module: string;
  action?: string;
  userId?: string;
  requestId?: string;
}) {
  return logger.child({
    module: context.module,
    action: context.action,
    userId: context.userId,
    requestId: context.requestId || generateRequestId(),
  });
}

// 辅助函数：记录 API 请求日志
export function logApiRequest(options: {
  method: string;
  url: string;
  userId?: string;
  duration: number;
  statusCode: number;
  error?: Error;
}) {
  const log = createLogger({
    module: 'api',
    action: `${options.method} ${options.url}`,
    userId: options.userId,
  });

  const logData = {
    method: options.method,
    url: options.url,
    statusCode: options.statusCode,
    duration: `${options.duration}ms`,
    timestamp: new Date().toISOString(),
  };

  if (options.error) {
    log.error(
      {
        ...logData,
        error: {
          message: options.error.message,
          stack: options.error.stack,
        },
      },
      'API request failed'
    );
  } else {
    log.info(logData, 'API request completed');
  }
}

// 辅助函数：记录数据库操作日志
export function logDatabaseOperation(options: {
  operation: string;
  table: string;
  duration: number;
  rows?: number;
  error?: Error;
}) {
  const log = createLogger({
    module: 'database',
    action: options.operation,
  });

  const logData = {
    operation: options.operation,
    table: options.table,
    duration: `${options.duration}ms`,
    rowsAffected: options.rows,
    timestamp: new Date().toISOString(),
  };

  if (options.error) {
    log.error(
      {
        ...logData,
        error: {
          message: options.error.message,
          stack: options.error.stack,
        },
      },
      'Database operation failed'
    );
  } else {
    log.info(logData, 'Database operation completed');
  }
}

// 辅助函数：记录用户行为日志
export function logUserAction(options: {
  action: string;
  userId: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}) {
  const log = createLogger({
    module: 'user-action',
    action: options.action,
    userId: options.userId,
  });

  log.info(
    {
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      metadata: options.metadata,
      timestamp: new Date().toISOString(),
    },
    `User action: ${options.action}`
  );
}

// 辅助函数：记录性能指标
export function logPerformance(options: {
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}) {
  const log = createLogger({
    module: 'performance',
    action: options.metric,
  });

  log.info(
    {
      metric: options.metric,
      value: options.value,
      unit: options.unit,
      tags: options.tags,
      timestamp: new Date().toISOString(),
    },
    `Performance metric: ${options.metric}`
  );
}

// 导出日志级别
export const { fatal, error, warn, info, debug, trace } = logger;
