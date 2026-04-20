# 制造商信用评分系统

## 概述

制造商信用评分系统是一个基于规则引擎的4维度评分算法，用于评估PPE制造商的信用风险。

## 评分维度

### 1. 合规历史分 (40%)

基于制造商的认证历史和合规记录计算：

- **认证总数**：拥有的认证数量
- **活跃认证比例**：活跃认证占总认证的比例
- **平均认证持续时间**：认证的平均有效期
- **认证趋势**：近期认证数量变化趋势

**计算公式**：
```
合规历史分 = 活跃比例 × 50 + 持续时间得分 + 无撤销加分
```

### 2. 风险事件分 (30%)

基于负面合规事件计算：

- **产品召回**：每次召回扣20分
- **警告信**：每封警告信扣10分
- **进口警报**：每次扣15分
- **事件趋势**：近期事件变化趋势

**计算公式**：
```
风险事件分 = 100 - (召回数 × 20 + 警告信数 × 10 + 进口警报 × 15)
```

### 3. 活跃度分 (20%)

基于近期业务活动计算：

- **去年新认证**：每年2个认证得40分
- **近6个月认证**：额外加分
- **新市场拓展**：进入新市场的数量
- **活动频率**：高/中/低频

**计算公式**：
```
活跃度分 = min(100, 去年认证数 × 20 + 近6月认证数 × 10)
```

### 4. 多样性分 (10%)

基于市场覆盖和产品多样性计算：

- **市场覆盖**：覆盖的国际市场数量（加权）
- **产品类别**：产品类别多样性
- **认证类型**：拥有的认证类型数量
- **监管框架**：通过的监管体系

**市场权重**：
- 美国 (US): 1.0
- 欧盟 (EU): 0.9
- 中国 (CN): 0.8
- 日本 (JP): 0.7
- 其他: 0.4-0.6

## 风险等级

| 等级 | 分数范围 | 描述 |
|------|----------|------|
| 低风险 | 80-100 | 优秀的合规记录，值得信赖 |
| 中等风险 | 60-79 | 整体良好，有改进空间 |
| 高风险 | 40-59 | 存在合规风险，需谨慎 |
| 极高风险 | 0-39 | 严重合规问题，不建议合作 |

## API 接口

### 1. 计算信用评分

```http
POST /api/credit-score
Content-Type: application/json

{
  "manufacturer_id": "uuid",
  "force_recalculate": false,
  "include_explanation": true
}
```

**响应**：
```json
{
  "success": true,
  "score": {
    "overall_score": 85,
    "risk_level": "low",
    "dimensions": {
      "compliance_history": { "score": 90, ... },
      "risk_events": { "score": 95, ... },
      "activity": { "score": 70, ... },
      "diversity": { "score": 80, ... }
    },
    "risk_factors": [],
    "positive_factors": [...]
  },
  "explanation": {
    "summary": "该制造商信用评分为85分...",
    "key_strengths": [...],
    "key_concerns": [...],
    "recommendations": [...]
  },
  "processing_time_ms": 150
}
```

### 2. 获取信用评分

```http
GET /api/credit-score?manufacturer_id=uuid&include_explanation=true&include_history=true
```

### 3. 批量计算

```http
PATCH /api/credit-score
Content-Type: application/json

{
  "manufacturer_ids": ["uuid1", "uuid2"]
}
```

### 4. 对比评分

```http
POST /api/credit-score/compare
Content-Type: application/json

{
  "manufacturer_ids": ["uuid1", "uuid2", "uuid3"]
}
```

## 使用示例

### 计算单个制造商评分

```typescript
import { creditScoreCalculator, scoreExplainer } from '@/lib/ai/credit-score'

// 计算评分
const score = await creditScoreCalculator.calculate('manufacturer-uuid')

// 生成解释
const explanation = scoreExplainer.explain(score)
console.log(explanation.summary)
console.log(explanation.recommendations)
```

### 批量计算

```typescript
// 批量计算所有制造商
const response = await fetch('/api/credit-score', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})

const result = await response.json()
console.log(`处理完成：${result.processed_count}个成功`)
```

### 对比制造商

```typescript
const response = await fetch('/api/credit-score/compare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    manufacturer_ids: ['uuid1', 'uuid2', 'uuid3']
  })
})

const result = await response.json()
console.log(result.analysis)
```

## 评分解释

系统提供详细的评分解释，包括：

1. **总体摘要**：评分概况和风险等级
2. **维度详解**：各维度得分和关键指标
3. **关键优势**：制造商的突出表现
4. **关键风险**：需要关注的问题
5. **改进建议**：提升评分的具体建议

## 性能指标

- **计算时间**：< 200ms（单个制造商）
- **缓存策略**：7天自动刷新
- **并发限制**：60 req/min
- **批量限制**：每次最多100个制造商

## 数据库表

### manufacturer_credit_scores

存储历史评分记录：

```sql
CREATE TABLE manufacturer_credit_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id UUID REFERENCES ppe_manufacturers_enhanced(id),
  overall_score INTEGER,
  dimension_scores JSONB,
  risk_level VARCHAR(20),
  calculated_at TIMESTAMP DEFAULT NOW(),
  version VARCHAR(10)
);
```

## 文件结构

```
src/lib/ai/credit-score/
├── types.ts          # 类型定义
├── calculator.ts     # 评分计算引擎
├── explainer.ts      # 评分解释器
└── index.ts          # 主入口

src/app/api/credit-score/
├── route.ts          # 评分API
└── compare/
    └── route.ts      # 对比API
```

## 未来优化

1. **机器学习模型**：引入XGBoost等模型提升准确性
2. **实时更新**：监听数据库变更自动重算
3. **行业细分**：按产品类别分别计算基准
4. **预测功能**：预测未来风险趋势
