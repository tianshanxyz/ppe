/**
 * 增量采集管理器
 * 实现智能的增量数据更新机制，只采集新增或变更的数据
 */
import { DataSourceType, CollectionFilter } from '../types';
export interface IncrementalConfig {
    sourceType: DataSourceType;
    lastCollectTime?: Date;
    lastMaxId?: string;
    lastChecksum?: string;
    mode: 'time-based' | 'id-based' | 'checksum-based' | 'hybrid';
    timeWindowHours: number;
    detectChanges: boolean;
    changeDetectionFields: string[];
}
export interface DataCheckpoint {
    sourceType: DataSourceType;
    timestamp: Date;
    maxId?: string;
    checksum?: string;
    recordCount: number;
    metadata: Record<string, any>;
}
export interface IncrementalResult {
    newRecords: number;
    updatedRecords: number;
    deletedRecords: number;
    unchangedRecords: number;
    checkpoint: DataCheckpoint;
    changes: DataChange[];
}
export interface DataChange {
    type: 'new' | 'updated' | 'deleted';
    sourceId: string;
    sourceType: DataSourceType;
    oldData?: any;
    newData?: any;
    changedFields?: string[];
    timestamp: Date;
}
/**
 * 增量采集管理器类
 */
export declare class IncrementalCollector {
    private logger;
    private checkpoints;
    constructor();
    /**
     * 加载检查点（从数据库或文件）
     */
    loadCheckpoint(sourceType: DataSourceType): Promise<DataCheckpoint | undefined>;
    /**
     * 保存检查点
     */
    saveCheckpoint(checkpoint: DataCheckpoint): Promise<void>;
    /**
     * 计算数据校验和
     */
    calculateChecksum(data: any): string;
    /**
     * 检测数据变更
     */
    detectChanges(oldData: any, newData: any, fields: string[]): {
        hasChanged: boolean;
        changedFields: string[];
    };
    /**
     * 生成增量采集过滤器
     */
    generateIncrementalFilter(config: IncrementalConfig): CollectionFilter;
    /**
     * 处理增量采集结果
     */
    processIncrementalData<T extends {
        sourceId: string;
        updatedAt?: Date;
    }>(config: IncrementalConfig, newData: T[], existingData: Map<string, T>): Promise<IncrementalResult>;
    /**
     * 合并增量数据到现有数据集
     */
    mergeIncrementalData<T extends {
        sourceId: string;
    }>(existingData: T[], incrementalResult: IncrementalResult, newData: T[]): T[];
    /**
     * 创建增量采集配置
     */
    createConfig(sourceType: DataSourceType, mode?: IncrementalConfig['mode'], options?: Partial<IncrementalConfig>): IncrementalConfig;
    /**
     * 获取数据源默认配置
     */
    getDefaultConfig(sourceType: DataSourceType): IncrementalConfig;
    /**
     * 生成变更报告
     */
    generateChangeReport(result: IncrementalResult): string;
    /**
     * 清理过期检查点
     */
    cleanupOldCheckpoints(maxAgeDays?: number): Promise<number>;
}
export declare const incrementalCollector: IncrementalCollector;
//# sourceMappingURL=IncrementalCollector.d.ts.map