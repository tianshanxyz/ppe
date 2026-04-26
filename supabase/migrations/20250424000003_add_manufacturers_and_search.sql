-- ============================================
-- MIGRATION: Add manufacturers table and search improvements
-- Date: 2026-04-24
-- ============================================

-- ============================================
-- CREATE PPE_MANUFACTURERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ppe_manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    company_name_zh TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    contact_person TEXT,
    business_type TEXT[], -- ['manufacturer', 'trader', 'distributor']
    product_categories TEXT[],
    certifications TEXT[], -- ['ISO9001', 'CE', 'FDA']
    credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 100),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    registration_number TEXT,
    year_established INTEGER,
    employee_count TEXT, -- '1-50', '51-200', '201-500', '500+'
    annual_revenue TEXT,
    main_markets TEXT[], -- ['EU', 'US', 'Asia']
    description TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE ppe_manufacturers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Manufacturers are viewable by everyone"
    ON ppe_manufacturers FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create manufacturers"
    ON ppe_manufacturers FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update manufacturers"
    ON ppe_manufacturers FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_company_name ON ppe_manufacturers(company_name);
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_country ON ppe_manufacturers(country);
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_credit_score ON ppe_manufacturers(credit_score);
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_status ON ppe_manufacturers(status);
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_verified ON ppe_manufacturers(verified);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_search 
ON ppe_manufacturers USING gin(to_tsvector('english', company_name || ' ' || COALESCE(description, '')));

-- Insert sample manufacturers
INSERT INTO ppe_manufacturers (
    id, company_name, company_name_zh, country, city, 
    business_type, product_categories, certifications,
    credit_score, risk_level, year_established, employee_count,
    main_markets, description, status, verified
) VALUES 
(
    gen_random_uuid(),
    'SafeStep Manufacturing Co., Ltd.',
    '安全步伐制造有限公司',
    'China',
    'Shenzhen',
    ARRAY['manufacturer'],
    ARRAY['Safety Footwear', 'Safety Gloves'],
    ARRAY['ISO9001', 'CE', 'FDA'],
    85,
    'low',
    2005,
    '201-500',
    ARRAY['EU', 'US', 'Asia'],
    'Leading manufacturer of safety footwear and gloves with 18+ years experience.',
    'active',
    true
),
(
    gen_random_uuid(),
    'ChemSafe GmbH',
    NULL,
    'Germany',
    'Munich',
    ARRAY['manufacturer', 'distributor'],
    ARRAY['Safety Gloves', 'Chemical Protection'],
    ARRAY['ISO9001', 'CE', 'ISO14001'],
    92,
    'low',
    1998,
    '500+',
    ARRAY['EU', 'US'],
    'German manufacturer specializing in chemical resistant PPE.',
    'active',
    true
),
(
    gen_random_uuid(),
    'HeadGuard Industries',
    '头部防护工业公司',
    'China',
    'Shanghai',
    ARRAY['manufacturer'],
    ARRAY['Safety Helmets', 'Eye Protection'],
    ARRAY['CE', 'ANSI'],
    78,
    'medium',
    2010,
    '51-200',
    ARRAY['Asia', 'Africa'],
    'Professional safety helmet and eye protection manufacturer.',
    'active',
    false
),
(
    gen_random_uuid(),
    'VisionSafe Corp',
    NULL,
    'USA',
    'Chicago',
    ARRAY['manufacturer', 'trader'],
    ARRAY['Eye Protection', 'Face Protection'],
    ARRAY['ANSI', 'OSHA', 'CE'],
    88,
    'low',
    2002,
    '201-500',
    ARRAY['US', 'EU', 'Canada'],
    'American leader in eye and face protection equipment.',
    'active',
    true
),
(
    gen_random_uuid(),
    'HearSafe Manufacturing',
    '听力安全防护制造',
    'China',
    'Guangzhou',
    ARRAY['manufacturer'],
    ARRAY['Hearing Protection'],
    ARRAY['CE', 'ANSI'],
    72,
    'medium',
    2015,
    '1-50',
    ARRAY['Asia'],
    'Specialized in hearing protection devices.',
    'active',
    false
),
(
    gen_random_uuid(),
    'BreatheSafe Ltd',
    NULL,
    'UK',
    'Manchester',
    ARRAY['manufacturer', 'distributor'],
    ARRAY['Respiratory Protection'],
    ARRAY['CE', 'ISO13485'],
    90,
    'low',
    2008,
    '51-200',
    ARRAY['EU', 'UK', 'US'],
    'UK-based respiratory protection specialist.',
    'active',
    true
);

-- ============================================
-- CREATE SEARCH SUGGESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS search_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword TEXT NOT NULL UNIQUE,
    category TEXT, -- 'product', 'manufacturer', 'regulation', 'general'
    search_count INTEGER DEFAULT 1,
    last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Search suggestions are viewable by everyone"
    ON search_suggestions FOR SELECT
    USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_suggestions_keyword ON search_suggestions(keyword);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_category ON search_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_count ON search_suggestions(search_count DESC);

-- Insert sample search suggestions
INSERT INTO search_suggestions (keyword, category, search_count) VALUES
('safety boots', 'product', 156),
('N95 mask', 'product', 142),
('chemical gloves', 'product', 98),
('CE certification', 'regulation', 87),
('FDA registration', 'regulation', 76),
('safety helmet', 'product', 65),
('ear protection', 'product', 54),
('China manufacturer', 'manufacturer', 132),
('German supplier', 'manufacturer', 45),
('PPE export', 'general', 89),
('EN 388', 'regulation', 43),
('ANSI Z87.1', 'regulation', 38),
('safety goggles', 'product', 67),
('work gloves', 'product', 51),
('respirator', 'product', 44)
ON CONFLICT (keyword) DO NOTHING;

-- ============================================
-- CREATE SEARCH FUNCTION WITH FUZZY MATCHING
-- ============================================

-- Function to search products with fuzzy matching
CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT,
    category_filter TEXT DEFAULT NULL,
    country_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    product_name TEXT,
    category TEXT,
    product_category TEXT,
    description TEXT,
    manufacturer_country TEXT,
    manufacturer_name TEXT,
    risk_level TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.product_name,
        p.category,
        p.product_category,
        p.description,
        p.manufacturer_country,
        p.manufacturer_name,
        p.risk_level,
        GREATEST(
            similarity(p.product_name, search_query),
            similarity(p.name, search_query),
            similarity(COALESCE(p.description, ''), search_query),
            similarity(COALESCE(p.product_category, ''), search_query)
        ) as similarity
    FROM ppe_products p
    WHERE 
        -- Fuzzy match on multiple fields
        (p.product_name % search_query
        OR p.name % search_query
        OR p.description ILIKE '%' || search_query || '%'
        OR p.product_category ILIKE '%' || search_query || '%'
        OR p.product_name ILIKE '%' || search_query || '%')
        -- Apply filters
        AND (category_filter IS NULL OR p.product_category = category_filter)
        AND (country_filter IS NULL OR p.manufacturer_country = country_filter)
        AND p.status = 'active'
    ORDER BY similarity DESC, p.product_name
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to search manufacturers with fuzzy matching
CREATE OR REPLACE FUNCTION search_manufacturers(
    search_query TEXT,
    country_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    company_name TEXT,
    country TEXT,
    business_type TEXT[],
    product_categories TEXT[],
    credit_score INTEGER,
    risk_level TEXT,
    verified BOOLEAN,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.company_name,
        m.country,
        m.business_type,
        m.product_categories,
        m.credit_score,
        m.risk_level,
        m.verified,
        GREATEST(
            similarity(m.company_name, search_query),
            similarity(COALESCE(m.description, ''), search_query),
            similarity(COALESCE(m.city, ''), search_query)
        ) as similarity
    FROM ppe_manufacturers m
    WHERE 
        -- Fuzzy match on multiple fields
        (m.company_name % search_query
        OR m.description ILIKE '%' || search_query || '%'
        OR m.company_name ILIKE '%' || search_query || '%'
        OR m.city ILIKE '%' || search_query || '%')
        -- Apply filters
        AND (country_filter IS NULL OR m.country = country_filter)
        AND m.status = 'active'
    ORDER BY 
        m.verified DESC,
        similarity DESC,
        m.credit_score DESC NULLS LAST
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
    partial_query TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    keyword TEXT,
    category TEXT,
    search_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.keyword,
        s.category,
        s.search_count
    FROM search_suggestions s
    WHERE 
        s.keyword ILIKE '%' || partial_query || '%'
    ORDER BY 
        s.search_count DESC,
        similarity(s.keyword, partial_query) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to record search (for analytics)
CREATE OR REPLACE FUNCTION record_search(
    search_keyword TEXT,
    search_category TEXT DEFAULT 'general'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO search_suggestions (keyword, category, search_count)
    VALUES (search_keyword, search_category, 1)
    ON CONFLICT (keyword) 
    DO UPDATE SET 
        search_count = search_suggestions.search_count + 1,
        last_searched = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_ppe_products_name_trgm ON ppe_products USING gin(product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ppe_manufacturers_name_trgm ON ppe_manufacturers USING gin(company_name gin_trgm_ops);

-- ============================================
-- INSERT 3M AND OTHER WELL-KNOWN BRAND DATA
-- ============================================

-- Insert 3M as a manufacturer
INSERT INTO ppe_manufacturers (
    id, company_name, company_name_zh, country, city,
    business_type, product_categories, certifications,
    credit_score, risk_level, year_established, employee_count,
    main_markets, description, status, verified
) VALUES
(
    gen_random_uuid(),
    '3M Company',
    '3M公司',
    'USA',
    'Saint Paul',
    ARRAY['manufacturer', 'distributor'],
    ARRAY['Respiratory Protection', 'Eye Protection', 'Hearing Protection', 'Face Protection'],
    ARRAY['ISO9001', 'ISO13485', 'CE', 'NIOSH', 'FDA'],
    95,
    'low',
    1902,
    '500+',
    ARRAY['US', 'EU', 'Asia'],
    'Global diversified technology company, leading manufacturer of PPE including respirators, safety glasses, and hearing protection.',
    'active',
    true
),
(
    gen_random_uuid(),
    'Honeywell International',
    '霍尼韦尔国际',
    'USA',
    'Charlotte',
    ARRAY['manufacturer', 'distributor'],
    ARRAY['Safety Gloves', 'Safety Footwear', 'Respiratory Protection', 'Eye Protection'],
    ARRAY['ISO9001', 'CE', 'ANSI'],
    92,
    'low',
    1885,
    '500+',
    ARRAY['US', 'EU', 'Asia'],
    'Multinational conglomerate producing safety equipment and PPE.',
    'active',
    true
)
ON CONFLICT DO NOTHING;

-- Insert 3M and Honeywell products
INSERT INTO ppe_products (
    id, name, product_name, category, product_category, description,
    manufacturer_country, product_code, manufacturer_name, risk_level, status
) VALUES
(
    gen_random_uuid(),
    '3M 8210 N95 Particulate Respirator',
    '3M 8210 N95 Particulate Respirator',
    'Respiratory Protection',
    'Respiratory Protection',
    '3M N95 disposable particulate respirator, filters at least 95% of airborne particles. NIOSH approved.',
    'USA',
    '3M-8210',
    '3M Company',
    'high',
    'active'
),
(
    gen_random_uuid(),
    '3M 1860 N95 Health Care Particulate Respirator and Surgical Mask',
    '3M 1860 N95 Health Care Particulate Respirator and Surgical Mask',
    'Respiratory Protection',
    'Respiratory Protection',
    '3M N95 healthcare respirator designed to help provide respiratory protection for the wearer. FDA cleared for use as a surgical mask.',
    'USA',
    '3M-1860',
    '3M Company',
    'high',
    'active'
),
(
    gen_random_uuid(),
    '3M SecureFit Safety Glasses SF400',
    '3M SecureFit Safety Glasses SF400',
    'Eye Protection',
    'Eye Protection',
    '3M secure fit safety glasses with anti-fog lens and adjustable temples. ANSI Z87.1+ certified.',
    'USA',
    '3M-SF400',
    '3M Company',
    'medium',
    'active'
),
(
    gen_random_uuid(),
    '3M Peltor X5A Over-the-Head Earmuff',
    '3M Peltor X5A Over-the-Head Earmuff',
    'Hearing Protection',
    'Hearing Protection',
    '3M Peltor X Series over-the-head earmuff with NRR 31 dB noise reduction rating.',
    'USA',
    '3M-X5A',
    '3M Company',
    'medium',
    'active'
),
(
    gen_random_uuid(),
    'Honeywell North 7700 Half-Mask Respirator',
    'Honeywell North 7700 Half-Mask Respirator',
    'Respiratory Protection',
    'Respiratory Protection',
    'Honeywell North half-mask respirator made of soft, non-allergenic silicone. NIOSH approved.',
    'USA',
    'HN-7700',
    'Honeywell International',
    'high',
    'active'
),
(
    gen_random_uuid(),
    'Honeywell Maxiflex Comfort Gloves',
    'Honeywell Maxiflex Comfort Gloves',
    'Safety Gloves',
    'Safety Gloves',
    'Honeywell Maxiflex nitrile coated work gloves for general purpose and light manufacturing.',
    'USA',
    'HN-MF',
    'Honeywell International',
    'low',
    'active'
)
ON CONFLICT DO NOTHING;
