-- =====================================================
-- MDLooker PPE 数据库索引优化
-- 创建时间: 2026-04-19
-- =====================================================

-- 1. 产品表索引
CREATE INDEX IF NOT EXISTS idx_products_name ON ppe_products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON ppe_products(category);
CREATE INDEX IF NOT EXISTS idx_products_model ON ppe_products(model);
CREATE INDEX IF NOT EXISTS idx_products_country ON ppe_products(country_of_origin);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON ppe_products(manufacturer_id);

-- 2. 制造商表索引
CREATE INDEX IF NOT EXISTS idx_manufacturers_name ON ppe_manufacturers(name);
CREATE INDEX IF NOT EXISTS idx_manufacturers_country ON ppe_manufacturers(country);

-- 3. 复合索引（用于常见查询场景）
CREATE INDEX IF NOT EXISTS idx_products_category_name ON ppe_products(category, name);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_country ON ppe_products(manufacturer_id, country_of_origin);

-- 4. 更新时间索引（用于增量同步）
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON ppe_products(updated_at);
CREATE INDEX IF NOT EXISTS idx_manufacturers_updated_at ON ppe_manufacturers(updated_at);

-- 5. 验证索引创建成功
SELECT 
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND tablename IN ('ppe_products', 'ppe_manufacturers')
ORDER BY 
    tablename, indexname;
