-- =====================================================
-- 全球 PPE 数据平台 - 数据库架构设计 v1.0
-- 创建日期: 2026-04-18
-- 数据工程师: 数据工程师
-- =====================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 用于全文搜索

-- =====================================================
-- 一、核心数据表 - PPE 注册数据
-- =====================================================

-- 1.1 PPE 产品主表
CREATE TABLE IF NOT EXISTS ppe_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 产品基本信息
    product_name VARCHAR(500) NOT NULL,
    product_name_en VARCHAR(500),
    product_name_local VARCHAR(500), -- 本地语言名称
    product_code VARCHAR(100),
    model_number VARCHAR(200),
    
    -- 产品分类
    category VARCHAR(100) NOT NULL, -- 产品大类: 呼吸防护、头部防护等
    subcategory VARCHAR(100), -- 子类
    ppe_category VARCHAR(20), -- PPE 类别: I, II, III
    risk_level VARCHAR(50), -- 风险等级
    
    -- 产品描述
    description TEXT,
    description_en TEXT,
    specifications JSONB, -- 技术参数 JSON
    features JSONB, -- 产品特性 JSON
    images TEXT[], -- 产品图片URL数组
    
    -- 制造商信息
    manufacturer_id UUID REFERENCES ppe_manufacturers(id) ON DELETE SET NULL,
    manufacturer_name VARCHAR(300),
    manufacturer_address TEXT,
    manufacturer_country VARCHAR(100),
    
    -- 品牌信息
    brand_name VARCHAR(200),
    brand_owner VARCHAR(300),
    
    -- 数据元信息
    data_source VARCHAR(100), -- 数据来源: FDA, CE, NMPA, PMDA, TGA, HealthCanada
    source_id VARCHAR(200), -- 源系统ID
    source_url TEXT,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 数据质量标记
    data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 约束
    CONSTRAINT unique_source_record UNIQUE (data_source, source_id)
);

-- 1.2 制造商/企业表
CREATE TABLE IF NOT EXISTS ppe_manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 企业基本信息
    company_name VARCHAR(300) NOT NULL,
    company_name_en VARCHAR(300),
    company_name_local VARCHAR(300),
    
    -- 企业类型
    business_type VARCHAR(100), -- manufacturer, supplier, distributor, cert_body
    
    -- 联系信息
    country VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(50),
    website VARCHAR(300),
    email VARCHAR(200),
    phone VARCHAR(100),
    
    -- 企业资质
    certifications JSONB, -- 资质认证信息
    capabilities TEXT, -- 生产能力描述
    
    -- 数据元信息
    data_source VARCHAR(100),
    source_id VARCHAR(200),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 数据质量
    data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT unique_manufacturer_source UNIQUE (data_source, source_id)
);

-- 1.3 认证信息表
CREATE TABLE IF NOT EXISTS ppe_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 关联产品
    product_id UUID REFERENCES ppe_products(id) ON DELETE CASCADE,
    
    -- 认证基本信息
    certification_type VARCHAR(100) NOT NULL, -- FDA, CE, NMPA, PMDA, TGA, HealthCanada
    certification_number VARCHAR(200),
    certificate_url TEXT,
    
    -- 认证机构
    cert_body_id UUID REFERENCES ppe_manufacturers(id) ON DELETE SET NULL,
    cert_body_name VARCHAR(300),
    
    -- 时间信息
    issue_date DATE,
    expiry_date DATE,
    renewal_date DATE,
    
    -- 认证状态
    status VARCHAR(50), -- active, expired, revoked, suspended
    
    -- 认证详情
    standard_code VARCHAR(100), -- 标准编号
    standard_name TEXT, -- 标准名称
    scope_description TEXT, -- 认证范围
    
    -- 数据元信息
    data_source VARCHAR(100),
    source_id VARCHAR(200),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 预警标记
    warning_sent BOOLEAN DEFAULT FALSE,
    warning_date TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_certification UNIQUE (product_id, certification_type, certification_number)
);

-- 1.4 法规标准表
CREATE TABLE IF NOT EXISTS ppe_regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 法规基本信息
    regulation_code VARCHAR(100) NOT NULL, -- 法规编号
    regulation_name VARCHAR(500) NOT NULL,
    regulation_name_en VARCHAR(500),
    
    -- 适用范围
    jurisdiction VARCHAR(100) NOT NULL, -- 适用地区: US, EU, CN, JP, AU, CA
    authority VARCHAR(200), -- 主管机构
    
    -- 法规类型
    regulation_type VARCHAR(100), -- law, regulation, standard, guideline
    
    -- 法规内容
    description TEXT,
    full_text TEXT,
    document_url TEXT,
    
    -- 产品分类映射
    applicable_categories TEXT[], -- 适用的产品类别
    
    -- 时间信息
    publish_date DATE,
    effective_date DATE,
    expiry_date DATE,
    last_updated DATE,
    
    -- 版本控制
    version VARCHAR(50),
    is_current BOOLEAN DEFAULT TRUE,
    
    -- 数据元信息
    data_source VARCHAR(100),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_regulation_version UNIQUE (regulation_code, version)
);

-- 1.5 产品与法规关联表
CREATE TABLE IF NOT EXISTS ppe_product_regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES ppe_products(id) ON DELETE CASCADE,
    regulation_id UUID REFERENCES ppe_regulations(id) ON DELETE CASCADE,
    
    -- 合规状态
    compliance_status VARCHAR(50), -- compliant, non-compliant, pending, exempt
    compliance_notes TEXT,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, regulation_id)
);

-- 1.6 市场分布表
CREATE TABLE IF NOT EXISTS ppe_markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES ppe_products(id) ON DELETE CASCADE,
    
    -- 市场信息
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(10),
    
    -- 市场状态
    market_status VARCHAR(50), -- approved, pending, withdrawn, banned
    entry_date DATE,
    withdrawal_date DATE,
    
    -- 本地注册信息
    local_registration_number VARCHAR(200),
    local_agent VARCHAR(300),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, country)
);

-- =====================================================
-- 二、数据采集管理表
-- =====================================================

-- 2.1 数据源配置表
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 数据源基本信息
    source_name VARCHAR(200) NOT NULL, -- FDA, EUDAMED, NMPA, PMDA, TGA, HealthCanada
    source_type VARCHAR(100), -- api, web_scraping, file_import
    jurisdiction VARCHAR(100), -- US, EU, CN, JP, AU, CA
    
    -- 连接配置
    base_url TEXT,
    api_endpoint TEXT,
    api_key_encrypted TEXT, -- 加密存储
    
    -- 采集配置
    config JSONB, -- 采集参数配置
    
    -- 状态
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 5, -- 优先级 1-10
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 采集任务表
CREATE TABLE IF NOT EXISTS collection_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 任务信息
    task_name VARCHAR(200) NOT NULL,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    
    -- 任务类型
    task_type VARCHAR(100), -- full_import, incremental_update, manual_trigger
    
    -- 任务状态
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, cancelled
    
    -- 执行信息
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- 统计信息
    records_total INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- 错误信息
    error_message TEXT,
    
    -- 执行者
    executed_by VARCHAR(100), -- system, manual, scheduled
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 采集日志表
CREATE TABLE IF NOT EXISTS collection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES collection_tasks(id) ON DELETE CASCADE,
    
    -- 日志信息
    log_level VARCHAR(20), -- info, warning, error
    message TEXT,
    details JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 三、数据治理表
-- =====================================================

-- 3.1 数据质量规则表
CREATE TABLE IF NOT EXISTS data_quality_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 规则信息
    rule_name VARCHAR(200) NOT NULL,
    rule_description TEXT,
    
    -- 适用对象
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100),
    
    -- 规则类型
    rule_type VARCHAR(100), -- completeness, validity, consistency, uniqueness, timeliness
    
    -- 规则配置
    rule_config JSONB, -- 规则参数
    
    -- 规则状态
    is_active BOOLEAN DEFAULT TRUE,
    severity VARCHAR(20) DEFAULT 'warning', -- error, warning, info
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 数据质量报告表
CREATE TABLE IF NOT EXISTS data_quality_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 报告信息
    report_name VARCHAR(200),
    report_type VARCHAR(100), -- daily, weekly, monthly, on_demand
    
    -- 统计信息
    total_records INTEGER,
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    
    -- 问题统计
    issues_by_type JSONB, -- 各类型问题数量
    issues_by_table JSONB, -- 各表问题数量
    
    -- 报告内容
    report_data JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by VARCHAR(100)
);

-- 3.3 数据清洗记录表
CREATE TABLE IF NOT EXISTS data_cleaning_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 清洗信息
    table_name VARCHAR(100) NOT NULL,
    cleaning_type VARCHAR(100), -- deduplication, standardization, validation
    
    -- 统计信息
    records_processed INTEGER,
    records_modified INTEGER,
    records_deleted INTEGER,
    
    -- 清洗详情
    cleaning_details JSONB,
    
    -- 执行者
    executed_by VARCHAR(100),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 四、预警系统表
-- =====================================================

-- 4.1 预警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 规则信息
    rule_name VARCHAR(200) NOT NULL,
    rule_description TEXT,
    
    -- 规则类型
    alert_type VARCHAR(100), -- certification_expiry, regulation_update, data_anomaly
    
    -- 触发条件
    trigger_condition JSONB, -- 触发条件配置
    
    -- 通知配置
    notification_channels TEXT[], -- email, sms, webhook, in_app
    notification_template TEXT,
    
    -- 提前预警天数
    advance_days INTEGER DEFAULT 30,
    
    -- 规则状态
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 预警记录表
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 关联信息
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    certification_id UUID REFERENCES ppe_certifications(id) ON DELETE CASCADE,
    
    -- 预警内容
    alert_title VARCHAR(300),
    alert_message TEXT,
    alert_severity VARCHAR(20), -- high, medium, low
    
    -- 状态
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, acknowledged, resolved
    
    -- 通知信息
    sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 五、用户与权限表
-- =====================================================

-- 5.1 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 基本信息
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 个人信息
    full_name VARCHAR(200),
    phone VARCHAR(100),
    
    -- 状态
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 5.2 角色表
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    role_name VARCHAR(100) UNIQUE NOT NULL,
    role_description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.3 用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, role_id)
);

-- 5.4 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(200),
    resource VARCHAR(100), -- product, manufacturer, regulation, etc.
    action VARCHAR(100), -- read, write, delete, admin
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.5 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role_id, permission_id)
);

-- =====================================================
-- 六、索引创建
-- =====================================================

-- 6.1 PPE 产品表索引
CREATE INDEX IF NOT EXISTS idx_ppe_products_category ON ppe_products(category);
CREATE INDEX IF NOT EXISTS idx_ppe_products_subcategory ON ppe_products(subcategory);
CREATE INDEX IF NOT EXISTS idx_ppe_products_manufacturer_id ON ppe_products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_ppe_products_manufacturer_country ON ppe_products(manufacturer_country);
CREATE INDEX IF NOT EXISTS idx_ppe_products_data_source ON ppe_products(data_source);
CREATE INDEX IF NOT EXISTS idx_ppe_products_created_at ON ppe_products(created_at);
CREATE INDEX IF NOT EXISTS idx_ppe_products_name_trgm ON ppe_products USING gin (product_name gin_trgm_ops);

-- 6.2 制造商表索引
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_country ON ppe_manufacturers(country);
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_business_type ON ppe_manufacturers(business_type);
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_name_trgm ON ppe_manufacturers USING gin (company_name gin_trgm_ops);

-- 6.3 认证信息表索引
CREATE INDEX IF NOT EXISTS idx_ppe_certifications_product_id ON ppe_certifications(product_id);
CREATE INDEX IF NOT EXISTS idx_ppe_certifications_type ON ppe_certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_ppe_certifications_status ON ppe_certifications(status);
CREATE INDEX IF NOT EXISTS idx_ppe_certifications_expiry_date ON ppe_certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ppe_certifications_warning ON ppe_certifications(warning_sent, expiry_date);

-- 6.4 法规标准表索引
CREATE INDEX IF NOT EXISTS idx_ppe_regulations_jurisdiction ON ppe_regulations(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_ppe_regulations_type ON ppe_regulations(regulation_type);
CREATE INDEX IF NOT EXISTS idx_ppe_regulations_is_current ON ppe_regulations(is_current);
CREATE INDEX IF NOT EXISTS idx_ppe_regulations_effective_date ON ppe_regulations(effective_date);

-- 6.5 市场分布表索引
CREATE INDEX IF NOT EXISTS idx_ppe_markets_product_id ON ppe_markets(product_id);
CREATE INDEX IF NOT EXISTS idx_ppe_markets_country ON ppe_markets(country);
CREATE INDEX IF NOT EXISTS idx_ppe_markets_status ON ppe_markets(market_status);

-- 6.6 采集任务表索引
CREATE INDEX IF NOT EXISTS idx_collection_tasks_status ON collection_tasks(status);
CREATE INDEX IF NOT EXISTS idx_collection_tasks_data_source ON collection_tasks(data_source_id);
CREATE INDEX IF NOT EXISTS idx_collection_tasks_created_at ON collection_tasks(created_at);

-- 6.7 预警记录表索引
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(alert_severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- =====================================================
-- 七、触发器创建
-- =====================================================

-- 7.1 自动更新 updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7.2 为所有表创建更新触发器
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'ppe_products', 'ppe_manufacturers', 'ppe_certifications', 
            'ppe_regulations', 'ppe_product_regulations', 'ppe_markets',
            'data_sources', 'collection_tasks', 'data_quality_rules',
            'alert_rules', 'alerts', 'users', 'roles'
        )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%s ON %s', t_name, t_name);
        EXECUTE format(
            'CREATE TRIGGER trg_update_%s BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            t_name, t_name
        );
    END LOOP;
END $$;

-- =====================================================
-- 八、初始数据插入
-- =====================================================

-- 8.1 插入默认数据源
INSERT INTO data_sources (source_name, source_type, jurisdiction, base_url, is_active, priority) VALUES
('FDA', 'web_scraping', 'US', 'https://www.accessdata.fda.gov', TRUE, 1),
('EUDAMED', 'web_scraping', 'EU', 'https://ec.europa.eu/tools/eudamed', TRUE, 1),
('NMPA', 'web_scraping', 'CN', 'https://www.nmpa.gov.cn', TRUE, 1),
('PMDA', 'web_scraping', 'JP', 'https://www.pmda.go.jp', TRUE, 2),
('TGA', 'web_scraping', 'AU', 'https://www.tga.gov.au', TRUE, 2),
('HealthCanada', 'web_scraping', 'CA', 'https://www.canada.ca/en/health-canada.html', TRUE, 2)
ON CONFLICT DO NOTHING;

-- 8.2 插入默认角色
INSERT INTO roles (role_name, role_description) VALUES
('admin', '系统管理员，拥有所有权限'),
('data_engineer', '数据工程师，负责数据采集与治理'),
('analyst', '数据分析师，负责数据分析与报告'),
('viewer', '普通用户，只读权限')
ON CONFLICT DO NOTHING;

-- 8.3 插入默认权限
INSERT INTO permissions (permission_code, permission_name, resource, action) VALUES
('product:read', '查看产品', 'product', 'read'),
('product:write', '编辑产品', 'product', 'write'),
('product:delete', '删除产品', 'product', 'delete'),
('manufacturer:read', '查看企业', 'manufacturer', 'read'),
('manufacturer:write', '编辑企业', 'manufacturer', 'write'),
('regulation:read', '查看法规', 'regulation', 'read'),
('regulation:write', '编辑法规', 'regulation', 'write'),
('collection:manage', '管理采集任务', 'collection', 'admin'),
('alert:manage', '管理预警规则', 'alert', 'admin'),
('user:manage', '管理用户', 'user', 'admin')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 九、行级安全策略 (RLS)
-- =====================================================

-- 9.1 启用 RLS
ALTER TABLE ppe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppe_manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppe_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppe_regulations ENABLE ROW LEVEL SECURITY;

-- 9.2 创建 RLS 策略 - 允许所有用户读取
CREATE POLICY "Allow public read access" ON ppe_products FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ppe_manufacturers FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ppe_certifications FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON ppe_regulations FOR SELECT USING (true);

-- 9.3 创建 RLS 策略 - 只允许服务角色写入
CREATE POLICY "Allow service role write access" ON ppe_products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role write access" ON ppe_manufacturers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role write access" ON ppe_certifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role write access" ON ppe_regulations FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 十、视图创建
-- =====================================================

-- 10.1 产品详情视图
CREATE OR REPLACE VIEW v_ppe_product_details AS
SELECT 
    p.*,
    m.company_name AS manufacturer_name,
    m.country AS manufacturer_country_code,
    COUNT(c.id) AS certification_count,
    COUNT(DISTINCT mr.country) AS market_count
FROM ppe_products p
LEFT JOIN ppe_manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN ppe_certifications c ON p.id = c.product_id AND c.status = 'active'
LEFT JOIN ppe_markets mr ON p.id = mr.product_id
GROUP BY p.id, m.company_name, m.country;

-- 10.2 即将过期认证视图
CREATE OR REPLACE VIEW v_expiring_certifications AS
SELECT 
    c.*,
    p.product_name,
    p.manufacturer_name,
    (c.expiry_date - CURRENT_DATE) AS days_until_expiry
FROM ppe_certifications c
JOIN ppe_products p ON c.product_id = p.id
WHERE c.expiry_date IS NOT NULL 
    AND c.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
    AND c.status = 'active'
ORDER BY c.expiry_date;

-- 10.3 数据质量统计视图
CREATE OR REPLACE VIEW v_data_quality_summary AS
SELECT 
    'ppe_products' AS table_name,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE data_quality_score >= 80) AS high_quality_records,
    COUNT(*) FILTER (WHERE data_quality_score BETWEEN 60 AND 79) AS medium_quality_records,
    COUNT(*) FILTER (WHERE data_quality_score < 60 OR data_quality_score IS NULL) AS low_quality_records,
    AVG(data_quality_score) AS avg_quality_score
FROM ppe_products
UNION ALL
SELECT 
    'ppe_manufacturers' AS table_name,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE data_quality_score >= 80) AS high_quality_records,
    COUNT(*) FILTER (WHERE data_quality_score BETWEEN 60 AND 79) AS medium_quality_records,
    COUNT(*) FILTER (WHERE data_quality_score < 60 OR data_quality_score IS NULL) AS low_quality_records,
    AVG(data_quality_score) AS avg_quality_score
FROM ppe_manufacturers;

-- =====================================================
-- 完成
-- =====================================================

SELECT 'Database schema v1.0 created successfully!' AS message;
