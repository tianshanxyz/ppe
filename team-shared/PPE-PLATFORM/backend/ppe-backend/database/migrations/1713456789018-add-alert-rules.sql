-- 迁移文件：添加预警规则系统
-- 执行时间：2026-04-18

-- 创建告警类型枚举
DO $$ BEGIN
    CREATE TYPE alert_type AS ENUM (
        'data_change',
        'quality_issue',
        'regulation_update',
        'task_failure',
        'threshold',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建告警级别枚举
DO $$ BEGIN
    CREATE TYPE alert_level AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建告警状态枚举
DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM (
        'active',
        'triggered',
        'resolved',
        'disabled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建触发条件枚举
DO $$ BEGIN
    CREATE TYPE trigger_condition AS ENUM (
        'greater_than',
        'less_than',
        'equals',
        'contains',
        'changes',
        'not_exists',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建告警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    alert_type alert_type NOT NULL DEFAULT 'custom',
    level alert_level NOT NULL DEFAULT 'medium',
    data_source VARCHAR(100) NOT NULL,
    target_field VARCHAR(255),
    trigger_condition trigger_condition NOT NULL DEFAULT 'changes',
    threshold_value DECIMAL(15,2),
    threshold_unit VARCHAR(50),
    filter_conditions JSONB,
    notification_channels JSONB,
    notification_template TEXT,
    cooldown_period INTEGER DEFAULT 300,
    enabled BOOLEAN NOT NULL DEFAULT true,
    status alert_status NOT NULL DEFAULT 'active',
    trigger_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建告警记录表
CREATE TABLE IF NOT EXISTS alert_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    level alert_level NOT NULL,
    alert_type alert_type NOT NULL,
    trigger_data JSONB,
    trigger_value DECIMAL(15,2),
    threshold_value DECIMAL(15,2),
    affected_records JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by VARCHAR(255),
    resolution TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_alert_rules_type_status ON alert_rules(alert_type, status);
CREATE INDEX IF NOT EXISTS idx_alert_rules_level ON alert_rules(level);
CREATE INDEX IF NOT EXISTS idx_alert_rules_created_by ON alert_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_alert_rules_name ON alert_rules(name);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);

CREATE INDEX IF NOT EXISTS idx_alert_records_rule_status ON alert_records(rule_id, status);
CREATE INDEX IF NOT EXISTS idx_alert_records_level_status ON alert_records(level, status);
CREATE INDEX IF NOT EXISTS idx_alert_records_created_at ON alert_records(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_records_rule_id ON alert_records(rule_id);

-- 添加注释
COMMENT ON TABLE alert_rules IS '告警规则表';
COMMENT ON TABLE alert_records IS '告警记录表';

COMMENT ON COLUMN alert_rules.id IS '规则 ID';
COMMENT ON COLUMN alert_rules.name IS '规则名称';
COMMENT ON COLUMN alert_rules.description IS '规则描述';
COMMENT ON COLUMN alert_rules.alert_type IS '告警类型';
COMMENT ON COLUMN alert_rules.level IS '告警级别';
COMMENT ON COLUMN alert_rules.data_source IS '数据源';
COMMENT ON COLUMN alert_rules.target_field IS '目标字段';
COMMENT ON COLUMN alert_rules.trigger_condition IS '触发条件';
COMMENT ON COLUMN alert_rules.threshold_value IS '阈值';
COMMENT ON COLUMN alert_rules.threshold_unit IS '阈值单位';
COMMENT ON COLUMN alert_rules.filter_conditions IS '过滤条件';
COMMENT ON COLUMN alert_rules.notification_channels IS '通知渠道';
COMMENT ON COLUMN alert_rules.notification_template IS '通知模板';
COMMENT ON COLUMN alert_rules.cooldown_period IS '冷却时间（秒）';
COMMENT ON COLUMN alert_rules.enabled IS '是否启用';
COMMENT ON COLUMN alert_rules.status IS '状态';
COMMENT ON COLUMN alert_rules.trigger_count IS '触发次数';
COMMENT ON COLUMN alert_rules.last_triggered_at IS '最后触发时间';
COMMENT ON COLUMN alert_rules.created_by IS '创建人';
COMMENT ON COLUMN alert_rules.metadata IS '元数据';

COMMENT ON COLUMN alert_records.id IS '记录 ID';
COMMENT ON COLUMN alert_records.rule_id IS '规则 ID';
COMMENT ON COLUMN alert_records.title IS '告警标题';
COMMENT ON COLUMN alert_records.message IS '告警消息';
COMMENT ON COLUMN alert_records.level IS '告警级别';
COMMENT ON COLUMN alert_records.alert_type IS '告警类型';
COMMENT ON COLUMN alert_records.trigger_data IS '触发数据';
COMMENT ON COLUMN alert_records.trigger_value IS '触发值';
COMMENT ON COLUMN alert_records.threshold_value IS '阈值';
COMMENT ON COLUMN alert_records.affected_records IS '受影响记录';
COMMENT ON COLUMN alert_records.status IS '状态';
COMMENT ON COLUMN alert_records.processed_at IS '处理时间';
COMMENT ON COLUMN alert_records.processed_by IS '处理人';
COMMENT ON COLUMN alert_records.resolution IS '处理结果';
COMMENT ON COLUMN alert_records.metadata IS '元数据';
