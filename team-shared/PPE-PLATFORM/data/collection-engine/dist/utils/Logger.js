"use strict";
// 全局PPE数据采集引擎 - 日志工具
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
/**
 * 日志记录器类
 * 简化版，不依赖winston
 */
class Logger {
    sourceType;
    constructor(sourceType) {
        this.sourceType = sourceType;
    }
    formatMessage(level, message, metadata) {
        const timestamp = new Date().toISOString();
        let msg = `${timestamp} [${level.toUpperCase()}] [${this.sourceType}] ${message}`;
        if (metadata && Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    }
    info(message, metadata) {
        console.log(this.formatMessage('info', message, metadata));
    }
    warn(message, metadata) {
        console.warn(this.formatMessage('warn', message, metadata));
    }
    error(message, error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(this.formatMessage('error', message, { error: errorMessage }));
    }
    debug(message, metadata) {
        if (process.env.LOG_LEVEL === 'debug') {
            console.log(this.formatMessage('debug', message, metadata));
        }
    }
}
exports.Logger = Logger;
// 导出单例实例
exports.logger = new Logger('Global');
//# sourceMappingURL=Logger.js.map