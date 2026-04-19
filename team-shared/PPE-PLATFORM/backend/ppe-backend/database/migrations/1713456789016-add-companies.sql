-- 迁移文件：添加企业表
-- 执行时间：2026-04-18

-- 创建企业类型枚举
DO $$ BEGIN
    CREATE TYPE company_type AS ENUM (
        'manufacturer',
        'distributor',
        'retailer',
        'service',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建企业状态枚举
DO $$ BEGIN
    CREATE TYPE company_status AS ENUM (
        'active',
        'inactive',
        'suspended',
        'revoked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建企业表
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    logo VARCHAR(255),
    company_type company_type NOT NULL DEFAULT 'manufacturer',
    credit_code VARCHAR(100) NOT NULL,
    legal_representative VARCHAR(100),
    registered_capital DECIMAL(15,2),
    registration_date DATE,
    address TEXT,
    province VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(200),
    phone VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    business_scope TEXT,
    description TEXT,
    status company_status NOT NULL DEFAULT 'active',
    product_count INTEGER DEFAULT 0,
    quality_score DECIMAL(5,2),
    certifications JSONB,
    licenses JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_credit_code ON companies(credit_code);
CREATE INDEX IF NOT EXISTS idx_companies_province_city ON companies(province, city);
CREATE INDEX IF NOT EXISTS idx_companies_type_status ON companies(company_type, status);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- 添加注释
COMMENT ON TABLE companies IS '企业表';
COMMENT ON COLUMN companies.id IS '企业 ID';
COMMENT ON COLUMN companies.name IS '企业名称';
COMMENT ON COLUMN companies.short_name IS '企业简称';
COMMENT ON COLUMN companies.logo IS 'Logo URL';
COMMENT ON COLUMN companies.company_type IS '企业类型';
COMMENT ON COLUMN companies.credit_code IS '统一社会信用代码';
COMMENT ON COLUMN companies.legal_representative IS '法定代表人';
COMMENT ON COLUMN companies.registered_capital IS '注册资本';
COMMENT ON COLUMN companies.registration_date IS '注册日期';
COMMENT ON COLUMN companies.address IS '详细地址';
COMMENT ON COLUMN companies.province IS '省份';
COMMENT ON COLUMN companies.city IS '城市';
COMMENT ON COLUMN companies.district IS '区县';
COMMENT ON COLUMN companies.phone IS '联系电话';
COMMENT ON COLUMN companies.email IS '电子邮箱';
COMMENT ON COLUMN companies.website IS '官方网站';
COMMENT ON COLUMN companies.business_scope IS '经营范围';
COMMENT ON COLUMN companies.description IS '企业描述';
COMMENT ON COLUMN companies.status IS '状态';
COMMENT ON COLUMN companies.product_count IS '产品数量';
COMMENT ON COLUMN companies.quality_score IS '质量评分';
COMMENT ON COLUMN companies.certifications IS '认证列表';
COMMENT ON COLUMN companies.licenses IS '许可证列表';
COMMENT ON COLUMN companies.metadata IS '元数据';
