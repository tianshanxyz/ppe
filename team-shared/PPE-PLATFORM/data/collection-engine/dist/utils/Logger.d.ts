import { DataSourceType } from '../types';
/**
 * 日志记录器类
 * 简化版，不依赖winston
 */
export declare class Logger {
    private sourceType;
    constructor(sourceType: DataSourceType | string);
    private formatMessage;
    info(message: string, metadata?: any): void;
    warn(message: string, metadata?: any): void;
    error(message: string, error?: any): void;
    debug(message: string, metadata?: any): void;
}
export declare const logger: Logger;
//# sourceMappingURL=Logger.d.ts.map