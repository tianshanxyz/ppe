// 全局PPE数据采集引擎 - 日志工具

import { DataSourceType, LogLevel } from '../types';

/**
 * 日志记录器类
 * 简化版，不依赖winston
 */
export class Logger {
  private sourceType: DataSourceType | string;

  constructor(sourceType: DataSourceType | string) {
    this.sourceType = sourceType;
  }

  private formatMessage(level: string, message: string, metadata?: any): string {
    const timestamp = new Date().toISOString();
    let msg = `${timestamp} [${level.toUpperCase()}] [${this.sourceType}] ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  }

  info(message: string, metadata?: any): void {
    console.log(this.formatMessage('info', message, metadata));
  }

  warn(message: string, metadata?: any): void {
    console.warn(this.formatMessage('warn', message, metadata));
  }

  error(message: string, error?: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(this.formatMessage('error', message, { error: errorMessage }));
  }

  debug(message: string, metadata?: any): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(this.formatMessage('debug', message, metadata));
    }
  }
}

// 导出单例实例
export const logger = new Logger('Global');
