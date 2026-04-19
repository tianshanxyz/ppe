-- MDLooker v6.0 数据库初始化脚本
-- 执行此脚本以配置 PostgreSQL 扩展和索引

-- ============================================
-- 1. 启用必要的扩展
-- ============================================

-- 启用 pg_trgm 扩展 (用于模糊搜索)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 启用 uuid-ossp 扩展 (用于生成 UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. 创建模糊搜索索引
-- ============================================

-- 为 companies 表创建 trigram 索引 (假设 name 字段存在)
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm 
ON companies USING gin(name gin_trgm_ops);

-- 注意：legal_name 字段在 companies_enhanced 表中，不在 companies 表中
-- 为 companies_enhanced 表创建 trigram 索引 (表会在后面创建)
-- 索引将在表创建后自动创建

-- ============================================
-- 3. 创建新表结构
-- ============================================

-- 创建企业扩展表
CREATE TABLE IF NOT EXISTS companies_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  legal_name VARCHAR(255),
  registration_number VARCHAR(100),
  address TEXT,
  website VARCHAR(255),
  founded_date DATE,
  company_type VARCHAR(50),
  employee_count_range VARCHAR(50),
  annual_revenue_range VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建法规表
CREATE TABLE IF NOT EXISTS regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  title_zh VARCHAR(500),
  jurisdiction VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- law, regulation, guidance, standard
  category VARCHAR(100),
  effective_date DATE,
  last_updated DATE,
  content TEXT,
  keywords TEXT[],
  attachments JSONB,
  related_regulations UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建市场准入指南表
CREATE TABLE IF NOT EXISTS market_entry_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction VARCHAR(100) NOT NULL,
  overview TEXT,
  document_checklist JSONB,
  process_flow JSONB,
  timeline_estimate JSONB,
  cost_estimate JSONB,
  faq JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建 AI 对话记录表
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(100),
  messages JSONB NOT NULL,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建搜索查询记录表
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  clicked_results UUID[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建企业关联表
CREATE TABLE IF NOT EXISTS company_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  related_company_id UUID REFERENCES companies(id),
  relationship_type VARCHAR(50), -- parent, subsidiary, same_group, etc.
  confidence_score DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. 创建全文搜索索引
-- ============================================

-- 为 regulations 表创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_regulations_fts 
ON regulations USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- ============================================
-- 5. 创建常用查询索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_regulations_jurisdiction ON regulations(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_regulations_type ON regulations(type);
CREATE INDEX IF NOT EXISTS idx_regulations_effective_date ON regulations(effective_date);
CREATE INDEX IF NOT EXISTS idx_companies_enhanced_company_id ON companies_enhanced(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_enhanced_legal_name_trgm ON companies_enhanced USING gin(legal_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_market_entry_guides_jurisdiction ON market_entry_guides(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_company_relationships_company_id ON company_relationships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_relationships_related_id ON company_relationships(related_company_id);

-- ============================================
-- 6. 创建行级安全策略 (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE companies_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_entry_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_relationships ENABLE ROW LEVEL SECURITY;

-- 创建公开读取策略
CREATE POLICY "公开读取企业扩展信息" ON companies_enhanced
  FOR SELECT USING (true);

CREATE POLICY "公开读取法规" ON regulations
  FOR SELECT USING (true);

CREATE POLICY "公开读取市场指南" ON market_entry_guides
  FOR SELECT USING (true);

CREATE POLICY "公开读取企业关联" ON company_relationships
  FOR SELECT USING (true);

-- 用户只能读取自己的对话记录
CREATE POLICY "用户读取自己的对话" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户插入自己的对话" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户更新自己的对话" ON ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能读取自己的搜索记录
CREATE POLICY "用户读取自己的搜索记录" ON search_queries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户插入自己的搜索记录" ON search_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. 创建触发器 (自动更新 updated_at)
-- ============================================

-- 创建通用触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加触发器
CREATE TRIGGER update_companies_enhanced_updated_at
  BEFORE UPDATE ON companies_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulations_updated_at
  BEFORE UPDATE ON regulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_entry_guides_updated_at
  BEFORE UPDATE ON market_entry_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. 创建视图
-- ============================================

-- 创建企业完整信息视图
CREATE OR REPLACE VIEW companies_full AS
SELECT 
  c.*,
  ce.legal_name,
  ce.registration_number,
  ce.address,
  ce.website,
  ce.founded_date,
  ce.company_type,
  ce.employee_count_range,
  ce.annual_revenue_range,
  ce.description as enhanced_description
FROM companies c
LEFT JOIN companies_enhanced ce ON c.id = ce.company_id;

-- ============================================
-- 完成提示
-- ============================================
SELECT '数据库初始化完成！' as status;
