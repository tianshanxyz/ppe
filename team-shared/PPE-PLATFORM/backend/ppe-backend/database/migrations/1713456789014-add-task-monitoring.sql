-- 迁移文件：添加任务监控相关表
-- 执行时间：2026-04-18

-- 创建任务执行日志表
CREATE TABLE IF NOT EXISTS task_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES collection_tasks(id) ON DELETE CASCADE,
    level VARCHAR(50) NOT NULL DEFAULT 'info',
    message TEXT NOT NULL,
    error_stack TEXT,
    metadata JSONB,
    execution_time INTEGER,
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建任务指标表
CREATE TABLE IF NOT EXISTS task_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES collection_tasks(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_logs_task_created ON task_execution_logs(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_level_created ON task_execution_logs(level, created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_task_type_time ON task_metrics(task_id, metric_type, timestamp);

-- 添加注释
COMMENT ON TABLE task_execution_logs IS '任务执行日志表';
COMMENT ON COLUMN task_execution_logs.id IS '日志 ID';
COMMENT ON COLUMN task_execution_logs.task_id IS '任务 ID';
COMMENT ON COLUMN task_execution_logs.level IS '日志级别';
COMMENT ON COLUMN task_execution_logs.message IS '日志消息';
COMMENT ON COLUMN task_execution_logs.error_stack IS '错误堆栈';
COMMENT ON COLUMN task_execution_logs.metadata IS '元数据';
COMMENT ON COLUMN task_execution_logs.execution_time IS '执行时间（毫秒）';
COMMENT ON COLUMN task_execution_logs.processed_count IS '已处理数量';
COMMENT ON COLUMN task_execution_logs.success_count IS '成功数量';
COMMENT ON COLUMN task_execution_logs.failed_count IS '失败数量';

COMMENT ON TABLE task_metrics IS '任务指标表';
COMMENT ON COLUMN task_metrics.id IS '指标 ID';
COMMENT ON COLUMN task_metrics.task_id IS '任务 ID';
COMMENT ON COLUMN task_metrics.metric_type IS '指标类型';
COMMENT ON COLUMN task_metrics.metric_value IS '指标值';
COMMENT ON COLUMN task_metrics.unit IS '单位';
COMMENT ON COLUMN task_metrics.metadata IS '元数据';
COMMENT ON COLUMN task_metrics.timestamp IS '指标时间戳';
