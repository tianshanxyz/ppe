'use client'

import { useParams } from 'next/navigation'
import { BookOpen, ArrowLeft, Clock, Calendar, Tag, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useTranslation, useLocale } from '@/lib/i18n/useLocale'
import { knowledgeBaseTranslations } from '@/lib/i18n/translations'

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
  'ukca-transition': {
    title: 'UKCA Marking Transition Guide',
    title_zh: 'UKCA认证过渡指南',
    content: `# UKCA Marking Transition Guide for PPE

## Overview

Following Brexit, the UK introduced the UKCA (UK Conformity Assessed) marking as a replacement for CE marking for products sold in Great Britain (England, Scotland, and Wales). This guide covers the transition requirements for PPE manufacturers.

## Regulatory Framework

### The Equipment (Safety) Regulations 2016

These regulations transpose EU PPE Regulation 2016/425 into UK law. Key requirements include:
- UKCA marking for products placed on the GB market
- UK Approved Body involvement for Category II and III PPE
- UK Declaration of Conformity (UKDoC)
- UK Responsible Person for overseas manufacturers

### Timeline

**January 1, 2021**: UKCA marking became available
**January 1, 2023**: UKCA marking became mandatory for most products
**August 2023**: CE marking recognition extended for certain goods

## UKCA vs CE Marking

### Key Differences

| Aspect | CE Marking | UKCA Marking |
|--------|------------|--------------|
| Market | EU + Northern Ireland | Great Britain |
| Notified Body | EU Notified Body | UK Approved Body |
| Declaration | EU DoC | UKDoC |
| Responsible Person | EU Rep | UK Responsible Person |
| Legislation | EU Regulation 2016/425 | UK Equipment (Safety) Regs 2016 |

### Dual Marking

Many manufacturers need both CE and UKCA marks for:
- EU market access (CE)
- GB market access (UKCA)
- Northern Ireland (CE or CE + UKNI)

## Conformity Assessment

### Approved Body Requirements

For Category II and III PPE:
- Must use a UK Approved Body (not EU Notified Body)
- Some bodies hold both designations
- Check the UK Market Conformity Assessment Bodies database

### Technical Documentation

UKCA technical file requirements mirror EU requirements:
- Risk assessment
- Technical documentation
- Test reports from recognized laboratories
- User instructions in English
- UK Declaration of Conformity

## Northern Ireland Protocol

Under the Northern Ireland Protocol:
- CE marking remains valid in Northern Ireland
- UKNI marking used with CE if using UK Approved Body
- Goods can flow freely from NI to GB
- GB to NI movement requires additional checks

## Source
- UK Government: Equipment (Safety) Regulations 2016
- Office for Product Safety and Standards (OPSS)
- UKCA Marking Guidance
- Northern Ireland Protocol

*Last updated: April 2026*`,
    content_zh: `# UKCA认证过渡指南

## 概述

英国脱欧后，UKCA（英国合格评定）标志取代CE标志，用于在Great Britain（英格兰、苏格兰和威尔士）销售的产品。

## 监管框架

### 2016年设备（安全）法规

这些法规将欧盟PPE法规2016/425转化为英国法律。

## UKCA与CE标志的区别

| 方面 | CE标志 | UKCA标志 |
|------|--------|----------|
| 市场 | 欧盟 + 北爱尔兰 | 大不列颠 |
| 公告机构 | 欧盟公告机构 | 英国批准机构 |
| 符合性声明 | EU DoC | UKDoC |
| 负责人 | 欧盟代表 | 英国负责人 |

## 北爱尔兰议定书

在北爱尔兰议定书下：
- CE标志在北爱尔兰仍然有效
- 如果使用英国批准机构，UKNI标志与CE一起使用

## 来源
- 英国政府：2016年设备（安全）法规
- 产品安全与标准办公室（OPSS）
- UKCA标志指南

*最后更新：2026年4月*`,
    category: 'compliance',
    tags: ['UKCA', 'UK', 'Brexit'],
    readTime: '12 min',
    updatedAt: '2026-04-15',
    source: 'UK Government Equipment (Safety) Regulations 2016, OPSS'
  },
  'nmpa-registration': {
    title: 'NMPA Registration for Foreign Manufacturers',
    title_zh: '外国制造商NMPA注册指南',
    content: `# NMPA Registration for Foreign PPE Manufacturers

## Overview

The National Medical Products Administration (NMPA) regulates PPE classified as medical devices in China. Foreign manufacturers must obtain NMPA registration before selling medical PPE products in the Chinese market.

## Product Classification

### Class I PPE (Filing Required)
- Non-sterile medical gloves
- Basic surgical gowns
- Simple protective masks

### Class II PPE (Registration Required)
- Surgical masks
- Medical protective clothing
- Examination gloves

### Class III PPE (Registration Required)
- N95 medical respirators
- High-risk surgical PPE
- Implantable medical devices

## Registration Process

### Step 1: Appoint a China Agent
- Must be a legal entity registered in China
- Responsible for communication with NMPA
- Handles adverse event reporting

### Step 2: Prepare Documentation
- Product technical requirements
- Risk assessment report
- Clinical evaluation (if required)
- Product testing report from NMPA-recognized lab
- Quality management system documentation
- Original manufacturing country certificates

### Step 3: Product Testing
- Testing must be conducted at NMPA-recognized laboratories
- Chinese national standards (GB/YY) apply
- Testing timeline: 3-6 months

### Step 4: Submit Application
- Submit through NMPA online system
- Registration certificate valid for 5 years
- Renewal required 6 months before expiration

## Timeline and Costs

**Class I Filing**: 2-3 months, ¥5,000-15,000
**Class II Registration**: 12-18 months, ¥50,000-150,000
**Class III Registration**: 18-24 months, ¥100,000-300,000+

## Source
- NMPA Medical Device Registration Regulations
- GB/YY Standards for Medical Devices
- China Medical Device Classification Catalog

*Last updated: April 2026*`,
    content_zh: `# 外国制造商NMPA注册指南

## 概述

国家药品监督管理局（NMPA）监管被归类为医疗器械的PPE。外国制造商在中国市场销售医疗PPE产品之前必须获得NMPA注册。

## 产品分类

### I类PPE（备案）
- 非无菌医用手套
- 基础手术服
- 简易防护口罩

### II类PPE（注册）
- 外科口罩
- 医用防护服
- 检查手套

### III类PPE（注册）
- N95医用呼吸器
- 高风险外科PPE
- 植入式医疗器械

## 注册流程

### 第1步：指定中国代理人
- 必须是在中国注册的法人实体
- 负责与NMPA沟通
- 处理不良事件报告

### 第2步：准备文档
- 产品技术要求
- 风险评估报告
- 临床评价（如需要）
- NMPA认可实验室的产品检测报告
- 质量管理体系文件
- 原产国证书

### 第3步：产品检测
- 必须在NMPA认可的实验室进行检测
- 适用中国国家标准（GB/YY）
- 检测周期：3-6个月

### 第4步：提交申请
- 通过NMPA在线系统提交
- 注册证书有效期5年
- 需在到期前6个月续期

## 时间和费用

**I类备案**：2-3个月，¥5,000-15,000
**II类注册**：12-18个月，¥50,000-150,000
**III类注册**：18-24个月，¥100,000-300,000+

## 来源
- 医疗器械注册管理办法
- 医疗器械国家标准（GB/YY）
- 医疗器械分类目录

*最后更新：2026年4月*`,
    category: 'compliance',
    tags: ['NMPA', 'China', 'Registration'],
    readTime: '25 min',
    updatedAt: '2026-04-10',
    source: 'NMPA Medical Device Registration Regulations, GB/YY Standards'
  },
  'risk-assessment': {
    title: 'PPE Risk Assessment Best Practices',
    title_zh: 'PPE风险评估最佳实践',
    content: `# PPE Risk Assessment Best Practices

## Overview

Risk assessment is a fundamental requirement for all PPE products under major regulatory frameworks (EU Regulation 2016/425, ISO 14971). This guide provides best practices for conducting comprehensive risk assessments.

## Risk Assessment Framework

### ISO 14971:2019 - Medical Device Risk Management

The ISO 14971 standard provides a systematic approach to risk management:
1. Risk analysis
2. Risk evaluation
3. Risk control
4. Evaluation of overall residual risk
5. Risk management review
6. Production and post-production information gathering

### Hazard Identification

**Physical Hazards:**
- Mechanical injury (cuts, abrasions, impacts)
- Thermal injury (heat, cold, fire)
- Electrical hazards
- Radiation exposure
- Noise exposure

**Chemical Hazards:**
- Toxic substances
- Corrosive chemicals
- Carcinogens
- Allergens

**Biological Hazards:**
- Pathogenic microorganisms
- Blood-borne pathogens
- Airborne infectious agents

## Risk Assessment Process

### Step 1: Define Scope and Intended Use
- Product description and specifications
- Intended user population
- Expected use environment
- Single-use vs. reusable

### Step 2: Identify Hazards
- Review similar products on the market
- Analyze materials and components
- Consider manufacturing processes
- Review user feedback and complaints

### Step 3: Estimate Risk
For each hazard, assess:
- **Probability of occurrence**: Rare (1) to Frequent (5)
- **Severity of harm**: Negligible (1) to Catastrophic (5)
- **Risk level**: Probability x Severity

### Step 4: Risk Evaluation
Compare estimated risk against acceptability criteria:
- **Acceptable**: No further action required
- **ALARP (As Low As Reasonably Practicable)**: Further reduction may be possible
- **Unacceptable**: Must implement risk controls

### Step 5: Risk Control Measures

**Hierarchy of Controls:**
1. **Inherent safety by design** (most effective)
2. **Protective measures in the product**
3. **Information for safety** (warnings, instructions) (least effective)

## Risk Assessment Documentation

### Required Documentation
- Risk Management Plan
- Hazard identification records
- Risk analysis worksheets
- Risk evaluation matrix
- Risk control measures and verification
- Residual risk assessment
- Risk-benefit analysis (if applicable)
- Risk Management Report

### Common Risk Assessment Methods
- Failure Mode and Effects Analysis (FMEA)
- Fault Tree Analysis (FTA)
- Hazard Analysis and Critical Control Points (HACCP)
- Preliminary Hazard Analysis (PHA)

## Source
- ISO 14971:2019 Medical Devices - Application of Risk Management
- EU Regulation 2016/425 Annex I
- EN ISO 12100:2010 Safety of Machinery

*Last updated: April 2026*`,
    content_zh: `# PPE风险评估最佳实践

## 概述

风险评估是主要监管框架下所有PPE产品的基本要求（欧盟法规2016/425，ISO 14971）。

## 风险评估框架

### ISO 14971:2019 - 医疗器械风险管理

1. 风险分析
2. 风险评价
3. 风险控制
4. 剩余风险总体评价
5. 风险管理评审
6. 生产和生产后信息收集

## 风险评估流程

### 第1步：定义范围和预期用途
### 第2步：识别危害
### 第3步：风险估计
### 第4步：风险评价
### 第5步：风险控制措施

## 风险评估文档

### 必需文档
- 风险管理计划
- 危害识别记录
- 风险分析工作表
- 风险评价矩阵
- 风险控制措施及验证
- 剩余风险评估
- 风险收益分析（如适用）
- 风险管理报告

## 来源
- ISO 14971:2019 医疗器械风险管理
- 欧盟法规2016/425附件I

*最后更新：2026年4月*`,
    category: 'technical',
    tags: ['Risk Assessment', 'ISO 14971', 'Safety'],
    readTime: '18 min',
    updatedAt: '2026-04-12',
    source: 'ISO 14971:2019, EU Regulation 2016/425 Annex I'
  },
  'testing-requirements': {
    title: 'PPE Testing Requirements by Category',
    title_zh: '按类别划分的PPE测试要求',
    content: `# PPE Testing Requirements by Category

## Overview

Different PPE categories require different testing protocols to verify compliance with applicable standards. This guide outlines testing requirements by product category for major markets.

## Head Protection

### Safety Helmets (EN 397 / ANSI Z89.1)
**Required Tests:**
- Impact absorption (5kg weight dropped from 1m)
- Penetration resistance (3kg striker from 1m)
- Flame resistance (15-second exposure)
- Lateral deformation
- Electrical insulation (if applicable)
- Low temperature performance (-20°C to +50°C)

### Industrial Helmets (EN 12492)
**Additional Tests:**
- Chin strap effectiveness
- Accessory mounting compatibility

## Eye Protection (EN 166 / ANSI Z87.1)

**Required Tests:**
- Optical quality and vision requirements
- Mechanical strength (robustness, impact resistance)
- Field of vision
- Resistance to fogging
- Resistance to surface damage (abrasion)
- UV protection testing
- Laser radiation protection (if applicable)

## Hand Protection (EN 388 / EN 374)

### EN 388 - Mechanical Risks
**Required Tests:**
- Abrasion resistance (cycles to wear through)
- Blade cut resistance
- Tear resistance
- Puncture resistance
- Impact protection (optional)

### EN 374 - Chemical & Microorganisms
**Required Tests:**
- Chemical permeation testing
- Penetration testing
- Microorganism penetration

## Respiratory Protection (EN 149 / NIOSH 42 CFR 84)

### EN 149 - Filtering Half Masks
**Required Tests:**
- Filter efficiency (FFP1: 80%, FFP2: 94%, FFP3: 99%)
- Total inward leakage
- Breathing resistance (inhalation/exhalation)
- CO2 content of inhaled air
- Clogging test (dolomite dust)
- Flammability

### NIOSH N95 Testing
**Required Tests:**
- NaCl aerosol filtration efficiency (≥95%)
- Oil resistance
- Breathing resistance
- Flame resistance
- Strap strength

## Foot Protection (EN ISO 20345)

**Required Tests:**
- Toe cap impact resistance (200J)
- Toe cap compression resistance (15kN)
- Penetration resistance (1100N)
- Antistatic properties
- Slip resistance
- Energy absorption of heel region
- Water resistance (if applicable)

## Body Protection (EN ISO 13688 / EN 14605)

**Required Tests:**
- Material tear strength
- Burst strength (seams)
- Chemical penetration resistance
- Liquid repellency
- Flame resistance
- Antistatic properties

## Testing Laboratories

### Accredited Laboratories
- Must be ISO/IEC 17025 accredited
- Recognized by relevant regulatory bodies
- Regular proficiency testing participation

### Typical Testing Costs
- Basic mechanical testing: $500 - $2,000 per test
- Full category testing: $5,000 - $30,000
- Complete product certification testing: $15,000 - $100,000+

## Source
- European Committee for Standardization (CEN)
- NIOSH Testing Standards
- ANSI/ISEA Standards
- ISO Standards

*Last updated: April 2026*`,
    content_zh: `# 按类别划分的PPE测试要求

## 概述

不同的PPE类别需要不同的测试方案来验证是否符合适用标准。

## 头部防护

### 安全帽（EN 397 / ANSI Z89.1）
**必需测试：**
- 冲击吸收（5kg重物从1m高度落下）
- 穿透阻力（3kg冲击物从1m高度落下）
- 阻燃性（15秒暴露）
- 侧向变形
- 电绝缘性（如适用）

## 眼部防护（EN 166 / ANSI Z87.1）
## 手部防护（EN 388 / EN 374）
## 呼吸防护（EN 149 / NIOSH 42 CFR 84）
## 足部防护（EN ISO 20345）
## 身体防护（EN ISO 13688 / EN 14605）

## 测试实验室

### 认可实验室
- 必须通过ISO/IEC 17025认可
- 相关监管机构认可
- 定期参加能力验证

## 来源
- 欧洲标准化委员会（CEN）
- NIOSH测试标准
- ANSI/ISEA标准

*最后更新：2026年4月*`,
    category: 'technical',
    tags: ['Testing', 'Standards', 'Certification'],
    readTime: '30 min',
    updatedAt: '2026-04-08',
    source: 'CEN, NIOSH, ANSI/ISEA, ISO Standards'
  },
  'market-access-eu': {
    title: 'EU Market Access Strategy',
    title_zh: '欧盟市场准入策略',
    content: `# EU Market Access Strategy for PPE Products

## Overview

Entering the EU PPE market requires comprehensive compliance with Regulation (EU) 2016/425 and strategic planning. This guide provides a framework for successful market entry.

## Regulatory Pathway

### Step 1: Product Classification
Determine the risk category:
- **Category I**: Simple design, self-certification
- **Category II**: Intermediate risk, Notified Body required
- **Category III**: Complex design, full quality assurance

### Step 2: Notified Body Selection

**Criteria for Selection:**
- Scope covers your product category
- Geographic proximity for audits
- Processing time and capacity
- Reputation and experience
- Cost structure

**EU NANDO Database:**
- Search at ec.europa.eu/growth/tools-databases/nando/
- Verify NB designation number
- Check current accreditation status

### Step 3: Technical Documentation

**Required Elements:**
1. General product description
2. Design and manufacturing drawings
3. Risk assessment report
4. List of applied harmonized standards
5. Test reports from accredited laboratories
6. Instructions for use
7. EU Declaration of Conformity
8. CE marking specifications

### Step 4: EU Authorized Representative

For non-EU manufacturers:
- Must appoint an EU authorized representative
- Written mandate required
- Rep maintains technical documentation
- Rep coordinates with authorities

## Market Entry Strategy

### Distribution Channels
1. **Direct Sales**: Higher margins, requires local presence
2. **Distributors**: Established market access, shared margins
3. **Online Platforms**: Growing channel, regulatory complexity
4. **OEM Partnerships**: Leverage existing manufacturer networks

### Competitive Positioning
- Price competition vs. quality differentiation
- Niche market specialization
- Private label opportunities
- Innovation-driven differentiation

## Timeline for Market Entry

**Category I Products**: 2-3 months
**Category II Products**: 6-12 months
**Category III Products**: 12-24 months

## Source
- European Commission Market Access Database
- Regulation (EU) 2016/425
- CEN Harmonized Standards
- EU NANDO Database

*Last updated: April 2026*`,
    content_zh: `# 欧盟市场准入策略

## 概述

进入欧盟PPE市场需要全面遵守法规(EU) 2016/425和战略规划。

## 监管路径

### 第1步：产品分类
### 第2步：公告机构选择
### 第3步：技术文档
### 第4步：欧盟授权代表

## 市场准入策略

### 分销渠道
1. **直销**：利润率高，需要本地存在
2. **经销商**：现有市场准入，共享利润
3. **在线平台**：增长渠道，监管复杂性
4. **OEM合作**：利用现有制造商网络

### 市场进入时间线

**I类产品**：2-3个月
**II类产品**：6-12个月
**III类产品**：12-24个月

## 来源
- 欧盟委员会市场准入数据库
- 法规(EU) 2016/425
- CEN协调标准

*最后更新：2026年4月*`,
    category: 'market',
    tags: ['EU', 'Market Access', 'Strategy'],
    readTime: '22 min',
    updatedAt: '2026-04-05',
    source: 'European Commission, Regulation (EU) 2016/425, CEN Standards'
  },
  'post-market-surveillance': {
    title: 'Post-Market Surveillance Requirements',
    title_zh: '上市后监督要求',
    content: `# Post-Market Surveillance Requirements for PPE Manufacturers

## Overview

Post-market surveillance (PMS) is a mandatory obligation for PPE manufacturers in most major markets. It ensures ongoing product safety and compliance throughout the product lifecycle.

## EU PMS Requirements

### Under Regulation 2016/425

**PMS System Requirements:**
- Documented PMS procedures
- Collection and review of post-market data
- Complaint handling procedures
- Product recall procedures
- Periodic safety update reports (Category III)

### PMS Data Sources
1. Customer complaints
2. Non-conforming product reports
3. Warranty claims
4. Field failure data
5. Scientific literature review
6. Regulatory authority notifications
7. Distributor feedback
8. Adverse event reports

## US PMS Requirements

### FDA Medical Device Reporting (MDR)

**Reportable Events:**
- Device-related deaths
- Serious injuries
- Malfunctions that could cause death or serious injury

**Reporting Timelines:**
- Death: 10 working days
- Serious injury: 30 calendar days
- Trend reports: Annual submission

### Corrective and Preventive Actions (CAPA)

**CAPA Process:**
1. Identify and document the issue
2. Investigate root cause
3. Develop corrective action plan
4. Implement corrective actions
5. Verify effectiveness
6. Prevent recurrence
7. Document and close

## Other Markets

### UK PMS (MHRA)
- Vigilance reporting system
- Field Safety Corrective Actions (FSCA)
- Field Safety Notices (FSN)

### China PMS (NMPA)
- Adverse event monitoring system
- Periodic re-evaluation
- Quality complaint handling

## PMS Documentation

### PMS Plan
- Scope and objectives
- Data collection methods
- Analysis procedures
- Reporting schedule
- Roles and responsibilities

### PMS Report
- Summary of data collected
- Analysis and trends
- Actions taken
- Risk-benefit assessment
- Recommendations for improvement

## Best Practices

1. **Integrate PMS into Quality Management System**
2. **Use automated tools for data collection and analysis**
3. **Establish clear escalation procedures**
4. **Train staff on PMS requirements**
5. **Maintain comprehensive documentation**
6. **Review and update PMS plan regularly**
7. **Share relevant data with Notified Bodies**
8. **Benchmark against industry standards**

## Source
- EU Regulation 2016/425 Article 28
- FDA 21 CFR Part 803 - Medical Device Reporting
- ISO 13485:2016 Post-Market Surveillance
- MHRA Medical Device Vigilance System

*Last updated: April 2026*`,
    content_zh: `# 上市后监督要求

## 概述

上市后监督（PMS）是大多数主要市场PPE制造商的强制性义务。

## 欧盟PMS要求

### 根据法规2016/425

**PMS系统要求：**
- 文件化的PMS程序
- 上市后数据收集与审查
- 投诉处理程序
- 产品召回程序
- 定期安全更新报告（III类）

## 美国PMS要求

### FDA医疗器械报告（MDR）

**需报告的事件：**
- 器械相关死亡
- 严重伤害
- 可能导致死亡或严重伤害的故障

## 其他市场

### 英国PMS（MHRA）
### 中国PMS（NMPA）

## PMS文档

### PMS计划
### PMS报告

## 最佳实践

1. 将PMS整合到质量管理体系中
2. 使用自动化工具进行数据收集和分析
3. 建立明确的升级程序
4. 培训员工了解PMS要求
5. 维护全面的文档
6. 定期审查和更新PMS计划

## 来源
- 欧盟法规2016/425第28条
- FDA 21 CFR Part 803
- ISO 13485:2016

*最后更新：2026年4月*`,
    category: 'compliance',
    tags: ['PMS', 'Vigilance', 'Compliance'],
    readTime: '16 min',
    updatedAt: '2026-04-01',
    source: 'EU Regulation 2016/425 Article 28, FDA 21 CFR Part 803, ISO 13485:2016'
  },
}

export default function KnowledgeArticlePage() {
  const params = useParams()
  const articleId = params.id as string
  const locale = useLocale()
  const t = useTranslation(knowledgeBaseTranslations)
  
  const article = KNOWLEDGE_ARTICLES[articleId]
  
  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {locale === 'zh' ? '文章未找到' : 'Article Not Found'}
          </h1>
          <p className="text-gray-500 mb-6">
            {locale === 'zh' ? '您查找的文章不存在。' : 'The article you are looking for does not exist.'}
          </p>
          <Link href="/knowledge-base" className="text-[#339999] hover:underline">
            {t.backToKnowledgeBase}
          </Link>
        </div>
      </div>
    )
  }
  
  const displayTitle = locale === 'zh' && article.title_zh ? article.title_zh : article.title
  const displayContent = locale === 'zh' && article.content_zh ? article.content_zh : article.content
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/knowledge-base" className="inline-flex items-center text-sm text-[#339999] hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.backToKnowledgeBase}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{displayTitle}</h1>
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
            {displayContent.split('\n').map((line, idx) => {
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
              <strong>{t.source}:</strong> {article.source}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {locale === 'zh' 
                ? '本文仅供参考。请务必咨询官方监管机构以获取最新要求。'
                : 'This article is for informational purposes only. Always consult official regulatory authorities for the most current requirements.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
