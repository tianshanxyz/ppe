-- MDLooker v6.0 数据库最小化脚本
-- 只创建绝对必需的表和索引

-- ============================================
-- 1. 启用扩展
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. 为 companies 表创建索引
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
    CREATE INDEX IF NOT EXISTS idx_companies_name_trgm 
    ON companies USING gin(name gin_trgm_ops);
    RAISE NOTICE 'companies 表索引创建完成';
  END IF;
END $$;

-- ============================================
-- 3. 只创建缺失的表 (不检查字段)
-- ============================================

-- regulations 表
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
    RAISE NOTICE 'regulations 表创建成功';
  ELSE
    RAISE NOTICE 'regulations 表已存在';
  END IF;
END $$;

-- market_entry_guides 表
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
    RAISE NOTICE 'market_entry_guides 表创建成功';
  ELSE
    RAISE NOTICE 'market_entry_guides 表已存在';
  END IF;
END $$;

-- ai_conversations 表
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
    RAISE NOTICE 'ai_conversations 表创建成功';
  ELSE
    RAISE NOTICE 'ai_conversations 表已存在';
  END IF;
END $$;

-- search_queries 表
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
    RAISE NOTICE 'search_queries 表创建成功';
  ELSE
    RAISE NOTICE 'search_queries 表已存在';
  END IF;
END $$;

-- company_relationships 表
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
    RAISE NOTICE 'company_relationships 表创建成功';
  ELSE
    RAISE NOTICE 'company_relationships 表已存在';
  END IF;
END $$;

-- ============================================
-- 4. 创建索引
-- ============================================

-- regulations 索引
CREATE INDEX IF NOT EXISTS idx_regulations_fts ON regulations USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_regulations_jurisdiction ON regulations(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_regulations_type ON regulations(type);
CREATE INDEX IF NOT EXISTS idx_regulations_effective_date ON regulations(effective_date);

-- market_entry_guides 索引
CREATE INDEX IF NOT EXISTS idx_market_entry_guides_jurisdiction ON market_entry_guides(jurisdiction);

-- ai_conversations 索引
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);

-- search_queries 索引
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- company_relationships 索引
CREATE INDEX IF NOT EXISTS idx_company_relationships_company_id ON company_relationships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_relationships_related_id ON company_relationships(related_company_id);

-- ============================================
-- 5. 启用 RLS
-- ============================================

ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_entry_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_relationships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. 创建公开读取策略
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regulations' AND policyname = 'regulations_select_policy') THEN
    CREATE POLICY regulations_select_policy ON regulations FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_entry_guides' AND policyname = 'market_entry_guides_select_policy') THEN
    CREATE POLICY market_entry_guides_select_policy ON market_entry_guides FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_relationships' AND policyname = 'company_relationships_select_policy') THEN
    CREATE POLICY company_relationships_select_policy ON company_relationships FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================
-- 7. AI 对话用户策略
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'ai_conversations_user_policy') THEN
    CREATE POLICY ai_conversations_user_policy ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'ai_conversations_insert_policy') THEN
    CREATE POLICY ai_conversations_insert_policy ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'ai_conversations_update_policy') THEN
    CREATE POLICY ai_conversations_update_policy ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 8. 搜索查询用户策略
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_queries' AND policyname = 'search_queries_user_policy') THEN
    CREATE POLICY search_queries_user_policy ON search_queries FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_queries' AND policyname = 'search_queries_insert_policy') THEN
    CREATE POLICY search_queries_insert_policy ON search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 9. 触发器函数
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. 触发器
-- ============================================

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
-- 完成
-- ============================================
SELECT '数据库最小化初始化完成！' as status;
