# 会员等级系统 (B-001)

## 概述

会员等级系统提供基于订阅的权限管理和使用限制控制，支持三个等级：免费版、专业版、企业版。

## 会员等级

### 免费版 (Free)
- **价格**: $0/月
- **目标用户**: 个人用户基础查询
- **核心功能**:
  - 基础搜索功能
  - 查看企业和产品基本信息
  - 5次/天搜索额度
  - CSV导出（10条/月）

### 专业版 (Professional)
- **价格**: $49/月 或 $468/年（20%折扣）
- **目标用户**: 专业买手和合规经理
- **核心功能**:
  - 所有免费版功能
  - 语义搜索
  - AI助手问答
  - 竞品对比分析
  - 风险分析雷达
  - 100次/天搜索额度
  - 全格式导出（1000条/月）
  - 10个监控预警
  - 5份报告/月
  - API访问（1000次/天）

### 企业版 (Enterprise)
- **价格**: $199/月 或 $1908/年（20%折扣）
- **目标用户**: 企业团队和大型组织
- **核心功能**:
  - 所有专业版功能
  - 无限搜索额度
  - 无限导出
  - 无限监控预警
  - 无限报告生成
  - 白标报告
  - API访问（10000次/天）
  - Webhook集成
  - SSO单点登录
  - 10个团队成员
  - 优先客服支持

## 快速开始

### 1. 初始化数据库

```bash
# 在Supabase SQL编辑器中执行
psql -h YOUR_DB_HOST -d postgres -f scripts/init-membership.sql
```

### 2. 环境变量

```env
# 已配置在 .env.local 中
# 无需额外配置
```

### 3. 使用服务

```typescript
import { membershipService } from '@/lib/membership'

// 获取用户会员信息
const membership = await membershipService.getUserMembership(userId)

// 检查权限
const canUseAI = await membershipService.checkPermission(userId, 'canUseAiAssistant')

// 检查限制
const apiLimit = await membershipService.checkLimit(userId, 'maxApiCallsPerDay', 1)

// 增加使用量
await membershipService.incrementUsage(userId, 'maxApiCallsPerDay', 1)
```

## API 接口

### 获取当前会员信息
```http
GET /api/membership
Authorization: Bearer {token}

Response:
{
  "success": true,
  "membership": {
    "userId": "uuid",
    "currentTier": "professional",
    "subscription": { ... },
    "usage": { ... },
    "history": [ ... ]
  },
  "config": { ... },
  "usagePercentage": {
    "apiCalls": 45.5,
    "exports": 20.0,
    "reports": 40.0
  }
}
```

### 升级会员
```http
POST /api/membership
Content-Type: application/json
Authorization: Bearer {token}

{
  "target_tier": "enterprise",
  "billing_cycle": "yearly"
}

Response:
{
  "success": true
}
```

### 取消订阅
```http
DELETE /api/membership
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "不再需要"
}

Response:
{
  "success": true
}
```

### 检查权限
```http
POST /api/membership/check
Content-Type: application/json
Authorization: Bearer {token}

{
  "permission": "canUseAiAssistant"
}

Response:
{
  "success": true,
  "allowed": true,
  "currentTier": "professional"
}
```

### 检查限制
```http
GET /api/membership/check?type=maxApiCallsPerDay&amount=1
Authorization: Bearer {token}

Response:
{
  "success": true,
  "allowed": true,
  "currentUsage": 455,
  "limit": 1000,
  "remaining": 545,
  "resetAt": "2026-04-21T00:00:00.000Z"
}
```

### 获取会员计划
```http
GET /api/membership/plans

Response:
{
  "success": true,
  "plans": [
    {
      "tier": "free",
      "name": "免费版",
      "prices": { "monthly": 0, "yearly": 0 },
      "features": [...],
      "limits": {...}
    },
    ...
  ]
}
```

## 在API中使用中间件

```typescript
import { withPermission, withLimit } from '@/lib/membership'

// 检查权限
export async function POST(request: NextRequest) {
  return withPermission('canUseAiAssistant')(request, async (req) => {
    // 只有有权限的用户才能执行到这里
    return NextResponse.json({ success: true })
  })
}

// 检查限制
export async function GET(request: NextRequest) {
  return withLimit('maxApiCallsPerDay', 1)(request, async (req) => {
    // 执行API调用，使用量会自动增加
    return NextResponse.json({ success: true })
  })
}
```

## 数据库结构

### user_memberships 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID，外键 |
| current_tier | VARCHAR | 当前等级 |
| subscription | JSONB | 订阅信息 |
| usage | JSONB | 使用统计 |
| history | JSONB | 变更历史 |
| metadata | JSONB | 元数据 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

### membership_usage_logs 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID |
| tier | VARCHAR | 当时等级 |
| action_type | VARCHAR | 操作类型 |
| action_detail | JSONB | 详细信息 |
| usage_amount | INTEGER | 使用量 |
| created_at | TIMESTAMPTZ | 创建时间 |

## 权限列表

| 权限 | 免费版 | 专业版 | 企业版 |
|------|--------|--------|--------|
| canAccessBasicData | ✅ | ✅ | ✅ |
| canAccessAdvancedData | ❌ | ✅ | ✅ |
| canAccessHistoricalData | ❌ | ✅ | ✅ |
| canAccessRealTimeData | ❌ | ✅ | ✅ |
| canUseSemanticSearch | ❌ | ✅ | ✅ |
| canUseAiAssistant | ❌ | ✅ | ✅ |
| canUseComparisonTool | ❌ | ✅ | ✅ |
| canUseRiskAnalysis | ❌ | ✅ | ✅ |
| canUseMarketTrends | ❌ | ✅ | ✅ |
| canExportData | ✅ | ✅ | ✅ |
| canScheduleExports | ❌ | ✅ | ✅ |
| canCreateAlerts | ❌ | ✅ | ✅ |
| canCustomizeAlertRules | ❌ | ✅ | ✅ |
| canGenerateReports | ❌ | ✅ | ✅ |
| canCustomizeReports | ❌ | ✅ | ✅ |
| canWhiteLabelReports | ❌ | ❌ | ✅ |
| canUseApi | ❌ | ✅ | ✅ |
| canUseWebhooks | ❌ | ❌ | ✅ |
| canUseSso | ❌ | ❌ | ✅ |

## 限制配置

| 限制项 | 免费版 | 专业版 | 企业版 |
|--------|--------|--------|--------|
| maxSearchResults | 10 | 100 | 1000 |
| maxSavedSearches | 3 | 20 | 100 |
| maxApiCallsPerDay | 0 | 1000 | 10000 |
| maxExportRecordsPerMonth | 10 | 1000 | 10000 |
| maxReportsPerMonth | 0 | 5 | 100 |
| maxMonitoredProducts | 0 | 10 | 100 |
| maxMonitoredCompanies | 0 | 10 | 100 |
| maxTeamMembers | 1 | 1 | 10 |

## 技术亮点

- **灵活的JSONB存储**: 订阅信息、使用统计等使用JSONB格式，便于扩展
- **自动重置机制**: 日/月使用量自动重置
- **RLS安全策略**: 用户只能访问自己的会员数据
- **触发器自动化**: 新用户自动创建免费会员
- **中间件支持**: 易于在API中集成权限和限制检查
- **详细的审计日志**: 记录所有使用情况和变更历史
