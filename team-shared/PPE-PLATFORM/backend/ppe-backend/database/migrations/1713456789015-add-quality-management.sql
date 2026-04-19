-- 迁移文件：添加质量管理相关表
-- 执行时间：2026-04-18

-- 创建规则类型枚举
DO $$ BEGIN
    CREATE TYPE rule_type AS ENUM (
        'required',
        'pattern',
        'range',
        'length',
        'unique',
        'reference',
        'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建严重程度枚举
DO $$ BEGIN
    CREATE TYPE rule_severity AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建作用域枚举
DO $$ BEGIN
    CREATE TYPE rule_scope AS ENUM (
        'ppe',
        'regulation',
        'company',
        'global'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建检查状态枚举
DO $$ BEGIN
    CREATE TYPE check_status AS ENUM (
        'passed',
        'failed',
        'warning',
        'skipped'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建质量规则表
CREATE TABLE IF NOT EXISTS quality_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type rule_type NOT NULL DEFAULT 'custom',
    scope rule_scope NOT NULL DEFAULT 'global',
    resource_type VARCHAR(100) NOT NULL,
    field_path VARCHAR(255) NOT NULL,
    expression TEXT NOT NULL,
    error_message VARCHAR(500) NOT NULL,
    severity rule_severity NOT NULL DEFAULT 'medium',
    execution_order INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_by_id UUID NOT NULL REFERENCES users(id),
    updated_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建质量检查结果表
CREATE TABLE IF NOT EXISTS quality_check_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    rule_id UUID NOT NULL REFERENCES quality_rules(id),
    status check_status NOT NULL DEFAULT 'passed',
    message TEXT,
    field_value TEXT,
    expected_value TEXT,
    severity_weight DECIMAL(5,2) DEFAULT 1.0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建质量评分表
CREATE TABLE IF NOT EXISTS quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    overall_score DECIMAL(5,2) NOT NULL,
    total_checks INTEGER DEFAULT 0,
    passed_checks INTEGER DEFAULT 0,
    failed_checks INTEGER DEFAULT 0,
    warning_checks INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    high_issues INTEGER DEFAULT 0,
    medium_issues INTEGER DEFAULT 0,
    low_issues INTEGER DEFAULT 0,
    breakdown JSONB,
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rules_scope_resource ON quality_rules(scope, resource_type);
CREATE INDEX IF NOT EXISTS idx_rules_active_created ON quality_rules(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_results_resource ON quality_check_results(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_results_rule ON quality_check_results(rule_id, created_at);
CREATE INDEX IF NOT EXISTS idx_results_status ON quality_check_results(status, created_at);
CREATE INDEX IF NOT EXISTS idx_scores_resource ON quality_scores(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_scores_score ON quality_scores(overall_score, created_at);

-- 添加注释
COMMENT ON TABLE quality_rules IS '质量规则表';
COMMENT ON COLUMN quality_rules.id IS '规则 ID';
COMMENT ON COLUMN quality_rules.name IS '规则名称';
COMMENT ON COLUMN quality_rules.rule_type IS '规则类型';
COMMENT ON COLUMN quality_rules.scope IS '作用域';
COMMENT ON COLUMN quality_rules.resource_type IS '资源类型';
COMMENT ON COLUMN quality_rules.field_path IS '字段路径';
COMMENT ON COLUMN quality_rules.expression IS '规则表达式';
COMMENT ON COLUMN quality_rules.error_message IS '错误消息';
COMMENT ON COLUMN quality_rules.severity IS '严重程度';
COMMENT ON COLUMN quality_rules.execution_order IS '执行顺序';
COMMENT ON COLUMN quality_rules.is_active IS '是否激活';

COMMENT ON TABLE quality_check_results IS '质量检查结果表';
COMMENT ON COLUMN quality_check_results.id IS '检查结果 ID';
COMMENT ON COLUMN quality_check_results.resource_type IS '资源类型';
COMMENT ON COLUMN quality_check_results.resource_id IS '资源 ID';
COMMENT ON COLUMN quality_check_results.rule_id IS '规则 ID';
COMMENT ON COLUMN quality_check_results.status IS '检查状态';
COMMENT ON COLUMN quality_check_results.message IS '检查消息';
COMMENT ON COLUMN quality_check_results.field_value IS '字段值';
COMMENT ON COLUMN quality_check_results.expected_value IS '期望值';
COMMENT ON COLUMN quality_check_results.severity_weight IS '严重程度权重';

COMMENT ON TABLE quality_scores IS '质量评分表';
COMMENT ON COLUMN quality_scores.id IS '评分 ID';
COMMENT ON COLUMN quality_scores.resource_type IS '资源类型';
COMMENT ON COLUMN quality_scores.resource_id IS '资源 ID';
COMMENT ON COLUMN quality_scores.overall_score IS '总体评分';
COMMENT ON COLUMN quality_scores.total_checks IS '总检查数';
COMMENT ON COLUMN quality_scores.passed_checks IS '通过数';
COMMENT ON COLUMN quality_scores.failed_checks IS '失败数';
COMMENT ON COLUMN quality_scores.breakdown IS '详细分解';
COMMENT ON COLUMN quality_scores.recommendations IS '改进建议';
