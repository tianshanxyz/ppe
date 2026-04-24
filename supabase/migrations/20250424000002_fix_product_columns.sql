-- ============================================
-- MIGRATION: Fix ppe_products table columns
-- Date: 2026-04-24
-- ============================================

-- 首先检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS ppe_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_zh TEXT,
    category TEXT NOT NULL,
    product_name TEXT,
    product_category TEXT,
    subcategory TEXT,
    description TEXT,
    description_zh TEXT,
    hs_code TEXT,
    manufacturer_country TEXT,
    product_code TEXT,
    manufacturer_name TEXT,
    regulations JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    standards JSONB DEFAULT '[]'::jsonb,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    image_url TEXT,
    manufacturer_id UUID,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 添加缺失的列（如果表已存在）
ALTER TABLE ppe_products 
    ADD COLUMN IF NOT EXISTS product_name TEXT,
    ADD COLUMN IF NOT EXISTS product_category TEXT,
    ADD COLUMN IF NOT EXISTS manufacturer_country TEXT,
    ADD COLUMN IF NOT EXISTS product_code TEXT,
    ADD COLUMN IF NOT EXISTS manufacturer_name TEXT,
    ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high'));

-- 更新现有数据：将 name 复制到 product_name
UPDATE ppe_products 
SET product_name = name 
WHERE product_name IS NULL OR product_name = '';

-- 更新现有数据：将 category 复制到 product_category
UPDATE ppe_products 
SET product_category = category 
WHERE product_category IS NULL OR product_category = '';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ppe_products_product_name ON ppe_products(product_name);
CREATE INDEX IF NOT EXISTS idx_ppe_products_product_category ON ppe_products(product_category);
CREATE INDEX IF NOT EXISTS idx_ppe_products_manufacturer_country ON ppe_products(manufacturer_country);
CREATE INDEX IF NOT EXISTS idx_ppe_products_product_code ON ppe_products(product_code);

-- 插入示例数据（仅在表为空时）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ppe_products LIMIT 1) THEN
        INSERT INTO ppe_products (
            id, name, product_name, category, product_category, description, 
            manufacturer_country, product_code, manufacturer_name, risk_level, status
        ) VALUES 
        (
            gen_random_uuid(),
            'Safety Work Boots - Steel Toe',
            'Safety Work Boots - Steel Toe',
            'Safety Footwear',
            'Safety Footwear',
            'Steel toe safety boots for construction and industrial use',
            'China',
            'SWB-001',
            'SafeStep Manufacturing',
            'medium',
            'active'
        ),
        (
            gen_random_uuid(),
            'Chemical Resistant Gloves',
            'Chemical Resistant Gloves',
            'Safety Gloves',
            'Safety Gloves',
            'Nitrile chemical resistant gloves for laboratory use',
            'Germany',
            'CRG-002',
            'ChemSafe GmbH',
            'high',
            'active'
        ),
        (
            gen_random_uuid(),
            'Construction Safety Helmet',
            'Construction Safety Helmet',
            'Safety Helmets',
            'Safety Helmets',
            'Hard hat with chin strap for construction sites',
            'China',
            'CSH-003',
            'HeadGuard Industries',
            'medium',
            'active'
        ),
        (
            gen_random_uuid(),
            'Anti-Fog Safety Goggles',
            'Anti-Fog Safety Goggles',
            'Eye Protection',
            'Eye Protection',
            'Clear anti-fog safety goggles for chemical splash protection',
            'USA',
            'AFSG-004',
            'VisionSafe Corp',
            'medium',
            'active'
        ),
        (
            gen_random_uuid(),
            'Ear Protection Earmuffs',
            'Ear Protection Earmuffs',
            'Hearing Protection',
            'Hearing Protection',
            'Noise reduction earmuffs for industrial environments',
            'China',
            'EPE-005',
            'HearSafe Manufacturing',
            'low',
            'active'
        ),
        (
            gen_random_uuid(),
            'N95 Respirator Mask',
            'N95 Respirator Mask',
            'Respiratory Protection',
            'Respiratory Protection',
            'N95 particulate respirator for dust and particle protection',
            'China',
            'N95-006',
            'BreatheSafe Ltd',
            'high',
            'active'
        );
    END IF;
END $$;

-- 创建触发器函数，自动同步 name 和 product_name
CREATE OR REPLACE FUNCTION sync_product_aliases()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果 name 改变，同步到 product_name
    IF NEW.name IS DISTINCT FROM OLD.name OR NEW.product_name IS NULL THEN
        NEW.product_name = NEW.name;
    END IF;
    
    -- 如果 category 改变，同步到 product_category
    IF NEW.category IS DISTINCT FROM OLD.category OR NEW.product_category IS NULL THEN
        NEW.product_category = NEW.category;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_sync_product_name ON ppe_products;

-- 创建新触发器
DROP TRIGGER IF EXISTS trigger_sync_product_aliases ON ppe_products;
CREATE TRIGGER trigger_sync_product_aliases
    BEFORE INSERT OR UPDATE ON ppe_products
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_aliases();
