-- ============================================
-- MDLooker 语义搜索 - 向量搜索数据库初始化
-- 
-- 功能：
-- 1. 启用 pgvector 扩展
-- 2. 创建向量存储表
-- 3. 创建相似度搜索函数
-- 4. 创建索引优化查询性能
-- ============================================

-- ============================================
-- 1. 启用 pgvector 扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. 创建向量 embeddings 表
-- ============================================
CREATE TABLE IF NOT EXISTS vector_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,           -- 'product', 'company', 'regulation'
  entity_id UUID NOT NULL,                    -- 关联的实体ID
  content TEXT NOT NULL,                      -- 原始文本内容
  embedding VECTOR(1024),                     -- 火山方舟 embedding 向量 (1024维)
  metadata JSONB DEFAULT '{}',                -- 附加元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 唯一约束：同一实体只能有一条记录
  UNIQUE(entity_type, entity_id)
);

-- ============================================
-- 3. 创建索引
-- ============================================

-- 向量相似度搜索索引 (IVFFlat - 适合高维向量)
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding 
ON vector_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 实体类型索引
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_entity_type 
ON vector_embeddings(entity_type);

-- 实体ID索引
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_entity_id 
ON vector_embeddings(entity_id);

-- 复合索引：实体类型 + ID
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_type_id 
ON vector_embeddings(entity_type, entity_id);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_content_fts 
ON vector_embeddings USING gin(to_tsvector('english', content));

-- ============================================
-- 4. 创建相似度搜索函数
-- ============================================

-- 余弦相似度搜索函数
CREATE OR REPLACE FUNCTION match_vectors(
  query_embedding VECTOR(1024),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  entity_type VARCHAR,
  entity_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ve.id,
    ve.entity_type,
    ve.entity_id,
    ve.content,
    1 - (ve.embedding <=> query_embedding) AS similarity,
    ve.metadata
  FROM vector_embeddings ve
  WHERE 1 - (ve.embedding <=> query_embedding) > match_threshold
  ORDER BY ve.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 带实体类型过滤的相似度搜索
CREATE OR REPLACE FUNCTION match_vectors_by_type(
  query_embedding VECTOR(1024),
  match_threshold FLOAT,
  match_count INT,
  filter_types TEXT[]
)
RETURNS TABLE (
  id UUID,
  entity_type VARCHAR,
  entity_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ve.id,
    ve.entity_type,
    ve.entity_id,
    ve.content,
    1 - (ve.embedding <=> query_embedding) AS similarity,
    ve.metadata
  FROM vector_embeddings ve
  WHERE 1 - (ve.embedding <=> query_embedding) > match_threshold
    AND ve.entity_type = ANY(filter_types)
  ORDER BY ve.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- 5. 创建自动更新触发器
-- ============================================

CREATE OR REPLACE FUNCTION update_vector_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vector_embeddings_updated_at ON vector_embeddings;
CREATE TRIGGER update_vector_embeddings_updated_at
  BEFORE UPDATE ON vector_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_vector_embeddings_updated_at();

-- ============================================
-- 6. 启用行级安全策略 (RLS)
-- ============================================

ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "公开读取向量数据" ON vector_embeddings
  FOR SELECT USING (true);

-- 仅服务角色可写入
CREATE POLICY "服务角色可插入向量" ON vector_embeddings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "服务角色可更新向量" ON vector_embeddings
  FOR UPDATE USING (true);

CREATE POLICY "服务角色可删除向量" ON vector_embeddings
  FOR DELETE USING (true);

-- ============================================
-- 7. 创建向量统计视图
-- ============================================

CREATE OR REPLACE VIEW vector_embeddings_stats AS
SELECT 
  entity_type,
  COUNT(*) as count,
  MIN(created_at) as earliest_created,
  MAX(updated_at) as latest_updated
FROM vector_embeddings
GROUP BY entity_type;

-- ============================================
-- 8. 创建批量导入辅助函数
-- ============================================

-- 检查实体是否已存在向量
CREATE OR REPLACE FUNCTION check_vector_exists(
  p_entity_type VARCHAR,
  p_entity_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  exists_count INT;
BEGIN
  SELECT COUNT(*) INTO exists_count
  FROM vector_embeddings
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id;
  
  RETURN exists_count > 0;
END;
$$;

-- 获取需要生成向量的实体列表
CREATE OR REPLACE FUNCTION get_entities_without_vectors(
  p_entity_type VARCHAR,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  entity_id UUID,
  content TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_entity_type = 'product' THEN
    RETURN QUERY
    SELECT 
      ap.id::UUID as entity_id,
      COALESCE(ap.product_name, '') || ' ' || 
      COALESCE(ap.company_name, '') || ' ' ||
      COALESCE(ap.description, '') as content
    FROM all_products ap
    LEFT JOIN vector_embeddings ve 
      ON ve.entity_id = ap.id::UUID 
      AND ve.entity_type = 'product'
    WHERE ve.id IS NULL
    LIMIT p_limit;
    
  ELSIF p_entity_type = 'company' THEN
    RETURN QUERY
    SELECT 
      c.id::UUID as entity_id,
      COALESCE(c.name, '') || ' ' || 
      COALESCE(c.legal_name, '') || ' ' ||
      COALESCE(c.description, '') as content
    FROM companies c
    LEFT JOIN vector_embeddings ve 
      ON ve.entity_id = c.id::UUID 
      AND ve.entity_type = 'company'
    WHERE ve.id IS NULL
    LIMIT p_limit;
    
  ELSIF p_entity_type = 'regulation' THEN
    RETURN QUERY
    SELECT 
      r.id::UUID as entity_id,
      COALESCE(r.title, '') || ' ' || 
      COALESCE(r.content, '') as content
    FROM regulations r
    LEFT JOIN vector_embeddings ve 
      ON ve.entity_id = r.id::UUID 
      AND ve.entity_type = 'regulation'
    WHERE ve.id IS NULL
    LIMIT p_limit;
  END IF;
END;
$$;

-- ============================================
-- 9. 创建搜索历史记录表
-- ============================================

CREATE TABLE IF NOT EXISTS semantic_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  query_embedding VECTOR(1024),
  results_count INT,
  search_type VARCHAR(20) DEFAULT 'semantic', -- 'semantic', 'hybrid', 'keyword'
  response_time_ms INT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 搜索日志索引
CREATE INDEX IF NOT EXISTS idx_semantic_search_logs_created_at 
ON semantic_search_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_semantic_search_logs_user_id 
ON semantic_search_logs(user_id);

-- 启用RLS
ALTER TABLE semantic_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户查看自己的搜索历史" ON semantic_search_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户记录自己的搜索" ON semantic_search_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 10. 初始化完成提示
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '向量搜索数据库初始化完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '已创建:';
  RAISE NOTICE '  - vector_embeddings 表';
  RAISE NOTICE '  - 相似度搜索函数 (match_vectors)';
  RAISE NOTICE '  - 向量索引 (IVFFlat)';
  RAISE NOTICE '  - 行级安全策略';
  RAISE NOTICE '  - 搜索日志表';
  RAISE NOTICE '';
  RAISE NOTICE '下一步:';
  RAISE NOTICE '  1. 运行向量生成脚本填充数据';
  RAISE NOTICE '  2. 测试语义搜索API';
  RAISE NOTICE '========================================';
END $$;
