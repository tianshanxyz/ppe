-- ============================================
-- 会员等级系统数据库初始化脚本
-- B-001: 会员等级系统
-- ============================================

-- 用户会员信息表
CREATE TABLE IF NOT EXISTS user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (current_tier IN ('free', 'professional', 'enterprise')),

    -- 订阅信息 (JSONB格式，灵活存储)
    subscription JSONB NOT NULL DEFAULT '{
        "status": "active",
        "started_at": null,
        "expires_at": null,
        "billing_cycle": "monthly",
        "auto_renew": false
    }'::jsonb,

    -- 使用统计
    usage JSONB NOT NULL DEFAULT '{
        "api_calls_today": 0,
        "api_calls_this_month": 0,
        "exports_this_month": 0,
        "reports_this_month": 0,
        "searches_today": 0,
        "last_reset_at": null
    }'::jsonb,

    -- 升级/降级历史
    history JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- 元数据
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 唯一约束：每个用户只有一条会员记录
    CONSTRAINT unique_user_membership UNIQUE (user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_tier ON user_memberships(current_tier);
CREATE INDEX IF NOT EXISTS idx_user_memberships_subscription_status ON user_memberships((subscription->>'status'));

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_user_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_memberships ON user_memberships;
CREATE TRIGGER trigger_update_user_memberships
    BEFORE UPDATE ON user_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_user_memberships_updated_at();

-- ============================================
-- 会员使用日志表（用于审计和统计）
-- ============================================

CREATE TABLE IF NOT EXISTS membership_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'api_call', 'export', 'report', 'search', etc.
    action_detail JSONB, -- 详细信息
    usage_amount INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON membership_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON membership_usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON membership_usage_logs(created_at);

-- ============================================
-- 会员变更历史表（详细记录）
-- ============================================

CREATE TABLE IF NOT EXISTS membership_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_tier VARCHAR(20) NOT NULL,
    to_tier VARCHAR(20) NOT NULL,
    change_reason VARCHAR(50) NOT NULL, -- 'upgrade', 'downgrade', 'cancellation', 'expiration', 'admin'
    payment_info JSONB, -- 支付相关信息
    changed_by UUID REFERENCES auth.users(id), -- 操作人（管理员或用户自己）
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_change_history_user_id ON membership_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_change_history_created_at ON membership_change_history(created_at);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用RLS
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_change_history ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的会员信息
CREATE POLICY user_memberships_select_policy ON user_memberships
    FOR SELECT
    USING (auth.uid() = user_id);

-- 用户只能更新自己的会员信息（但某些字段需要额外验证）
CREATE POLICY user_memberships_update_policy ON user_memberships
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 插入策略（通常由系统或触发器处理）
CREATE POLICY user_memberships_insert_policy ON user_memberships
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 使用日志：用户只能查看自己的
CREATE POLICY usage_logs_select_policy ON membership_usage_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- 变更历史：用户只能查看自己的
CREATE POLICY change_history_select_policy ON membership_change_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- 存储过程：增加使用量
-- ============================================

CREATE OR REPLACE FUNCTION increment_membership_usage(
    p_user_id UUID,
    p_field TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    v_usage JSONB;
    v_field_name TEXT;
BEGIN
    -- 获取当前使用统计
    SELECT usage INTO v_usage
    FROM user_memberships
    WHERE user_id = p_user_id;

    IF v_usage IS NULL THEN
        RAISE EXCEPTION 'User membership not found';
    END IF;

    -- 提取字段名（去掉 'usage.' 前缀）
    v_field_name := REPLACE(p_field, 'usage.', '');

    -- 更新指定字段
    v_usage := jsonb_set(
        v_usage,
        ARRAY[v_field_name],
        COALESCE((v_usage->>v_field_name)::INTEGER, 0) + p_amount
    );

    -- 保存更新
    UPDATE user_memberships
    SET usage = v_usage,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 触发器：新用户自动创建免费会员
-- ============================================

CREATE OR REPLACE FUNCTION create_free_membership_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_memberships (
        user_id,
        current_tier,
        subscription,
        usage,
        history,
        metadata
    ) VALUES (
        NEW.id,
        'free',
        jsonb_build_object(
            'status', 'active',
            'started_at', NOW(),
            'expires_at', (NOW() + INTERVAL '100 years'),
            'billing_cycle', 'monthly',
            'auto_renew', false
        ),
        jsonb_build_object(
            'api_calls_today', 0,
            'api_calls_this_month', 0,
            'exports_this_month', 0,
            'reports_this_month', 0,
            'searches_today', 0,
            'last_reset_at', NOW()
        ),
        '[]'::jsonb,
        '{}'::jsonb
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为新用户创建会员记录
DROP TRIGGER IF EXISTS trigger_create_membership_on_signup ON auth.users;
CREATE TRIGGER trigger_create_membership_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_free_membership_for_new_user();

-- ============================================
-- 视图：会员统计概览（管理员用）
-- ============================================

CREATE OR REPLACE VIEW membership_stats AS
SELECT
    current_tier,
    COUNT(*) as user_count,
    COUNT(*) FILTER (WHERE subscription->>'status' = 'active') as active_count,
    COUNT(*) FILTER (WHERE subscription->>'status' = 'cancelled') as cancelled_count,
    COUNT(*) FILTER (WHERE subscription->>'status' = 'expired') as expired_count,
    AVG((usage->>'api_calls_today')::INTEGER) as avg_api_calls_today,
    AVG((usage->>'exports_this_month')::INTEGER) as avg_exports_this_month
FROM user_memberships
GROUP BY current_tier;

-- ============================================
-- 注释
-- ============================================

COMMENT ON TABLE user_memberships IS '用户会员信息表';
COMMENT ON TABLE membership_usage_logs IS '会员使用日志表';
COMMENT ON TABLE membership_change_history IS '会员变更历史表';
COMMENT ON VIEW membership_stats IS '会员统计概览视图';
