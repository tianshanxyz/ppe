# 法规变更影响分析系统 (A-008)

## 概述

法规变更影响分析系统用于监控法规变更，识别受影响的产品和企业，并生成详细的影响报告。

## 核心特性

- **法规监控**: 自动监控法规变更（新增、修订、废止）
- **影响分析**: 评估变更对产品、企业、类别、市场的影响
- **严重程度评估**: 基于多维度评分确定影响严重程度
- **报告生成**: 支持 Markdown、HTML、JSON 多种格式
- **监控任务**: 可配置的监控任务管理

## 快速开始

### 1. 执行影响分析

```bash
curl -X POST https://your-api.com/api/regulation-impact/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "change": {
      "id": "change_001",
      "regulation_id": "reg_001",
      "regulation_title": "FDA 510(k) 新规",
      "jurisdiction": "US",
      "change_type": "amended",
      "change_summary": "修订了510(k)提交要求",
      "changed_fields": ["content", "effective_date"],
      "current_version": "2026-04-20",
      "effective_date": "2026-06-01",
      "announced_date": "2026-04-20",
      "keywords": ["medical device", "510(k)", "FDA"],
      "confidence": 0.95
    },
    "analysis_depth": "comprehensive"
  }'
```

### 2. 生成影响报告

```bash
curl -X POST https://your-api.com/api/regulation-impact/report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "2026年4月法规变更影响报告",
    "changes": [
      {
        "id": "change_001",
        "regulation_id": "reg_001",
        "regulation_title": "FDA 510(k) 新规",
        "jurisdiction": "US",
        "change_type": "amended",
        "change_summary": "修订了510(k)提交要求",
        "changed_fields": ["content"],
        "current_version": "2026-04-20",
        "effective_date": "2026-06-01",
        "announced_date": "2026-04-20",
        "keywords": ["medical device", "510(k)"],
        "confidence": 0.95
      }
    ],
    "format": "markdown"
  }'
```

### 3. 创建监控任务

```bash
curl -X POST https://your-api.com/api/regulation-impact/monitor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FDA法规监控",
    "config": {
      "jurisdictions": ["US"],
      "categories": ["Respiratory Protection"],
      "keywords": ["510(k)", "PPE"],
      "check_interval_hours": 24,
      "alert_threshold": "medium"
    }
  }'
```

## API 接口

### 执行影响分析

```http
POST /api/regulation-impact/analyze
Content-Type: application/json

{
  "change": {
    "id": "change_001",
    "regulation_id": "reg_001",
    "regulation_title": "FDA 510(k) 新规",
    "jurisdiction": "US",
    "change_type": "amended",
    "change_summary": "修订了510(k)提交要求",
    "changed_fields": ["content"],
    "current_version": "2026-04-20",
    "effective_date": "2026-06-01",
    "announced_date": "2026-04-20",
    "keywords": ["medical device", "510(k)"],
    "confidence": 0.95
  },
  "analysis_depth": "comprehensive",
  "include_historical_data": false
}
```

**响应示例**:

```json
{
  "success": true,
  "analysis": {
    "change": { ... },
    "scope": "category",
    "severity": "high",
    "affected_products": [
      {
        "product_id": "prod_001",
        "product_name": "N95 Respirator",
        "manufacturer_id": "comp_001",
        "manufacturer_name": "3M Company",
        "impact_severity": "high",
        "impact_description": "产品需要重新认证以符合新法规要求",
        "required_actions": ["更新技术文档", "重新提交认证申请"],
        "deadline": "2026-12-01",
        "estimated_cost": 50000
      }
    ],
    "affected_companies": [
      {
        "company_id": "comp_001",
        "company_name": "3M Company",
        "impact_severity": "high",
        "impact_description": "有 1 个产品受到影响",
        "affected_products_count": 1,
        "affected_markets": ["US"],
        "required_actions": ["更新技术文档", "重新提交认证申请"],
        "estimated_compliance_cost": 50000,
        "estimated_timeline_days": 180
      }
    ],
    "affected_categories": ["Respiratory Protection"],
    "affected_markets": ["US"],
    "summary": "法规变更影响分析：FDA 510(k) 新规\n严重程度：高\n影响范围：1 个产品，1 家企业\n...",
    "recommendations": [
      "立即成立法规响应小组，评估全面影响",
      "联系法律顾问，确认合规要求",
      "对比新旧版本，识别具体变更点"
    ],
    "analysis_timestamp": "2026-04-20T10:00:00Z"
  },
  "processing_time_ms": 150
}
```

### 生成影响报告

```http
POST /api/regulation-impact/report
Content-Type: application/json

{
  "title": "法规变更影响报告",
  "description": "2026年4月法规变更影响分析",
  "changes": [...],
  "analysis_depth": "detailed",
  "format": "markdown",
  "valid_days": 30
}
```

**响应格式**:
- `format: "json"` - 返回JSON格式的报告数据
- `format: "markdown"` - 返回Markdown文件下载
- `format: "html"` - 返回HTML文件下载

### 监控任务管理

#### 获取监控任务列表

```http
GET /api/regulation-impact/monitor
```

#### 获取单个监控任务

```http
GET /api/regulation-impact/monitor?id=task_xxx
```

#### 创建监控任务

```http
POST /api/regulation-impact/monitor
Content-Type: application/json

{
  "name": "FDA法规监控",
  "config": {
    "jurisdictions": ["US", "EU"],
    "categories": ["Respiratory Protection", "Hand Protection"],
    "keywords": ["510(k)", "CE", "PPE"],
    "check_interval_hours": 24,
    "alert_threshold": "medium",
    "notification_channels": ["email", "dashboard"]
  }
}
```

#### 更新监控任务

```http
PATCH /api/regulation-impact/monitor
Content-Type: application/json

{
  "id": "task_xxx",
  "updates": {
    "is_active": false
  }
}
```

#### 删除监控任务

```http
DELETE /api/regulation-impact/monitor?id=task_xxx
```

## 变更类型

| 类型 | 说明 | 影响权重 |
|------|------|----------|
| new | 新法规 | +30 |
| amended | 修订 | +25 |
| repealed | 废止 | +40 |
| interpretation | 解释说明 | +10 |
| guidance | 指导文件 | +10 |

## 严重程度评估

### 评分维度

1. **变更类型** (40%): 新法规、修订、废止等
2. **影响范围** (30%): 全局、市场、类别、企业、产品
3. **关键词** (20%): 禁止、强制、立即等敏感词
4. **置信度** (10%): 变更检测的置信度

### 严重程度分级

| 级别 | 分数范围 | 说明 | 颜色 |
|------|----------|------|------|
| CRITICAL | ≥70 | 严重 - 必须立即采取行动 | 🔴 #dc2626 |
| HIGH | 50-69 | 高 - 需要尽快处理 | 🟠 #ea580c |
| MEDIUM | 30-49 | 中 - 需要关注 | 🟡 #ca8a04 |
| LOW | <30 | 低 - 一般性了解 | 🟢 #16a34a |

### 影响范围

| 范围 | 说明 |
|------|------|
| GLOBAL | 全局级别 - 影响整个行业 |
| MARKET | 市场级别 - 影响特定市场 |
| CATEGORY | 类别级别 - 影响产品类别 |
| COMPANY | 企业级别 - 影响特定企业 |
| PRODUCT | 产品级别 - 影响特定产品 |

## 分析深度

| 深度 | 说明 | 响应时间 |
|------|------|----------|
| basic | 基础分析 - 仅评估严重程度 | <50ms |
| detailed | 详细分析 - 识别受影响产品和企业 | <200ms |
| comprehensive | 全面分析 - 包含建议和行动项 | <500ms |

## 报告格式

### Markdown 报告

包含以下内容：
- 执行摘要
- 严重程度分布表格
- 详细分析（每个法规）
- 受影响产品列表
- 建议汇总

### HTML 报告

包含以下内容：
- 美观的统计卡片
- 交互式表格
- 颜色编码的严重程度
- 打印友好的布局

### JSON 报告

完整的结构化数据，包含所有分析结果。

## 使用示例

### 示例1：基础影响分析

```typescript
import { impactAnalyzer } from '@/lib/ai/regulation-impact'

const analysis = await impactAnalyzer.analyze({
  change: regulationChange,
  analysis_depth: 'detailed',
  include_historical_data: false,
})

console.log(`严重程度: ${analysis.severity}`)
console.log(`受影响产品: ${analysis.affected_products.length}`)
console.log(`受影响企业: ${analysis.affected_companies.length}`)
```

### 示例2：生成并下载报告

```typescript
import { impactAnalyzer, reportGenerator } from '@/lib/ai/regulation-impact'

// 分析多个法规变更
const analyses = []
for (const change of changes) {
  const analysis = await impactAnalyzer.analyze({
    change,
    analysis_depth: 'comprehensive',
  })
  analyses.push(analysis)
}

// 生成报告
const report = reportGenerator.generateReport(
  '月度法规变更影响报告',
  '2026年4月法规变更分析',
  analyses,
  30
)

// 获取Markdown格式
const markdown = reportGenerator.generateMarkdownReport(report)
```

### 示例3：创建监控任务

```typescript
import { regulationMonitor } from '@/lib/ai/regulation-impact'

const task = regulationMonitor.createTask('欧盟PPE法规监控', {
  jurisdictions: ['EU'],
  categories: ['Respiratory Protection', 'Hand Protection'],
  keywords: ['PPE', 'CE', 'certification'],
  check_interval_hours: 24,
  alert_threshold: 'medium',
})

console.log(`监控任务已创建: ${task.id}`)
```

### 示例4：获取监控统计

```typescript
const stats = regulationMonitor.getStatistics()
console.log(`总任务数: ${stats.total_tasks}`)
console.log(`活跃任务: ${stats.active_tasks}`)
console.log(`检测到变更: ${stats.tasks_with_changes}`)
```

## 配置参数

```typescript
{
  jurisdictions: ['US', 'EU', 'CN', 'JP', 'UK'],  // 监控的司法管辖区
  categories: [                                    // 监控的产品类别
    'Respiratory Protection',
    'Hand Protection',
    'Eye Protection',
    'Body Protection',
    'Head Protection',
    'Foot Protection',
    'Hearing Protection',
    'Fall Protection',
  ],
  keywords: ['PPE', 'certification', 'standard'],  // 监控的关键词
  check_interval_hours: 24,                       // 检查间隔（小时）
  alert_threshold: 'medium',                      // 告警阈值
  notification_channels: ['email', 'dashboard'],  // 通知渠道
}
```

## 性能指标

| 操作 | 平均时间 | 最大时间 |
|------|----------|----------|
| 基础分析 | 50ms | 100ms |
| 详细分析 | 200ms | 500ms |
| 全面分析 | 500ms | 1000ms |
| 报告生成 | 100ms | 300ms |
| 监控任务检查 | 500ms | 2000ms |

## 应用场景

1. **合规部门**: 监控法规变更，评估对企业的影响
2. **产品经理**: 了解产品合规状态，规划产品更新
3. **风险管理**: 识别合规风险，制定应对策略
4. **高层决策**: 获取法规趋势，支持战略决策
5. **客户通知**: 主动通知客户法规变更及其影响

## 未来优化

1. **实时推送**: WebSocket实时推送法规变更
2. **机器学习**: 训练模型预测法规变更趋势
3. **自动集成**: 与外部法规数据库自动同步
4. **邮件通知**: 自动发送影响报告邮件
5. **仪表盘**: 可视化展示法规影响趋势
