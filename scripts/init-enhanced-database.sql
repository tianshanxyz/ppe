-- ============================================
-- MDLooker 增强版数据库初始化脚本
-- 
-- 任务D-001: 完善PPE产品数据模型
-- 任务D-002: 扩展制造商档案模型  
-- 任务D-003: 设计数据同步状态表
-- 创建时间: 2026-04-20
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 用于模糊搜索

-- ============================================
-- 1. 增强版产品表
-- ============================================

CREATE TABLE IF NOT EXISTS ppe_products_enhanced (
    -- 基础信息
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(500) NOT NULL,
    product_name_zh VARCHAR(500),
    product_code VARCHAR(100),
    product_category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    ppe_category VARCHAR(10) CHECK (ppe_category IN ('I', 'II', 'III')),
    
    -- 详细描述
    description TEXT,
    description_zh TEXT,
    intended_use TEXT[],
    target_users TEXT[],
    
    -- 技术规格 (JSONB存储结构化数据)
    specifications JSONB DEFAULT '{}',
    
    -- 产品特性
    features JSONB DEFAULT '{}',
    
    -- 图片资源
    images JSONB DEFAULT '{}',
    
    -- 制造商信息
    manufacturer_id UUID,
    manufacturer_name VARCHAR(500),
    manufacturer_name_zh VARCHAR(500),
    manufacturer_address TEXT,
    manufacturer_country VARCHAR(100),
    brand_name VARCHAR(200),
    
    -- 认证详情 (JSONB存储完整结构化数据)
    certifications JSONB DEFAULT '{}',
    
    -- 目标市场
    target_markets TEXT[],
    market_approvals JSONB DEFAULT '[]',
    
    -- 注册状态
    registration_status VARCHAR(50) DEFAULT 'active' 
        CHECK (registration_status IN ('active', 'expired', 'suspended', 'cancelled', 'pending')),
    
    -- 适用法规和标准
    applicable_regulations TEXT[],
    harmonized_standards JSONB DEFAULT '[]',
    
    -- 风险分类
    risk_classification VARCHAR(100),
    
    -- 基本要求合规
    essential_requirements JSONB DEFAULT '[]',
    
    -- 性能指标
    performance_metrics JSONB DEFAULT '[]',
    
    -- 测试报告
    test_reports JSONB DEFAULT '[]',
    
    -- 时间戳
    approval_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- 数据质量
    data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    data_completeness JSONB DEFAULT '{}',
    
    -- 搜索优化
    search_vector TSVECTOR,
    
    -- 索引
    CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date >= approval_date)
);

-- 产品表索引
CREATE INDEX idx_products_name ON ppe_products_enhanced USING gin(product_name gin_trgm_ops);
CREATE INDEX idx_products_category ON ppe_products_enhanced(product_category);
CREATE INDEX idx_products_manufacturer ON ppe_products_enhanced(manufacturer_id);
CREATE INDEX idx_products_country ON ppe_products_enhanced(manufacturer_country);
CREATE INDEX idx_products_status ON ppe_products_enhanced(registration_status);
CREATE INDEX idx_products_markets ON ppe_products_enhanced USING gin(target_markets);
CREATE INDEX idx_products_sync ON ppe_products_enhanced(last_sync_at);
CREATE INDEX idx_products_search ON ppe_products_enhanced USING gin(search_vector);

-- 产品表GIN索引（用于JSONB查询）
CREATE INDEX idx_products_certifications ON ppe_products_enhanced USING gin(certifications);
CREATE INDEX idx_products_specs ON ppe_products_enhanced USING gin(specifications);

-- ============================================
-- 2. 增强版制造商表
-- ============================================

CREATE TABLE IF NOT EXISTS ppe_manufacturers_enhanced (
    -- 基础信息
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(500) NOT NULL,
    company_name_en VARCHAR(500),
    company_name_zh VARCHAR(500),
    
    -- 公司注册信息
    registration_info JSONB DEFAULT '{}',
    
    -- 地址信息
    headquarters_address JSONB DEFAULT '{}',
    
    -- 联系方式
    contact JSONB DEFAULT '{}',
    
    -- 业务类型
    business_type VARCHAR(50) 
        CHECK (business_type IN ('manufacturer', 'distributor', 'agent', 'retailer', 'oem')),
    
    -- 公司规模
    company_size JSONB DEFAULT '{}',
    
    -- 生产能力
    capabilities JSONB DEFAULT '{}',
    
    -- 公司描述
    description TEXT,
    description_zh TEXT,
    
    -- 信用评分 (JSONB存储完整评分数据)
    credit_score JSONB DEFAULT '{}',
    
    -- 合规统计
    compliance_stats JSONB DEFAULT '{}',
    
    -- 关联企业
    related_companies JSONB DEFAULT '[]',
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    
    -- 数据验证
    data_verified BOOLEAN DEFAULT false,
    verification_date DATE,
    data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    
    -- 搜索优化
    search_vector TSVECTOR
);

-- 制造商表索引
CREATE INDEX idx_manufacturers_name ON ppe_manufacturers_enhanced USING gin(company_name gin_trgm_ops);
CREATE INDEX idx_manufacturers_country ON ppe_manufacturers_enhanced USING gin((headquarters_address->>'country'));
CREATE INDEX idx_manufacturers_type ON ppe_manufacturers_enhanced(business_type);
CREATE INDEX idx_manufacturers_sync ON ppe_manufacturers_enhanced(last_sync_at);
CREATE INDEX idx_manufacturers_search ON ppe_manufacturers_enhanced USING gin(search_vector);
CREATE INDEX idx_manufacturers_credit ON ppe_manufacturers_enhanced USING gin((credit_score->>'overall_score'));

-- ============================================
-- 3. 数据同步状态表
-- ============================================

CREATE TABLE IF NOT EXISTS data_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source VARCHAR(50) NOT NULL 
        CHECK (data_source IN ('fda', 'eudamed', 'nmpa', 'ukca', 'pmda', 'health_canada', 'tga', 'other')),
    source_name VARCHAR(200) NOT NULL,
    
    -- 同步配置
    sync_config JSONB DEFAULT '{}',
    
    -- 同步状态
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(50) 
        CHECK (last_sync_status IN ('success', 'failed', 'running', 'pending')),
    last_sync_duration_ms INTEGER,
    last_sync_records_count INTEGER,
    
    -- 错误信息
    last_error JSONB DEFAULT '{}',
    
    -- 统计信息
    stats JSONB DEFAULT '{}',
    
    -- 健康度
    health_status VARCHAR(50) DEFAULT 'healthy' 
        CHECK (health_status IN ('healthy', 'degraded', 'unhealthy')),
    health_check_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 唯一约束
    UNIQUE(data_source)
);

-- 同步状态表索引
CREATE INDEX idx_sync_status_source ON data_sync_status(data_source);
CREATE INDEX idx_sync_status_health ON data_sync_status(health_status);
CREATE INDEX idx_sync_status_last ON data_sync_status(last_sync_at);

-- ============================================
-- 4. 产品-制造商关联表（支持多对多关系）
-- ============================================

CREATE TABLE IF NOT EXISTS product_manufacturer_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES ppe_products_enhanced(id) ON DELETE CASCADE,
    manufacturer_id UUID REFERENCES ppe_manufacturers_enhanced(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) DEFAULT 'manufacturer' 
        CHECK (relation_type IN ('manufacturer', 'distributor', 'oem', 'supplier')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, manufacturer_id, relation_type)
);

CREATE INDEX idx_pm_relations_product ON product_manufacturer_relations(product_id);
CREATE INDEX idx_pm_relations_manufacturer ON product_manufacturer_relations(manufacturer_id);

-- ============================================
-- 5. 数据变更历史表
-- ============================================

CREATE TABLE IF NOT EXISTS data_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL 
        CHECK (entity_type IN ('product', 'manufacturer', 'regulation')),
    entity_id UUID NOT NULL,
    change_type VARCHAR(50) 
        CHECK (change_type IN ('create', 'update', 'delete')),
    changed_fields JSONB DEFAULT '{}',
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    changed_by VARCHAR(200),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_change_history_entity ON data_change_history(entity_type, entity_id);
CREATE INDEX idx_change_history_time ON data_change_history(created_at);

-- ============================================
-- 6. 搜索日志表
-- ============================================

CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    query_type VARCHAR(50) DEFAULT 'keyword' 
        CHECK (query_type IN ('keyword', 'semantic', 'advanced', 'natural_language')),
    filters JSONB DEFAULT '{}',
    results_count INTEGER,
    user_id UUID,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_search_logs_query ON search_logs USING gin(query gin_trgm_ops);
CREATE INDEX idx_search_logs_time ON search_logs(created_at);
CREATE INDEX idx_search_logs_user ON search_logs(user_id);

-- ============================================
-- 7. 用户收藏表
-- ============================================

CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    entity_type VARCHAR(50) 
        CHECK (entity_type IN ('product', 'manufacturer', 'regulation')),
    entity_id UUID NOT NULL,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_favorites_entity ON user_favorites(entity_type, entity_id);

-- ============================================
-- 8. 用户监控预警表
-- ============================================

CREATE TABLE IF NOT EXISTS user_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    alert_name VARCHAR(200) NOT NULL,
    alert_type VARCHAR(50) 
        CHECK (alert_type IN ('product_change', 'manufacturer_change', 'regulation_change', 'certification_expiry', 'new_competitor')),
    entity_type VARCHAR(50),
    entity_id UUID,
    conditions JSONB DEFAULT '{}',
    notification_channels TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON user_alerts(user_id);
CREATE INDEX idx_alerts_type ON user_alerts(alert_type);
CREATE INDEX idx_alerts_active ON user_alerts(is_active);

-- ============================================
-- 9. 自动更新触发器
-- ============================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间戳触发器
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON ppe_products_enhanced 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manufacturers_updated_at 
    BEFORE UPDATE ON ppe_manufacturers_enhanced 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_status_updated_at 
    BEFORE UPDATE ON data_sync_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at 
    BEFORE UPDATE ON user_alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. 搜索向量更新触发器
-- ============================================

-- 产品搜索向量生成函数
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.product_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.manufacturer_name, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.target_markets, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 制造商搜索向量生成函数
CREATE OR REPLACE FUNCTION update_manufacturer_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.company_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.headquarters_address->>'country', '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 添加搜索向量触发器
CREATE TRIGGER update_product_search 
    BEFORE INSERT OR UPDATE ON ppe_products_enhanced 
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

CREATE TRIGGER update_manufacturer_search 
    BEFORE INSERT OR UPDATE ON ppe_manufacturers_enhanced 
    FOR EACH ROW EXECUTE FUNCTION update_manufacturer_search_vector();

-- ============================================
-- 11. 数据变更历史记录触发器
-- ============================================

CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO data_change_history (
            entity_type, entity_id, change_type, 
            changed_fields, old_values, new_values
        ) VALUES (
            'product', NEW.id, 'update',
            (
                SELECT jsonb_object_agg(key, true)
                FROM jsonb_each(to_jsonb(NEW))
                WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key
            ),
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO data_change_history (
            entity_type, entity_id, change_type, old_values
        ) VALUES ('product', OLD.id, 'delete', to_jsonb(OLD));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_product_changes_trigger
    AFTER UPDATE OR DELETE ON ppe_products_enhanced
    FOR EACH ROW EXECUTE FUNCTION log_product_changes();

-- ============================================
-- 12. 初始化数据同步状态
-- ============================================

INSERT INTO data_sync_status (data_source, source_name, sync_config, last_sync_status) VALUES
('fda', 'FDA 510(k) Database', '{"sync_type": "incremental", "sync_frequency": "daily"}', 'pending'),
('eudamed', 'EU EUDAMED Database', '{"sync_type": "incremental", "sync_frequency": "daily"}', 'pending'),
('nmpa', 'China NMPA Database', '{"sync_type": "incremental", "sync_frequency": "weekly"}', 'pending'),
('ukca', 'UK MHRA Database', '{"sync_type": "incremental", "sync_frequency": "weekly"}', 'pending'),
('pmda', 'Japan PMDA Database', '{"sync_type": "incremental", "sync_frequency": "weekly"}', 'pending'),
('health_canada', 'Health Canada MDALL', '{"sync_type": "incremental", "sync_frequency": "weekly"}', 'pending'),
('tga', 'Australia TGA ARTG', '{"sync_type": "incremental", "sync_frequency": "weekly"}', 'pending')
ON CONFLICT (data_source) DO NOTHING;

-- ============================================
-- 13. 创建视图（方便查询）
-- ============================================

-- 产品完整信息视图
CREATE OR REPLACE VIEW v_products_full AS
SELECT 
    p.*,
    m.company_name as manufacturer_company_name,
    m.credit_score->>'overall_score' as manufacturer_credit_score,
    m.credit_score->>'risk_level' as manufacturer_risk_level
FROM ppe_products_enhanced p
LEFT JOIN ppe_manufacturers_enhanced m ON p.manufacturer_id = m.id;

-- 制造商完整信息视图
CREATE OR REPLACE VIEW v_manufacturers_full AS
SELECT 
    m.*,
    COUNT(p.id) as total_products,
    COUNT(CASE WHEN p.registration_status = 'active' THEN 1 END) as active_products
FROM ppe_manufacturers_enhanced m
LEFT JOIN ppe_products_enhanced p ON p.manufacturer_id = m.id
GROUP BY m.id;

-- ============================================
-- 完成
-- ============================================

SELECT 'Enhanced database schema created successfully!' as status;
