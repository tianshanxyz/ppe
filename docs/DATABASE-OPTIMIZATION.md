# 数据库优化指南

## 索引优化建议

### 核心表索引

#### 1. products (all_products) 表

```sql
-- 搜索优化索引
CREATE INDEX IF NOT EXISTS idx_products_name_search ON all_products USING gin(product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_company_search ON all_products USING gin(company_name gin_trgm_ops);

-- 过滤优化索引
CREATE INDEX IF NOT EXISTS idx_products_market ON all_products(market);
CREATE INDEX IF NOT EXISTS idx_products_device_class ON all_products(device_class);
CREATE INDEX IF NOT EXISTS idx_products_status ON all_products(status);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON all_products(company_id);

-- 复合索引（常用查询组合）
CREATE INDEX IF NOT EXISTS idx_products_market_class ON all_products(market, device_class);
CREATE INDEX IF NOT EXISTS idx_products_market_status ON all_products(market, status);
CREATE INDEX IF NOT EXISTS idx_products_market_company ON all_products(market, company_id);

-- 时间排序索引
CREATE INDEX IF NOT EXISTS idx_products_created_at ON all_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON all_products(updated_at DESC);
```

#### 2. companies 表

```sql
-- 搜索优化索引
CREATE INDEX IF NOT EXISTS idx_companies_name_search ON companies USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_legal_name_search ON companies USING gin(legal_name gin_trgm_ops);

-- 过滤优化索引
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_market ON companies(market);

-- 复合索引
CREATE INDEX IF NOT EXISTS idx_companies_country_market ON companies(country, market);
```

#### 3. certifications 表

```sql
-- 外键索引
CREATE INDEX IF NOT EXISTS idx_certifications_product_id ON certifications(product_id);
CREATE INDEX IF NOT EXISTS idx_certifications_company_id ON certifications(company_id);

-- 过滤索引
CREATE INDEX IF NOT EXISTS idx_certifications_type ON certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON certifications(expiry_date);
```

#### 4. search_logs 表（如果有）

```sql
-- 时间范围查询索引
CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp ON search_logs(created_at DESC);

-- 用户行为分析索引
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(search_query);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
```

## 查询优化

### 1. 搜索查询优化

#### 优化前（慢）
```sql
SELECT * FROM all_products 
WHERE product_name ILIKE '%mask%' 
  AND market = 'FDA';
```

#### 优化后（快）
```sql
-- 使用 gin_trgm_ops 索引
SELECT * FROM all_products 
WHERE product_name ILIKE '%mask%' 
  AND market = 'FDA'
LIMIT 100;

-- 或者使用全文搜索
SELECT * FROM all_products 
WHERE to_tsvector('english', product_name) @@ to_tsquery('mask')
  AND market = 'FDA';
```

### 2. 分页查询优化

#### 优化前（慢）
```sql
SELECT * FROM all_products 
WHERE market = 'FDA'
ORDER BY created_at DESC
OFFSET 10000 LIMIT 20;
```

#### 优化后（快）
```sql
-- 使用键集分页
SELECT * FROM all_products 
WHERE market = 'FDA' 
  AND created_at < '2024-01-01 00:00:00'
ORDER BY created_at DESC
LIMIT 20;
```

### 3. 关联查询优化

#### 优化前（慢）
```sql
SELECT p.*, c.name as company_name
FROM all_products p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.market = 'FDA'
  AND c.country = 'United States';
```

#### 优化后（快）
```sql
-- 确保有适当的索引
SELECT p.*, c.name as company_name
FROM all_products p
LEFT JOIN companies c ON p.company_id = c.id
  AND c.country = 'United States'
WHERE p.market = 'FDA'
LIMIT 100;
```

## 缓存策略

### 1. 查询结果缓存

```typescript
// 使用 Redis 缓存热门查询
const cacheKey = `search:products:${query}:${market}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await supabase
  .from('all_products')
  .select('*')
  .ilike('product_name', `%${query}%`)
  .eq('market', market)
  .limit(100);

// 缓存 5 分钟
await redis.setex(cacheKey, 300, JSON.stringify(result));
```

### 2. 计数缓存

```sql
-- 创建物化视图缓存统计数据
CREATE MATERIALIZED VIEW mv_market_stats AS
SELECT 
  market,
  COUNT(*) as product_count,
  COUNT(DISTINCT company_id) as company_count
FROM all_products
GROUP BY market;

-- 定期刷新
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_market_stats;
```

## 性能监控

### 1. 慢查询监控

```sql
-- 启用 pg_stat_statements 扩展
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 查询最慢的 SQL
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. 索引使用情况

```sql
-- 查看索引使用统计
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 3. 表大小统计

```sql
-- 查看表大小
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 最佳实践

### 1. 查询编写

- ✅ 使用 LIMIT 限制结果数量
- ✅ 只选择需要的列，避免 SELECT *
- ✅ 使用参数化查询防止 SQL 注入
- ✅ 使用 EXPLAIN 分析查询计划
- ❌ 避免在 WHERE 子句中对列使用函数
- ❌ 避免大事务
- ❌ 避免 N+1 查询问题

### 2. 索引创建

- ✅ 为频繁查询的 WHERE 条件列创建索引
- ✅ 为 JOIN 条件列创建索引
- ✅ 为 ORDER BY 列创建索引
- ✅ 考虑使用复合索引
- ❌ 避免在低基数列上创建索引
- ❌ 避免创建过多索引（影响写入性能）
- ❌ 定期删除未使用的索引

### 3. 连接池配置

```typescript
// Supabase 连接池配置
const config = {
  max: 20, // 最大连接数
  min: 5,  // 最小连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

### 4. 数据分区

对于大数据量表，考虑按时间或市场分区：

```sql
-- 示例：按市场分区
CREATE TABLE products_fda (
  CHECK (market = 'FDA')
) INHERITS (all_products);

CREATE TABLE products_eudamed (
  CHECK (market = 'EUDAMED')
) INHERITS (all_products);
```

## 性能基准

### 目标性能指标

| 查询类型 | 目标响应时间 | 警告阈值 |
|----------|-------------|----------|
| 简单查询 | < 50ms | > 100ms |
| 复杂搜索 | < 200ms | > 500ms |
| 关联查询 | < 300ms | > 1000ms |
| 聚合查询 | < 500ms | > 2000ms |

### 监控指标

- QPS (Queries Per Second)
- 平均响应时间
- P95/P99 响应时间
- 缓存命中率
- 连接池使用率

## 参考资源

- [PostgreSQL 官方文档 - 索引](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase 性能优化指南](https://supabase.com/docs/guides/database/database-performance)
- [PostgreSQL EXPLAIN 详解](https://www.postgresql.org/docs/current/using-explain.html)
