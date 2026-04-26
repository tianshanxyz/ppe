'use client'

import { useParams } from 'next/navigation'
import { BookOpen, ArrowLeft, Clock, Calendar, Tag, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const KNOWLEDGE_ARTICLES: Record<string, {
  title: string
  title_zh: string
  content: string
  content_zh: string
  category: string
  tags: string[]
  readTime: string
  updatedAt: string
  source: string
}> = {
  'ce-marking-guide': {
    title: 'CE Marking Complete Guide for PPE',
    title_zh: 'PPE产品CE认证完整指南',
    content: `# CE Marking Complete Guide for PPE

## Overview

CE marking is mandatory for all PPE products sold in the European Economic Area (EEA). Under EU Regulation 2016/425, manufacturers must ensure their products meet essential health and safety requirements before affixing the CE mark.

## Regulatory Framework

### EU Regulation 2016/425
This regulation replaced the previous PPE Directive 89/686/EEC and establishes the design, manufacture, and marketing requirements for personal protective equipment.

**Key Requirements:**
- Risk assessment must be conducted for all PPE
- Products must meet essential health and safety requirements (Annex II)
- Technical documentation must be maintained
- Declaration of Conformity must be issued
- CE marking must be affixed

### Product Categories

**Category I (Simple PPE)**
- Minimal risks (e.g., gardening gloves, sunglasses)
- Self-certification by manufacturer
- Module A: Internal production control

**Category II (Intermediate PPE)**
- Risks other than those listed in Categories I and III
- EU Type Examination by Notified Body required
- Module B: EU type examination

**Category III (Complex PPE)**
- Risks that may cause very serious consequences (e.g., irreversible health damage)
- Examples: respiratory protection, chemical protective clothing, fall arrest equipment
- Module B + C2/D/E/F: Full quality assurance required

## Conformity Assessment Procedures

### Module A - Internal Production Control
1. Prepare technical documentation
2. Conduct internal production control
3. Affix CE marking and issue DoC

### Module B - EU Type Examination
1. Submit application to Notified Body
2. Provide technical documentation and samples
3. Notified Body examines design and issues EU Type Examination Certificate

### Module C2 - Conformity to Type Based on Internal Production Control Plus Supervised Product Checks
1. Follow Module B procedures
2. Implement internal production control
3. Conduct supervised product checks at random intervals

### Module D - Conformity to Type Based on Quality Assurance of the Production Process
1. Follow Module B procedures
2. Implement approved quality system (ISO 9001)
3. Undergo regular surveillance audits

## Essential Requirements (Annex II)

### Design Principles
- Ergonomic design matching intended use
- Maximum level of protection without compromising usability
- Comfort and effectiveness considerations

### Safety Requirements
- Absence of risks and other nuisance factors
- Satisfactory surface condition of all parts in contact with user
- Maximum weight and volume optimization
- Adaptation to user morphology

### Information Requirements
- Manufacturer name and address
- Product designation
- CE marking
- Storage, use, and maintenance instructions
- Obsolescence date or period

## Harmonized Standards

Key EN standards for PPE:
- EN 149: Respiratory protective devices
- EN 166: Personal eye protection
- EN 20345: Safety footwear
- EN 388: Protective gloves against mechanical risks
- EN 397: Industrial safety helmets
- EN 354: Personal fall protection equipment

## Documentation Requirements

### Technical File Must Include:
1. Product description and specifications
2. Risk assessment report
3. Design and manufacturing drawings
4. Test reports (from accredited laboratories)
5. Quality control procedures
6. User instructions and labeling
7. Declaration of Conformity

## Common Mistakes to Avoid

1. **Incorrect risk category classification** - Underestimating risk level leads to insufficient testing
2. **Incomplete technical documentation** - Missing risk assessment or test reports
3. **Wrong standards applied** - Using outdated or non-harmonized standards
4. **Missing user instructions** - Incomplete or unclear instructions in required languages
5. **Improper CE marking** - Wrong size, placement, or format

## Timeline and Costs

**Typical Timeline:**
- Category I: 2-4 weeks
- Category II: 3-6 months
- Category III: 6-12 months

**Estimated Costs:**
- Category I: €2,000 - €5,000
- Category II: €10,000 - €30,000
- Category III: €30,000 - €100,000+

## Source
- European Commission: Regulation (EU) 2016/425
- Official Journal of the European Union
- European Committee for Standardization (CEN)

*Last updated: April 2026*`,
    content_zh: `# PPE产品CE认证完整指南

## 概述

CE标志是在欧洲经济区（EEA）销售的所有PPE产品的强制性要求。根据欧盟法规2016/425，制造商必须确保其产品符合基本的健康和安全要求，然后才能贴上CE标志。

## 监管框架

### 欧盟法规2016/425
该法规取代了之前的PPE指令89/686/EEC，建立了个人防护设备的设计、制造和销售要求。

**关键要求：**
- 必须对所有PPE进行风险评估
- 产品必须符合基本的健康和安全要求（附件II）
- 必须维护技术文档
- 必须发布符合性声明
- 必须贴上CE标志

### 产品类别

**I类（简单PPE）**
- 最小风险（如园艺手套、太阳镜）
- 制造商自我认证
- 模块A：内部生产控制

**II类（中等PPE）**
- 除I类和III类所列风险之外的风险
- 需要公告机构进行EU型式检验
- 模块B：EU型式检验

**III类（复杂PPE）**
- 可能导致非常严重后果的风险
- 示例：呼吸防护、化学防护服、防坠落设备
- 模块B + C2/D/E/F：需要完整的质量保证

## 符合性评估程序

### 模块A - 内部生产控制
1. 准备技术文档
2. 进行内部生产控制
3. 贴上CE标志并发布DoC

### 模块B - EU型式检验
1. 向公告机构提交申请
2. 提供技术文档和样品
3. 公告机构检查设计并颁发EU型式检验证书

## 基本要求（附件II）

### 设计原则
- 符合预期用途的人体工程学设计
- 在不损害可用性的情况下提供最大程度的保护
- 舒适性和有效性考虑

## 协调标准

PPE的关键EN标准：
- EN 149：呼吸防护装置
- EN 166：个人眼睛防护
- EN 20345：安全鞋
- EN 388：防护手套（机械风险）
- EN 397：工业安全帽
- EN 354：个人防坠落设备

## 常见错误

1. **风险类别分类不正确** - 低估风险等级导致测试不足
2. **技术文档不完整** - 缺少风险评估或测试报告
3. **应用了错误的标准** - 使用过时或非协调标准
4. **缺少用户说明** - 所需语言中的说明不完整或不清晰
5. **CE标志不当** - 尺寸、位置或格式错误

## 来源
- 欧盟委员会：法规(EU) 2016/425
- 欧洲联盟官方公报
- 欧洲标准化委员会(CEN)

*最后更新：2026年4月*`,
    category: 'compliance',
    tags: ['CE Marking', 'EU', 'PPE Regulation'],
    readTime: '15 min',
    updatedAt: '2026-04-20',
    source: 'European Commission Regulation (EU) 2016/425'
  },
  'fda-510k-process': {
    title: 'FDA 510(k) Submission Process',
    title_zh: 'FDA 510(k)提交流程',
    content: `# FDA 510(k) Submission Process for PPE

## Overview

The FDA 510(k) premarket notification is the most common pathway for PPE products to enter the US market. This guide covers the complete submission process for respiratory protection, surgical masks, and other PPE classified as Class I or II medical devices.

## Regulatory Classification

### PPE as Medical Devices

**Class I PPE (510(k) Exempt)**
- Non-surgical gloves
- Patient examination gloves
- Some surgical gowns

**Class II PPE (510(k) Required)**
- N95 respirators
- Surgical masks
- Surgical N95 respirators
- Some protective clothing

**Class III PPE (PMA Required)**
- High-risk respiratory protection (rare)

## The 510(k) Pathway

### Step 1: Predicate Device Identification

**Requirements:**
- Identify a legally marketed predicate device
- Same intended use and technological characteristics
- Same or similar performance standards

**Resources:**
- FDA 510(k) Premarket Notification Database
- Product Code Classification Database
- FDA Device Advice

### Step 2: Performance Testing

**Required Tests:**
1. **Biocompatibility Testing** (ISO 10993 series)
   - Cytotoxicity
   - Sensitization
   - Irritation
   - Systemic toxicity

2. **Performance Testing**
   - Filtration efficiency (for respirators)
   - Bacterial filtration efficiency (BFE)
   - Particle filtration efficiency (PFE)
   - Fluid resistance
   - Differential pressure

3. **Flammability Testing**
   - 16 CFR Part 1610 (Class I and II textiles)

### Step 3: Documentation Preparation

**510(k) Summary Must Include:**
1. Submitter information
2. Device identification
3. Predicate device information
4. Device description
5. Intended use
6. Technological characteristics comparison
7. Performance data summary
8. Conclusion of substantial equivalence

### Step 4: Submission and Review

**Submission Methods:**
- eSubmitter (electronic)
- Traditional paper submission

**FDA Review Timeline:**
- Standard review: 90 FDA days
- Third-party review ( eligible devices): 30-60 days

**Review Outcomes:**
- Substantial Equivalence (SE) Letter
- Additional Information (AI) Request
- Not Substantially Equivalent (NSE) Letter

## Special Considerations for Respiratory Protection

### NIOSH Approval Requirements

**Before FDA 510(k):**
1. Obtain NIOSH approval (42 CFR Part 84)
2. NIOSH approval number required in 510(k)

**Testing Standards:**
- NIOSH TEB-APR-STP-0059 (filter efficiency)
- NIOSH TEB-APR-STP-0007 (exhalation valve leakage)
- NIOSH TEB-APR-STP-0003 (inhalation/exhalation resistance)

### Surgical N95 Respirators

**Dual Requirements:**
- NIOSH approval (respiratory protection)
- FDA 510(k) clearance (surgical use)
- Must meet both 42 CFR Part 84 and 21 CFR 878.4040

## Common Mistakes and How to Avoid Them

### 1. Wrong Predicate Device
**Problem:** Choosing a predicate with different intended use
**Solution:** Verify intended use statement matches exactly

### 2. Incomplete Performance Data
**Problem:** Missing required test reports
**Solution:** Use FDA-recognized consensus standards

### 3. Inadequate Biocompatibility
**Problem:** Testing doesn't cover all patient-contacting materials
**Solution:** Complete ISO 10993 biological evaluation plan

### 4. Poor Device Description
**Problem:** Vague or incomplete device description
**Solution:** Include detailed engineering drawings and specifications

## Costs and Timeline

**Typical Costs:**
- Performance testing: $15,000 - $50,000
- Biocompatibility testing: $5,000 - $20,000
- Consultant fees: $10,000 - $50,000
- FDA user fee (2026): $6,000 - $12,000

**Total Estimated Cost:** $50,000 - $150,000

**Timeline:**
- Preparation: 3-6 months
- FDA review: 3-6 months
- Total: 6-12 months

## Source
- FDA 21 CFR Part 878 - Surgical Devices
- FDA Guidance: "Premarket Notification 510(k)"
- NIOSH 42 CFR Part 84 - Approval of Respiratory Protective Devices
- ISO 10993 - Biological Evaluation of Medical Devices

*Last updated: April 2026*`,
    content_zh: `# FDA 510(k)提交流程

## 概述

FDA 510(k)上市前通知是PPE产品进入美国市场最常见的途径。本指南涵盖了呼吸防护、外科口罩和其他被归类为I类或II类医疗器械的PPE的完整提交流程。

## 监管分类

### 作为医疗器械的PPE

**I类PPE（510(k)豁免）**
- 非手术手套
- 患者检查手套
- 部分手术服

**II类PPE（需要510(k)）**
- N95呼吸器
- 外科口罩
- 外科N95呼吸器
- 部分防护服

## 510(k)途径

### 第1步：前代设备识别

**要求：**
- 识别合法上市的前代设备
- 相同的预期用途和技术特征
- 相同或类似的性能标准

### 第2步：性能测试

**所需测试：**
1. **生物相容性测试**（ISO 10993系列）
   - 细胞毒性
   - 致敏性
   - 刺激性
   - 全身毒性

2. **性能测试**
   - 过滤效率（呼吸器）
   - 细菌过滤效率（BFE）
   - 颗粒过滤效率（PFE）
   - 抗液体性
   - 压差

### 第3步：文档准备

**510(k)摘要必须包括：**
1. 提交者信息
2. 设备识别
3. 前代设备信息
4. 设备描述
5. 预期用途
6. 技术特征比较
7. 性能数据摘要
8. 实质等同性结论

### 第4步：提交和审查

**FDA审查时间线：**
- 标准审查：90个FDA工作日
- 第三方审查：30-60天

## 呼吸防护的特殊考虑

### NIOSH批准要求

**在FDA 510(k)之前：**
1. 获得NIOSH批准（42 CFR Part 84）
2. 510(k)中需要NIOSH批准号

## 常见错误及避免方法

### 1. 错误的前代设备
**问题：** 选择预期用途不同的前代设备
**解决方案：** 确保预期用途声明完全匹配

### 2. 性能数据不完整
**问题：** 缺少必需的测试报告
**解决方案：** 使用FDA认可的共识标准

## 成本和时间线

**典型成本：**
- 性能测试：$15,000 - $50,000
- 生物相容性测试：$5,000 - $20,000
- 顾问费：$10,000 - $50,000
- FDA用户费：$6,000 - $12,000

**总估计成本：** $50,000 - $150,000

**时间线：**
- 准备：3-6个月
- FDA审查：3-6个月
- 总计：6-12个月

## 来源
- FDA 21 CFR Part 878 - 外科器械
- FDA指南："Premarket Notification 510(k)"
- NIOSH 42 CFR Part 84
- ISO 10993 - 医疗器械生物学评价

*最后更新：2026年4月*`,
    category: 'compliance',
    tags: ['FDA', '510(k)', 'US Market'],
    readTime: '20 min',
    updatedAt: '2026-04-18',
    source: 'FDA 21 CFR Part 878, NIOSH 42 CFR Part 84'
  },
}

export default function KnowledgeArticlePage() {
  const params = useParams()
  const articleId = params.id as string
  
  const article = KNOWLEDGE_ARTICLES[articleId]
  
  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-500 mb-6">The article you are looking for does not exist.</p>
          <Link href="/ppe/knowledge-base" className="text-[#339999] hover:underline">
            Back to Knowledge Base
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/ppe/knowledge-base" className="inline-flex items-center text-sm text-[#339999] hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Knowledge Base
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{article.category}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{article.readTime}</span>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{article.updatedAt}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {article.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                <Tag className="w-3 h-3" />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="prose prose-lg max-w-none">
            {article.content.split('\n').map((line, idx) => {
              if (line.startsWith('# ')) {
                return <h1 key={idx} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{line.replace('# ', '')}</h1>
              } else if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-6 mb-3">{line.replace('## ', '')}</h2>
              } else if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.replace('### ', '')}</h3>
              } else if (line.startsWith('- ')) {
                return <li key={idx} className="ml-6 text-gray-700">{line.replace('- ', '')}</li>
              } else if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. ')) {
                return <li key={idx} className="ml-6 text-gray-700">{line.substring(3)}</li>
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={idx} className="font-bold text-gray-900 mt-2">{line.replace(/\*\*/g, '')}</p>
              } else if (line.trim() === '') {
                return <div key={idx} className="h-2" />
              } else {
                return <p key={idx} className="text-gray-700 leading-relaxed">{line}</p>
              }
            })}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <strong>Source:</strong> {article.source}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              This article is for informational purposes only. Always consult official regulatory authorities for the most current requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
