# 训练数据准备方案 - AI-001

**任务**: AI-001 智能解析模型  
**日期**: 2026-04-18  
**负责人**: AI工程师  
**状态**: 🟡 进行中

---

## 📊 训练数据需求分析

### 模型类型与数据需求

| 模型 | 数据类型 | 预估数量 | 标注复杂度 |
|------|---------|---------|-----------|
| HTML 结构识别模型 | DOM 节点 + 字段标签 | 10,000+ 样本 | 中等 |
| 字段分类模型 | 文本片段 + 字段类型 | 50,000+ 样本 | 低 |
| 表格提取模型 | HTML 表格 + 结构化数据 | 5,000+ 样本 | 高 |

---

## 🎯 数据收集策略

### 1. 人工标注数据（高质量，小规模）

**来源**: 从各目标网站手动收集并标注

**标注内容**:
```json
{
  "url": "https://www.accessdata.fda.gov/...",
  "source": "FDA",
  "page_type": "list",
  "html_snippet": "<tr>...</tr>",
  "annotations": [
    {
      "xpath": "//td[1]",
      "text": "Product A",
      "field_type": "product_name",
      "confidence": 1.0
    },
    {
      "xpath": "//td[2]",
      "text": "Company B",
      "field_type": "company_name",
      "confidence": 1.0
    }
  ]
}
```

**数量规划**:
- FDA: 500 个列表页样本 + 500 个详情页样本
- NMPA: 500 个列表页样本 + 500 个详情页样本
- EUDAMED: 300 个样本（API 数据为主）
- 其他: 各 200 个样本

**预估工时**: 40 小时（约 2 周，每天 4 小时标注）

---

### 2. 半自动标注数据（中质量，中规模）

**策略**: 使用规则引擎预标注，人工校验

**流程**:
```
原始 HTML → 规则引擎提取 → 人工校验 → 训练数据
```

**规则引擎预标注**:
```javascript
// 基于 CSS Selector 的预标注规则
const preAnnotationRules = {
  'FDA': {
    'product_name': 'table tr td:first-child',
    'company_name': 'table tr td:nth-child(2)',
    'registration_no': 'table tr td:nth-child(3)',
    'approval_date': 'table tr td:nth-child(4)'
  },
  'NMPA': {
    'product_name': '.list-item .title',
    'company_name': '.list-item .company',
    'registration_no': '.list-item .reg-no'
  }
};
```

**数量规划**:
- 每个数据源 2,000-5,000 个样本
- 人工校验比例: 20%

**预估工时**: 20 小时

---

### 3. 合成数据（补充训练）

**策略**: 基于模板生成合成 HTML 页面

**模板示例**:
```html
<!-- 合成列表页模板 -->
<table class="data-table">
  {{#each items}}
  <tr>
    <td class="product-name">{{productName}}</td>
    <td class="company-name">{{companyName}}</td>
    <td class="reg-no">{{registrationNo}}</td>
    <td class="date">{{approvalDate}}</td>
  </tr>
  {{/each}}
</table>
```

**变体生成**:
- 不同的 CSS 类名
- 不同的 HTML 结构（div vs table）
- 不同的属性命名

**数量规划**: 10,000+ 合成样本

---

### 4. 迁移学习数据

**来源**: 公开数据集

| 数据集 | 用途 | 规模 |
|--------|------|------|
| SWDE (Structured Web Data Extraction) | 网页结构理解 | 8 个领域，10,000+ 页面 |
| WebTables | 表格理解 | 2.3 亿表格 |
| Common Crawl | 预训练语料 | PB 级 |

---

## 🏗️ 数据标注工具

### 推荐方案: 自建轻量标注工具

**技术栈**:
- React + TypeScript (前端)
- Node.js + Express (后端)
- PostgreSQL (数据存储)

**核心功能**:
1. **网页预览**: 嵌入 iframe 显示目标网页
2. **元素选择**: 点击选择 DOM 元素
3. **字段标注**: 下拉选择字段类型
4. **XPath 生成**: 自动生成唯一选择器
5. **批量导入**: 支持 URL 列表批量导入
6. **导出格式**: JSON/CSV/XML

**界面草图**:
```
┌─────────────────────────────────────────────────────┐
│  URL: [https://www.fda.gov/...        ] [加载]     │
├──────────────────────────┬──────────────────────────┤
│                          │  标注面板                 │
│   网页预览                │  ┌────────────────────┐  │
│   ┌──────────────────┐   │  │ 选中元素: <td>     │  │
│   │                  │   │  │ 文本: Product A    │  │
│   │   (iframe)       │   │  │                     │  │
│   │                  │   │  │ 字段类型:           │  │
│   │                  │   │  │ ○ product_name     │  │
│   │                  │   │  │ ○ company_name     │  │
│   │                  │   │  │ ○ registration_no  │  │
│   │                  │   │  │ ○ ...              │  │
│   └──────────────────┘   │  │                     │  │
│                          │  │ [保存] [跳过]       │  │
│                          │  └────────────────────┘  │
│                          │  进度: 45/100            │
└──────────────────────────┴──────────────────────────┘
```

---

## 📈 数据质量控制

### 标注质量检查

1. **交叉验证**: 同一页面由 2 人标注，一致性 > 95%
2. **抽样检查**: 10% 数据人工复核
3. **自动校验**: 
   - 日期格式校验
   - 注册证号格式校验
   - 必填字段完整性

### 数据平衡性

```python
# 检查字段类型分布
field_distribution = {
    'product_name': 15000,
    'company_name': 15000,
    'registration_no': 12000,
    'approval_date': 12000,
    'device_class': 8000,
    'market': 8000,
    'status': 6000,
    'address': 4000,
    'contact': 3000,
    'other': 5000
}

# 确保每个类别样本数 > 3000
```

---

## 🗓️ 数据准备时间表

| 阶段 | 任务 | 开始时间 | 完成时间 | 产出 |
|------|------|---------|---------|------|
| Week 1 | 标注工具开发 | W5 Day 1 | W5 Day 5 | 标注工具 v1.0 |
| Week 2 | 人工标注（FDA） | W6 Day 1 | W6 Day 5 | 1,000 标注样本 |
| Week 3 | 人工标注（NMPA） | W7 Day 1 | W7 Day 5 | 1,000 标注样本 |
| Week 4 | 半自动标注 | W8 Day 1 | W8 Day 3 | 5,000 预标注样本 |
| Week 4 | 合成数据生成 | W8 Day 4 | W8 Day 5 | 10,000 合成样本 |
| Week 5 | 数据清洗整合 | W9 Day 1 | W9 Day 3 | 训练数据集 v1.0 |
| Week 5 | 质量检查 | W9 Day 4 | W9 Day 5 | 质量报告 |

---

## 💾 数据存储结构

```
ai-training-data/
├── raw/                          # 原始数据
│   ├── fda/
│   │   ├── list-pages/          # 列表页 HTML
│   │   └── detail-pages/        # 详情页 HTML
│   ├── nmpa/
│   ├── eudamed/
│   └── ...
├── annotated/                    # 标注数据
│   ├── fda-annotations.json     # FDA 标注结果
│   ├── nmpa-annotations.json    # NMPA 标注结果
│   └── ...
├── synthetic/                    # 合成数据
│   └── synthetic-samples.json
├── processed/                    # 处理后数据
│   ├── train.json               # 训练集 (70%)
│   ├── val.json                 # 验证集 (15%)
│   └── test.json                # 测试集 (15%)
└── metadata.json                 # 数据集元信息
```

---

## 🎯 下一步行动

1. **立即开始**: 开发轻量标注工具（本周内完成 MVP）
2. **本周完成**: 收集 FDA 网站 100 个样本页面
3. **下周开始**: 人工标注工作

---

**最后更新**: 2026-04-18  
**下次更新**: 标注工具开发完成后
