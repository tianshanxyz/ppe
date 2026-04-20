-- ============================================
-- API密钥管理系统数据库初始化脚本
-- B-002: API密钥管理
-- ============================================

-- API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- 密钥信息（只存储哈希）
    key_prefix VARCHAR(20) NOT NULL, -- 前12位，用于显示
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256哈希

    -- 权限配置
    permissions JSONB NOT NULL DEFAULT '[{"resource": "companies", "actions": ["read"]}, {"resource": "products", "actions": ["read"]}, {"resource": "search", "actions": ["read"]}]'::jsonb,
    allowed_endpoints JSONB NOT NULL DEFAULT '["*"]'::jsonb,
    allowed_ips JSONB, -- IP白名单

    -- 限制配置
    rate_limit JSONB NOT NULL DEFAULT '{
        "requestsPerSecond": 10,
        "requestsPerMinute": 100,
        "requestsPerHour": 1000,
        "requestsPerDay": 10000,
        "burstAllowance": 20
    }'::jsonb,
    usage_quota JSONB NOT NULL DEFAULT '{
        "maxRequestsPerMonth": 100000,
        "maxDataTransferPerMonth": 1024
    }'::jsonb,

    -- 状态
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked', 'expired')),
    expires_at TIMESTAMPTZ,

    -- 使用统计
    usage JSONB NOT NULL DEFAULT '{
        "total_requests": 0,
        "requests_this_month": 0,
        "requests_today": 0,
        "data_transfer_this_month": 0
    }'::jsonb,

    -- 元数据
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_api_keys ON api_keys;
CREATE TRIGGER trigger_update_api_keys
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_updated_at();

-- ============================================
-- API密钥限流记录表
-- ============================================

CREATE TABLE IF NOT EXISTS api_key_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    window VARCHAR(20) NOT NULL CHECK (window IN ('second', 'minute', 'hour', 'day')),
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,

    -- 唯一约束：每个密钥在每个时间窗口只有一条记录
    CONSTRAINT unique_key_window UNIQUE (key_id, window, window_start)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_id ON api_key_rate_limits(key_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON api_key_rate_limits(window);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON api_key_rate_limits(window_start);

-- 自动清理过期限流记录（保留7天）
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM api_key_rate_limits
    WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- API密钥审计日志表
-- ============================================

CREATE TABLE IF NOT EXISTS api_key_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'used', 'updated', 'revoked', 'expired')),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_key_id ON api_key_audit_logs(key_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON api_key_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON api_key_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON api_key_audit_logs(created_at);

-- ============================================
-- 存储过程：增加API密钥使用量
-- ============================================

CREATE OR REPLACE FUNCTION increment_api_key_usage(
    p_key_id UUID,
    p_client_ip TEXT,
    p_endpoint TEXT
)
RETURNS VOID AS $$
DECLARE
    v_usage JSONB;
    v_last_reset DATE;
BEGIN
    -- 获取当前使用统计
    SELECT usage INTO v_usage
    FROM api_keys
    WHERE id = p_key_id;

    IF v_usage IS NULL THEN
        RAISE EXCEPTION 'API key not found';
    END IF;

    -- 检查是否需要重置日统计
    v_last_reset := COALESCE((v_usage->>'last_reset')::DATE, '1970-01-01'::DATE);
    
    IF v_last_reset < CURRENT_DATE THEN
        -- 重置日统计
        v_usage := jsonb_set(v_usage, '{requests_today}', '0'::jsonb);
        v_usage := jsonb_set(v_usage, '{last_reset}', to_jsonb(CURRENT_DATE::TEXT));
        
        -- 检查是否需要重置月统计
        IF EXTRACT(MONTH FROM v_last_reset) != EXTRACT(MONTH FROM CURRENT_DATE) 
           OR EXTRACT(YEAR FROM v_last_reset) != EXTRACT(YEAR FROM CURRENT_DATE) THEN
            v_usage := jsonb_set(v_usage, '{requests_this_month}', '0'::jsonb);
            v_usage := jsonb_set(v_usage, '{data_transfer_this_month}', '0'::jsonb);
        END IF;
    END IF;

    -- 更新使用量
    v_usage := jsonb_set(
        v_usage,
        '{total_requests}',
        to_jsonb(COALESCE((v_usage->>'total_requests')::INTEGER, 0) + 1)
    );
    v_usage := jsonb_set(
        v_usage,
        '{requests_this_month}',
        to_jsonb(COALESCE((v_usage->>'requests_this_month')::INTEGER, 0) + 1)
    );
    v_usage := jsonb_set(
        v_usage,
        '{requests_today}',
        to_jsonb(COALESCE((v_usage->>'requests_today')::INTEGER, 0) + 1)
    );

    -- 保存更新
    UPDATE api_keys
    SET usage = v_usage,
        metadata = jsonb_set(
            metadata,
            '{last_used_at}',
            to_jsonb(NOW()::TEXT)
        ) || jsonb_build_object(
            'last_request_ip', p_client_ip,
            'last_request_endpoint', p_endpoint
        ),
        updated_at = NOW()
    WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_audit_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的API密钥
CREATE POLICY api_keys_select_policy ON api_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- 用户只能更新自己的API密钥
CREATE POLICY api_keys_update_policy ON api_keys
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 用户只能插入自己的API密钥
CREATE POLICY api_keys_insert_policy ON api_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的API密钥
CREATE POLICY api_keys_delete_policy ON api_keys
    FOR DELETE
    USING (auth.uid() = user_id);

-- 限流记录：用户只能查看与自己API密钥相关的
CREATE POLICY rate_limits_select_policy ON api_key_rate_limits
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM api_keys 
            WHERE api_keys.id = api_key_rate_limits.key_id 
            AND api_keys.user_id = auth.uid()
        )
    );

-- 审计日志：用户只能查看与自己API密钥相关的
CREATE POLICY audit_logs_select_policy ON api_key_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM api_keys 
            WHERE api_keys.id = api_key_audit_logs.key_id 
            AND api_keys.user_id = auth.uid()
        )
    );

-- ============================================
-- 视图：API密钥统计概览（管理员用）
-- ============================================

CREATE OR REPLACE VIEW api_key_stats AS
SELECT
    status,
    COUNT(*) as key_count,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW()) as expired_count,
    SUM((usage->>'total_requests')::INTEGER) as total_requests,
    AVG((usage->>'requests_this_month')::INTEGER) as avg_requests_this_month
FROM api_keys
GROUP BY status;

-- ============================================
-- 注释
-- ============================================

COMMENT ON TABLE api_keys IS 'API密钥表';
COMMENT ON TABLE api_key_rate_limits IS 'API密钥限流记录表';
COMMENT ON TABLE api_key_audit_logs IS 'API密钥审计日志表';
COMMENT ON VIEW api_key_stats IS 'API密钥统计概览视图';
