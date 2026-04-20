# API密钥管理系统 (B-002)

## 概述

API密钥管理系统提供安全的API访问控制，支持密钥生成、权限管理、限流控制和审计日志。

## 核心特性

- **安全存储**: 只存储密钥SHA256哈希，不存储明文
- **细粒度权限**: 支持资源和操作级别的权限控制
- **多级限流**: 秒/分钟/小时/日四级限流
- **使用配额**: 月度请求数和数据传输量限制
- **IP白名单**: 可选的IP访问控制
- **审计日志**: 完整的密钥使用记录

## 快速开始

### 1. 初始化数据库

```bash
# 在Supabase SQL编辑器中执行
psql -h YOUR_DB_HOST -d postgres -f scripts/init-api-keys.sql
```

### 2. 创建API密钥

```bash
curl -X POST https://your-api.com/api/api-keys \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "description": "用于生产环境",
    "permissions": [
      {"resource": "companies", "actions": ["read"]},
      {"resource": "products", "actions": ["read"]}
    ],
    "expires_in_days": 365
  }'
```

### 3. 使用API密钥

```bash
# 方式1: Authorization Header
curl https://your-api.com/api/companies \
  -H "Authorization: Bearer pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"

# 方式2: X-API-Key Header
curl https://your-api.com/api/companies \
  -H "X-API-Key: pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
```

## API 接口

### 创建API密钥
```http
POST /api/api-keys
Content-Type: application/json
Authorization: Bearer {user_token}

{
  "name": "My API Key",
  "description": "Description",
  "permissions": [
    {"resource": "companies", "actions": ["read"]},
    {"resource": "products", "actions": ["read", "write"]}
  ],
  "allowed_endpoints": ["/api/companies/*", "/api/products/*"],
  "allowed_ips": ["192.168.1.1", "10.0.0.0/8"],
  "rate_limit": {
    "requestsPerSecond": 10,
    "requestsPerMinute": 100,
    "requestsPerHour": 1000,
    "requestsPerDay": 10000
  },
  "usage_quota": {
    "maxRequestsPerMonth": 100000,
    "maxDataTransferPerMonth": 1024
  },
  "expires_in_days": 365
}

Response:
{
  "success": true,
  "apiKey": {
    "id": "uuid",
    "name": "My API Key",
    "keyPrefix": "pk_live_xxxx",
    "fullKey": "pk_live_xxxxxxxxxxxxxxxxxxxxxxxx",  // 只返回一次！
    "status": "active",
    ...
  }
}
```

### 列出API密钥
```http
GET /api/api-keys
Authorization: Bearer {user_token}

Response:
{
  "success": true,
  "keys": [
    {
      "id": "uuid",
      "name": "My API Key",
      "keyPrefix": "pk_live_xxxx",
      "status": "active",
      "usage": {...},
      "metadata": {...}
    }
  ],
  "total": 1
}
```

### 获取单个API密钥
```http
GET /api/api-keys/:id
Authorization: Bearer {user_token}

Response:
{
  "success": true,
  "key": {...}
}
```

### 更新API密钥
```http
PATCH /api/api-keys/:id
Content-Type: application/json
Authorization: Bearer {user_token}

{
  "name": "Updated Name",
  "status": "inactive",
  "permissions": [...]
}

Response:
{
  "success": true
}
```

### 撤销API密钥
```http
DELETE /api/api-keys/:id
Content-Type: application/json
Authorization: Bearer {user_token}

{
  "reason": "No longer needed"
}

Response:
{
  "success": true
}
```

### 获取使用情况
```http
GET /api/api-keys/:id/usage
Authorization: Bearer {user_token}

Response:
{
  "success": true,
  "usage": {
    "totalRequests": 5000,
    "requestsThisMonth": 1500,
    "requestsToday": 50,
    "dataTransferThisMonth": 256.5,
    "quotaPercentage": 1.5,
    "rateLimitStatus": {
      "perSecond": {"used": 2, "limit": 10, "remaining": 8},
      "perMinute": {"used": 15, "limit": 100, "remaining": 85},
      "perHour": {"used": 150, "limit": 1000, "remaining": 850},
      "perDay": {"used": 500, "limit": 10000, "remaining": 9500}
    }
  }
}
```

## 在API中使用中间件

```typescript
import { withApiKeyAuth, withApiKeyAuthAndPermission } from '@/lib/api-keys'

// 基础API密钥认证
export async function GET(request: NextRequest) {
  return withApiKeyAuth(request, async (req, apiKey) => {
    // apiKey包含验证通过的密钥信息
    return NextResponse.json({ success: true })
  })
}

// 认证 + 权限检查
export async function POST(request: NextRequest) {
  return withApiKeyAuthAndPermission('companies', 'write')(
    request,
    async (req, apiKey) => {
      // 只有拥有companies写权限的密钥才能执行
      return NextResponse.json({ success: true })
    }
  )
}
```

## 默认配置

### 默认限流
```typescript
{
  requestsPerSecond: 10,
  requestsPerMinute: 100,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
  burstAllowance: 20
}
```

### 默认配额
```typescript
{
  maxRequestsPerMonth: 100000,
  maxDataTransferPerMonth: 1024 // MB
}
```

### 默认权限
```typescript
[
  { resource: 'companies', actions: ['read'] },
  { resource: 'products', actions: ['read'] },
  { resource: 'search', actions: ['read'] }
]
```

## 错误码

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| MISSING_API_KEY | 缺少API密钥 | 401 |
| INVALID_KEY | 无效的API密钥 | 401 |
| REVOKED | 密钥已撤销 | 401 |
| EXPIRED | 密钥已过期 | 401 |
| IP_NOT_ALLOWED | IP不在白名单中 | 403 |
| PERMISSION_DENIED | 权限不足 | 403 |
| RATE_LIMITED | 超出限流 | 429 |

## 数据库结构

### api_keys 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID |
| name | VARCHAR | 密钥名称 |
| key_prefix | VARCHAR | 密钥前缀（显示用） |
| key_hash | VARCHAR | 密钥SHA256哈希 |
| permissions | JSONB | 权限配置 |
| allowed_endpoints | JSONB | 允许的端点 |
| allowed_ips | JSONB | IP白名单 |
| rate_limit | JSONB | 限流配置 |
| usage_quota | JSONB | 配额配置 |
| status | VARCHAR | 状态 |
| expires_at | TIMESTAMPTZ | 过期时间 |
| usage | JSONB | 使用统计 |
| metadata | JSONB | 元数据 |

### api_key_rate_limits 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| key_id | UUID | 密钥ID |
| window | VARCHAR | 时间窗口 |
| window_start | TIMESTAMPTZ | 窗口开始时间 |
| request_count | INTEGER | 请求计数 |

### api_key_audit_logs 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| key_id | UUID | 密钥ID |
| user_id | UUID | 用户ID |
| action | VARCHAR | 操作类型 |
| details | JSONB | 详细信息 |
| created_at | TIMESTAMPTZ | 创建时间 |

## 安全最佳实践

1. **密钥存储**: 客户端应安全存储密钥，不要在代码中硬编码
2. **传输安全**: 始终使用HTTPS传输密钥
3. **定期轮换**: 建议定期更换API密钥
4. **最小权限**: 只授予必要的权限
5. **IP限制**: 生产环境建议使用IP白名单
6. **监控使用**: 定期检查密钥使用情况，发现异常立即撤销

## 技术亮点

- **安全哈希**: 使用SHA256存储密钥哈希，不可逆
- **滑动窗口限流**: 精确的秒/分钟/小时/日限流控制
- **自动重置**: 日/月使用量自动重置
- **RLS安全**: 用户只能访问自己的密钥数据
- **审计追踪**: 完整的密钥生命周期记录
