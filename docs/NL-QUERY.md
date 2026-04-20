# MDLooker 自然语言查询系统 - 文档

## 📋 系统概述

自然语言查询系统（NL Query）允许用户使用日常语言与数据库交互，无需学习复杂的查询语法。

**核心能力**:
- **意图识别**: 理解用户查询目的（搜索、对比、分析等）
- **实体提取**: 自动识别产品、公司、市场等关键信息
- **智能查询**: 将自然语言转换为数据库查询
- **对话上下文**: 支持多轮对话，保持会话连贯性

---

## 🏗️ 架构设计

```
用户输入
    ↓
[意图分类器] → 识别查询类型（搜索/对比/分析）
    ↓
[实体提取器] → 提取产品、公司、市场等实体
    ↓
[查询构建器] → 生成结构化查询
    ↓
[查询执行器] → 执行数据库操作
    ↓
[响应生成器] → 生成自然语言回答
    ↓
用户收到回答
```

---

## 📦 核心组件

### 1. 服务端代码

| 文件 | 功能 |
|------|------|
| `src/lib/ai/nl-query/types.ts` | 类型定义 |
| `src/lib/ai/nl-query/intent-classifier.ts` | 意图识别和实体提取 |
| `src/lib/ai/nl-query/query-executor.ts` | 查询执行器 |
| `src/lib/ai/nl-query/response-generator.ts` | 响应生成器 |
| `src/lib/ai/nl-query/index.ts` | NL查询引擎主入口 |
| `src/app/api/ai/query/route.ts` | API路由 |

### 2. 支持的查询意图

| 意图类型 | 示例查询 | 功能 |
|----------|----------|------|
| `search` | "找N95口罩制造商" | 搜索产品或公司 |
| `compare` | "对比3M和霍尼韦尔" | 对比多个实体 |
| `analyze` | "分析这家公司的风险" | 数据分析和洞察 |
| `recommend` | "推荐适合欧盟市场的产品" | 智能推荐 |
| `explain` | "什么是510K认证" | 概念解释 |
| `status_check` | "查询K123456的状态" | 状态检查 |
| `trend_analysis` | "最近口罩认证趋势" | 趋势分析 |

---

## 🚀 使用方式

### API接口

#### POST /api/ai/query

执行自然语言查询。

**请求体**:
```json
{
  "query": "找在欧盟和美国都有注册的N95口罩制造商",
  "sessionId": "session_xxx",  // 可选，用于多轮对话
  "useAI": false,              // 是否使用AI生成高级响应
  "maxResults": 20             // 最大返回结果数
}
```

**响应**:
```json
{
  "success": true,
  "answer": "为您找到 15 个相关制造商：\n\n1. **3M Company** - US\n   市场：US, EU | 类别：N95...",
  "sessionId": "session_xxx",
  "results": {
    "success": true,
    "data": [...],
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "executionTimeMs": 45
  },
  "suggestions": [
    "查看这些制造商的详细信息",
    "对比N95在不同市场的认证情况"
  ],
  "relatedQuestions": [
    "这些制造商中谁的风险最低？",
    "这些产品在哪些市场有认证？"
  ],
  "confidence": 0.85,
  "processingTimeMs": 120
}
```

#### GET /api/ai/query?sessionId=xxx

获取会话历史。

#### DELETE /api/ai/query?sessionId=xxx

删除会话。

---

## 💡 示例查询

### 搜索查询

```bash
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "找在欧盟和美国都有注册的N95口罩制造商"
  }'
```

### 对比查询

```bash
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "对比3M和Honeywell的N95产品"
  }'
```

### 分析查询

```bash
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "分析3M公司的合规风险"
  }'
```

### 多轮对话

```bash
# 第一轮
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "找N95口罩制造商"
  }'

# 第二轮（使用返回的sessionId）
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "这些制造商中谁的风险最低？",
    "sessionId": "session_xxx"
  }'
```

---

## 🔧 支持的实体类型

### 产品类型
- N95, KN95, FFP2, FFP3
- 医用口罩、外科口罩
- 防护服、护目镜、手套

### 市场/认证
- 美国 / FDA / US
- 欧盟 / CE / EU
- 中国 / NMPA / CN
- 日本 / PMDA / JP
- 加拿大 / CA
- 澳大利亚 / AU
- 英国 / UKCA / UK

### 设备类别
- Class I, Class II, Class III
- 一类、二类、三类器械

---

## 📊 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 意图识别准确率 | > 85% | 基于规则+模式匹配 |
| 实体提取准确率 | > 80% | 正则表达式匹配 |
| 查询响应时间 | < 200ms | 不包括AI生成时间 |
| 支持并发 | 60 req/min | 与现有API一致 |

---

## 🛠️ 开发指南

### 添加新的意图类型

1. 在 `types.ts` 中添加新的 `QueryIntentType`
2. 在 `intent-classifier.ts` 的 `INTENT_PATTERNS` 中添加识别规则
3. 在 `response-generator.ts` 的 `RESPONSE_TEMPLATES` 中添加响应模板

### 添加新的实体类型

1. 在 `types.ts` 中添加新的 `EntityType`
2. 在 `intent-classifier.ts` 的 `ENTITY_PATTERNS` 中添加提取规则
3. 在 `query-executor.ts` 的 `ENTITY_TABLE_MAP` 中添加表映射

---

## 📝 更新日志

### v1.0.0 (2026-04-20)
- ✅ 实现基础意图识别（7种意图类型）
- ✅ 实现实体提取（产品、市场、认证）
- ✅ 实现查询执行器
- ✅ 实现响应生成器
- ✅ 支持多轮对话
- ✅ API接口完整实现

---

## 📞 技术支持

- **任务编号**: A-003
- **负责人**: AI助手（AI/算法工程师）
- **技术文档**: `/docs/NL-QUERY.md`
- **API端点**: `/api/ai/query`
