-- MDLooker 用户权限管理系统 - 数据库迁移脚本
-- 执行顺序: 1 → 2 → 3

-- ============================================
-- 1. 用户表新增字段
-- ============================================

ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS vip_tier VARCHAR(20);
ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(10);
ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;
ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100);
ALTER TABLE mdlooker_users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ============================================
-- 2. 订阅记录表
-- ============================================

CREATE TABLE IF NOT EXISTS mdlooker_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL REFERENCES mdlooker_users(id),
  tier VARCHAR(20) NOT NULL,
  billing_cycle VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  stripe_subscription_id VARCHAR(100) UNIQUE,
  stripe_price_id VARCHAR(100),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON mdlooker_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON mdlooker_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON mdlooker_subscriptions(stripe_subscription_id);

-- ============================================
-- 3. 支付记录表
-- ============================================

CREATE TABLE IF NOT EXISTS mdlooker_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL REFERENCES mdlooker_users(id),
  subscription_id UUID REFERENCES mdlooker_subscriptions(id),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  payment_method VARCHAR(20) NOT NULL DEFAULT 'stripe',
  stripe_payment_intent_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON mdlooker_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON mdlooker_payments(status);

-- ============================================
-- 4. 数据迁移: 统一现有用户角色
-- ============================================

-- 将现有 vip 角色用户映射为 professional vip_tier
UPDATE mdlooker_users
SET vip_tier = 'professional',
    subscription_status = 'active'
WHERE role = 'vip' AND vip_tier IS NULL;

-- 将现有 enterprise membership 用户映射为 enterprise vip_tier
UPDATE mdlooker_users
SET vip_tier = 'enterprise'
WHERE membership = 'enterprise' AND vip_tier = 'professional';

-- 将现有 admin/editor 角色用户设置 enterprise vip_tier
UPDATE mdlooker_users
SET vip_tier = 'enterprise',
    subscription_status = 'active'
WHERE role IN ('admin', 'editor') AND vip_tier IS NULL;

-- 将普通用户设置 subscription_status
UPDATE mdlooker_users
SET subscription_status = 'none'
WHERE role = 'user' AND subscription_status = 'none';

-- ============================================
-- 5. 配额表新增指标支持
-- ============================================

-- 确保配额表支持新增的 metric 类型
-- mdlooker_quotas 表的 metric 字段为 VARCHAR，无需修改结构
-- 新增 metric 类型: complianceChecks, aiChat, reports
