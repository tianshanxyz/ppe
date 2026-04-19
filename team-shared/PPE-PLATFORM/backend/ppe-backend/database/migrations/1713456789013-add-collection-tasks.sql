-- 迁移文件：添加采集任务管理表
-- 执行时间：2026-04-18

-- 创建任务枚举类型
DO $$ BEGIN
    CREATE TYPE task_type AS ENUM (
        'ppe_collection',
        'regulation_collection',
        'company_collection',
        'data_sync',
        'data_export',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'pending',
        'running',
        'completed',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM (
        'low',
        'normal',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建采集任务表
CREATE TABLE IF NOT EXISTS collection_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type task_type NOT NULL DEFAULT 'custom',
    status task_status NOT NULL DEFAULT 'pending',
    priority task_priority NOT NULL DEFAULT 'normal',
    description TEXT,
    source_url VARCHAR(500) NOT NULL,
    target_resource VARCHAR(100) NOT NULL,
    config JSONB,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    timeout INTEGER,
    progress INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    created_by_id UUID NOT NULL REFERENCES users(id),
    updated_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON collection_tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON collection_tasks(created_by_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON collection_tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON collection_tasks(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- 添加注释
COMMENT ON TABLE collection_tasks IS '数据采集任务表';
COMMENT ON COLUMN collection_tasks.id IS '任务 ID';
COMMENT ON COLUMN collection_tasks.name IS '任务名称';
COMMENT ON COLUMN collection_tasks.type IS '任务类型';
COMMENT ON COLUMN collection_tasks.status IS '任务状态';
COMMENT ON COLUMN collection_tasks.priority IS '任务优先级';
COMMENT ON COLUMN collection_tasks.description IS '任务描述';
COMMENT ON COLUMN collection_tasks.source_url IS '数据源 URL';
COMMENT ON COLUMN collection_tasks.target_resource IS '目标资源类型';
COMMENT ON COLUMN collection_tasks.config IS '任务配置';
COMMENT ON COLUMN collection_tasks.result IS '执行结果';
COMMENT ON COLUMN collection_tasks.error_message IS '错误信息';
COMMENT ON COLUMN collection_tasks.retry_count IS '重试次数';
COMMENT ON COLUMN collection_tasks.max_retries IS '最大重试次数';
COMMENT ON COLUMN collection_tasks.started_at IS '开始时间';
COMMENT ON COLUMN collection_tasks.completed_at IS '完成时间';
COMMENT ON COLUMN collection_tasks.scheduled_at IS '计划执行时间';
COMMENT ON COLUMN collection_tasks.timeout IS '超时时间（秒）';
COMMENT ON COLUMN collection_tasks.progress IS '进度百分比';
COMMENT ON COLUMN collection_tasks.total_items IS '总项数';
COMMENT ON COLUMN collection_tasks.processed_items IS '已处理项数';
COMMENT ON COLUMN collection_tasks.created_by_id IS '创建者 ID';
COMMENT ON COLUMN collection_tasks.updated_by_id IS '更新者 ID';
COMMENT ON COLUMN collection_tasks.is_active IS '是否激活';
