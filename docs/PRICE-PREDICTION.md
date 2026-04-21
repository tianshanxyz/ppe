# 价格预测模型 (A-009)

## 概述

价格预测模型用于预测PPE产品认证成本和市场价格趋势，帮助企业制定预算规划和市场策略。

## 核心特性

- **认证成本预测**: 基于行业基准数据预测各类认证成本
- **市场价格趋势**: 分析历史数据预测未来价格走势
- **成本优化建议**: 提供节省认证成本的策略建议
- **最优路径规划**: 生成最优的认证申请顺序和方案
- **ROI分析**: 计算认证投资回报率

## 快速开始

### 1. 获取认证成本预测

```bash
curl -X POST https://your-api.com/api/price-prediction \
  -H "Content-Type: application/json" \
  -d '{
    "cost_requests": [
      {
        "certification_type": "fda_510k",
        "product_category": "respiratory",
        "market_region": "us",
        "product_complexity": "medium",
        "company_size": "medium",
        "urgency_level": "normal"
      }
    ]
  }'
```

### 2. 获取市场价格趋势

```bash
curl "https://your-api.com/api/price-prediction/trend?category=respiratory&market=us&compare=eu,china"
```

### 3. 获取最优认证路径

```bash
curl -X POST https://your-api.com/api/price-prediction/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "product_category": "respiratory",
    "target_markets": ["us", "eu", "china"],
    "budget_constraint": 100000,
    "time_constraint": 12,
    "expected_revenue": 500000
  }'
```

## API 接口

### 价格预测

```http
POST /api/price-prediction
Content-Type: application/json

{
  "cost_requests": [
    {
      "certification_type": "fda_510k",
      "product_category": "respiratory",
      "market_region": "us",
      "product_complexity": "medium",
      "company_size": "medium",
      "urgency_level": "normal"
    }
  ],
  "price_requests": [
    {
      "product_category": "respiratory",
      "market_region": "us",
      "timeframe": "medium_term"
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "result": {
    "cost_predictions": [
      {
        "certification_type": "fda_510k",
        "product_category": "respiratory",
        "market_region": "us",
        "total_cost_min": 15000,
        "total_cost_max": 75000,
        "total_cost_typical": 35000,
        "cost_breakdown": [
          {
            "cost_type": "application_fee",
            "min_cost": 3500,
            "max_cost": 3500,
            "typical_cost": 3500,
            "currency": "USD",
            "notes": "FDA申请费"
          }
        ],
        "timeline_months_min": 3,
        "timeline_months_max": 12,
        "timeline_months_typical": 6,
        "confidence_score": 0.92,
        "last_updated": "2026-04-20T10:00:00Z"
      }
    ],
    "price_trends": [...],
    "optimization_suggestions": [...],
    "generated_at": "2026-04-20T10:00:00Z",
    "valid_until": "2026-05-20T10:00:00Z"
  },
  "processing_time_ms": 45
}
```

### 获取可用选项

```http
GET /api/price-prediction?type=options
```

### 认证路径优化

```http
POST /api/price-prediction/optimize
Content-Type: application/json

{
  "product_category": "respiratory",
  "target_markets": ["us", "eu", "china"],
  "budget_constraint": 100000,
  "time_constraint": 12,
  "expected_revenue": 500000
}
```

**响应示例**:
```json
{
  "success": true,
  "optimal_path": {
    "recommendedPath": [...],
    "totalCost": {
      "min": 75000,
      "max": 150000,
      "typical": 96000
    },
    "totalTimeline": {
      "min": 8,
      "max": 20,
      "typical": 12
    },
    "phases": [
      {
        "phase": 1,
        "certifications": [...],
        "estimatedCost": 28000,
        "estimatedTimeline": 6
      }
    ],
    "savings": [
      {
        "description": "批量认证折扣",
        "amount": 15000
      }
    ]
  },
  "roi_analysis": {
    "roi": 420.5,
    "paybackPeriod": 2.3,
    "netProfit": 404000,
    "breakEvenUnits": 1920
  }
}
```

### 价格趋势查询

```http
GET /api/price-prediction/trend?category=respiratory&market=us&compare=eu,china
```

**响应示例**:
```json
{
  "success": true,
  "trend": {
    "product_category": "respiratory",
    "market_region": "us",
    "current_price": 2.45,
    "price_unit": "USD/unit",
    "trend": "stable",
    "trend_strength": 0.75,
    "change_percent_30d": 1.2,
    "change_percent_90d": 3.5,
    "change_percent_1y": 8.2,
    "historical_data": [...],
    "forecast": [
      {
        "timeframe": "short_term",
        "predicted_price": 2.52,
        "confidence_interval_low": 2.39,
        "confidence_interval_high": 2.65,
        "confidence_score": 0.85,
        "factors": [...]
      }
    ]
  },
  "alert_thresholds": {
    "low": 2.21,
    "high": 2.69,
    "current": 2.45
  }
}
```

## 支持的类型

### 认证类型
- `fda_510k` - FDA 510(k)
- `fda_pma` - FDA PMA
- `ce_mark` - CE认证
- `iso_13485` - ISO 13485
- `niosh` - NIOSH认证
- `gb_standard` - 国标
- `jis` - 日本工业标准
- `csa` - 加拿大标准
- `tga` - 澳大利亚TGA
- `anvisa` - 巴西ANVISA

### 产品类别
- `respiratory` - 呼吸防护
- `hand_protection` - 手部防护
- `eye_protection` - 眼部防护
- `body_protection` - 身体防护
- `head_protection` - 头部防护
- `foot_protection` - 足部防护
- `hearing_protection` - 听力防护
- `fall_protection` - 坠落防护

### 市场区域
- `us` - 美国
- `eu` - 欧盟
- `china` - 中国
- `japan` - 日本
- `uk` - 英国
- `canada` - 加拿大
- `australia` - 澳大利亚
- `brazil` - 巴西

## 成本优化策略

### 1. 时机优化
- 避开申请高峰期（节假日、财年末）
- 利用审核机构工作负荷较低时段
- 潜在节省：3-8%

### 2. 批量认证
- 同时申请多个认证享受打包折扣
- 2个认证：5%折扣
- 3个认证：10%折扣
- 4个认证：15%折扣
- 5个及以上：20%折扣

### 3. 替代方案
- FDA PMA → FDA 510(k)：节省60%
- 优先CE认证再转FDA：节省25%
- 先建立ISO 13485体系：节省15%

### 4. 谈判策略
- 多家测试实验室比价
- 长期合作协议获取批量折扣
- 部分工作内部完成
- 选择按项目计费而非按小时

## 性能指标

- 成本预测响应时间: < 50ms
- 价格趋势响应时间: < 100ms
- 路径优化响应时间: < 200ms
- 并发限制: 60 req/min

## 数据更新

- 成本数据基于2024-2025年行业基准
- 价格趋势数据每日更新
- 预测结果有效期：30天

## 注意事项

1. 成本预测仅供参考，实际费用可能因具体情况而异
2. 价格趋势基于历史数据分析，不构成投资建议
3. 汇率波动可能影响跨国认证成本
4. 法规变更可能影响认证要求和费用
