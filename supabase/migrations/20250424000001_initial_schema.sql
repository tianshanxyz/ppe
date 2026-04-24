-- MDLooker PPE Platform - Initial Database Schema
-- Created: 2026-04-24

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE (User profiles extension)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin')),
    phone TEXT,
    country TEXT,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Public can view basic profile info"
    ON profiles FOR SELECT
    USING (true);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'company'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PPE PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ppe_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_zh TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    description_zh TEXT,
    hs_code TEXT,
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

-- Enable RLS
ALTER TABLE ppe_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Products are viewable by everyone"
    ON ppe_products FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert products"
    ON ppe_products FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Only admins can update products"
    ON ppe_products FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Indexes
CREATE INDEX idx_ppe_products_category ON ppe_products(category);
CREATE INDEX idx_ppe_products_subcategory ON ppe_products(subcategory);
CREATE INDEX idx_ppe_products_status ON ppe_products(status);
CREATE INDEX idx_ppe_products_hs_code ON ppe_products(hs_code);

-- ============================================
-- MANUFACTURERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_zh TEXT,
    description TEXT,
    country TEXT NOT NULL,
    city TEXT,
    address TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    certifications JSONB DEFAULT '[]'::jsonb,
    products_count INTEGER DEFAULT 0,
    credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 100),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'rejected')),
    logo_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Manufacturers are viewable by everyone"
    ON manufacturers FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify manufacturers"
    ON manufacturers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Indexes
CREATE INDEX idx_manufacturers_country ON manufacturers(country);
CREATE INDEX idx_manufacturers_verification ON manufacturers(verification_status);
CREATE INDEX idx_manufacturers_credit_score ON manufacturers(credit_score DESC);

-- ============================================
-- REGULATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_zh TEXT,
    description TEXT,
    description_zh TEXT,
    regulation_number TEXT,
    authority TEXT NOT NULL,
    country TEXT NOT NULL,
    category TEXT,
    effective_date DATE,
    expiry_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'draft')),
    document_url TEXT,
    related_products UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Regulations are viewable by everyone"
    ON regulations FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify regulations"
    ON regulations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Indexes
CREATE INDEX idx_regulations_country ON regulations(country);
CREATE INDEX idx_regulations_authority ON regulations(authority);
CREATE INDEX idx_regulations_status ON regulations(status);
CREATE INDEX idx_regulations_effective_date ON regulations(effective_date);

-- ============================================
-- COMPLIANCE CHECKS TABLE (User history)
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES ppe_products(id),
    product_name TEXT,
    target_market TEXT NOT NULL,
    result JSONB NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    estimated_cost DECIMAL(10, 2),
    estimated_days INTEGER,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own compliance checks"
    ON compliance_checks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own compliance checks"
    ON compliance_checks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own compliance checks"
    ON compliance_checks FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_compliance_checks_user_id ON compliance_checks(user_id);
CREATE INDEX idx_compliance_checks_created_at ON compliance_checks(created_at DESC);

-- ============================================
-- USER CERTIFICATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES ppe_products(id),
    certificate_number TEXT NOT NULL,
    certificate_type TEXT NOT NULL,
    issuing_body TEXT,
    issue_date DATE,
    expiry_date DATE,
    document_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own certificates"
    ON user_certificates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own certificates"
    ON user_certificates FOR ALL
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_certificates_user_id ON user_certificates(user_id);
CREATE INDEX idx_user_certificates_expiry ON user_certificates(expiry_date);
CREATE INDEX idx_user_certificates_status ON user_certificates(status);

-- ============================================
-- COMPLIANCE TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    related_product_id UUID REFERENCES ppe_products(id),
    related_certificate_id UUID REFERENCES user_certificates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tasks"
    ON compliance_tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks"
    ON compliance_tasks FOR ALL
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_compliance_tasks_user_id ON compliance_tasks(user_id);
CREATE INDEX idx_compliance_tasks_status ON compliance_tasks(status);
CREATE INDEX idx_compliance_tasks_due_date ON compliance_tasks(due_date);

-- ============================================
-- NEWS & UPDATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS news_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_zh TEXT,
    content TEXT NOT NULL,
    content_zh TEXT,
    summary TEXT,
    category TEXT,
    source TEXT,
    source_url TEXT,
    image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE news_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "News are viewable by everyone"
    ON news_updates FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify news"
    ON news_updates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Indexes
CREATE INDEX idx_news_updates_published_at ON news_updates(published_at DESC);
CREATE INDEX idx_news_updates_category ON news_updates(category);
CREATE INDEX idx_news_updates_featured ON news_updates(is_featured) WHERE is_featured = true;

-- ============================================
-- API KEYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    rate_limit INTEGER DEFAULT 100,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own API keys"
    ON api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own API keys"
    ON api_keys FOR ALL
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'professional', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ppe_products_updated_at
    BEFORE UPDATE ON ppe_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manufacturers_updated_at
    BEFORE UPDATE ON manufacturers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulations_updated_at
    BEFORE UPDATE ON regulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_certificates_updated_at
    BEFORE UPDATE ON user_certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_tasks_updated_at
    BEFORE UPDATE ON compliance_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert sample PPE products
INSERT INTO ppe_products (name, name_zh, category, subcategory, description, hs_code, risk_level, regulations, certifications) VALUES
('Disposable Face Mask', '一次性口罩', 'Face Protection', 'Masks', '3-ply disposable protective face mask for general use', '63079000', 'low', '["EU 2016/425", "FDA 21 CFR 878.4040"]', '["CE", "FDA"]'),
('N95 Respirator', 'N95口罩', 'Face Protection', 'Respirators', 'N95 particulate respirator for healthcare use', '63079000', 'high', '["NIOSH 42 CFR 84", "EU 2016/425"]', '["NIOSH", "CE"]'),
('Safety Helmet', '安全帽', 'Head Protection', 'Hard Hats', 'Industrial safety helmet with chin strap', '65061000', 'medium', '["EN 397", "ANSI Z89.1"]', '["CE", "ANSI"]'),
('Safety Goggles', '护目镜', 'Eye Protection', 'Goggles', 'Chemical splash resistant safety goggles', '90049000', 'medium', '["EN 166", "ANSI Z87.1"]', '["CE", "ANSI"]'),
('Protective Gloves', '防护手套', 'Hand Protection', 'Chemical Gloves', 'Nitrile chemical resistant gloves', '61161000', 'medium', '["EN 374", "ANSI/ISEA 105"]', '["CE", "ANSI"]')
ON CONFLICT DO NOTHING;

-- Insert sample manufacturers
INSERT INTO manufacturers (name, name_zh, country, city, description, certifications, credit_score, verification_status) VALUES
('3M Company', '3M公司', 'USA', 'Saint Paul', 'Global diversified technology company', '["ISO 9001", "ISO 13485"]', 95, 'verified'),
('Honeywell International', '霍尼韦尔', 'USA', 'Charlotte', 'Multinational conglomerate', '["ISO 9001", "CE"]', 92, 'verified'),
('Ansell Limited', '安思尔', 'Australia', 'Richmond', 'Global leader in protection solutions', '["ISO 9001", "ISO 13485"]', 88, 'verified'),
('Alpha Pro Tech', '阿尔法', 'Canada', 'Markham', 'Protective apparel manufacturer', '["ISO 9001"]', 78, 'verified')
ON CONFLICT DO NOTHING;

-- Insert sample regulations
INSERT INTO regulations (title, title_zh, authority, country, category, regulation_number, effective_date, status) VALUES
('Regulation (EU) 2016/425 on personal protective equipment', '欧盟个人防护装备法规', 'European Commission', 'EU', 'PPE', 'EU 2016/425', '2018-04-21', 'active'),
('FDA 21 CFR 878.4040 - Surgical apparel', 'FDA外科服装法规', 'FDA', 'USA', 'Medical Devices', '21 CFR 878.4040', '1976-01-01', 'active'),
('GB 2626-2019 - Respiratory protective equipment', '中国呼吸防护标准', 'SAMR', 'China', 'PPE', 'GB 2626-2019', '2020-07-01', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample news
INSERT INTO news_updates (title, content, summary, category, source, is_featured, tags) VALUES
('EU Updates PPE Regulation Guidance', 'The European Commission has released updated guidance on the application of Regulation (EU) 2016/425...', 'New guidance document published for PPE regulation', 'Regulatory Update', 'European Commission', true, '{"EU", "PPE", "Regulation"}'),
('FDA Issues Emergency Use Authorization for New Respirators', 'The FDA has issued EUAs for several new N95 respirator models...', 'New respirator models approved under EUA', 'FDA Update', 'FDA', false, '{"FDA", "N95", "Respirator"}')
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPLETION
-- ============================================
SELECT 'Database schema created successfully!' as status;
