-- ============================================
-- MIGRATION: Add missing columns to ppe_products table
-- Date: 2026-04-24
-- ============================================

-- Add product_name column (alias for name)
ALTER TABLE ppe_products ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Add product_category column (alias for category)
ALTER TABLE ppe_products ADD COLUMN IF NOT EXISTS product_category TEXT;

-- Add manufacturer_country column
ALTER TABLE ppe_products ADD COLUMN IF NOT EXISTS manufacturer_country TEXT;

-- Add product_code column
ALTER TABLE ppe_products ADD COLUMN IF NOT EXISTS product_code TEXT;

-- Add manufacturer_name column
ALTER TABLE ppe_products ADD COLUMN IF NOT EXISTS manufacturer_name TEXT;

-- Update existing data: copy name to product_name
UPDATE ppe_products SET product_name = name WHERE product_name IS NULL;

-- Update existing data: copy category to product_category
UPDATE ppe_products SET product_category = category WHERE product_category IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ppe_products_product_name ON ppe_products(product_name);
CREATE INDEX IF NOT EXISTS idx_ppe_products_product_category ON ppe_products(product_category);
CREATE INDEX IF NOT EXISTS idx_ppe_products_manufacturer_country ON ppe_products(manufacturer_country);
CREATE INDEX IF NOT EXISTS idx_ppe_products_product_code ON ppe_products(product_code);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert sample products if table is empty
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
)
ON CONFLICT DO NOTHING;

-- ============================================
-- CREATE FUNCTION TO SYNC ALIAS COLUMNS
-- ============================================

-- Create trigger function to keep product_name in sync with name
CREATE OR REPLACE FUNCTION sync_product_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.product_name = NEW.name;
    NEW.product_category = NEW.category;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_product_name ON ppe_products;
CREATE TRIGGER trigger_sync_product_name
    BEFORE INSERT OR UPDATE ON ppe_products
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_name();
