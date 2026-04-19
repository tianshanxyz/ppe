# HTML 解析技术调研 - AI-001 技术方案

**任务**: AI-001 智能解析模型  
**调研日期**: 2026-04-18  
**负责人**: AI工程师  
**状态**: 🟡 进行中

---

## 📋 技术选型对比

### 1. HTML 解析框架

| 技术方案 | 优点 | 缺点 | 适用场景 | 推荐指数 |
|---------|------|------|---------|---------|
| **Cheerio** | 轻量、快速、jQuery语法 | 不支持动态内容 | 静态HTML页面 | ⭐⭐⭐⭐⭐ |
| **Puppeteer** | 支持动态内容、完整浏览器 | 资源消耗大、速度慢 | SPA/动态网站 | ⭐⭐⭐⭐ |
| **Playwright** | 多浏览器支持、更稳定 | 资源消耗大 | 复杂动态网站 | ⭐⭐⭐⭐ |
| **BeautifulSoup** | Python生态、简单易用 | 性能一般 | 快速原型开发 | ⭐⭐⭐ |

**推荐方案**: Cheerio + Puppeteer 组合
- Cheerio 处理静态页面（80%场景）
- Puppeteer 处理动态页面（20%场景）

---

### 2. AI 模型架构

#### 方案 A: 基于 BERT 的 HTML 结构理解模型

```
输入: HTML DOM 树结构
处理: 
  1. DOM 树序列化
  2. BERT 编码
  3. 分类头输出字段类型
输出: 字段类型（产品名、企业名、注册号等）
```

**优点**:
- 强大的语义理解能力
- 预训练模型可用
- 准确率较高

**缺点**:
- 计算资源需求大
- 推理速度较慢
- 需要大量标注数据

**适用**: 复杂页面结构识别

---

#### 方案 B: 基于规则 + 轻量 ML 的混合方案

```
输入: HTML 页面
处理:
  1. CSS 选择器规则匹配（优先级1）
  2. 正则表达式提取（优先级2）
  3. 轻量分类模型（FastText/浅层NN）兜底
输出: 结构化数据
```

**优点**:
- 速度快、资源消耗低
- 可解释性强
- 易于维护和调整

**缺点**:
- 对复杂页面效果一般
- 需要人工维护规则库

**适用**: 结构化程度高的页面

---

#### 方案 C: 基于 DOM 特征的 CNN 模型

```
输入: DOM 节点特征向量
处理:
  1. 提取 DOM 特征（标签、类名、位置等）
  2. CNN 卷积提取局部模式
  3. 全连接层分类
输出: 字段类型
```

**优点**:
- 专注于结构特征
- 不受语言影响
- 推理速度快

**缺点**:
- 需要设计特征工程
- 泛化能力有限

**适用**: 多语言、结构相似页面

---

### 3. 推荐技术栈

| 组件 | 技术选型 | 理由 |
|------|---------|------|
| **HTML解析** | Cheerio + Puppeteer | 兼顾性能和动态内容支持 |
| **AI模型** | BERT-base + 规则引擎 | 准确率和效率平衡 |
| **特征提取** | DOM Path + CSS Selector | 结构稳定、可解释 |
| **数据存储** | PostgreSQL + Redis | 关系数据 + 缓存 |
| **任务调度** | Bull Queue (Redis) | 可靠的任务队列 |
| **监控** | Prometheus + Grafana | 生产级监控 |

---

## 🏗️ 系统架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      PPE 智能解析系统                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   美国 FDA    │  │   欧盟 EUDAMED│  │   中国 NMPA   │      │
│  │   解析器      │  │   解析器      │  │   解析器      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           ▼                                │
│              ┌─────────────────────────┐                   │
│              │     HTML 提取引擎        │                   │
│              │  (Cheerio/Puppeteer)    │                   │
│              └───────────┬─────────────┘                   │
│                          ▼                                 │
│              ┌─────────────────────────┐                   │
│              │    AI 解析模型服务       │                   │
│              │  (字段识别 + 数据提取)   │                   │
│              └───────────┬─────────────┘                   │
│                          ▼                                 │
│              ┌─────────────────────────┐                   │
│              │     数据清洗标准化       │                   │
│              └───────────┬─────────────┘                   │
│                          ▼                                 │
│              ┌─────────────────────────┐                   │
│              │     PostgreSQL 数据库    │                   │
│              └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 解析器设计模式

```typescript
// 抽象解析器接口
interface PPEParser {
  readonly name: string;
  readonly baseUrl: string;
  
  // 获取列表页
  fetchListPage(page: number): Promise<ListPageResult>;
  
  // 获取详情页
  fetchDetailPage(id: string): Promise<DetailPageResult>;
  
  // 解析列表数据
  parseList(html: string): PPEItem[];
  
  // 解析详情数据
  parseDetail(html: string): PPEItemDetail;
  
  // 检查是否需要动态渲染
  requiresDynamicRendering(): boolean;
}

// FDA 解析器实现示例
class FDAParser implements PPEParser {
  readonly name = 'FDA';
  readonly baseUrl = 'https://www.accessdata.fda.gov';
  
  async fetchListPage(page: number): Promise<ListPageResult> {
    // 使用 Cheerio 获取静态页面
    const url = `${this.baseUrl}/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?start=${page * 100}`;
    const response = await fetch(url);
    const html = await response.text();
    return { html, page };
  }
  
  parseList(html: string): PPEItem[] {
    const $ = cheerio.load(html);
    const items: PPEItem[] = [];
    
    $('table tr').each((i, elem) => {
      if (i === 0) return; // 跳过表头
      
      const $row = $(elem);
      items.push({
        productName: $row.find('td:nth-child(1)').text().trim(),
        companyName: $row.find('td:nth-child(2)').text().trim(),
        registrationNumber: $row.find('td:nth-child(3)').text().trim(),
        approvalDate: $row.find('td:nth-child(4)').text().trim(),
      });
    });
    
    return items;
  }
  
  requiresDynamicRendering(): boolean {
    return false; // FDA 使用静态页面
  }
}
```

---

## 🤖 AI 模型设计

### 字段识别模型

```python
# 基于 BERT 的字段分类模型
import torch
import torch.nn as nn
from transformers import BertModel, BertTokenizer

class FieldClassifier(nn.Module):
    def __init__(self, num_labels=10):
        super().__init__()
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(768, num_labels)
        
    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        return logits

# 字段类型定义
FIELD_TYPES = [
    'product_name',      # 产品名称
    'company_name',      # 企业名称
    'registration_no',   # 注册证号
    'approval_date',     # 批准日期
    'device_class',      # 设备分类
    'market',           # 市场/国家
    'status',           # 状态
    'address',          # 地址
    'contact',          # 联系方式
    'other',            # 其他
]
```

### DOM 特征提取

```python
# DOM 特征提取器
class DOMFeatureExtractor:
    def extract(self, element) -> Dict[str, any]:
        """提取 DOM 元素特征"""
        return {
            'tag': element.name,
            'class': ' '.join(element.get('class', [])),
            'id': element.get('id', ''),
            'parent_tag': element.parent.name if element.parent else '',
            'sibling_count': len(list(element.parent.children)) if element.parent else 0,
            'text_length': len(element.get_text()),
            'has_link': bool(element.find('a')),
            'depth': self._calculate_depth(element),
        }
    
    def _calculate_depth(self, element, depth=0):
        if not element.parent:
            return depth
        return self._calculate_depth(element.parent, depth + 1)
```

---

## 📊 性能预估

### 解析性能

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 单页面解析时间 | < 500ms | Cheerio 静态页面 |
| 动态页面解析时间 | < 3s | Puppeteer 渲染 |
| 字段识别准确率 | ≥ 95% | AI 模型 |
| 数据提取完整率 | ≥ 98% | 整体系统 |
| 并发处理能力 | 10 req/s | 单实例 |

### 资源需求

| 资源 | 开发环境 | 生产环境 |
|------|---------|---------|
| CPU | 4核 | 8核+ |
| 内存 | 8GB | 16GB+ |
| 存储 | 50GB | 200GB+ |
| GPU | 可选 | 推荐 (BERT推理) |

---

## 🎯 实施计划

### Phase 1: 基础框架 (W5)
- [ ] 搭建解析器框架
- [ ] 实现 Cheerio + Puppeteer 基础组件
- [ ] 设计数据模型

### Phase 2: 规则引擎 (W6)
- [ ] 实现 CSS Selector 规则库
- [ ] 开发 FDA 解析器（静态页面）
- [ ] 开发 NMPA 解析器（动态页面）

### Phase 3: AI 模型 (W7)
- [ ] 收集训练数据
- [ ] 训练字段识别模型
- [ ] 集成模型到解析流程

### Phase 4: 优化测试 (W8)
- [ ] 性能优化
- [ ] 准确率测试
- [ ] 生产环境部署

---

## 📝 下一步行动

1. **立即开始**: 搭建基础框架代码
2. **本周完成**: FDA 解析器原型
3. **下周开始**: NMPA 解析器开发

---

**最后更新**: 2026-04-18  
**下次更新**: 完成基础框架后
