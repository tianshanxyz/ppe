# MDLooker API 文档

完整的 API 接口文档，包含所有端点、请求/响应格式和使用示例。

## 基础信息

**Base URL**: `https://mdlooker.com/api`

**API Version**: `v1`

**认证方式**: API Key (部分端点需要)

**速率限制**: 
- 未认证：100 请求/小时
- 已认证：1000 请求/小时

## 认证

### API Key 认证

在请求头中添加 API Key：

```http
Authorization: Bearer YOUR_API_KEY
```

### 获取 API Key

1. 登录 MDLooker 账户
2. 进入设置 > API 访问
3. 生成新的 API Key

## 端点

### 健康检查

#### `GET /api/health`

检查 API 服务状态。

**请求示例**:
```bash
curl https://mdlooker.com/api/health
```

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "checks": {
    "database_connected": true,
    "redis_connected": true,
    "environment_valid": true
  }
}
```

**响应字段**:
- `status`: 服务状态 (healthy/degraded/unhealthy)
- `timestamp`: 检查时间戳
- `version`: API 版本
- `uptime`: 运行时间（秒）
- `checks`: 各项健康检查状态

---

### 搜索

#### `GET /api/search`

搜索医疗器械和公司数据。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| q | string | 是 | 搜索关键词 | `mask` |
| type | string | 否 | 搜索类型 (all/product/company) | `product` |
| market | string | 否 | 市场过滤 (可多选) | `fda,eudamed` |
| deviceClass | string | 否 | 器械类别 | `Class II` |
| limit | number | 否 | 每页数量 (1-100) | `20` |
| offset | number | 否 | 偏移量 | `0` |

**请求示例**:
```bash
curl "https://mdlooker.com/api/search?q=mask&type=product&market=fda&limit=20"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod-123",
        "name": "Surgical Mask Type I",
        "company_name": "3M Healthcare",
        "market": "FDA",
        "device_class": "Class II",
        "product_code": "DXN",
        "status": "active",
        "registration_number": "K123456",
        "created_at": "2023-01-15T00:00:00Z",
        "updated_at": "2024-01-10T00:00:00Z",
        "data_source": "local"
      }
    ],
    "companies": [
      {
        "id": "comp-456",
        "name": "3M Healthcare",
        "legal_name": "3M Healthcare Company",
        "registration_number": "REG-2023-001",
        "country": "United States",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2024-01-05T00:00:00Z",
        "data_source": "local"
      }
    ]
  },
  "pagination": {
    "limit": 20,
    "total": 150
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "查询长度必须在 1-200 字符之间"
}
```

---

### 产品

#### `GET /api/products`

获取产品列表。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| market | string | 否 | 市场过滤 | `fda` |
| deviceClass | string | 否 | 器械类别 | `Class II` |
| companyId | string | 否 | 公司 ID | `comp-123` |
| limit | number | 否 | 每页数量 | `20` |
| offset | number | 否 | 偏移量 | `0` |

**请求示例**:
```bash
curl "https://mdlooker.com/api/products?market=fda&deviceClass=Class%20II"
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-123",
      "product_name": "Surgical Mask",
      "company_name": "3M Healthcare",
      "company_id": "comp-456",
      "market": "FDA",
      "device_class": "Class II",
      "product_code": "DXN",
      "status": "active",
      "registration_number": "K123456",
      "created_at": "2023-01-15T00:00:00Z",
      "updated_at": "2024-01-10T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 500
  }
}
```

---

#### `GET /api/products/:id`

获取单个产品详情。

**请求示例**:
```bash
curl "https://mdlooker.com/api/products/prod-123"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "prod-123",
    "product_name": "Surgical Mask Type I",
    "company_name": "3M Healthcare",
    "company_id": "comp-456",
    "market": "FDA",
    "device_class": "Class II",
    "product_code": "DXN",
    "status": "active",
    "registration_number": "K123456",
    "description": "Single-use surgical mask for medical procedures",
    "indications": "For general surgical use",
    "created_at": "2023-01-15T00:00:00Z",
    "updated_at": "2024-01-10T00:00:00Z",
    "certifications": [
      {
        "type": "CE",
        "number": "CE-2023-001",
        "issued_date": "2023-01-10",
        "expiry_date": "2028-01-10"
      }
    ]
  }
}
```

---

### 公司

#### `GET /api/companies`

获取公司列表。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| country | string | 否 | 国家过滤 | `United States` |
| market | string | 否 | 市场过滤 | `fda` |
| limit | number | 否 | 每页数量 | `20` |
| offset | number | 否 | 偏移量 | `0` |

**请求示例**:
```bash
curl "https://mdlooker.com/api/companies?country=United%20States"
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "comp-456",
      "name": "3M Healthcare",
      "legal_name": "3M Healthcare Company",
      "registration_number": "REG-2023-001",
      "country": "United States",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2024-01-05T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 100
  }
}
```

---

#### `GET /api/companies/:id`

获取单个公司详情。

**请求示例**:
```bash
curl "https://mdlooker.com/api/companies/comp-456"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "comp-456",
    "name": "3M Healthcare",
    "legal_name": "3M Healthcare Company",
    "registration_number": "REG-2023-001",
    "country": "United States",
    "address": "123 Medical Way, Minneapolis, MN",
    "website": "https://www.3m.com/healthcare",
    "phone": "+1-800-123-4567",
    "email": "healthcare@3m.com",
    "products_count": 150,
    "certifications_count": 45,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2024-01-05T00:00:00Z",
    "products": [
      {
        "id": "prod-123",
        "name": "Surgical Mask Type I",
        "market": "FDA",
        "device_class": "Class II"
      }
    ]
  }
}
```

---

### 报告

#### `POST /api/reports/generate`

生成报告。

**请求体**:
```json
{
  "type": "company",
  "entityId": "comp-456",
  "format": "pdf",
  "includeSections": ["overview", "products", "certifications"]
}
```

**请求字段**:
| 字段 | 类型 | 必填 | 说明 | 可选值 |
|------|------|------|------|--------|
| type | string | 是 | 报告类型 | company/product/comparison |
| entityId | string | 是 | 实体 ID | - |
| format | string | 是 | 导出格式 | pdf/excel/csv/json |
| includeSections | array | 否 | 包含的章节 | overview/products/certifications/market_access |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "reportId": "rpt-789",
    "downloadUrl": "https://mdlooker.com/api/reports/download/rpt-789",
    "expiresAt": "2024-01-16T10:30:00Z"
  },
  "message": "报告生成成功"
}
```

---

#### `GET /api/reports/download/:id`

下载报告。

**请求示例**:
```bash
curl "https://mdlooker.com/api/reports/download/rpt-789" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**响应**: 文件下载

---

### 数据同步

#### `POST /api/sync/medplum`

触发 Medplum 数据同步。

**请求体**:
```json
{
  "type": "incremental",
  "since": "2024-01-01T00:00:00Z"
}
```

**请求字段**:
| 字段 | 类型 | 必填 | 说明 | 可选值 |
|------|------|------|------|--------|
| type | string | 否 | 同步类型 | full/incremental |
| since | string | 否 | 同步起始时间 | ISO 8601 格式 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "syncId": "sync-123",
    "status": "processing",
    "estimatedTime": 300
  },
  "message": "同步任务已启动"
}
```

---

#### `GET /api/sync/status/:id`

查询同步状态。

**请求示例**:
```bash
curl "https://mdlooker.com/api/sync/status/sync-123"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "syncId": "sync-123",
    "status": "completed",
    "progress": 100,
    "itemsSynced": 150,
    "itemsFailed": 2,
    "startedAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T10:05:00Z",
    "errors": [
      {
        "id": "device-999",
        "error": "Not found in Medplum"
      }
    ]
  }
}
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

### 常见错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMIT_EXCEEDED | 429 | 超过速率限制 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### 错误示例

```json
{
  "success": false,
  "error": "查询参数不能为空",
  "code": "VALIDATION_ERROR"
}
```

---

## 速率限制

### 限制说明

| 用户类型 | 限制 | 时间窗口 |
|----------|------|----------|
| 未认证 | 100 请求 | 1 小时 |
| 已认证 | 1000 请求 | 1 小时 |
| 企业用户 | 5000 请求 | 1 小时 |

### 速率限制响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320000
```

### 超过限制

```json
{
  "success": false,
  "error": "超过速率限制，请在 300 秒后重试",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300
}
```

---

## 最佳实践

### 1. 使用分页

对于大量数据的请求，使用分页避免单次请求过大：

```bash
curl "https://mdlooker.com/api/products?limit=20&offset=0"
curl "https://mdlooker.com/api/products?limit=20&offset=20"
```

### 2. 使用缓存

在客户端实现缓存机制，减少重复请求：

```javascript
// 使用 ETag 或 Last-Modified 头
const response = await fetch('/api/products/123', {
  headers: {
    'If-None-Match': '"etag-value"'
  }
});
```

### 3. 批量请求

合并多个请求为单个请求：

```javascript
// 不推荐：多个单独请求
const products = await Promise.all(
  ids.map(id => fetch(`/api/products/${id}`))
);

// 推荐：使用批量端点（如果可用）
const products = await fetch('/api/products/batch', {
  method: 'POST',
  body: JSON.stringify({ ids })
});
```

### 4. 错误重试

实现指数退避重试机制：

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
        await sleep(retryAfter * 1000);
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

---

## SDK 和工具

### JavaScript/TypeScript

```bash
npm install @mdlooker/sdk
```

```javascript
import { MDLookerClient } from '@mdlooker/sdk';

const client = new MDLookerClient({
  apiKey: 'YOUR_API_KEY'
});

const results = await client.search({
  query: 'mask',
  type: 'product',
  market: 'fda'
});
```

### Python

```bash
pip install mdlooker-python
```

```python
from mdlooker import MDLookerClient

client = MDLookerClient(api_key='YOUR_API_KEY')
results = client.search(query='mask', type='product', market='fda')
```

### cURL 示例

```bash
# 搜索
curl "https://mdlooker.com/api/search?q=mask&type=product" \
  -H "Authorization: Bearer YOUR_API_KEY"

# 获取产品详情
curl "https://mdlooker.com/api/products/prod-123" \
  -H "Authorization: Bearer YOUR_API_KEY"

# 生成报告
curl -X POST "https://mdlooker.com/api/reports/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "company",
    "entityId": "comp-456",
    "format": "pdf"
  }'
```

---

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持搜索、产品、公司、报告 API
- 添加 Medplum 数据同步功能
- 实现速率限制和错误处理

---

## 支持与反馈

如有问题或建议，请通过以下方式联系我们：

- **邮箱**: api-support@mdlooker.com
- **文档**: https://docs.mdlooker.com
- **状态页面**: https://status.mdlooker.com
- **GitHub**: https://github.com/mdlooker/api-issues
