# 市场准入推荐引擎 (A-004)

## 概述

市场准入推荐引擎基于产品特性和企业资质，智能推荐最优的市场准入路径。

## 核心特性

- **多维度评估**: 产品适配度、市场机会、准入难度、成本效率、上市速度
- **个性化推荐**: 根据企业已有认证和预算时间约束定制推荐
- **认证互认**: 自动识别已有认证在新市场的优势
- **详细路径**: 提供具体的准入路径、时间、成本估算
- **比较分析**: 多市场对比矩阵，便于决策

## 快速开始

### 1. 获取市场列表

```bash
curl https://your-api.com/api/markets
```

### 2. 生成市场准入推荐

```bash
curl -X POST https://your-api.com/api/market-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "product": {
      "product_type": "口罩",
      "product_category": "呼吸防护",
      "ppe_category": "II",
      "intended_use": ["医疗防护", "工业防护"],
      "target_users": ["医护人员", "工业工人"]
    },
    "company": {
      "company_name": "ABC Manufacturing",
      "existing_certifications": [
        {
          "type": "CE",
          "market": "EU",
          "status": "active"
        }
      ],
      "manufacturing_capabilities": {
        "iso_certified": true,
        "has_qms": true
      }
    },
    "preferences": {
      "prioritize_speed": false,
      "prioritize_cost": false,
      "prioritize_market_size": true
    },
    "constraints": {
      "max_recommendations": 5
    }
  }'
```

## API 接口

### 生成市场准入推荐

```http
POST /api/market-recommendation
Content-Type: application/json

{
  "product": {
    "product_type": "口罩",
    "product_category": "呼吸防护",
    "ppe_category": "II",
    "intended_use": ["医疗防护", "工业防护"],
    "target_users": ["医护人员", "工业工人"],
    "features": {
      "material": "熔喷布",
      "standards": ["EN 149", "GB 2626"],
      "certifications": ["CE"]
    }
  },
  "company": {
    "company_name": "ABC Manufacturing",
    "existing_certifications": [
      {
        "type": "CE",
        "market": "EU",
        "status": "active",
        "expiry_date": "2025-12-31"
      }
    ],
    "manufacturing_capabilities": {
      "iso_certified": true,
      "has_qms": true,
      "production_capacity": "100万片/月"
    },
    "budget_constraint": {
      "max_budget_usd": 100000,
      "budget_flexibility": "flexible"
    },
    "timeline_constraint": {
      "target_launch_date": "2025-06-01",
      "urgency": "medium"
    }
  },
  "preferences": {
    "prioritize_speed": false,
    "prioritize_cost": false,
    "prioritize_market_size": true,
    "risk_tolerance": "moderate",
    "regions_of_interest": ["北美", "欧洲", "亚洲"],
    "exclude_markets": []
  },
  "constraints": {
    "max_recommendations": 5,
    "min_market_size_usd": 1000000000,
    "max_difficulty_score": 80
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "recommendations": [
    {
      "market": {
        "code": "US",
        "name": "United States",
        "name_zh": "美国",
        "region": "北美",
        "market_size": {
          "total_value_usd": 18000000000,
          "growth_rate": 0.08,
          "ppe_market_share": 0.15
        },
        "difficulty_score": 75,
        "estimated_timeline": { "min_months": 6, "max_months": 18, "average_months": 12 },
        "estimated_cost": { "min_usd": 50000, "max_usd": 200000, "average_usd": 100000 }
      },
      "recommendation_score": 85,
      "ranking": 1,
      "match_analysis": {
        "overall_match": 85,
        "product_fit_score": 88,
        "certification_advantage_score": 65,
        "market_opportunity_score": 92,
        "difficulty_adjusted_score": 75
      },
      "entry_path": {
        "primary_path": "美国 - CE (PPE) + FDA 510(k) + NIOSH N95",
        "alternative_paths": [],
        "required_certifications": [
          {
            "type": "FDA 510(k)",
            "name": "FDA 510(k) Premarket Notification",
            "mandatory": true,
            "estimated_timeline_months": 6,
            "estimated_cost_usd": 20000,
            "prerequisites": ["Predicate Device", "Substantial Equivalence", "Test Reports"],
            "description": "美国FDA 510(k)上市前通知"
          }
        ],
        "estimated_timeline_months": 12,
        "estimated_cost_usd": 100000
      },
      "recommendations": {
        "priority": "high",
        "actions": [
          "优先考虑进入该市场",
          "利用已有认证优势加速准入"
        ],
        "risks": [
          "市场竞争激烈，需要差异化策略"
        ],
        "opportunities": [
          "市场匹配度高，成功概率大",
          "可节省认证成本和时间"
        ]
      }
    }
  ],
  "total_recommendations": 5,
  "summary": {
    "top_market": "美国",
    "fastest_entry": "新加坡",
    "lowest_cost": "新加坡",
    "best_overall": "美国"
  },
  "comparison_matrix": {
    "markets": ["美国", "欧盟", "中国", "日本"],
    "criteria": [
      {
        "name": "综合推荐分",
        "weights": 1.0,
        "scores": { "美国": 85, "欧盟": 82, "中国": 75, "日本": 70 }
      }
    ]
  },
  "action_plan": {
    "immediate_actions": [
      "确定首选目标市场：美国",
      "准备产品技术文档和质量管理体系文件",
      "评估现有认证是否可加速目标市场准入"
    ],
    "short_term_actions": [
      "启动美国市场准入调研，联系当地代理商或咨询公司",
      "制定详细的认证时间表和预算计划",
      "开始准备认证所需的技术文档和测试报告"
    ],
    "medium_term_actions": [
      "提交首个市场的认证申请",
      "建立当地代表或寻找合作伙伴",
      "准备产品本地化和标签翻译",
      "制定市场推广策略"
    ]
  },
  "processing_time_ms": 150
}
```

### 获取市场列表

```http
GET /api/markets
GET /api/markets?region=亚洲
GET /api/markets?code=US
```

**响应示例**:

```json
{
  "success": true,
  "markets": [
    {
      "code": "US",
      "name": "United States",
      "name_zh": "美国",
      "region": "北美",
      "market_size": {
        "total_value_usd": 18000000000,
        "growth_rate": 0.08,
        "ppe_market_share": 0.15
      },
      "entry_requirements": {
        "mandatory_certification": true,
        "certification_types": ["FDA 510(k)", "FDA PMA", "NIOSH N95"],
        "local_representative_required": false,
        "testing_required": true,
        "clinical_data_required": false
      },
      "difficulty_score": 75,
      "estimated_timeline": { "min_months": 6, "max_months": 18, "average_months": 12 },
      "estimated_cost": { "min_usd": 50000, "max_usd": 200000, "average_usd": 100000 },
      "competition_level": "high",
      "regulation": {
        "framework": "FDA CFR Title 21",
        "authority": "U.S. Food and Drug Administration"
      }
    }
  ],
  "total": 12
}
```

## 评分算法

### 评分维度

| 维度 | 权重 | 说明 |
|------|------|------|
| 产品适配度 | 20% | 产品与市场认证要求的匹配程度 |
| 市场机会 | 25% | 市场规模、增长率、竞争程度 |
| 准入难度 | 15% | 准入复杂度（反向计分） |
| 成本效率 | 15% | 准入成本与预算的匹配度 |
| 上市速度 | 15% | 准入时间与时限要求的匹配度 |
| 认证优势 | 10% | 已有认证在新市场的认可度 |

### 个性化调整

根据用户偏好动态调整权重：

- **prioritize_speed**: 上市速度权重 ×1.5
- **prioritize_cost**: 成本效率权重 ×1.5
- **prioritize_market_size**: 市场机会权重 ×1.5

## 支持的市场

| 市场代码 | 名称 | 地区 | 市场规模 | 准入难度 |
|----------|------|------|----------|----------|
| US | 美国 | 北美 | $18B | 75/100 |
| EU | 欧盟 | 欧洲 | $15B | 70/100 |
| CN | 中国 | 亚洲 | $12B | 80/100 |
| JP | 日本 | 亚洲 | $5B | 85/100 |
| UK | 英国 | 欧洲 | $3B | 65/100 |
| CA | 加拿大 | 北美 | $2B | 60/100 |
| AU | 澳大利亚 | 大洋洲 | $1.5B | 55/100 |
| BR | 巴西 | 南美 | $2B | 70/100 |
| KR | 韩国 | 亚洲 | $2.5B | 65/100 |
| SG | 新加坡 | 亚洲 | $500M | 50/100 |
| MX | 墨西哥 | 北美 | $1.2B | 60/100 |
| IN | 印度 | 亚洲 | $3B | 65/100 |

## 认证互认关系

| 认证 | 被认可市场 | 优势 |
|------|------------|------|
| CE | 英国、瑞士、土耳其、澳大利亚、新加坡 | 简化注册流程 |
| FDA | 加拿大、澳大利亚、新加坡、以色列 | 加速审批 |
| ISO 13485 | 全球 | 基础要求 |

## 产品类型要求

| 产品类型 | 典型认证 | 典型时间 | 典型成本 |
|----------|----------|----------|----------|
| 口罩 | CE, FDA, NIOSH, NMPA | 6个月 | $30,000 |
| 医用手套 | CE, FDA, NMPA | 9个月 | $50,000 |
| 防护服 | CE, FDA, NMPA | 12个月 | $60,000 |
| 护目镜 | CE, FDA, NMPA | 6个月 | $25,000 |
| 呼吸器 | CE, FDA, NIOSH, NMPA | 18个月 | $100,000 |

## 使用示例

### 示例1：口罩制造商寻求新市场

```typescript
const request = {
  product: {
    product_type: '口罩',
    product_category: '呼吸防护',
    ppe_category: 'II',
    intended_use: ['医疗防护', '工业防护'],
    target_users: ['医护人员', '工业工人'],
  },
  company: {
    company_name: 'ABC Manufacturing',
    existing_certifications: [
      { type: 'CE', market: 'EU', status: 'active' },
    ],
    manufacturing_capabilities: {
      iso_certified: true,
      has_qms: true,
    },
  },
  preferences: {
    prioritize_market_size: true,
  },
}

const result = await marketRecommendationEngine.generateRecommendations(request)
```

### 示例2：预算有限的初创企业

```typescript
const request = {
  product: {
    product_type: '护目镜',
    product_category: '眼部防护',
    intended_use: ['医疗防护'],
  },
  company: {
    company_name: 'Startup Vision',
    existing_certifications: [],
    budget_constraint: {
      max_budget_usd: 50000,
      budget_flexibility: 'strict',
    },
  },
  preferences: {
    prioritize_cost: true,
  },
}
```

### 示例3：紧急上市需求

```typescript
const request = {
  product: {
    product_type: '口罩',
    product_category: '呼吸防护',
  },
  company: {
    company_name: 'Urgent Med',
    existing_certifications: [
      { type: 'FDA_510K', market: 'US', status: 'active' },
    ],
    timeline_constraint: {
      target_launch_date: '2025-06-01',
      urgency: 'critical',
    },
  },
  preferences: {
    prioritize_speed: true,
  },
}
```

## 技术亮点

- **多维度评分**: 6个维度综合评估，权重可动态调整
- **认证互认**: 自动识别已有认证在新市场的优势
- **智能过滤**: 支持按地区、市场规模、难度等多条件筛选
- **详细路径**: 提供具体的认证要求、时间、成本估算
- **比较矩阵**: 多维度对比，辅助决策
- **行动建议**: 分阶段给出可执行的准入建议
