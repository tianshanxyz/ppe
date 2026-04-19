-- 迁移文件：添加法规表
-- 执行时间：2026-04-18

-- 创建法规类型枚举
DO $$ BEGIN
    CREATE TYPE regulation_type AS ENUM (
        'law',
        'regulation',
        'rule',
        'standard',
        'guideline',
        'notice',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建法规级别枚举
DO $$ BEGIN
    CREATE TYPE regulation_level AS ENUM (
        'national',
        'industry',
        'local',
        'enterprise'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建法规状态枚举
DO $$ BEGIN
    CREATE TYPE regulation_status AS ENUM (
        'effective',
        'repealed',
        'amended',
        'draft'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建法规表
CREATE TABLE IF NOT EXISTS regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    subtitle TEXT,
    document_number VARCHAR(200),
    regulation_type regulation_type NOT NULL DEFAULT 'other',
    level regulation_level NOT NULL DEFAULT 'national',
    issuing_agency VARCHAR(255),
    content TEXT,
    summary TEXT,
    release_date DATE,
    implementation_date DATE,
    expiry_date DATE,
    status regulation_status NOT NULL DEFAULT 'effective',
    applicable_fields JSONB,
    related_regulations JSONB,
    keywords JSONB,
    attachments JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_regulations_type_level ON regulations(regulation_type, level);
CREATE INDEX IF NOT EXISTS idx_regulations_agency ON regulations(issuing_agency);
CREATE INDEX IF NOT EXISTS idx_regulations_release_date ON regulations(release_date);
CREATE INDEX IF NOT EXISTS idx_regulations_status ON regulations(status);
CREATE INDEX IF NOT EXISTS idx_regulations_title ON regulations(title);

-- 添加注释
COMMENT ON TABLE regulations IS '法规表';
COMMENT ON COLUMN regulations.id IS '法规 ID';
COMMENT ON COLUMN regulations.title IS '法规标题';
COMMENT ON COLUMN regulations.subtitle IS '副标题';
COMMENT ON COLUMN regulations.document_number IS '文号';
COMMENT ON COLUMN regulations.regulation_type IS '法规类型';
COMMENT ON COLUMN regulations.level IS '法规级别';
COMMENT ON COLUMN regulations.issuing_agency IS '发布机构';
COMMENT ON COLUMN regulations.content IS '法规内容';
COMMENT ON COLUMN regulations.summary IS '摘要';
COMMENT ON COLUMN regulations.release_date IS '发布日期';
COMMENT ON COLUMN regulations.implementation_date IS '实施日期';
COMMENT ON COLUMN regulations.expiry_date IS '失效日期';
COMMENT ON COLUMN regulations.status IS '状态';
COMMENT ON COLUMN regulations.applicable_fields IS '适用领域';
COMMENT ON COLUMN regulations.related_regulations IS '相关法规';
COMMENT ON COLUMN regulations.keywords IS '关键词';
COMMENT ON COLUMN regulations.attachments IS '附件列表';
COMMENT ON COLUMN regulations.metadata IS '元数据';
