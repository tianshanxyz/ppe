# MDLooker v6.0 功能规格说明书

## 项目概述

**项目名称**: MDLooker v6.0  
**目标**: 打造全球领先的医疗合规信息平台  
**技术栈**: Next.js 16.2.1 + TypeScript + Tailwind CSS 4.x + Supabase + Zustand  
**语言支持**: 英文(默认) + 中文 + 可扩展架构(日语/西班牙语)  

---

## 1. 搜索功能优化

### 1.1 模糊搜索功能

**功能描述**: 实现智能模糊搜索，支持部分关键词匹配和拼写容错

**技术实现**:
- 使用 PostgreSQL pg_trgm 扩展实现 trigram 相似度搜索
- 集成 Fuse.js 客户端模糊搜索库
- 实现 Levenshtein 距离算法进行拼写纠错
- 支持拼音搜索(中文场景)

**搜索字段**:
- 企业名称 (模糊匹配 + 拼音)
- 产品名称 (模糊匹配)
- 注册证号 (精确匹配 + 容错)
- 申请人/制造商名称

**容错规则**:
- 拼写错误: 允许 1-2 个字符差异
- 顺序错误: 支持关键词乱序匹配
- 简繁体: 自动转换匹配
- 同义词: 建立同义词库(如"公司"="企业")

**UI/UX**:
- 搜索框实时显示建议
- 拼写错误时提示"您是否要搜索: xxx"
- 高亮匹配的关键词

### 1.2 NLP/AI 语义搜索

**功能描述**: 集成 AI 大模型，支持自然语言查询和语义理解

**技术实现**:
- 接入 OpenAI/Claude API 进行查询理解
- 实现向量搜索 (pgvector + embeddings)
- 构建查询意图分类器
- 支持多轮对话式搜索

**支持的查询类型**:
```
自然语言示例:
- "查找在中国和欧盟都有注册的医疗器械公司"
- "哪些美国公司的产品获得了510k认证"
- "显示最近一年在FDA注册的中国企业"
- "对比Medtronic和Johnson & Johnson的合规情况"
```

**AI 处理流程**:
1. 用户输入自然语言查询
2. AI 解析查询意图和提取实体
3. 转换为结构化查询条件
4. 执行数据库搜索
5. AI 生成结果摘要和推荐

**UI/UX**:
- 搜索框支持自然语言输入提示
- 显示 AI 理解的查询意图
- 提供"智能推荐"相关搜索

### 1.3 高级搜索选项

**功能描述**: 多维度筛选条件，精准查询目标企业或产品

**筛选维度**:

| 维度 | 选项 | 说明 |
|------|------|------|
| 地区/市场 | 美国FDA、欧盟CE、中国NMPA、日本PMDA等 | 多选 |
| 行业分类 | 医疗器械I/II/III类、IVD、药品等 | 多选 |
| 合规类型 | 510(k)、PMA、De Novo、CE Mark等 | 多选 |
| 注册状态 | 活跃、过期、撤销、待审批 | 多选 |
| 时间范围 | 最近1年、3年、5年、自定义 | 单选 |
| 企业规模 | 大型、中型、小型、初创 | 单选 |
| 产品类别 | 心血管、骨科、影像、诊断等 | 多选 |

**UI/UX**:
- 侧边栏折叠式筛选面板
- 已选条件以标签形式展示，可快速移除
- 支持保存常用筛选组合
- 实时显示筛选结果数量

### 1.4 搜索结果展示优化

**功能描述**: 优化结果展示，支持直接点击进入详情页

**结果卡片设计**:
```
┌─────────────────────────────────────────────────┐
│ [类型图标] 企业名称/产品名称                      │
│ [市场标签] [合规类型标签] [状态标签]              │
│ 所属国家/地区 | 注册日期 | 有效期                 │
│ 简要描述 (前100字)...                           │
│ [查看详情 →]                                    │
└─────────────────────────────────────────────────┘
```

**排序选项**:
- 相关度(默认)
- 注册日期(最新)
- 企业规模
- 市场覆盖数量

**批量操作**:
- 多选结果进行对比
- 导出CSV/Excel
- 添加到收藏夹

---

## 2. 公司信息详情页

### 2.1 结构化布局

**页面结构**:
```
企业详情页
├── 头部信息区
│   ├── 企业Logo/默认图标
│   ├── 企业名称
│   ├── 国家/地区
│   ├── 官网链接
│   └── 关注/收藏按钮
├── 标签导航
│   ├── 概览 (默认)
│   ├── 合规资质
│   ├── 产品信息
│   ├── 市场分布
│   └── 关联企业
├── 内容区域
│   └── 根据标签切换内容
└── 侧边栏
    ├── 快速联系
    ├── 相关推荐
    └── 数据更新时间
```

### 2.2 内容模块

#### 2.2.1 企业基本信息
- 企业法定名称
- 注册地址
- 成立日期
- 企业类型(上市公司/私营企业等)
- 员工规模
- 年营业额(如有)
- 企业简介

#### 2.2.2 注册信息
- 统一社会信用代码/注册号
- 注册机构
- 注册日期
- 企业状态(存续/注销等)

#### 2.2.3 合规资质 (核心展示)
**FDA 注册信息**:
- 510(k) 清单 (数量、编号、产品名称、批准日期)
- PMA 清单 (数量、编号、产品名称、批准日期)
- De Novo 清单
- 警告信历史 (如有)
- 召回记录 (如有)

**欧盟 CE 认证**:
- CE 证书清单
- 公告机构信息
- MDR/MDD 合规状态

**中国 NMPA 注册**:
- 医疗器械注册证清单
- 生产许可证信息
- 经营许可证信息

**其他市场**:
- 日本 PMDA
- 加拿大 Health Canada
- 澳大利亚 TGA
- 韩国 MFDS

#### 2.2.4 产品信息
- 产品分类统计
- 主要产品列表
- 产品注册状态分布图
- 产品生命周期分析

#### 2.2.5 市场分布
- 全球注册热力图
- 各市场注册数量统计
- 市场进入时间线
- 竞争对手对比 (同市场注册的其他企业)

### 2.3 跨市场注册信息整合

**功能描述**: 集中展示同一企业在不同地区/市场的注册详情

**实现方式**:
- 建立企业实体关联系统
- 使用企业名称标准化算法匹配
- 人工审核确认机制
- 展示跨市场注册时间线

**对比分析功能**:
- 选择多个市场进行合规情况对比
- 生成竞争对手分析报告
- 导出 PDF 报告

---

## 3. 法规索引库系统

### 3.1 法规数据采集与整合

**数据来源**:
- FDA 官方数据库 (510k, PMA, De Novo, MAUDE)
- 欧盟 EUDAMED 数据库
- 中国 NMPA 数据库
- 各国监管机构公开数据

**数据结构**:
```typescript
interface Regulation {
  id: string;
  title: string;
  jurisdiction: string; // 管辖区域
  type: 'law' | 'regulation' | 'guidance' | 'standard';
  category: string; // 分类
  effectiveDate: Date;
  lastUpdated: Date;
  content: string;
  attachments: Attachment[];
  relatedRegulations: string[];
  keywords: string[];
}
```

### 3.2 高效检索系统

**搜索功能**:
- 全文搜索 (标题 + 内容)
- 多维度筛选
  - 管辖区域 (国家/地区)
  - 法规类型 (法律/法规/指南/标准)
  - 行业分类
  - 生效日期范围
  - 更新状态
- 关键词高亮
- 内容定位 (跳转到匹配段落)

**高级功能**:
- 法规版本对比
- 变更历史追踪
- 相关法规推荐
- 收藏和笔记功能

### 3.3 市场准入合规操作指南

**指南内容结构**:
```
市场准入指南 - [国家/地区]
├── 概述
│   ├── 监管机构
│   ├── 法规框架
│   └── 市场准入路径
├── 文件清单
│   ├── 必需文件
│   ├── 可选文件
│   └── 文件模板下载
├── 办理流程
│   ├── 流程图
│   ├── 各阶段说明
│   └── 注意事项
├── 时间周期
│   ├── 标准审批时间
│   ├── 加速通道(如有)
│   └── 影响因素
├── 费用估算
│   ├── 官方费用
│   ├── 代理费用(参考)
│   └── 其他成本
└── 常见问题
```

### 3.4 交互式世界地图

**功能描述**: 世界地图作为法规索引入口

**技术实现**:
- 使用 D3.js 或 ECharts 绘制世界地图
- 支持缩放和平移
- 点击国家/地区进入法规库
- 热力图显示数据覆盖度

**交互设计**:
- 鼠标悬停显示国家名称和数据概览
- 点击打开该国法规详情页
- 支持区域选择 (欧盟、东盟等)
- 搜索框快速定位国家

---

## 4. 实用工具箱

### 4.1 基础商务工具

#### 4.1.1 汇率计算器
- 实时汇率查询 (集成汇率API)
- 支持 50+ 货币
- 历史汇率走势图
- 常用货币对快捷选择

#### 4.1.2 海关编码查询 (HS Code)
- 全球 HS Code 数据库
- 支持中英文搜索
- 显示税率信息
- 相关编码推荐

#### 4.1.3 船期查询
- 集成船公司 API
- 港口到港口船期
- 运价参考
- 货物追踪

#### 4.1.4 港口信息查询
- 全球主要港口数据库
- 港口基本信息 (位置、代码、联系方式)
- 港口费用参考
- 相关航线信息

### 4.2 MDLooker 专属工具

#### 4.2.1 合规成本计算器
- 输入目标市场和产品类型
- 计算注册费用、代理费用、测试费用等
- 生成费用明细报告

#### 4.2.2 注册时间规划器
- 根据产品类型和目标市场
- 生成甘特图式时间规划
- 关键节点提醒

#### 4.2.3 合规差距分析工具
- 上传现有合规文档
- AI 分析差距
- 生成改进建议清单

#### 4.2.4 法规变更追踪器
- 订阅关注的法规领域
- 变更邮件通知
- 变更影响分析

### 4.3 工具界面规范

**统一设计**:
- 一致的输入组件样式
- 统一的结果展示格式
- 支持深色/浅色模式
- 响应式布局

**集成方式**:
- 工具箱独立页面 `/tools`
- 各工具可独立访问 `/tools/[tool-name]`
- 搜索结果页可快速调用相关工具

---

## 5. 多语言支持

### 5.1 语言架构

**默认语言**: English (en)  
**支持语言**:
- English (en) - 默认
- 简体中文 (zh-CN)
- 繁体中文 (zh-TW) - 预留
- 日本語 (ja) - 预留
- Español (es) - 预留

### 5.2 实现方案

**技术选型**: next-intl (已集成)

**文件结构**:
```
src/
├── i18n/
│   ├── config.ts          # 配置文件
│   ├── messages/
│   │   ├── en.json        # 英文
│   │   ├── zh-CN.json     # 简体中文
│   │   ├── ja.json        # 日语(预留)
│   │   └── es.json        # 西班牙语(预留)
│   └── utils.ts
```

### 5.3 内容翻译范围

**必须翻译**:
- 所有 UI 界面文本
- 导航菜单
- 按钮标签
- 表单提示
- 错误信息
- 帮助文档

**专业内容**:
- 法规名称保留原文，提供翻译注释
- 企业名称不翻译
- 产品名称保留原文

### 5.4 语言切换

**UI 设计**:
- 顶部导航栏语言选择器
- 自动检测浏览器语言
- 记住用户选择
- URL 路径前缀 `/en`, `/zh-CN`

---

## 6. AI 智能助手

### 6.1 部署方式

**悬浮机器人图标**:
- 位置: 页面右下角
- 图标: 机器人/助手图标
- 状态: 空闲时轻微动画吸引注意
- 拖拽: 支持用户调整位置

**对话窗口**:
- 展开方式: 点击图标展开
- 尺寸: 默认 380px × 600px
- 可最小化到图标状态
- 支持全屏模式

### 6.2 功能范围

**平台功能介绍**:
- 解释各模块功能
- 引导用户使用
- 提供操作指引

**合规信息咨询**:
- 回答法规相关问题
- 解释专业术语
- 提供合规建议

**智能搜索辅助**:
- 帮助构建搜索查询
- 推荐相关搜索词
- 解释搜索结果

**页面导航**:
- 根据对话内容推荐相关页面
- 提供直接跳转链接
- 高亮相关功能

### 6.3 技术实现

**AI 模型**:
- 主模型: OpenAI GPT-4 / Claude 3
- 备用模型: GPT-3.5 (快速响应)
- 嵌入模型: text-embedding-3-small

**知识库**:
- 平台功能文档
- 常见法规问答
- 使用指南
- 产品文档

**对话管理**:
- 上下文记忆 (最近 10 轮)
- 会话持久化 (本地存储)
- 多会话管理

### 6.4 性能要求

**响应速度**:
- 首字响应时间 < 1.5s
- 完整回复时间 < 5s
- 打字机效果展示

**准确率**:
- 意图识别准确率 > 90%
- 回答相关性 > 85%
- 提供"不满意"反馈入口

**持续学习**:
- 收集用户反馈
- 定期更新知识库
- A/B 测试优化回答

---

## 7. 数据库设计

### 7.1 新增表结构

#### companies_enhanced (企业扩展表)
```sql
CREATE TABLE companies_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  legal_name VARCHAR(255),
  registration_number VARCHAR(100),
  address TEXT,
  website VARCHAR(255),
  founded_date DATE,
  company_type VARCHAR(50),
  employee_count_range VARCHAR(50),
  annual_revenue_range VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### regulations (法规表)
```sql
CREATE TABLE regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  title_zh VARCHAR(500),
  jurisdiction VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- law, regulation, guidance, standard
  category VARCHAR(100),
  effective_date DATE,
  last_updated DATE,
  content TEXT,
  content_vector VECTOR(1536), -- 用于向量搜索
  keywords TEXT[],
  attachments JSONB,
  related_regulations UUID[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### market_entry_guides (市场准入指南表)
```sql
CREATE TABLE market_entry_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction VARCHAR(100) NOT NULL,
  overview TEXT,
  document_checklist JSONB,
  process_flow JSONB,
  timeline_estimate JSONB,
  cost_estimate JSONB,
  faq JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### ai_conversations (AI对话记录表)
```sql
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(100),
  messages JSONB NOT NULL,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### search_queries (搜索查询记录表)
```sql
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  query TEXT NOT NULL,
  query_vector VECTOR(1536),
  filters JSONB,
  results_count INTEGER,
  clicked_results UUID[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 索引设计

```sql
-- 全文搜索索引
CREATE INDEX idx_regulations_fts ON regulations USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- 向量搜索索引
CREATE INDEX idx_regulations_vector ON regulations USING ivfflat (content_vector vector_cosine_ops);

-- 模糊搜索索引
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);

-- 常用查询索引
CREATE INDEX idx_regulations_jurisdiction ON regulations(jurisdiction);
CREATE INDEX idx_regulations_type ON regulations(type);
CREATE INDEX idx_regulations_effective_date ON regulations(effective_date);
```

---

## 8. API 设计

### 8.1 搜索 API

```typescript
// POST /api/search
interface SearchRequest {
  query: string;
  mode: 'fuzzy' | 'semantic' | 'exact';
  filters: {
    markets?: string[];
    industries?: string[];
    complianceTypes?: string[];
    dateRange?: { from: Date; to: Date };
  };
  pagination: {
    page: number;
    limit: number;
  };
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  suggestions?: string[]; // 拼写建议
  relatedQueries?: string[]; // 相关查询
}
```

### 8.2 AI 助手 API

```typescript
// POST /api/ai/chat
interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    currentPage?: string;
    searchQuery?: string;
  };
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
  actions?: {
    type: 'navigate' | 'search' | 'open_tool';
    payload: any;
  }[];
}
```

### 8.3 法规库 API

```typescript
// GET /api/regulations
interface RegulationsQuery {
  jurisdiction?: string;
  type?: string;
  category?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

// GET /api/regulations/:id
interface RegulationDetail {
  id: string;
  title: string;
  content: string;
  relatedRegulations: RelatedRegulation[];
  versionHistory: Version[];
}
```

---

## 9. 性能指标

### 9.1 搜索性能
- 简单搜索响应时间 < 200ms
- 模糊搜索响应时间 < 500ms
- AI 语义搜索响应时间 < 2s
- 支持并发 1000 QPS

### 9.2 页面性能
- 首屏加载时间 < 1.5s
- 详情页加载时间 < 1s
- 地图组件加载时间 < 3s

### 9.3 AI 助手性能
- 首字响应时间 < 1.5s
- 完整回复时间 < 5s
- 上下文记忆 10 轮对话

---

## 10. 安全与隐私

### 10.1 数据安全
- 敏感数据加密存储
- API 密钥安全托管 (Vercel Secrets)
- 数据库 RLS 策略保护

### 10.2 用户隐私
- AI 对话数据匿名化处理
- 用户搜索历史可选清除
- GDPR 合规

### 10.3 访问控制
- 公开数据无需认证
- 高级功能需要登录
- API 限流保护

---

## 11. 部署与运维

### 11.1 环境配置
```bash
# AI 服务 - 阿里云百炼
ALIBABA_BAILIAN_API_KEY=sk-24880096468e42b9a1ee8ccd4dcf63dd

# 翻译服务 - 百度翻译
BAIDU_TRANSLATE_APP_ID=MDLooker
BAIDU_TRANSLATE_SECRET_KEY=mDoC_d63bna0852cal846kvo0

# 搜索服务 - 百度 AI 搜索
BAIDU_AI_SEARCH_KEY=bce-v3/ALTAK-VHQFEEkaOwctxjibeiOYK/854648d0486b6755758e620fe37875483fad3831

# 向量数据库
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=

# 汇率 API
EXCHANGE_RATE_API_KEY=

# 其他工具 API
SHIPPING_API_KEY=
HS_CODE_API_KEY=
```

### 11.2 第三方服务集成

#### 阿里云百炼 (AI 大模型)
- **用途**: NLP 语义搜索、AI 智能助手、合规差距分析
- **API 文档**: https://help.aliyun.com/zh/model-studio/
- **支持模型**: Qwen-Max, Qwen-Plus, Qwen-Turbo
- **推荐模型**: Qwen-Max (复杂任务), Qwen-Turbo (快速响应)

#### 百度翻译
- **用途**: 多语言翻译、界面文本本地化
- **API 文档**: https://fanyi-api.baidu.com/
- **支持语言**: 200+ 语言
- **QPS 限制**: 标准版 10 QPS

#### 百度 AI 搜索
- **用途**: 智能搜索增强、知识图谱查询
- **API 文档**: https://cloud.baidu.com/doc/
- **功能**: 语义理解、智能推荐

### 11.2 监控指标
- 搜索成功率
- AI 助手响应时间
- 页面加载性能
- 错误率统计

### 11.3 备份策略
- 数据库每日自动备份
- 重要配置版本控制
- 灾难恢复预案

---

**文档版本**: 1.0  
**创建日期**: 2026-04-08  
**最后更新**: 2026-04-08  
**作者**: MDLooker Product Team
