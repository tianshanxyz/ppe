/**
 * 采集器管理器
 * 统一管理所有数据源采集器
 */
import { BaseCollector } from './BaseCollector';
import { DataSourceType, CollectionFilter, CollectionResult, CollectionTask } from '../types';
export declare class CollectorManager {
    private collectors;
    private tasks;
    private logger;
    constructor();
    /**
     * 初始化所有采集器
     */
    private initializeCollectors;
    /**
     * 获取指定采集器
     */
    getCollector(sourceType: DataSourceType): BaseCollector | undefined;
    /**
     * 获取所有采集器
     */
    getAllCollectors(): BaseCollector[];
    /**
     * 执行单数据源采集
     */
    collectFromSource(sourceType: DataSourceType, filter?: CollectionFilter): Promise<CollectionResult>;
    /**
     * 执行多数据源并行采集
     */
    collectFromMultipleSources(sourceTypes: DataSourceType[], filter?: CollectionFilter): Promise<Map<DataSourceType, CollectionResult>>;
    /**
     * 执行全量采集（所有数据源）
     */
    collectAll(filter?: CollectionFilter): Promise<Map<DataSourceType, CollectionResult>>;
    /**
     * 获取任务状态
     */
    getTaskStatus(taskId: string): CollectionTask | undefined;
    /**
     * 获取所有任务
     */
    getAllTasks(): CollectionTask[];
    /**
     * 获取运行中的任务
     */
    getRunningTasks(): CollectionTask[];
    /**
     * 取消任务
     */
    cancelTask(taskId: string): Promise<boolean>;
    /**
     * 生成任务ID
     */
    private generateTaskId;
    /**
     * 获取采集器统计信息
     */
    getStatistics(): {
        totalCollectors: number;
        totalTasks: number;
        runningTasks: number;
        completedTasks: number;
        failedTasks: number;
    };
}
export declare const collectorManager: CollectorManager;
//# sourceMappingURL=CollectorManager.d.ts.map