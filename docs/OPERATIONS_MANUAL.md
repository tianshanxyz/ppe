# MDLooker 运维操作手册

## 文档信息

| 项目 | 内容 |
|-----|------|
| **文档名称** | MDLooker 运维操作手册 |
| **版本** | 1.0.0 |
| **创建日期** | 2026-04-20 |
| **负责人** | AI 助手（运维工程师） |
| **适用范围** | 生产环境运维团队 |

---

## 目录

1. [系统架构](#系统架构)
2. [日常运维](#日常运维)
3. [故障排查](#故障排查)
4. [应急预案](#应急预案)
5. [性能优化](#性能优化)
6. [变更管理](#变更管理)

---

## 系统架构

### 架构概览

```
┌─────────────────────────────────────────┐
│            用户层（Users）               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CDN（Vercel Edge Network）       │
│         全球节点、DDoS 防护               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        应用层（Vercel - Next.js）        │
│   - SSR/SSG                            │
│   - API Routes                         │
│   - 自动扩展                            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        数据层（Supabase - PostgreSQL）   │
│   - 主数据库                            │
│   - 实时订阅                            │
│   - 自动备份                            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       外部服务（External APIs）          │
│   - FDA API                            │
│   - EUDAMED                            │
│   - NMPA                               │
└─────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本 | 说明 |
|-----|------|------|------|
| 前端 | Next.js | 16.x | React 框架 |
| 后端 | Next.js API Routes | - | Serverless 函数 |
| 数据库 | PostgreSQL | 15.x | 关系型数据库 |
| ORM | Supabase JS | 2.x | 数据库客户端 |
| 部署 | Vercel | - | Serverless 平台 |
| 监控 | Sentry | - | 错误追踪 |
| 分析 | Vercel Analytics | - | 性能分析 |

---

## 日常运维

### 每日检查清单

#### 早晨检查（9:00 AM）

- [ ] 检查应用可用性（UptimeRobot）
- [ ] 查看错误日志（Sentry）
- [ ] 检查数据库性能（Supabase Dashboard）
- [ ] 验证外部 API 健康状态
- [ ] 查看夜间备份状态

#### 下午检查（3:00 PM）

- [ ] 检查性能指标（Vercel Analytics）
- [ ] 查看用户反馈
- [ ] 监控系统资源使用
- [ ] 检查数据同步状态

#### 晚上检查（9:00 PM）

- [ ] 生成日报
- [ ] 检查当日告警
- [ ] 确认备份执行
- [ ] 记录运维日志

### 每周运维任务

| 任务 | 频率 | 负责人 | 说明 |
|-----|------|--------|------|
| 性能报告 | 每周一 | 运维工程师 | 生成上周性能报告 |
| 备份验证 | 每周三 | 运维工程师 | 验证备份文件完整性 |
| 安全扫描 | 每周五 | 运维工程师 | 依赖漏洞扫描 |
| 容量规划 | 每月 | 技术负责人 | 资源使用评估 |

### 监控指标

#### 应用性能指标

| 指标 | 目标值 | 告警阈值 | 采集方式 |
|-----|--------|---------|---------|
| 响应时间 P50 | < 200ms | > 300ms | Vercel Analytics |
| 响应时间 P95 | < 500ms | > 1000ms | Vercel Analytics |
| 响应时间 P99 | < 1000ms | > 2000ms | Vercel Analytics |
| 错误率 | < 1% | > 5% | Sentry |
| 可用性 | > 99.9% | < 99% | UptimeRobot |

#### 数据库指标

| 指标 | 目标值 | 告警阈值 | 采集方式 |
|-----|--------|---------|---------|
| 查询时间 | < 50ms | > 100ms | Supabase |
| 连接数 | < 80% | > 90% | Supabase |
| 存储空间 | < 70% | > 85% | Supabase |
| CPU 使用率 | < 60% | > 80% | Supabase |

---

## 故障排查

### 故障分级

| 级别 | 标识 | 响应时间 | 示例 |
|-----|------|---------|------|
| P0 | 🔴 Critical | 5 分钟 | 应用完全不可用、数据丢失 |
| P1 | 🟠 High | 30 分钟 | 核心功能异常、高错误率 |
| P2 | 🟡 Medium | 2 小时 | 非核心功能异常 |
| P3 | 🟢 Low | 24 小时 | UI 问题、性能下降 |

### 故障排查流程

```
故障发现
    ↓
初步评估（定级）
    ↓
┌─────────────────┐
│ P0/P1 故障？     │
└─────────────────┘
    ↓ 是              ↓ 否
启动应急预案      正常排查流程
    ↓              ↓
通知团队        定位问题
    ↓              ↓
执行修复        实施修复
    ↓              ↓
验证恢复        验证修复
    ↓              ↓
事后复盘        记录归档
```

### 常见故障排查

#### 故障 1: 应用无法访问

**症状**:
- 用户报告网站打不开
- UptimeRobot 告警应用 DOWN

**排查步骤**:

```bash
# 1. 确认故障范围
curl -I https://ppe-platform.vercel.app

# 2. 检查 Vercel 状态
vercel ls

# 3. 查看部署状态
vercel --prod

# 4. 检查错误日志
vercel logs --prod --level=error

# 5. 检查健康端点
curl https://ppe-platform.vercel.app/api/health
```

**可能原因**:
1. Vercel 平台故障
2. DNS 解析问题
3. 部署失败
4. 应用崩溃

**解决方案**:
1. 查看 Vercel 状态页：https://vercel.com/status
2. 检查 DNS 配置
3. 回滚到上一个稳定版本
4. 联系 Vercel 支持

#### 故障 2: 数据库连接失败

**症状**:
- API 返回 500 错误
- 错误日志显示数据库连接超时

**排查步骤**:

```bash
# 1. 检查 Supabase 状态
# 访问：https://supabase.com/dashboard

# 2. 验证连接配置
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 3. 测试数据库连接
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT 1"

# 4. 查看数据库日志
# Supabase Dashboard → Logs
```

**可能原因**:
1. Supabase 服务故障
2. 连接字符串错误
3. 网络问题
4. 连接数耗尽

**解决方案**:
1. 查看 Supabase 状态：https://status.supabase.com
2. 检查环境变量
3. 重启应用（重新部署）
4. 联系 Supabase 支持

#### 故障 3: 错误率飙升

**症状**:
- Sentry 告警错误率 > 5%
- 用户报告功能异常

**排查步骤**:

```bash
# 1. 查看 Sentry 错误详情
# 访问：https://sentry.io/organizations/mdlooker

# 2. 识别错误类型
- JavaScript 错误？
- API 错误？
- 数据库错误？

# 3. 查看错误分布
- 哪个页面错误最多？
- 哪个 API 错误最多？

# 4. 检查最近的部署
vercel ls
```

**可能原因**:
1. 代码 bug
2. 数据异常
3. 第三方服务故障
4. 配置错误

**解决方案**:
1. 修复代码并重新部署
2. 清理异常数据
3. 切换备用服务
4. 回滚部署

#### 故障 4: 性能下降

**症状**:
- 页面加载缓慢
- API 响应时间增加

**排查步骤**:

```bash
# 1. 检查性能指标
# Vercel Analytics → Performance

# 2. 识别慢查询
# Supabase Dashboard → Database → Slow queries

# 3. 检查资源使用
# 查看 CPU、内存、网络使用率

# 4. 运行性能测试
lighthouse https://ppe-platform.vercel.app
```

**可能原因**:
1. 数据库慢查询
2. 网络延迟
3. 资源不足
4. 缓存失效

**解决方案**:
1. 优化数据库查询
2. 启用 CDN 缓存
3. 升级资源
4. 重建缓存

---

## 应急预案

### 预案 1: 应用完全不可用

**触发条件**:
- 应用持续不可用超过 5 分钟
- 所有用户无法访问

**应急步骤**:

```bash
# 步骤 1: 确认故障
curl -f https://ppe-platform.vercel.app/api/health

# 步骤 2: 通知团队
# 发送 Slack/钉钉/企业微信通知

# 步骤 3: 检查 Vercel 状态
# https://vercel.com/status

# 步骤 4: 尝试重新部署
vercel --prod --force

# 步骤 5: 如无效，回滚到上一版本
vercel rollback

# 步骤 6: 联系 Vercel 支持
# https://vercel.com/support
```

**恢复验证**:
```bash
curl -f https://ppe-platform.vercel.app/api/health
```

### 预案 2: 数据丢失

**触发条件**:
- 用户报告数据丢失
- 数据库表损坏

**应急步骤**:

```bash
# 步骤 1: 确认数据丢失范围
# 检查受影响的用户和数据表

# 步骤 2: 停止数据同步任务
# 防止进一步损坏

# 步骤 3: 评估恢复方案
# - 从备份恢复
# - 手动修复数据

# 步骤 4: 执行恢复
./scripts/restore-database.sh latest.dump.gz

# 步骤 5: 验证数据完整性
# 运行数据验证脚本

# 步骤 6: 通知用户
# 发送数据恢复通知
```

### 预案 3: 安全事件

**触发条件**:
- 发现安全漏洞
- 数据泄露
- 未授权访问

**应急步骤**:

```bash
# 步骤 1: 隔离受影响系统
# 限制访问、断开连接

# 步骤 2: 收集证据
# 保存日志、截图

# 步骤 3: 评估影响
# 确定泄露范围和程度

# 步骤 4: 修复漏洞
# 打补丁、修改配置

# 步骤 5: 重置密钥
# 轮换所有访问密钥

# 步骤 6: 通知相关方
# 用户、监管机构

# 步骤 7: 事后分析
# 编写安全事件报告
```

---

## 性能优化

### 前端优化

#### 1. 启用缓存

```typescript
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-cache' }
      ]
    },
    {
      source: '/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
      ]
    }
  ]
};
```

#### 2. 图片优化

```typescript
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={800}
  height={600}
  loading="lazy"
  quality={75}
/>
```

#### 3. 代码分割

```typescript
// 动态导入
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
});
```

### 后端优化

#### 1. 数据库查询优化

```typescript
// 使用索引
// CREATE INDEX idx_products_name ON products(name);

// 避免 N+1 查询
const products = await supabase
  .from('products')
  .select('*, companies(name)')  // 关联查询
  .eq('category', 'PPE');
```

#### 2. 启用缓存

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// 缓存查询结果
async function getProducts(category: string) {
  const cacheKey = `products:${category}`;
  
  // 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // 从数据库查询
  const products = await queryDatabase(category);
  
  // 写入缓存（5 分钟过期）
  await redis.setex(cacheKey, 300, JSON.stringify(products));
  
  return products;
}
```

### CDN 优化

#### 配置边缘缓存

```json
// vercel.json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 变更管理

### 变更类型

| 类型 | 说明 | 审批要求 | 示例 |
|-----|------|---------|------|
| 标准变更 | 低风险、常规 | 自动审批 | 代码部署、配置更新 |
| 一般变更 | 中等风险 | 技术负责人审批 | 数据库迁移、架构调整 |
| 重大变更 | 高风险 | 项目负责人审批 | 核心系统升级、数据迁移 |

### 变更流程

```
变更申请
    ↓
风险评估
    ↓
┌─────────────────┐
│ 变更类型？       │
└─────────────────┘
    ↓
标准变更 → 自动审批 → 执行变更
一般变更 → 技术审批 → 执行变更
重大变更 → 负责人审批 → 执行变更
    ↓
验证变更
    ↓
记录归档
```

### 变更窗口

| 变更类型 | 允许时间 | 说明 |
|---------|---------|------|
| 标准变更 | 工作日 9:00-18:00 | 避开业务高峰 |
| 一般变更 | 工作日 10:00-16:00 | 预留回滚时间 |
| 重大变更 | 周末或凌晨 | 最小化影响 |

### 变更检查清单

#### 部署前检查

- [ ] 代码审查通过
- [ ] 测试通过（单元 + E2E）
- [ ] 性能测试通过
- [ ] 备份已执行
- [ ] 回滚方案准备
- [ ] 团队通知

#### 部署后检查

- [ ] 健康检查通过
- [ ] 核心功能验证
- [ ] 性能指标正常
- [ ] 错误率正常
- [ ] 用户反馈收集

---

## 附录

### A. 常用命令

```bash
# 部署
vercel --prod

# 查看日志
vercel logs --prod

# 回滚
vercel rollback

# 健康检查
curl https://ppe-platform.vercel.app/api/health

# 性能测试
lighthouse https://ppe-platform.vercel.app

# 数据库备份
./scripts/backup-database.sh

# 数据库恢复
./scripts/restore-database.sh backup.dump.gz
```

### B. 联系清单

| 角色 | 联系方式 | 说明 |
|-----|---------|------|
| 运维负责人 | AI 助手 | 7x24 小时 |
| 技术负责人 | AI 助手 | 工作时间 |
| Vercel 支持 | https://vercel.com/support | 工单系统 |
| Supabase 支持 | https://supabase.com/support | 工单系统 |

### C. 文档索引

| 文档 | 路径 | 说明 |
|-----|------|------|
| 部署指南 | `docs/DEPLOYMENT_GUIDE.md` | 详细部署步骤 |
| 监控配置 | `docs/MONITORING_SETUP.md` | 监控和告警 |
| 备份策略 | `docs/BACKUP_STRATEGY.md` | 备份和恢复 |
| Secrets 配置 | `.github/SECRETS_GUIDE.md` | 密钥管理 |

---

*最后更新：2026-04-20*
*维护者：AI 助手（运维工程师）*
*下次审查日期：2026-05-20*
