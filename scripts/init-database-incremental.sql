-- MDLooker v6.0 数据库增量更新脚本
-- 此脚本会检查现有结构，只添加缺失的部分

-- ============================================
-- 1. 启用必要的扩展
-- ============================================

-- 启用 pg_trgm 扩展 (用于模糊搜索)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 启用 uuid-ossp 扩展 (用于生成 UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. 为现有 companies 表创建索引
-- ============================================

-- 为 companies 表创建 trigram 索引
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    CREATE INDEX IF NOT EXISTS idx_companies_name_trgm 
    ON companies USING gin(name gin_trgm_ops);
  END IF;
END $$;

-- ============================================
-- 3. 检查并创建 companies_enhanced 表
-- ============================================

DO $$
BEGIN
  -- 如果表不存在，创建表
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies_enhanced') THEN
    CREATE TABLE companies_enhanced (
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
    
    RAISE NOTICE '创建 companies_enhanced 表成功';
  ELSE
    RAISE NOTICE 'companies_enhanced 表已存在，跳过创建';
  END IF;
END $$;

-- 为 companies_enhanced 表创建索引
CREATE INDEX IF NOT EXISTS idx_companies_enhanced_company_id ON companies_enhanced(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_enhanced_legal_name_trgm ON companies_enhanced USING gin(legal_name gin_trgm_ops);

-- ============================================
-- 4. 检查并创建 regulations 表
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'regulations') THEN
    CREATE TABLE regulations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      title_zh VARCHAR(500),
      jurisdiction VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
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
    RAISE NOTICE '创建 regulations 表成功';
  ELSE
    RAISE NOTICE 'regulations 表已存在，跳过创建';
  END IF;
END $$;

-- 为 regulations 表创建索引
CREATE INDEX IF NOT EXISTS idx_regulations_fts ON regulations USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_regulations_jurisdiction ON regulations(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_regulations_type ON regulations(type);
CREATE INDEX IF NOT EXISTS idx_regulations_effective_date ON regulations(effective_date);

-- ============================================
-- 5. 检查并创建 market_entry_guides 表
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_entry_guides') THEN
    CREATE TABLE market_entry_guides (
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
    RAISE NOTICE '创建 market_entry_guides 表成功';
  ELSE
    RAISE NOTICE 'market_entry_guides 表已存在，跳过创建';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_market_entry_guides_jurisdiction ON market_entry_guides(jurisdiction);

-- ============================================
-- 6. 检查并创建 ai_conversations 表
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_conversations') THEN
    CREATE TABLE ai_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id),
      session_id VARCHAR(100),
      messages JSONB NOT NULL,
      context JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE '创建 ai_conversations 表成功';
  ELSE
    RAISE NOTICE 'ai_conversations 表已存在，跳过创建';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);

-- ============================================
-- 7. 检查并创建 search_queries 表
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_queries') THEN
    CREATE TABLE search_queries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id),
      query TEXT NOT NULL,
      filters JSONB,
      results_count INTEGER,
      clicked_results UUID[],
      created_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE '创建 search_queries 表成功';
  ELSE
    RAISE NOTICE 'search_queries 表已存在，跳过创建';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- ============================================
-- 8. 检查并创建 company_relationships 表
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_relationships') THEN
    CREATE TABLE company_relationships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES companies(id),
      related_company_id UUID REFERENCES companies(id),
      relationship_type VARCHAR(50),
      confidence_score DECIMAL(5,4),
      created_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE '创建 company_relationships 表成功';
  ELSE
    RAISE NOTICE 'company_relationships 表已存在，跳过创建';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_company_relationships_company_id ON company_relationships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_relationships_related_id ON company_relationships(related_company_id);

-- ============================================
-- 9. 启用 RLS (行级安全)
-- ============================================

ALTER TABLE companies_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_entry_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_relationships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. 创建 RLS 策略 (检查是否存在)
-- ============================================

-- companies_enhanced 公开读取策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies_enhanced' AND policyname = '公开读取企业扩展信息') THEN
    CREATE POLICY "公开读取企业扩展信息" ON companies_enhanced FOR SELECT USING (true);
  END IF;
END $$;

-- regulations 公开读取策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regulations' AND policyname = '公开读取法规') THEN
    CREATE POLICY "公开读取法规" ON regulations FOR SELECT USING (true);
  END IF;
END $$;

-- market_entry_guides 公开读取策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_entry_guides' AND policyname = '公开读取市场指南') THEN
    CREATE POLICY "公开读取市场指南" ON market_entry_guides FOR SELECT USING (true);
  END IF;
END $$;

-- company_relationships 公开读取策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_relationships' AND policyname = '公开读取企业关联') THEN
    CREATE POLICY "公开读取企业关联" ON company_relationships FOR SELECT USING (true);
  END IF;
END $$;

-- ai_conversations 用户策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = '用户读取自己的对话') THEN
    CREATE POLICY "用户读取自己的对话" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = '用户插入自己的对话') THEN
    CREATE POLICY "用户插入自己的对话" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = '用户更新自己的对话') THEN
    CREATE POLICY "用户更新自己的对话" ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- search_queries 用户策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_queries' AND policyname = '用户读取自己的搜索记录') THEN
    CREATE POLICY "用户读取自己的搜索记录" ON search_queries FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_queries' AND policyname = '用户插入自己的搜索记录') THEN
    CREATE POLICY "用户插入自己的搜索记录" ON search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 11. 创建触发器函数
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. 为各表添加触发器 (检查是否存在)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_enhanced_updated_at') THEN
    CREATE TRIGGER update_companies_enhanced_updated_at
      BEFORE UPDATE ON companies_enhanced
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_regulations_updated_at') THEN
    CREATE TRIGGER update_regulations_updated_at
      BEFORE UPDATE ON regulations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_market_entry_guides_updated_at') THEN
    CREATE TRIGGER update_market_entry_guides_updated_at
      BEFORE UPDATE ON market_entry_guides
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_conversations_updated_at') THEN
    CREATE TRIGGER update_ai_conversations_updated_at
      BEFORE UPDATE ON ai_conversations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================
-- 13. 创建或替换视图
-- ============================================

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
-- 完成
-- ============================================
SELECT '数据库增量更新完成！' as status;
