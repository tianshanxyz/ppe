"use strict";
/**
 * 采集器管理器
 * 统一管理所有数据源采集器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectorManager = exports.CollectorManager = void 0;
const FDACollector_1 = require("../collectors/FDACollector");
const EUDAMEDCollector_1 = require("../collectors/EUDAMEDCollector");
const NMPACollector_1 = require("../collectors/NMPACollector");
const PMDACollector_1 = require("../collectors/PMDACollector");
const TGACollector_1 = require("../collectors/TGACollector");
const HealthCanadaCollector_1 = require("../collectors/HealthCanadaCollector");
const Logger_1 = require("../utils/Logger");
class CollectorManager {
    collectors = new Map();
    tasks = new Map();
    logger;
    constructor() {
        this.logger = new Logger_1.Logger('CollectorManager');
        this.initializeCollectors();
    }
    /**
     * 初始化所有采集器
     */
    initializeCollectors() {
        this.collectors.set('FDA', new FDACollector_1.FDACollector());
        this.collectors.set('EUDAMED', new EUDAMEDCollector_1.EUDAMEDCollector());
        this.collectors.set('NMPA', new NMPACollector_1.NMPACollector());
        this.collectors.set('PMDA', new PMDACollector_1.PMDACollector());
        this.collectors.set('TGA', new TGACollector_1.TGACollector());
        this.collectors.set('HealthCanada', new HealthCanadaCollector_1.HealthCanadaCollector());
        this.logger.info('采集器初始化完成', {
            sources: Array.from(this.collectors.keys()),
        });
    }
    /**
     * 获取指定采集器
     */
    getCollector(sourceType) {
        return this.collectors.get(sourceType);
    }
    /**
     * 获取所有采集器
     */
    getAllCollectors() {
        return Array.from(this.collectors.values());
    }
    /**
     * 执行单数据源采集
     */
    async collectFromSource(sourceType, filter) {
        const collector = this.collectors.get(sourceType);
        if (!collector) {
            throw new Error(`未找到数据源采集器: ${sourceType}`);
        }
        const taskId = this.generateTaskId();
        const task = {
            id: taskId,
            taskName: `采集任务-${sourceType}`,
            dataSourceId: sourceType,
            taskType: 'manual_trigger',
            status: 'pending',
            recordsTotal: 0,
            recordsSuccess: 0,
            recordsFailed: 0,
            executedBy: 'manual',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.tasks.set(task.id, task);
        this.logger.info(`开始采集任务: ${task.id}`, { sourceType, filter });
        try {
            task.status = 'running';
            task.startedAt = new Date();
            task.updatedAt = new Date();
            const result = await collector.collect(filter);
            task.status = 'completed';
            task.completedAt = new Date();
            task.recordsTotal = result.totalRecords;
            task.recordsSuccess = result.successRecords;
            task.recordsFailed = result.failedRecords;
            task.updatedAt = new Date();
            this.logger.info(`采集任务完成: ${task.id}`, {
                total: result.totalRecords,
                success: result.successRecords,
                failed: result.failedRecords,
            });
            return result;
        }
        catch (error) {
            task.status = 'failed';
            task.errorMessage = error instanceof Error ? error.message : 'Unknown error';
            task.completedAt = new Date();
            task.updatedAt = new Date();
            this.logger.error(`采集任务失败: ${task.id}`, error);
            throw error;
        }
    }
    /**
     * 执行多数据源并行采集
     */
    async collectFromMultipleSources(sourceTypes, filter) {
        const results = new Map();
        this.logger.info(`开始并行采集`, { sources: sourceTypes });
        const promises = sourceTypes.map(async (sourceType) => {
            try {
                const result = await this.collectFromSource(sourceType, filter);
                results.set(sourceType, result);
            }
            catch (error) {
                this.logger.error(`采集失败: ${sourceType}`, error);
            }
        });
        await Promise.all(promises);
        this.logger.info(`并行采集完成`, {
            completed: results.size,
            total: sourceTypes.length,
        });
        return results;
    }
    /**
     * 执行全量采集（所有数据源）
     */
    async collectAll(filter) {
        const allSources = Array.from(this.collectors.keys());
        return this.collectFromMultipleSources(allSources, filter);
    }
    /**
     * 获取任务状态
     */
    getTaskStatus(taskId) {
        return this.tasks.get(taskId);
    }
    /**
     * 获取所有任务
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    /**
     * 获取运行中的任务
     */
    getRunningTasks() {
        return this.getAllTasks().filter((task) => task.status === 'running');
    }
    /**
     * 取消任务
     */
    async cancelTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'running') {
            return false;
        }
        const collector = this.collectors.get(task.dataSourceId);
        if (collector) {
            await collector.cancel();
        }
        task.status = 'cancelled';
        task.completedAt = new Date();
        task.updatedAt = new Date();
        this.logger.info(`任务已取消: ${taskId}`);
        return true;
    }
    /**
     * 生成任务ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 获取采集器统计信息
     */
    getStatistics() {
        const tasks = this.getAllTasks();
        return {
            totalCollectors: this.collectors.size,
            totalTasks: tasks.length,
            runningTasks: tasks.filter((t) => t.status === 'running').length,
            completedTasks: tasks.filter((t) => t.status === 'completed').length,
            failedTasks: tasks.filter((t) => t.status === 'failed').length,
        };
    }
}
exports.CollectorManager = CollectorManager;
// 导出单例实例
exports.collectorManager = new CollectorManager();
//# sourceMappingURL=CollectorManager.js.map