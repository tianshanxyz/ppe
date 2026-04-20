# 生产环境监控和告警配置方案

## 一、监控架构设计

### 1.1 监控层次

```
┌─────────────────────────────────────────┐
│         监控展示层（Dashboard）          │
│    Grafana / Vercel Analytics / Sentry  │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│         告警通知层（Alerting）           │
│   Slack / 钉钉 / 企业微信 / 邮件 / 短信   │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│         数据采集层（Collection）         │
│  UptimeRobot / Vercel Log Drain / SDK   │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│         被监控对象（Services）           │
│  Next.js / Supabase / External APIs     │
└─────────────────────────────────────────┘
```

### 1.2 监控工具选型

| 监控对象 | 推荐工具 | 备选方案 | 成本 |
|---------|---------|---------|------|
| 应用可用性 | UptimeRobot | Pingdom | 免费 |
| 应用性能 | Vercel Analytics | Google Analytics | 免费 |
| 错误追踪 | Sentry | LogRocket | 免费额度 |
| 数据库监控 | Supabase Dashboard | 自建 Prometheus | 免费 |
| API 健康 | 自建健康检查 | UptimeRobot | 免费 |
| 日志分析 | Vercel Log Drain | Logtail | 免费额度 |

## 二、关键指标定义

### 2.1 应用性能指标

#### 响应时间
- **指标名称**: `http_response_time`
- **采集方式**: Vercel Analytics
- **告警阈值**:
  - P50 < 200ms
  - P95 < 500ms
  - P99 < 1000ms
- **告警级别**: ⚠️ Warning / 🚨 Critical

#### 错误率
- **指标名称**: `error_rate`
- **采集方式**: Sentry
- **计算公式**: (错误请求数 / 总请求数) × 100%
- **告警阈值**:
  - Warning: > 1%
  - Critical: > 5%

#### 吞吐量
- **指标名称**: `requests_per_minute`
- **采集方式**: Vercel Analytics
- **告警阈值**:
  - 异常下降：环比下降 > 50%
  - 异常上升：环比上升 > 200%

### 2.2 数据库性能指标

#### 查询响应时间
- **指标名称**: `db_query_time`
- **采集方式**: Supabase Dashboard
- **告警阈值**:
  - 平均查询时间 > 100ms
  - 慢查询数量 > 10 次/分钟

#### 连接数
- **指标名称**: `db_connections`
- **采集方式**: Supabase Dashboard
- **告警阈值**:
  - 连接数使用率 > 80%
  - 连接失败次数 > 5 次/分钟

### 2.3 外部 API 健康指标

#### FDA API
- **指标名称**: `fda_api_health`
- **采集方式**: 健康检查脚本
- **检查频率**: 每 5 分钟
- **告警阈值**: 连续 3 次检查失败

#### EUDAMED API
- **指标名称**: `eudamed_api_health`
- **采集方式**: 健康检查脚本
- **检查频率**: 每 5 分钟
- **告警阈值**: 连续 3 次检查失败

### 2.4 数据同步指标

#### 同步成功率
- **指标名称**: `sync_success_rate`
- **采集方式**: 数据同步日志
- **告警阈值**: < 95%

#### 同步延迟
- **指标名称**: `sync_latency`
- **采集方式**: 同步任务时间戳
- **告警阈值**: 延迟 > 1 小时

## 三、监控配置实施

### 3.1 UptimeRobot 配置

#### 步骤 1: 创建监控器

1. 登录 [UptimeRobot](https://uptimerobot.com/)
2. 点击 **Add New Monitor**
3. 配置监控参数：

```
Monitor Type: HTTP(s)
Friendly Name: MDLooker Production
URL: https://ppe-platform.vercel.app/api/health
Monitoring Interval: 5 minutes
```

#### 步骤 2: 配置告警联系人

1. 进入 **My Settings** → **Alert Contacts**
2. 添加联系人：
   - Email: team@mdlooker.com
   - Slack Webhook: [Webhook URL]
   - SMS: [手机号码]

#### 步骤 3: 配置告警规则

```yaml
Alert Conditions:
  - Condition: Monitor goes DOWN
    Action: Send notification immediately
  - Condition: Monitor stays DOWN for 5 minutes
    Action: Send SMS notification
  - Condition: Monitor comes back UP
    Action: Send recovery notification
```

### 3.2 Sentry 配置

#### 步骤 1: 创建项目

1. 登录 [Sentry](https://sentry.io/)
2. 创建新项目，选择 **Next.js**
3. 获取 DSN 密钥

#### 步骤 2: 集成到应用

在 `next.config.ts` 中添加：

```typescript
import { withSentryConfig } from '@sentry/nextjs';

const sentryConfig = {
  org: 'mdlooker',
  project: 'ppe-platform',
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // 性能监控配置
  tracesSampleRate: 0.1, // 10% 采样率
  
  // 错误采样配置
  sampleRate: 1.0, // 100% 错误捕获
  
  // 环境配置
  environment: process.env.NODE_ENV,
  
  // 忽略某些错误
  ignoreErrors: [
    'NetworkError',
    'AbortError'
  ]
};

export default withSentryConfig(nextConfig, sentryConfig);
```

#### 步骤 3: 配置告警规则

在 Sentry 项目中配置：

```yaml
Alert Rules:
  - Name: High Error Rate
    Condition: error_rate > 1% in 5 minutes
    Action: Send email + Slack
    Severity: Critical
    
  - Name: Application Down
    Condition: no events in 10 minutes
    Action: Send SMS + Email
    Severity: Critical
    
  - Name: Performance Degradation
    Condition: p95_latency > 1000ms in 15 minutes
    Action: Send Email
    Severity: Warning
```

### 3.3 Vercel Analytics 配置

#### 步骤 1: 启用 Analytics

1. 登录 Vercel Dashboard
2. 进入项目 → **Analytics**
3. 启用 **Web Analytics** 和 **Speed Insights**

#### 步骤 2: 配置自定义指标

在 `src/app/layout.tsx` 中添加：

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3.4 健康检查 API

创建 `/api/health` 端点：

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    services: {
      web: 'ok',
      database: 'unknown',
      external_apis: 'unknown'
    }
  };

  // 检查数据库连接
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase.from('health_check').select('id').limit(1);
    
    if (error) throw error;
    health.services.database = 'ok';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'unhealthy';
  }

  // 检查外部 API
  try {
    const response = await fetch('https://api.fda.gov/health');
    health.services.external_apis = response.ok ? 'ok' : 'error';
  } catch (error) {
    health.services.external_apis = 'error';
  }

  const status = health.status === 'healthy' ? 200 : 503;
  return NextResponse.json(health, { status });
}
```

## 四、监控 Dashboard

### 4.1 Grafana Dashboard 配置

#### 数据源配置

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true
    
  - name: Loki
    type: loki
    url: http://loki:3100
    access: proxy
    
  - name: Sentry
    type: grafana-sentry-datasource
    url: https://sentry.io/api/
    access: proxy
```

#### Dashboard 面板

**面板 1: 应用概览**
- 当前状态（UP/DOWN）
- 当前用户数
- 请求总数
- 平均响应时间

**面板 2: 性能指标**
- P50/P95/P99 响应时间趋势图
- 错误率趋势图
- 吞吐量趋势图

**面板 3: 数据库性能**
- 查询响应时间
- 连接数使用率
- 慢查询数量

**面板 4: 外部 API 健康**
- FDA API 状态
- EUDAMED API 状态
- 其他数据源状态

## 五、告警响应手册

### 5.1 告警级别定义

| 级别 | 标识 | 响应时间 | 通知渠道 |
|-----|------|---------|---------|
| Critical | 🚨 | 5 分钟内 | 短信 + 电话 + Slack |
| Warning | ⚠️ | 30 分钟内 | Slack + 邮件 |
| Info | ℹ️ | 24 小时内 | 邮件 |

### 5.2 告警处理流程

```
告警触发
    ↓
接收通知
    ↓
初步评估（5 分钟）
    ↓
┌─────────────────┐
│ 是否能自动恢复？ │
└─────────────────┘
    ↓ 是              ↓ 否
等待恢复        手动干预
    ↓              ↓
验证恢复        执行修复
    ↓              ↓
记录事件        验证修复
    ↓              ↓
归档            记录事件
```

### 5.3 常见告警处理

#### 告警 1: 应用不可用

**现象**: UptimeRobot 报告应用 DOWN

**处理步骤**:
1. 访问应用确认问题
2. 检查 Vercel 部署状态
3. 查看错误日志
4. 必要时执行回滚
5. 通知团队

#### 告警 2: 错误率过高

**现象**: Sentry 报告错误率 > 5%

**处理步骤**:
1. 查看 Sentry 错误详情
2. 识别错误类型和范围
3. 评估影响程度
4. 制定修复方案
5. 部署修复

#### 告警 3: 数据库连接失败

**现象**: 健康检查报告数据库错误

**处理步骤**:
1. 检查 Supabase 状态
2. 验证连接配置
3. 查看数据库日志
4. 联系 Supabase 支持（如需要）

## 六、成本估算

| 工具 | 免费额度 | 付费方案 | 预计成本 |
|-----|---------|---------|---------|
| UptimeRobot | 50 个监控器 | $7/月 | $0（免费） |
| Sentry | 5K 错误/月 | $26/月 | $0（免费） |
| Vercel Analytics | 内置 | 包含在 Vercel | $0 |
| Grafana Cloud | 10K 系列/月 | $49/月 | $0（自建） |

**月度总成本**: $0（使用免费额度）

## 七、后续优化

1. **添加业务指标监控**: 用户注册、付费转化等
2. **实现自动扩容**: 基于负载自动扩展资源
3. **建立 On-call 轮班**: 确保 24/7 响应能力
4. **定期演练**: 每季度进行故障演练
5. **持续优化**: 根据实际运行情况调整阈值

---

*配置日期：2026-04-20*
*负责人：AI 助手（运维工程师）*
