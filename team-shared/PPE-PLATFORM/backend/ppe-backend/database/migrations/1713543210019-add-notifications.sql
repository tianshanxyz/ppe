-- 迁移文件：添加通知服务系统
-- 执行时间：2026-04-19

-- 创建通知类型枚举
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'email',
        'in_app',
        'webhook',
        'sms'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建通知状态枚举
DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM (
        'pending',
        'sending',
        'sent',
        'failed',
        'read'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建通知优先级枚举
DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM (
        'low',
        'normal',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建模板类型枚举
DO $$ BEGIN
    CREATE TYPE template_type AS ENUM (
        'email',
        'in_app',
        'webhook',
        'sms'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建模板状态枚举
DO $$ BEGIN
    CREATE TYPE template_status AS ENUM (
        'draft',
        'active',
        'inactive',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    recipient VARCHAR(255),
    type notification_type NOT NULL DEFAULT 'in_app',
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    priority notification_priority NOT NULL DEFAULT 'normal',
    status notification_status NOT NULL DEFAULT 'pending',
    template_id UUID,
    template_data JSONB,
    attachments JSONB,
    metadata JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建通知模板表
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type template_type NOT NULL DEFAULT 'email',
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    description TEXT,
    variables JSONB,
    status template_status NOT NULL DEFAULT 'draft',
    created_by VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_type_status ON notifications(type, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type_status ON notification_templates(type, status);
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);

-- 添加注释
COMMENT ON TABLE notifications IS '通知表';
COMMENT ON TABLE notification_templates IS '通知模板表';

COMMENT ON COLUMN notifications.id IS '通知 ID';
COMMENT ON COLUMN notifications.user_id IS '用户 ID';
COMMENT ON COLUMN notifications.recipient IS '接收者（邮箱/手机号/Webhook URL）';
COMMENT ON COLUMN notifications.type IS '通知类型';
COMMENT ON COLUMN notifications.subject IS '主题';
COMMENT ON COLUMN notifications.content IS '内容';
COMMENT ON COLUMN notifications.html_content IS 'HTML 内容';
COMMENT ON COLUMN notifications.priority IS '优先级';
COMMENT ON COLUMN notifications.status IS '状态';
COMMENT ON COLUMN notifications.template_id IS '模板 ID';
COMMENT ON COLUMN notifications.template_data IS '模板数据';
COMMENT ON COLUMN notifications.attachments IS '附件列表';
COMMENT ON COLUMN notifications.metadata IS '元数据';
COMMENT ON COLUMN notifications.sent_at IS '发送时间';
COMMENT ON COLUMN notifications.read_at IS '阅读时间';
COMMENT ON COLUMN notifications.failed_reason IS '失败原因';
COMMENT ON COLUMN notifications.retry_count IS '重试次数';

COMMENT ON COLUMN notification_templates.id IS '模板 ID';
COMMENT ON COLUMN notification_templates.name IS '模板名称';
COMMENT ON COLUMN notification_templates.type IS '模板类型';
COMMENT ON COLUMN notification_templates.subject IS '主题';
COMMENT ON COLUMN notification_templates.content IS '内容';
COMMENT ON COLUMN notification_templates.html_content IS 'HTML 内容';
COMMENT ON COLUMN notification_templates.description IS '描述';
COMMENT ON COLUMN notification_templates.variables IS '变量列表';
COMMENT ON COLUMN notification_templates.status IS '状态';
COMMENT ON COLUMN notification_templates.created_by IS '创建人';
COMMENT ON COLUMN notification_templates.metadata IS '元数据';
