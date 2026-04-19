"use strict";
/**
 * 采集引擎 API 路由
 * RESTful API for collection engine management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CollectorManager_1 = require("../core/CollectorManager");
const router = (0, express_1.Router)();
const collectorManager = new CollectorManager_1.CollectorManager();
/**
 * GET /api/collectors
 * 获取所有采集器信息
 */
router.get('/collectors', (req, res) => {
    const collectors = collectorManager.getAllCollectors().map((collector) => ({
        sourceType: collector['config'].sourceType,
        baseUrl: collector['config'].baseUrl,
        isActive: true,
    }));
    res.json({
        success: true,
        data: collectors,
    });
});
/**
 * POST /api/collect/:source
 * 启动单数据源采集任务
 */
router.post('/collect/:source', async (req, res) => {
    try {
        const sourceType = req.params.source;
        const filter = req.body.filter || {};
        // 验证数据源类型
        const validSources = ['FDA', 'EUDAMED', 'NMPA', 'PMDA', 'TGA', 'HealthCanada'];
        if (!validSources.includes(sourceType)) {
            return res.status(400).json({
                success: false,
                error: `无效的数据源类型: ${sourceType}`,
                validSources,
            });
        }
        // 启动采集任务（异步）
        const taskPromise = collectorManager.collectFromSource(sourceType, filter);
        // 立即返回任务ID
        const task = collectorManager.getAllTasks().find((t) => t.sourceType === sourceType && t.status === 'running');
        res.json({
            success: true,
            message: `采集任务已启动: ${sourceType}`,
            taskId: task?.id,
        });
        // 在后台执行采集
        taskPromise.catch((error) => {
            console.error(`采集任务失败: ${sourceType}`, error);
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * POST /api/collect/all
 * 启动全量采集（所有数据源）
 */
router.post('/collect/all', async (req, res) => {
    try {
        const filter = req.body.filter || {};
        // 启动全量采集（异步）
        collectorManager.collectAll(filter).catch((error) => {
            console.error('全量采集任务失败', error);
        });
        res.json({
            success: true,
            message: '全量采集任务已启动',
            sources: ['FDA', 'EUDAMED', 'NMPA', 'PMDA', 'TGA', 'HealthCanada'],
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * GET /api/tasks
 * 获取所有任务列表
 */
router.get('/tasks', (req, res) => {
    const tasks = collectorManager.getAllTasks();
    res.json({
        success: true,
        data: tasks,
    });
});
/**
 * GET /api/tasks/:taskId
 * 获取指定任务详情
 */
router.get('/tasks/:taskId', (req, res) => {
    const task = collectorManager.getTaskStatus(req.params.taskId);
    if (!task) {
        return res.status(404).json({
            success: false,
            error: '任务不存在',
        });
    }
    res.json({
        success: true,
        data: task,
    });
});
/**
 * GET /api/tasks/running
 * 获取运行中的任务
 */
router.get('/tasks/running', (req, res) => {
    const tasks = collectorManager.getRunningTasks();
    res.json({
        success: true,
        data: tasks,
    });
});
/**
 * POST /api/tasks/:taskId/cancel
 * 取消指定任务
 */
router.post('/tasks/:taskId/cancel', async (req, res) => {
    try {
        const success = await collectorManager.cancelTask(req.params.taskId);
        if (!success) {
            return res.status(400).json({
                success: false,
                error: '任务不存在或无法取消',
            });
        }
        res.json({
            success: true,
            message: '任务已取消',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * GET /api/statistics
 * 获取采集统计信息
 */
router.get('/statistics', (req, res) => {
    const stats = collectorManager.getStatistics();
    res.json({
        success: true,
        data: stats,
    });
});
/**
 * GET /api/health
 * 健康检查
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
exports.default = router;
//# sourceMappingURL=routes.js.map