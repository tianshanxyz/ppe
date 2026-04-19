# PPE 合规信息服务平台 - 系统架构设计文档

**文档版本**: v1.0  
**创建日期**: 2026-04-18  
**最后更新**: 2026-04-18  
**负责人**: 产品架构师  
**状态**: 🟡 编写中

---

## 目录

1. [架构概述](#1-架构概述)
2. [技术选型](#2-技术选型)
3. [系统架构图](#3-系统架构图)
4. [模块划分](#4-模块划分)
5. [数据库设计](#5-数据库设计)
6. [API 接口设计](#6-接口设计)
7. [权限设计](#7-权限设计)
8. [安全方案](#8-安全方案)
9. [缓存策略](#9-缓存策略)
10. [部署方案](#10-部署方案)

---

## 1. 架构概述

### 1.1 架构目标

构建一个**高可用、高性能、易扩展**的 PPE 合规信息服务平台，支持：
- ✅ 全球 6+ 国家 PPE 数据采集与展示
- ✅ 百万级数据量的快速检索
- ✅ 千人并发访问
- ✅ 多租户 SaaS 服务
- ✅ 智能化数据处理

### 1.2 架构原则

| 原则 | 说明 |
|------|------|
| **分层架构** | 清晰的前后端分离，职责明确 |
| **微服务化** | 核心服务独立部署，便于扩展 |
| **数据驱动** | 数据治理优先，保证数据质量 |
| **安全优先** | 多层次安全防护 |
| **云原生** | 容器化部署，弹性伸缩 |

### 1.3 技术栈总览

```
┌─────────────────────────────────────────────┐
│              前端技术栈                      │
│  Next.js 16 + React 19 + TypeScript        │
│  + Tailwind CSS + shadcn/ui                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              后端技术栈                      │
│  Next.js API Routes + TypeScript            │
│  + NestJS (复杂业务)                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              数据存储层                      │
│  PostgreSQL (Supabase) + Redis             │
│  + Pinecone (向量数据库)                    │
└─────────────────────────────────────────────┘
```

---

## 2. 技术选型

### 2.1 前端技术栈

| 技术 | 选型 | 说明 |
|------|------|------|
| **框架** | Next.js 16 | React 全栈框架，支持 SSR/SSG |
| **语言** | TypeScript 5.x | 类型安全，提升代码质量 |
| **UI 库** | shadcn/ui | 基于 Radix UI，高度可定制 |
| **样式** | Tailwind CSS | 原子化 CSS，开发效率高 |
| **状态管理** | Zustand | 轻量级状态管理 |
| **数据请求** | TanStack Query (React Query) | 强大的数据同步库 |
| **表单处理** | React Hook Form | 高性能表单库 |
| **图表库** | Recharts | 声明式图表库 |
| **国际化** | next-intl | Next.js 国际化方案 |

### 2.2 后端技术栈

| 技术 | 选型 | 说明 |
|------|------|------|
| **主框架** | Next.js API Routes | 轻量级 API 服务 |
| **复杂业务** | NestJS | 模块化 Node.js 框架 |
| **语言** | TypeScript 5.x | 前后端统一语言 |
| **ORM** | Prisma | 类型安全的 ORM |
| **验证** | Zod | TypeScript 优先的验证库 |
| **认证** | NextAuth.js | 灵活的认证方案 |
| **日志** | Pino | 高性能日志库 |

### 2.3 数据存储

| 技术 | 选型 | 说明 |
|------|------|------|
| **主数据库** | PostgreSQL 15 (Supabase) | 关系型数据库，支持 JSON |
| **缓存** | Redis 7 | 高性能键值存储 |
| **向量数据库** | Pinecone | AI 检索与推荐 |
| **对象存储** | AWS S3 / Cloudflare R2 | 文件存储 |
| **搜索引擎** | Meilisearch / Algolia | 全文检索 |

### 2.4 基础设施

| 技术 | 选型 | 说明 |
|------|------|------|
| **容器化** | Docker + Docker Compose | 标准化部署 |
| **编排** | Kubernetes (可选) | 容器编排 |
| **CI/CD** | GitHub Actions | 自动化构建与部署 |
| **监控** | Sentry + Prometheus | 错误监控与性能监控 |
| **CDN** | Cloudflare | 全球加速 |
| **部署平台** | Vercel (前端) + AWS (后端) | 混合部署 |

---

## 3. 系统架构图

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Web 用户  │  │ 移动用户  │  │ API 用户   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      CDN 加速层 (Cloudflare)                  │
│         DDoS 防护 · 静态资源缓存 · SSL 终止                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      接入层 (Vercel)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js 应用 (前端 + API)                 │  │
│  │  - 页面渲染 (SSR/SSG)                                 │  │
│  │  - API 路由                                           │  │
│  │  - 中间件 (认证、限流、日志)                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      业务服务层 (AWS)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │用户服务   │  │检索服务   │  │数据服务   │  │文件服务   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │支付服务   │  │AI 服务     │  │通知服务   │  │分析服务   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐         │
│  │ PostgreSQL   │  │  Redis   │  │   Pinecone   │         │
│  │  (Supabase)  │  │  缓存     │  │  向量数据库   │         │
│  └──────────────┘  └──────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────┐                           │
│  │    S3/R2     │  │Meilisearch│                          │
│  │  对象存储     │  │  搜索引擎  │                          │
│  └──────────────┘  └──────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 数据流架构

```
数据采集流程:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 官方数据源 │ →  │ 采集引擎 │ →  │ AI 解析   │ →  │ 数据清洗 │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                    ↓
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 用户检索   │ ←  │ 搜索引擎 │ ←  │ 数据入库 │ ←  │ 质量校验 │
└──────────┘    └──────────┘    └──────────┘    └──────────┘

用户请求流程:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  用户     │ →  │  CDN     │ →  │ Next.js  │ →  │  认证    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                    ↓
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  响应     │ ←  │  缓存    │ ←  │  数据库   │ ←  │  API     │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## 4. 模块划分

### 4.1 前端模块

```
frontend/
├── app/                          # Next.js App Router
│   ├── (public)/                 # 公开页面
│   │   ├── page.tsx              # 首页
│   │   ├── search/               # 检索页面
│   │   ├── product/[id]/         # 产品详情
│   │   └── pricing/              # 定价页面
│   ├── (auth)/                   # 认证页面
│   │   ├── login/                # 登录
│   │   ├── register/             # 注册
│   │   └── forgot-password/      # 忘记密码
│   ├── (dashboard)/              # 用户中心
│   │   ├── dashboard/            # 仪表盘
│   │   ├── subscription/         # 订阅管理
│   │   └── documents/            # 文件管理
│   └── admin/                    # 管理后台
│       ├── users/                # 用户管理
│       ├── products/             # 产品管理
│       └── analytics/            # 数据分析
├── components/                   # 组件库
│   ├── ui/                       # 基础 UI 组件
│   ├── layout/                   # 布局组件
│   ├── search/                   # 搜索相关组件
│   ├── product/                  # 产品展示组件
│   └── document/                 # 文档生成组件
├── lib/                          # 工具库
│   ├── api/                      # API 客户端
│   ├── utils/                    # 工具函数
│   └── constants/                # 常量定义
└── hooks/                        # 自定义 Hooks
```

### 4.2 后端模块

```
backend/
├── api/                          # API 路由
│   ├── v1/
│   │   ├── auth/                 # 认证接口
│   │   ├── users/                # 用户接口
│   │   ├── products/             # 产品接口
│   │   ├── search/               # 搜索接口
│   │   ├── documents/            # 文档接口
│   │   └── subscription/         # 订阅接口
│   └── admin/                    # 管理接口
├── services/                     # 业务服务
│   ├── user.service.ts           # 用户服务
│   ├── product.service.ts        # 产品服务
│   ├── search.service.ts         # 搜索服务
│   ├── document.service.ts       # 文档服务
│   └── payment.service.ts        # 支付服务
├── models/                       # 数据模型
│   ├── user.ts                   # 用户模型
│   ├── product.ts                # 产品模型
│   ├── standard.ts               # 标准模型
│   └── subscription.ts           # 订阅模型
├── middleware/                   # 中间件
│   ├── auth.middleware.ts        # 认证中间件
│   ├── rate-limit.middleware.ts  # 限流中间件
│   └── logging.middleware.ts     # 日志中间件
└── utils/                        # 工具函数
    ├── logger.ts                 # 日志工具
    ├── validator.ts              # 验证工具
    └── crypto.ts                 # 加密工具
```

### 4.3 数据采集模块

```
data-pipeline/
├── collectors/                   # 采集器
│   ├── china.collector.ts        # 中国数据源
│   ├── usa.collector.ts          # 美国数据源
│   ├── eu.collector.ts           # 欧盟数据源
│   └── ...
├── parsers/                      # 解析器
│   ├── html.parser.ts            # HTML 解析
│   ├── pdf.parser.ts             # PDF 解析
│   └── api.parser.ts             # API 数据解析
├── classifiers/                  # 分类器
│   ├── rule.classifier.ts        # 规则分类
│   └── ml.classifier.ts          # ML 分类
└── validators/                   # 验证器
    ├── schema.validator.ts       # 结构验证
    └── quality.validator.ts      # 质量验证
```

---

## 5. 数据库设计

### 5.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │  Product    │       │  Standard   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ email       │       │ name        │       │ number      │
│ password    │       │ category    │       │ name        │
│ ...         │       │ ...         │       │ country     │
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │                      │
       │ 1:N                  │ N:M                  │ N:M
       ↓                      ↓                      ↓
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Subscription│       │ProductStd   │       │Certification│
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ product_id  │       │ id          │
│ user_id     │       │ standard_id │       │ product_id  │
│ type        │       └─────────────┘       │ type        │
│ ...         │                              │ ...         │
└─────────────┘
```

### 5.2 核心表结构

#### user (用户表)
```sql
CREATE TABLE user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    subscription_type VARCHAR(20) DEFAULT 'free',
    subscription_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_subscription (subscription_type)
);
```

#### ppe_product (PPE 产品表)
```sql
CREATE TABLE ppe_product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(500) NOT NULL,
    model_number VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    manufacturer VARCHAR(500),
    country_origin VARCHAR(100),
    applicable_standards JSONB,
    certification_required JSONB,
    status VARCHAR(20) DEFAULT 'active',
    data_source VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_country (country_origin),
    INDEX idx_status (status)
);
```

#### standard (标准表)
```sql
CREATE TABLE standard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_number VARCHAR(100) NOT NULL,
    standard_name VARCHAR(500) NOT NULL,
    country VARCHAR(100) NOT NULL,
    issuing_body VARCHAR(255),
    release_date DATE,
    implementation_date DATE,
    status VARCHAR(20) DEFAULT 'current',
    pdf_url VARCHAR(500),
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_number (standard_number),
    INDEX idx_country (country),
    INDEX idx_status (status)
);
```

#### product_standard (产品 - 标准关联表)
```sql
CREATE TABLE product_standard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES ppe_product(id),
    standard_id UUID NOT NULL REFERENCES standard(id),
    relation_type VARCHAR(50), -- 'mandatory' / 'recommended'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_product_standard (product_id, standard_id)
);
```

#### subscription (订阅表)
```sql
CREATE TABLE subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user(id),
    type VARCHAR(20) NOT NULL, -- 'free' / 'pro' / 'enterprise'
    status VARCHAR(20) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);
```

---

## 6. API 接口设计

### 6.1 RESTful 规范

#### URL 命名规范
- 使用小写字母
- 单词间用下划线分隔
- 资源名使用复数形式
- 示例：`/api/v1/products`, `/api/v1/users`

#### HTTP 方法
| 方法 | 说明 | 示例 |
|------|------|------|
| GET | 查询资源 | GET /api/v1/products/123 |
| POST | 创建资源 | POST /api/v1/products |
| PUT | 更新资源 (全量) | PUT /api/v1/products/123 |
| PATCH | 更新资源 (部分) | PATCH /api/v1/products/123 |
| DELETE | 删除资源 | DELETE /api/v1/products/123 |

### 6.2 统一响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2026-04-18T10:00:00Z"
}

// 失败响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [ ... ]
  },
  "timestamp": "2026-04-18T10:00:00Z"
}

// 分页响应
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2026-04-18T10:00:00Z"
}
```

### 6.3 核心 API 接口

#### 认证接口
```typescript
// 用户注册
POST /api/v1/auth/register
Body: {
  email: string,
  password: string,
  companyName?: string
}

// 用户登录
POST /api/v1/auth/login
Body: {
  email: string,
  password: string
}

// 刷新 Token
POST /api/v1/auth/refresh
Body: {
  refreshToken: string
}

// 登出
POST /api/v1/auth/logout
```

#### 产品接口
```typescript
// 获取产品列表
GET /api/v1/products
Query: {
  category?: string,
  country?: string,
  keyword?: string,
  page?: number,
  pageSize?: number
}

// 获取产品详情
GET /api/v1/products/:id

// 创建产品 (管理员)
POST /api/v1/products
Body: {
  productName: string,
  category: string,
  ...
}

// 更新产品 (管理员)
PUT /api/v1/products/:id

// 删除产品 (管理员)
DELETE /api/v1/products/:id
```

#### 搜索接口
```typescript
// 基础搜索
GET /api/v1/search
Query: {
  q: string,
  category?: string,
  country?: string,
  page?: number,
  pageSize?: number
}

// 高级搜索
POST /api/v1/search/advanced
Body: {
  filters: {
    category?: string[],
    country?: string[],
    standards?: string[],
    ...
  },
  sort?: string,
  page?: number,
  pageSize?: number
}
```

#### 文档生成接口
```typescript
// 生成 DoC 文件
POST /api/v1/documents/declaration
Body: {
  productId: string,
  standards: string[],
  manufacturer: string
}

// 下载文件
GET /api/v1/documents/:id/download

// 获取文件历史
GET /api/v1/documents/:id/history
```

#### 订阅接口
```typescript
// 获取订阅方案
GET /api/v1/subscription/plans

// 创建订阅
POST /api/v1/subscription
Body: {
  planId: string,
  paymentMethod: string
}

// 取消订阅
DELETE /api/v1/subscription/:id

// 获取使用统计
GET /api/v1/subscription/usage
```

---

## 7. 权限设计

### 7.1 RBAC 模型

```
用户 (User)
    ↓
角色 (Role)
    ↓
权限 (Permission)
    ↓
资源 (Resource)
```

### 7.2 角色定义

| 角色 | 编码 | 说明 |
|------|------|------|
| 游客 | GUEST | 未登录用户 |
| 免费会员 | FREE_USER | 已注册未付费 |
| Pro 会员 | PRO_USER | 付费个人用户 |
| 企业会员 | ENTERPRISE_USER | 付费企业用户 |
| 内容编辑 | CONTENT_EDITOR | 内容管理人员 |
| 管理员 | ADMIN | 系统管理员 |

### 7.3 权限矩阵

| 资源/操作 | GUEST | FREE | PRO | ENTERPRISE | EDITOR | ADMIN |
|----------|-------|------|-----|------------|--------|-------|
| 浏览首页 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 搜索产品 (10 次/天) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 搜索产品 (无限) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 查看产品详情 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 下载产品报告 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 生成合规文件 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| API 访问 | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| 内容管理 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 用户管理 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 系统设置 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 7.4 权限实现

```typescript
// 权限守卫示例
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(ROLE_DECORATOR) private roles: string[],
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) return false;
    
    return this.roles.includes(user.role);
  }
}

// 使用示例
@Get('admin/users')
@Roles(['ADMIN'])
async getAllUsers() {
  // 仅管理员可访问
}
```

---

## 8. 安全方案

### 8.1 认证安全

#### 密码安全
- 使用 bcrypt 加密存储，cost factor = 12
- 密码长度至少 8 位，包含大小写字母和数字
- 登录失败 5 次锁定 30 分钟

#### Token 安全
- Access Token: JWT，有效期 15 分钟
- Refresh Token: UUID，有效期 30 天
- Token 黑名单机制 (Redis)

### 8.2 传输安全

- 全站 HTTPS，强制 TLS 1.3
- HSTS 启用，防止协议降级
- 敏感数据加密传输

### 8.3 数据安全

#### SQL 注入防护
- 使用参数化查询 (Prisma ORM)
- 输入验证 (Zod)
- 最小权限原则 (数据库账号)

#### XSS 防护
- 输出编码
- Content Security Policy (CSP)
- HttpOnly Cookie

#### CSRF 防护
- CSRF Token 验证
- SameSite Cookie 属性
- 敏感操作二次验证

### 8.4 接口安全

#### 限流策略
```typescript
// 基于 IP 限流
rateLimit: {
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 最多 100 次请求
}

// 基于用户限流 (付费用户更高限额)
rateLimitByUser: {
  free: 1000 / day,
  pro: 10000 / day,
  enterprise: 100000 / day
}
```

#### API 签名
```typescript
// 请求签名验证
signature = HMAC_SHA256(
  method + path + timestamp + body,
  secretKey
)
```

### 8.5 审计日志

```typescript
// 记录所有关键操作
interface AuditLog {
  id: string;
  userId: string;
  action: string; // 'LOGIN', 'CREATE', 'UPDATE', 'DELETE'
  resource: string; // 'PRODUCT', 'USER', 'DOCUMENT'
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  result: 'SUCCESS' | 'FAILURE';
}
```

---

## 9. 缓存策略

### 9.1 多级缓存架构

```
┌─────────────────────────────────────┐
│         浏览器缓存 (Browser)         │
│         Cache-Control: max-age      │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│         CDN 缓存 (Cloudflare)        │
│         静态资源、API 响应             │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│         应用缓存 (Redis)             │
│         热点数据、Session            │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│         数据库 (PostgreSQL)          │
└─────────────────────────────────────┘
```

### 9.2 缓存策略

| 数据类型 | 缓存位置 | 过期策略 | 说明 |
|---------|---------|---------|------|
| 静态资源 | CDN + 浏览器 | 1 年 | JS/CSS/图片 |
| 产品列表 | Redis | 5 分钟 | 分页数据 |
| 产品详情 | Redis | 30 分钟 | 高频访问 |
| 标准数据 | Redis | 1 小时 | 变更较少 |
| 用户信息 | Redis | 15 分钟 | Session |
| 搜索结果 | Redis | 10 分钟 | 热门查询 |

### 9.3 缓存更新策略

```typescript
// Cache-Aside 模式
async getProduct(id: string) {
  // 1. 读缓存
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);
  
  // 2. 读数据库
  const product = await db.product.findUnique({ id });
  
  // 3. 写缓存
  await redis.setex(
    `product:${id}`,
    1800, // 30 分钟
    JSON.stringify(product)
  );
  
  return product;
}

// 写操作 - 删除缓存
async updateProduct(id: string, data: any) {
  // 1. 更新数据库
  await db.product.update({ id, data });
  
  // 2. 删除缓存
  await redis.del(`product:${id}`);
}
```

---

## 10. 部署方案

### 10.1 部署架构

```
┌──────────────────────────────────────────────────┐
│                  全球用户                         │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│            Cloudflare (DNS + CDN)                │
│         DDoS 防护 · SSL · 全球加速                  │
└──────────────────────────────────────────────────┘
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
┌────────────────┐         ┌────────────────┐
│   Vercel       │         │     AWS        │
│   (前端)       │         │   (后端)       │
│                │         │                │
│ - Next.js SSR  │         │ - API 服务      │
│ - 静态资源      │         │ - 数据采集      │
│                │         │ - AI 服务        │
└────────────────┘         └────────────────┘
        ↓                           ↓
┌──────────────────────────────────────────────────┐
│                  数据层                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Supabase  │  │  Redis   │  │   S3     │      │
│  │(Primary) │  │ (Cache)  │  │ (Files)  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└──────────────────────────────────────────────────┘
```

### 10.2 Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 依赖安装
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 构建
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 生产运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

### 10.3 Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=ppe_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  redis-data:
  postgres-data:
```

### 10.4 CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 10.5 监控与告警

#### 监控指标
- **应用性能**: 响应时间、错误率、吞吐量
- **系统资源**: CPU、内存、磁盘、网络
- **业务指标**: 用户数、检索量、转化率

#### 告警规则
```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: HighResponseTime
    condition: p95_latency > 2000ms
    duration: 10m
    severity: warning
    
  - name: LowDiskSpace
    condition: disk_usage > 80%
    severity: warning
```

---

## 附录

### 附录 A: 环境变量清单

```bash
# 数据库
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379

# 认证
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# 支付
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 邮件
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=...

# 监控
SENTRY_DSN=https://...
```

### 附录 B: 第三方服务清单

| 服务 | 用途 | 供应商 |
|------|------|--------|
| 数据库 | PostgreSQL | Supabase |
| 缓存 | Redis | Upstash |
| 部署 | Hosting | Vercel + AWS |
| CDN | 加速 | Cloudflare |
| 邮件 | 邮件发送 | SendGrid |
| 支付 | 支付处理 | Stripe |
| 监控 | 错误监控 | Sentry |
| 搜索 | 全文检索 | Meilisearch |

---

**文档结束**

---

## 变更记录

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|---------|
| v1.0 | 2026-04-18 | 产品架构师 | 初始版本创建 |

---

**审批记录**:

| 角色 | 姓名 | 审批意见 | 日期 |
|------|------|---------|------|
| 技术负责人 | 待指定 | 待审批 | - |
| 前端工程师 | 待指定 | 待审批 | - |
| 后端工程师 | 待指定 | 待审批 | - |
| 运维工程师 | 待指定 | 待审批 | - |
