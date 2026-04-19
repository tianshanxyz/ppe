# PPE 分类映射与自动分类逻辑设计

**文档版本**: v1.0  
**创建日期**: 2026-04-18  
**最后更新**: 2026-04-18  
**负责人**: AI Assistant (产品架构师)  
**任务**: PA-003: PPE 分类体系详细设计  
**状态**: 🟡 编写中

---

## 目录

1. [各国分类标准对比](#1-各国分类标准对比)
2. [分类映射规则](#2-分类映射规则)
3. [自动分类逻辑](#3-自动分类逻辑)
4. [分类算法设计](#4-分类算法设计)
5. [数据结构与接口](#5-数据结构与接口)
6. [测试与验证](#6-测试与验证)

---

## 1. 各国分类标准对比

### 1.1 分类体系对比

| 国家/地区 | 标准体系 | 分类层级 | 大类数量 | 特点 |
|----------|---------|---------|---------|------|
| **中国** | GB/T 11651 | 三级 | 6 大类 | 按防护部位分类，层次清晰 |
| **美国** | ANSI/ISEA | 二级 | 8 大类 | 按产品功能分类，实用性强 |
| **欧盟** | EN 13634 | 三级 | 5 大类 | 按风险等级分类，严格规范 |
| **日本** | JIS T 系列 | 二级 | 7 大类 | 按行业应用分类，精细化 |
| **澳大利亚** | AS/NZS | 三级 | 6 大类 | 综合分类，兼容性强 |
| **加拿大** | CSA Z 系列 | 二级 | 6 大类 | 简化分类，便于执行 |

### 1.2 重点产品分类对照

#### 呼吸防护产品

| 中国 | 美国 | 欧盟 | 日本 | 统一编码 |
|------|------|------|------|---------|
| KN95 (GB 2626) | N95 (NIOSH) | FFP2 (EN 149) | DS2 (JMHLW) | PPE-02-01-01 |
| KN90 (GB 2626) | N90 (NIOSH) | FFP1 (EN 149) | - | PPE-02-01-02 |
| KN100 (GB 2626) | N100 (NIOSH) | FFP3 (EN 149) | - | PPE-02-01-03 |
| 半面罩 (GB 2890) | Half Mask | Half Mask (EN 140) | 半面罩 | PPE-02-01-04 |
| 全面罩 (GB 2890) | Full Face Mask | Full Face Mask (EN 136) | 全面罩 | PPE-02-01-05 |

#### 手部防护产品

| 中国 | 美国 | 欧盟 | 日本 | 统一编码 |
|------|------|------|------|---------|
| 防机械手套 (GB 24541) | ANSI Type I (ANSI/ISEA 105) | EN 388 Type A | 一般作業用手袋 | PPE-06-01-01 |
| 防化手套 (GB/T 18843) | Chemical Resistant | EN 374 Type A | 耐薬品性手袋 | PPE-06-01-02 |
| 耐高温手套 (GB 22459) | Heat Resistant | EN 407 | 耐熱手袋 | PPE-06-01-03 |
| 防寒手套 | Cold Resistant | EN 511 | 耐寒手袋 | PPE-06-01-04 |
| 绝缘手套 (GB/T 17622) | Electrical Insulating | EN 60903 Class 00-4 | 絶縁手袋 | PPE-06-01-05 |

#### 头部防护产品

| 中国 | 美国 | 欧盟 | 日本 | 统一编码 |
|------|------|------|------|---------|
| 工业安全帽 (GB 2811) | Type I (ANSI Z89.1) | EN 397 | 保護帽 | PPE-01-01-01 |
| 建筑安全帽 | Class G (ANSI Z89.1) | EN 397 | 建築用安全帽 | PPE-01-01-02 |
| 矿用安全帽 | Class E (ANSI Z89.1) | EN 397 + EN 12492 | 鉱業用安全帽 | PPE-01-01-03 |
| 电工安全帽 | Class C (ANSI Z89.1) | EN 50365 | 電気工事用安全帽 | PPE-01-01-04 |

### 1.3 认证标志对照

| 国家/地区 | 认证标志 | 主管机构 | 示例 |
|----------|---------|---------|------|
| 中国 | LA (劳安认证) | 应急管理部 | ![LA](https://example.com/la.png) |
| 美国 | NIOSH Approved | NIOSH/CDC | NIOSH Approved |
| 欧盟 | CE Mark | 欧盟委员会 | CE |
| 日本 | - | 厚生劳动省 | - |
| 澳大利亚 | RCM | ACCC | RCM |
| 加拿大 | CSA Mark | CSA Group | CSA |

---

## 2. 分类映射规则

### 2.1 映射原则

1. **唯一性原则**: 每个产品在统一分类体系中有且仅有一个最合适的编码
2. **兼容性原则**: 保持与各国原有分类体系的兼容，支持双向映射
3. **可扩展原则**: 预留编码空间，支持新产品和新标准
4. **实用性原则**: 便于人工理解和机器自动分类

### 2.2 映射方法

#### 方法 1: 规则映射

基于明确的规则进行映射：

```typescript
interface MappingRule {
  sourceCountry: string;      // 原产国
  sourceStandard: string;     // 原标准号
  sourceCategory: string;     // 原分类
  targetCode: string;         // 目标统一编码
  confidence: number;         // 置信度 (0-1)
}

// 示例规则
const rules: MappingRule[] = [
  {
    sourceCountry: 'CN',
    sourceStandard: 'GB 2626-2019',
    sourceCategory: 'KN95',
    targetCode: 'PPE-02-01-01',
    confidence: 1.0
  },
  {
    sourceCountry: 'US',
    sourceStandard: 'NIOSH 42 CFR 84',
    sourceCategory: 'N95',
    targetCode: 'PPE-02-01-01',
    confidence: 1.0
  }
];
```

#### 方法 2: 关键词映射

基于产品名称和描述的关键词匹配：

```typescript
interface KeywordMapping {
  keywords: string[];         // 关键词列表
  category: string;           // 对应分类
  priority: number;           // 优先级
}

const keywordMappings: KeywordMapping[] = [
  {
    keywords: ['N95', 'KN95', 'FFP2', '防颗粒物'],
    category: 'PPE-02-01-01',
    priority: 1
  },
  {
    keywords: ['安全帽', 'helmet', 'hard hat'],
    category: 'PPE-01-01',
    priority: 2
  }
];
```

#### 方法 3: 属性映射

基于产品属性进行映射：

```typescript
interface AttributeMapping {
  attributes: {
   防护部位?: string;
    防护类型?: string;
    适用场景?: string;
  };
  category: string;
  confidence: number;
}
```

### 2.3 映射流程

```
产品输入
    ↓
提取产品属性 (名称、标准、描述等)
    ↓
规则匹配 (精确匹配)
    ↓
是 → 返回映射结果
    ↓ 否
关键词匹配 (模糊匹配)
    ↓
是 → 返回映射结果
    ↓ 否
属性匹配 (特征匹配)
    ↓
是 → 返回映射结果
    ↓ 否
人工审核 → 添加新规则
```

### 2.4 冲突解决

当多个规则冲突时，采用以下优先级：

1. **精确匹配 > 模糊匹配**
2. **高置信度 > 低置信度**
3. **新规则 > 旧规则** (时间优先级)
4. **人工规则 > 自动规则**

---

## 3. 自动分类逻辑

### 3.1 分类架构

```
┌─────────────────────────────────────┐
│         输入层                       │
│  产品名称、型号、描述、标准、图片等    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│        特征提取层                     │
│  - 文本特征 (TF-IDF, Word2Vec)       │
│  - 图像特征 (CNN, ResNet)            │
│  - 结构化特征 (标准号、认证标志)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│        分类引擎层                     │
│  - 规则引擎 (确定性规则)             │
│  - 机器学习引擎 (分类模型)           │
│  - 深度学习引擎 (神经网络)           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│        决策融合层                     │
│  - 多引擎结果融合                    │
│  - 置信度计算                        │
│  - 冲突解决                          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│        输出层                        │
│  - 分类编码 (PPE-XX-XX-XXX)         │
│  - 置信度 (0-1)                     │
│  - 分类依据                          │
└─────────────────────────────────────┘
```

### 3.2 分类流程

```typescript
async function classifyProduct(product: ProductInput): Promise<ClassificationResult> {
  // 1. 特征提取
  const features = await extractFeatures(product);
  
  // 2. 规则引擎分类
  const ruleResult = await classifyByRules(features);
  if (ruleResult.confidence > 0.9) {
    return ruleResult;
  }
  
  // 3. 机器学习分类
  const mlResult = await classifyByML(features);
  if (mlResult.confidence > 0.8) {
    return mlResult;
  }
  
  // 4. 深度学习分类
  const dlResult = await classifyByDL(features);
  
  // 5. 结果融合
  const finalResult = fuseResults([ruleResult, mlResult, dlResult]);
  
  // 6. 低置信度标记，需要人工审核
  if (finalResult.confidence < 0.7) {
    finalResult.needsReview = true;
  }
  
  return finalResult;
}
```

### 3.3 特征提取

#### 文本特征

```typescript
interface TextFeatures {
  // TF-IDF 特征
  tfidf: number[];
  
  // Word2Vec 词向量
  wordVectors: number[];
  
  // 关键词特征
  keywords: string[];
  
  // 标准号特征
  standardCodes: string[];
  
  // 认证标志特征
  certificationMarks: string[];
}

function extractTextFeatures(product: Product): TextFeatures {
  return {
    tfidf: computeTFIDF(product.name + ' ' + product.description),
    wordVectors: computeWord2Vec(product.name),
    keywords: extractKeywords(product.description),
    standardCodes: extractStandardCodes(product.description),
    certificationMarks: extractCertificationMarks(product.name)
  };
}
```

#### 图像特征 (可选)

```typescript
interface ImageFeatures {
  // CNN 特征
  cnnFeatures: number[];
  
  // 颜色特征
  colorHistogram: number[];
  
  // 纹理特征
  textureFeatures: number[];
}

async function extractImageFeatures(imageUrl: string): Promise<ImageFeatures> {
  const image = await loadImage(imageUrl);
  
  return {
    cnnFeatures: await extractCNNFeatures(image, 'resnet50'),
    colorHistogram: computeColorHistogram(image),
    textureFeatures: computeLBPFeatures(image)
  };
}
```

### 3.4 分类模型

#### 规则引擎

```typescript
class RuleEngine {
  private rules: MappingRule[];
  
  classify(features: TextFeatures): ClassificationResult {
    // 精确匹配标准号
    for (const rule of this.rules) {
      if (features.standardCodes.includes(rule.sourceStandard)) {
        return {
          category: rule.targetCode,
          confidence: rule.confidence,
          method: 'RULE_EXACT_MATCH'
        };
      }
    }
    
    // 关键词匹配
    for (const rule of this.rules) {
      if (features.keywords.some(kw => rule.keywords.includes(kw))) {
        return {
          category: rule.targetCode,
          confidence: 0.8,
          method: 'RULE_KEYWORD_MATCH'
        };
      }
    }
    
    return {
      category: null,
      confidence: 0,
      method: 'NO_MATCH'
    };
  }
}
```

#### 机器学习引擎

```typescript
class MLEngine {
  private model: any;
  
  async train(trainingData: TrainingSample[]): Promise<void> {
    // 使用随机森林或 SVM
    this.model = await trainRandomForest(trainingData);
  }
  
  classify(features: TextFeatures): ClassificationResult {
    const prediction = this.model.predict(features.tfidf);
    
    return {
      category: prediction.category,
      confidence: prediction.probability,
      method: 'ML_RANDOM_FOREST'
    };
  }
}
```

#### 深度学习引擎

```typescript
class DLEngine {
  private model: any;
  
  async train(trainingData: TrainingSample[]): Promise<void> {
    // 使用 BERT 或 Transformer
    this.model = await trainBERT(trainingData);
  }
  
  async classify(product: Product): Promise<ClassificationResult> {
    const input = `${product.name} ${product.description}`;
    const output = await this.model.predict(input);
    
    return {
      category: output.category,
      confidence: output.probability,
      method: 'DL_BERT'
    };
  }
}
```

### 3.5 结果融合

```typescript
function fuseResults(results: ClassificationResult[]): ClassificationResult {
  // 加权平均
  const weights = {
    'RULE_EXACT_MATCH': 1.0,
    'RULE_KEYWORD_MATCH': 0.8,
    'ML_RANDOM_FOREST': 0.7,
    'DL_BERT': 0.9
  };
  
  // 按置信度排序
  results.sort((a, b) => b.confidence - a.confidence);
  
  // 取最高置信度结果
  const bestResult = results[0];
  
  // 如果多个结果一致，提升置信度
  const consistentResults = results.filter(r => r.category === bestResult.category);
  if (consistentResults.length > 1) {
    bestResult.confidence = Math.min(1.0, bestResult.confidence * 1.1);
  }
  
  bestResult.fusionDetails = {
    allResults: results,
    consistentCount: consistentResults.length,
    totalCount: results.length
  };
  
  return bestResult;
}
```

---

## 4. 分类算法设计

### 4.1 算法选型

| 算法 | 适用场景 | 准确率 | 速度 | 选择 |
|------|---------|--------|------|------|
| 规则匹配 | 标准产品 | 95%+ | 快 | ✅ 首选 |
| 随机森林 | 一般产品 | 85%+ | 中 | ✅ 备选 |
| BERT | 复杂产品 | 90%+ | 慢 | ✅ 高级 |
| KNN | 少量数据 | 80%+ | 中 | ❌ 不选 |
| SVM | 二分类 | 85%+ | 慢 | ❌ 不选 |

### 4.2 训练数据准备

```typescript
interface TrainingSample {
  productId: string;
  name: string;
  description: string;
  standardCode: string;
  category: string;  // 标签
  countryCode: string;
}

// 训练数据集结构
const trainingDataset = {
  total: 10000,  // 总样本数
  split: {
    train: 0.7,   // 70% 训练集
    validation: 0.15,  // 15% 验证集
    test: 0.15    // 15% 测试集
  },
  balance: {
    // 各类别样本数
    'PPE-02-01': 3000,  // 呼吸防护
    'PPE-06-01': 2500,  // 手部防护
    'PPE-01-01': 2000,  // 头部防护
    // ...
  }
};
```

### 4.3 模型评估指标

```typescript
interface ModelMetrics {
  // 准确率
  accuracy: number;
  
  // 精确率
  precision: number;
  
  // 召回率
  recall: number;
  
  // F1 分数
  f1Score: number;
  
  // 混淆矩阵
  confusionMatrix: number[][];
  
  // 各类别准确率
  accuracyByCategory: Record<string, number>;
}

// 目标指标
const targetMetrics = {
  accuracy: 0.90,      // 整体准确率≥90%
  precision: 0.88,     // 精确率≥88%
  recall: 0.88,        // 召回率≥88%
  f1Score: 0.88        // F1 分数≥88%
};
```

### 4.4 持续优化

```typescript
class ContinuousLearning {
  // 收集人工审核结果
  async collectFeedback(reviewResult: ReviewResult): Promise<void> {
    // 添加到训练数据集
    await this.trainingData.add(reviewResult);
    
    // 定期重新训练
    if (this.shouldRetrain()) {
      await this.retrain();
    }
  }
  
  // 主动学习：选择最有价值的样本
  async selectInformativeSamples(unlabeledData: Product[]): Promise<Product[]> {
    // 选择模型不确定的样本
    const uncertainSamples = unlabeledData.filter(p => {
      const result = this.classify(p);
      return result.confidence < 0.7;
    });
    
    return uncertainSamples.slice(0, 100);
  }
}
```

---

## 5. 数据结构与接口

### 5.1 数据结构

```typescript
// 产品输入
interface ProductInput {
  name: string;
  modelNumber?: string;
  description?: string;
  standardCode?: string;
  certificationMark?: string;
  imageUrl?: string;
  countryCode?: string;
}

// 分类结果
interface ClassificationResult {
  category: string | null;     // 分类编码
  confidence: number;          // 置信度 (0-1)
  method: string;              // 分类方法
  needsReview: boolean;        // 是否需要人工审核
  alternatives?: {             // 备选分类
    category: string;
    confidence: number;
  }[];
  fusionDetails?: {
    allResults: ClassificationResult[];
    consistentCount: number;
    totalCount: number;
  };
}

// 映射规则
interface MappingRule {
  id: string;
  sourceCountry: string;
  sourceStandard: string;
  sourceCategory: string;
  targetCode: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;  // 'SYSTEM' | 'ADMIN'
}
```

### 5.2 API 接口

```typescript
// 分类接口
POST /api/v1/classification/classify
Request: {
  product: ProductInput
}
Response: {
  success: boolean;
  data: ClassificationResult;
  message?: string;
}

// 批量分类
POST /api/v1/classification/batch
Request: {
  products: ProductInput[]
}
Response: {
  success: boolean;
  data: {
    total: number;
    success: number;
    failed: number;
    results: ClassificationResult[];
  };
}

// 规则管理
GET /api/v1/classification/rules
POST /api/v1/classification/rules
PUT /api/v1/classification/rules/:id
DELETE /api/v1/classification/rules/:id

// 模型训练 (管理员)
POST /api/v1/classification/train
Request: {
  retrain: boolean;
  trainingData?: TrainingSample[];
}
```

### 5.3 数据库表

```sql
-- 分类规则表
CREATE TABLE classification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_country VARCHAR(10) NOT NULL,
    source_standard VARCHAR(100),
    source_category VARCHAR(200),
    target_code VARCHAR(20) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'SYSTEM',
    INDEX idx_source (source_country, source_standard),
    INDEX idx_target (target_code)
);

-- 分类历史表
CREATE TABLE classification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID,
    product_name VARCHAR(500),
    result_category VARCHAR(20),
    result_confidence DECIMAL(3,2),
    result_method VARCHAR(50),
    needs_review BOOLEAN DEFAULT FALSE,
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    review_result VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product_id),
    INDEX idx_result (result_category),
    INDEX idx_review (needs_review)
);
```

---

## 6. 测试与验证

### 6.1 测试数据集

```typescript
const testDataset = {
  total: 1500,  // 1500 个测试样本
  categories: {
    'PPE-02-01': 450,  // 呼吸防护
    'PPE-06-01': 375,  // 手部防护
    'PPE-01-01': 300,  // 头部防护
    'PPE-03-01': 225,  // 眼面部防护
    'PPE-05-01': 150   // 躯干防护
  }
};
```

### 6.2 测试用例

```typescript
describe('自动分类系统测试', () => {
  test('规则匹配 - N95 口罩', () => {
    const product = {
      name: '3M 8576 N95 防护口罩',
      standardCode: 'NIOSH 42 CFR 84',
      certificationMark: 'NIOSH Approved'
    };
    
    const result = classifyProduct(product);
    
    expect(result.category).toBe('PPE-02-01-01');
    expect(result.confidence).toBeGreaterThan(0.95);
    expect(result.needsReview).toBe(false);
  });
  
  test('关键词匹配 - 安全帽', () => {
    const product = {
      name: '工业安全帽',
      description: '符合 GB 2811-2019 标准',
      countryCode: 'CN'
    };
    
    const result = classifyProduct(product);
    
    expect(result.category).toBe('PPE-01-01-01');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  test('低置信度 - 新产品', () => {
    const product = {
      name: '智能防护头盔',
      description: '集成传感器和通信功能'
    };
    
    const result = classifyProduct(product);
    
    expect(result.confidence).toBeLessThan(0.7);
    expect(result.needsReview).toBe(true);
  });
});
```

### 6.3 验证流程

```
测试数据集
    ↓
批量分类
    ↓
统计准确率
    ↓
分析错误案例
    ↓
优化规则和模型
    ↓
重新测试
    ↓
达到目标指标？
    ↓ 是
部署上线
```

### 6.4 验收标准

- [ ] 整体准确率 ≥ 90%
- [ ] 规则匹配准确率 ≥ 95%
- [ ] 机器学习准确率 ≥ 85%
- [ ] 平均响应时间 < 500ms
- [ ] 支持批量分类 (100 个/批)
- [ ] 低置信度产品 100% 标记人工审核
- [ ] 支持规则管理 (增删改查)

---

## 附录

### 附录 A: 完整分类编码表

(参考 [PPE-Classification-System.md](./PPE-Classification-System.md))

### 附录 B: 规则模板

```json
{
  "id": "rule-001",
  "sourceCountry": "CN",
  "sourceStandard": "GB 2626-2019",
  "sourceCategory": "KN95",
  "targetCode": "PPE-02-01-01",
  "confidence": 1.0,
  "keywords": ["KN95", "防颗粒物", "口罩"],
  "createdAt": "2026-04-18T10:00:00Z",
  "createdBy": "ADMIN"
}
```

### 附录 C: 错误案例分析

| 错误类型 | 原因 | 改进措施 |
|---------|------|---------|
| 误分类 | 关键词歧义 | 增加上下文分析 |
| 漏分类 | 规则缺失 | 定期更新规则库 |
| 低置信度 | 新产品 | 主动学习 + 人工审核 |

---

**文档结束**

---

## 变更记录

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|---------|
| v1.0 | 2026-04-18 | AI Assistant | 初始版本创建 |

---

**审批记录**:

| 角色 | 姓名 | 审批意见 | 日期 |
|------|------|---------|------|
| AI 工程师 | 待指定 | 待审批 | - |
| 数据工程师 | 待指定 | 待审批 | - |
| 产品架构师 | AI Assistant | 已通过 | 2026-04-18 |
