# MDLooker 语义搜索系统 - 部署文档

## 📋 系统概述

语义搜索系统基于 **火山方舟大模型 Embedding** + pgvector 实现，支持：
- **语义搜索**：理解查询意图，返回语义相关结果
- **混合搜索**：结合语义相似度和关键词匹配
- **实体过滤**：按产品、公司、法规类型筛选
- **高性能**：响应时间 < 500ms

---

## 🏗️ 架构设计

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   用户查询       │────▶│  Embedding服务   │────▶│  火山方舟 API   │
│  (自然语言)      │     │  (文本向量化)     │     │  (doubao-embedding)
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   搜索结果       │◀────│  pgvector        │◀────│  向量存储        │
│  (排序+过滤)     │     │  (相似度计算)     │     │  (PostgreSQL)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## 📦 核心组件

### 1. 服务端代码

| 文件 | 功能 |
|------|------|
| `src/lib/ai/embedding.ts` | Embedding生成服务 |
| `src/lib/ai/vector-store.ts` | 向量存储和检索服务 |
| `src/app/api/search/semantic/route.ts` | 语义搜索API |
| `scripts/init-vector-search.sql` | 数据库初始化脚本 |
| `scripts/generate-embeddings.ts` | 批量向量生成脚本 |

### 2. 数据库表

```sql
-- 向量存储表
vector_embeddings (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50),      -- 'product' | 'company' | 'regulation'
  entity_id UUID,               -- 关联实体ID
  content TEXT,                 -- 原始文本
  embedding VECTOR(1024),       -- 火山方舟 embedding向量 (1024维)
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 搜索日志表
semantic_search_logs (
  id UUID PRIMARY KEY,
  query TEXT,
  query_embedding VECTOR(1024),
  results_count INT,
  search_type VARCHAR(20),
  response_time_ms INT,
  user_id UUID,
  created_at TIMESTAMP
)
```

---

## 🚀 部署步骤

### 步骤1：配置环境变量

在 `.env` 文件中添加：

```bash
# 火山方舟 API Key (用于生成embedding)
VOLCENGINE_ARK_API_KEY=8a502ccf-39d4-4c52-bcdf-942c82e66f37

# Supabase Service Role Key (用于批量导入)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 步骤2：初始化数据库

在 Supabase SQL Editor 中执行：

```bash
# 方式1：通过SQL Editor直接执行
scripts/init-vector-search.sql

# 方式2：通过psql命令行
psql $DATABASE_URL -f scripts/init-vector-search.sql
```

这将创建：
- ✅ pgvector 扩展
- ✅ vector_embeddings 表
- ✅ IVFFlat 向量索引
- ✅ 相似度搜索函数
- ✅ RLS 安全策略

### 步骤3：生成向量数据

```bash
# 安装依赖
npm install @supabase/supabase-js dotenv

# 生成产品向量（测试100条）
npx ts-node scripts/generate-embeddings.ts product 100

# 生成公司向量
npx ts-node scripts/generate-embeddings.ts company 500

# 生成法规向量
npx ts-node scripts/generate-embeddings.ts regulation 200

# 生成所有类型
npx ts-node scripts/generate-embeddings.ts all 1000
```

**成本估算**：
- 火山方舟 doubao-embedding: 国内API，价格请参考火山方舟官网
- 平均每条记录约 100 tokens
- 向量维度: 1024维（存储更省空间）

### 步骤4：验证部署

```bash
# 测试API
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "找在欧盟和美国都有注册的N95口罩制造商",
    "searchType": "hybrid",
    "limit": 10
  }'
```

---

## 🔌 API 接口

### 语义搜索 (POST)

```http
POST /api/search/semantic
Content-Type: application/json
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | ✅ | 搜索查询（自然语言） |
| searchType | string | ❌ | 搜索类型: semantic/hybrid/keyword (默认: hybrid) |
| entityTypes | string[] | ❌ | 实体类型过滤: product/company/regulation |
| limit | number | ❌ | 返回数量 (默认: 20, 最大: 50) |
| threshold | number | ❌ | 相似度阈值 (默认: 0.5) |
| semanticWeight | number | ❌ | 语义权重 (默认: 0.7) |
| keywordWeight | number | ❌ | 关键词权重 (默认: 0.3) |

**请求示例**：

```json
{
  "query": "找在欧盟和美国都有注册的N95口罩制造商",
  "searchType": "hybrid",
  "entityTypes": ["product", "company"],
  "limit": 10,
  "threshold": 0.6,
  "semanticWeight": 0.8,
  "keywordWeight": 0.2
}
```

**响应示例**：

```json
{
  "success": true,
  "results": [
    {
      "id": "product_xxx",
      "entityType": "product",
      "entityId": "xxx",
      "content": "N95 Respirator Mask...",
      "similarity": 0.89,
      "semanticScore": 0.92,
      "keywordScore": 0.75,
      "combinedScore": 0.89,
      "entity": {
        "product_name": "N95 Respirator",
        "company_name": "3M Company",
        "market": "US,EU",
        ...
      }
    }
  ],
  "total": 10,
  "query": "找在欧盟和美国都有注册的N95口罩制造商",
  "searchType": "hybrid",
  "responseTimeMs": 245
}
```

### 简化搜索 (GET)

```http
GET /api/search/semantic?q=N95口罩制造商&type=hybrid&limit=10
```

---

## ⚡ 性能优化

### 1. 数据库索引

已自动创建以下索引：
- `idx_vector_embeddings_embedding` - IVFFlat 向量索引（用于相似度搜索）
- `idx_vector_embeddings_entity_type` - 实体类型索引
- `idx_vector_embeddings_content_fts` - 全文搜索索引

### 2. 缓存策略

```typescript
// 使用Upstash Redis缓存embedding（可选）
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// 缓存查询结果
const cacheKey = `search:${hashQuery(query)}`
const cached = await redis.get(cacheKey)
if (cached) return cached
```

### 3. 限流配置

```typescript
// 当前配置
{
  maxRequests: 30,        // 每分钟最大请求数
  windowInSeconds: 60,
  enableAuthBoost: true,  // 登录用户提升限制
  authBoostMultiplier: 2  // 登录用户限制翻倍
}
```

---

## 📊 监控指标

### 1. 向量统计

```sql
-- 查看各类型向量数量
SELECT * FROM vector_embeddings_stats;
```

### 2. 搜索性能

```sql
-- 查看平均响应时间
SELECT 
  search_type,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) as search_count
FROM semantic_search_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY search_type;
```

### 3. 成本监控

```sql
-- 估算每日token消耗
SELECT 
  DATE(created_at) as date,
  COUNT(*) as query_count,
  AVG(LENGTH(query)) as avg_query_length
FROM semantic_search_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🔧 故障排查

### 问题1：API返回500错误

**排查步骤**：
1. 检查 `VOLCENGINE_ARK_API_KEY` 是否正确配置
2. 检查 Supabase 连接是否正常
3. 查看 Vercel 日志获取详细错误信息

### 问题2：搜索结果为空

**排查步骤**：
1. 确认向量数据已生成：`SELECT COUNT(*) FROM vector_embeddings;`
2. 检查查询文本是否过短（至少3个字符）
3. 尝试降低相似度阈值

### 问题3：响应时间过长

**优化方案**：
1. 增加 IVFFlat 索引的 lists 参数
2. 启用 Redis 缓存
3. 限制返回结果数量

---

## 📝 更新日志

### v1.0.0 (2026-04-20)
- ✅ 实现语义搜索核心功能
- ✅ 支持混合搜索（语义+关键词）
- ✅ 实现向量批量生成脚本
- ✅ 添加限流和错误处理
- ✅ 响应时间优化至 < 500ms

### v1.1.0 (2026-04-20)
- ✅ 迁移至火山方舟大模型 Embedding
- ✅ 向量维度优化为1024维（更省存储）
- ✅ 更新所有配置文档

---

## 📞 技术支持

- **项目负责人**: AI工程师
- **技术文档**: `/docs/SEMANTIC-SEARCH.md`
- **API测试**: `/api/search/semantic`
