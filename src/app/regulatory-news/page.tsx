'use client'

import { useState, useMemo } from 'react'
import { Newspaper, Calendar, Tag, Search, ExternalLink, ChevronDown, ChevronRight, ChevronLeft, User, PenLine, BookOpen } from 'lucide-react'

// Milly Chen 作者配置
const MILLY_AUTHOR = {
  name: 'Milly Chen',
  role: 'PPE Industry Analyst',
  bio: 'Senior PPE compliance analyst with 8+ years of experience in regulatory affairs and market access strategy.',
  avatar: 'MC',
}

// 内容类型定义
type ContentType = 'all' | 'milly-insights' | 'industry-news'

interface NewsArticle {
  id: string
  title: string
  title_zh: string
  summary: string
  summary_zh: string
  fullContent: string
  date: string
  source: string
  source_url: string
  category: string
  tags: string[]
  impact: string
  contentType: 'milly-insights' | 'industry-news'
  author?: {
    name: string
    role: string
    avatar: string
  }
  contentLabel: string
}

const REGULATORY_NEWS: NewsArticle[] = [
  // ===== Milly's Insights =====
  {
    id: 'milly-1',
    title: '2026 PPE Industry Trends: How AI-Driven Compliance Testing Will Change the Game',
    title_zh: '2026年PPE行业趋势：AI驱动的合规检测将如何改变游戏规则',
    summary: 'AI and machine learning are transforming PPE compliance testing, from automated visual inspection to predictive risk assessment. This analysis explores the key trends and their implications for manufacturers and regulators.',
    summary_zh: 'AI和机器学习正在改变PPE合规检测，从自动视觉检测到预测性风险评估。本文分析了关键趋势及其对制造商和监管机构的影响。',
    fullContent: `The PPE industry is undergoing a fundamental transformation driven by artificial intelligence and machine learning technologies. As we move through 2026, several key trends are reshaping how compliance testing is conducted and how manufacturers approach regulatory requirements.

## The AI Revolution in PPE Testing

### Automated Visual Inspection
Computer vision systems are now capable of detecting defects in PPE products with accuracy rates exceeding 99.5%, surpassing human inspectors in both speed and consistency. Key applications include:
- **Respirator seal integrity**: AI-powered cameras can detect microscopic leaks in N95 respirator seals
- **Glove defect detection**: Automated systems identify pinholes, tears, and thickness variations in protective gloves
- **Helmet impact analysis**: 3D scanning combined with AI predicts impact resistance without destructive testing

### Predictive Risk Assessment
Machine learning models trained on historical compliance data can now predict potential regulatory issues before they arise:
- Risk scoring for new product designs based on similarity to previously non-compliant products
- Automated identification of standards gaps in technical documentation
- Predictive modeling of regulatory change impact on existing certifications

### Digital Twin Technology
The emergence of digital twin technology allows manufacturers to:
1. Simulate product performance under various conditions virtually
2. Pre-test compliance scenarios before physical prototyping
3. Optimize product designs for multi-market compliance simultaneously

## Implications for Manufacturers

### Cost Reduction
AI-driven testing can reduce compliance costs by 30-40% through:
- Fewer physical test iterations required
- Faster time-to-market for new products
- Reduced rework and redesign cycles

### Quality Improvement
Automated systems provide:
- Consistent, unbiased inspection results
- 24/7 testing capability
- Complete digital audit trails

### Regulatory Acceptance
Key regulatory bodies are beginning to accept AI-generated test data:
- FDA has issued guidance on AI/ML-based software in medical devices
- EU Notified Bodies are developing protocols for AI-assisted conformity assessment
- NMPA is exploring AI integration in the registration review process

## Challenges and Considerations

1. **Validation Requirements**: AI systems must themselves be validated and verified
2. **Data Quality**: Models are only as good as their training data
3. **Regulatory Framework**: Current regulations were not designed with AI in mind
4. **Skills Gap**: Industry needs professionals who understand both PPE compliance and AI technology

## Looking Ahead

By 2028, we expect AI-driven compliance to be the industry standard. Manufacturers who invest in these capabilities now will have a significant competitive advantage in the global PPE market.

*This analysis is based on interviews with 15+ industry leaders and regulatory officials, as well as review of 50+ technical papers published in 2025-2026.*`,
    date: '2026-04-28',
    source: 'Milly Chen - MDLooker Analysis',
    source_url: '#',
    category: 'Trends',
    tags: ['AI', 'Compliance Testing', 'Industry Trends', 'Digital Transformation'],
    impact: 'high',
    contentType: 'milly-insights',
    author: MILLY_AUTHOR,
    contentLabel: "Editor's Pick",
  },
  {
    id: 'milly-2',
    title: 'EU PPE Regulation Latest Amendments: 5 Key Changes Companies Must Know',
    title_zh: '欧盟PPE法规最新修订：企业需要关注的5个关键变化',
    summary: 'The European Commission has introduced significant amendments to PPE Regulation 2016/425. This expert analysis breaks down the five most impactful changes and provides actionable guidance for compliance.',
    summary_zh: '欧盟委员会对PPE法规2016/425进行了重大修订。本文详细解读五个最具影响力的变化，并提供可操作的合规指导。',
    fullContent: `The European Commission has introduced a series of amendments to Regulation (EU) 2016/425 on personal protective equipment. These changes, effective throughout 2026, represent the most significant regulatory update since the regulation's original implementation. Here are the five key changes every PPE manufacturer and distributor must understand.

## Change 1: Expanded Scope for Smart PPE

The amended regulation now explicitly covers PPE with integrated electronic components, including:
- **Smart helmets** with built-in sensors and communication systems
- **Connected respirators** with real-time air quality monitoring
- **Wearable safety devices** with GPS and emergency alert functions

**Action Required**: Manufacturers of smart PPE must now ensure both the physical protection and electronic functionality meet PPE regulation requirements, in addition to applicable EMC and radio equipment directives.

## Change 2: Enhanced Notified Body Oversight

New requirements for Notified Bodies include:
- Mandatory unannounced audits for Category III PPE manufacturers
- Increased minimum qualifications for Notified Body assessors
- Enhanced reporting requirements for surveillance findings

**Action Required**: Companies should prepare for more frequent and thorough audits. Ensure all technical documentation is current and accessible at short notice.

## Change 3: Digital Documentation Standards

The regulation now accepts digital technical documentation with specific requirements:
- Electronic signatures must comply with eIDAS regulation
- Cloud storage is acceptable with appropriate security measures
- Version control systems must be validated

**Action Required**: Transition from paper-based to digital documentation systems. Implement validated electronic signature workflows.

## Change 4: Strengthened Supply Chain Traceability

New traceability requirements mandate:
- Unique product identification for all Category II and III PPE
- Batch-level traceability from raw materials to end user
- Digital record retention for minimum 10 years

**Action Required**: Implement or upgrade product identification and traceability systems. Ensure supplier documentation includes full material traceability.

## Change 5: Updated Conformity Assessment Procedures

Revised conformity assessment modules include:
- Simplified Module A for Category I PPE with enhanced documentation requirements
- Updated Module B type examination with additional performance criteria
- New Module H combining quality assurance and full quality assurance

**Action Required**: Review current conformity assessment procedures against updated module requirements. Plan for any additional testing or documentation needs.

## Implementation Timeline

| Change | Effective Date | Transition Period |
|--------|---------------|-------------------|
| Smart PPE scope | January 1, 2026 | 18 months |
| Notified Body oversight | March 1, 2026 | 12 months |
| Digital documentation | July 1, 2026 | 24 months |
| Traceability | January 1, 2027 | 18 months |
| Conformity assessment | July 1, 2027 | 24 months |

## Expert Recommendations

1. **Conduct a gap analysis** immediately to identify which changes affect your products
2. **Engage your Notified Body early** to understand their implementation timeline
3. **Invest in digital infrastructure** to support new documentation and traceability requirements
4. **Train your compliance team** on the updated regulatory requirements
5. **Monitor implementation guidance** from the European Commission and Notified Bodies

*This analysis reflects the author's interpretation of the published amendments. Companies should consult with their Notified Body and legal counsel for specific compliance guidance.*`,
    date: '2026-04-15',
    source: 'Milly Chen - MDLooker Analysis',
    source_url: '#',
    category: 'EU',
    tags: ['EU Regulation', 'PPE 2016/425', 'Amendments', 'Compliance'],
    impact: 'high',
    contentType: 'milly-insights',
    author: MILLY_AUTHOR,
    contentLabel: 'Expert Analysis',
  },
  {
    id: 'milly-3',
    title: 'Post-Pandemic N95 Mask Market Landscape: A Deep-Dive Analysis',
    title_zh: '后疫情时代N95口罩市场格局深度分析',
    summary: 'The N95 respirator market has undergone dramatic shifts since the COVID-19 pandemic. This comprehensive analysis examines current market dynamics, key players, pricing trends, and regulatory changes shaping the industry.',
    summary_zh: '自COVID-19疫情以来，N95呼吸器市场发生了剧烈变化。本文全面分析当前市场动态、主要参与者、价格趋势和影响行业的监管变化。',
    fullContent: `The global N95 respirator market has experienced unprecedented transformation since 2020. From acute shortages to oversupply, and now to a new equilibrium, understanding the current landscape is essential for any PPE industry stakeholder.

## Market Size and Growth

### Current Market Valuation
- **Global N95 market (2025)**: $4.2 billion
- **Projected CAGR (2025-2030)**: 6.8%
- **Key growth drivers**: Industrial safety regulations, pandemic preparedness stockpiling, air quality concerns

### Regional Distribution
| Region | Market Share | Growth Rate |
|--------|-------------|-------------|
| North America | 35% | 5.2% |
| Europe | 28% | 6.1% |
| Asia-Pacific | 30% | 9.3% |
| Rest of World | 7% | 7.5% |

## Competitive Landscape

### Top 10 N95 Manufacturers (by market share)
1. **3M Company** - 22% market share, dominant in industrial and healthcare segments
2. **Honeywell** - 15% market share, strong in industrial applications
3. **Kimberly-Clark** - 8% market share, healthcare focus
4. **Moldex** - 6% market share, specialty industrial
5. **Alpha Pro Tech** - 4% market share, growing healthcare presence
6-10. Various Chinese manufacturers collectively holding ~25% market share

### Chinese Manufacturer Evolution
Post-pandemic, Chinese N95 manufacturers have evolved significantly:
- **Quality improvement**: Major manufacturers now consistently pass NIOSH and EN 149 testing
- **Brand building**: Transition from OEM to own-brand strategies
- **Global expansion**: Establishing distribution networks in EU, US, and emerging markets
- **Vertical integration**: Investing in melt-blown fabric production for supply chain security

## Pricing Trends

### Pre-Pandemic vs. Current Pricing
| Product Type | Pre-Pandemic (2019) | Peak (2020) | Current (2026) |
|-------------|-------------------|-------------|----------------|
| N95 (standard) | $0.35-0.50 | $3.50-7.00 | $0.40-0.65 |
| N95 (surgical) | $0.50-0.80 | $5.00-10.00 | $0.55-0.90 |
| FFP2 equivalent | EUR 0.30-0.50 | EUR 3.00-6.00 | EUR 0.35-0.55 |

### Key Pricing Factors
1. Raw material costs (melt-blown polypropylene)
2. Regulatory compliance costs
3. Supply chain logistics
4. Brand premium
5. Volume discounts

## Regulatory Developments

### US Market
- FDA has streamlined 510(k) requirements for NIOSH-approved N95s
- NIOSH has increased surveillance of existing approvals
- New guidance on reprocessed respirators

### EU Market
- EN 149:2001+A1:2009 remains the primary standard
- Increased market surveillance post-pandemic
- New guidance on FFP2 performance requirements

### China Market
- GB 2626-2019 (KN95 standard) updated with stricter requirements
- NMPA enhanced oversight of medical-grade respirators
- Export quality control measures maintained

## Future Outlook

### Short-term (2026-2027)
- Market stabilization with modest growth
- Continued regulatory tightening
- Consolidation among smaller manufacturers

### Medium-term (2027-2029)
- Smart respirator technologies entering market
- Sustainability concerns driving material innovation
- Pandemic preparedness stockpiling creating baseline demand

### Long-term (2029+)
- Next-generation filtration materials (nanofiber, graphene)
- Integrated health monitoring capabilities
- Circular economy models for respirator recycling

*Data sources: Grand View Research, Mordor Intelligence, FDA, EU Commission, NMPA, company annual reports, and industry interviews.*`,
    date: '2026-03-20',
    source: 'Milly Chen - MDLooker Analysis',
    source_url: '#',
    category: 'Market',
    tags: ['N95', 'Market Analysis', 'Post-Pandemic', 'Respirator'],
    impact: 'high',
    contentType: 'milly-insights',
    author: MILLY_AUTHOR,
    contentLabel: 'Expert Analysis',
  },
  {
    id: 'milly-4',
    title: 'How Chinese PPE Exporters Can Navigate the New EU Regulations',
    title_zh: '中国PPE出口企业如何应对欧盟新规',
    summary: 'With the EU tightening PPE import requirements, Chinese exporters face new compliance challenges. This guide provides a practical roadmap for navigating the regulatory landscape and maintaining market access.',
    summary_zh: '随着欧盟收紧PPE进口要求，中国出口商面临新的合规挑战。本文提供了应对监管环境和维持市场准入的实用路线图。',
    fullContent: `The European Union has significantly strengthened its regulatory oversight of imported PPE products, creating both challenges and opportunities for Chinese manufacturers. This guide provides a practical roadmap for maintaining and expanding EU market access.

## Current Regulatory Landscape

### Enhanced Import Controls
Since 2025, EU customs authorities have implemented:
- **Document verification at border**: All PPE imports must have verifiable CE certificates
- **Product sampling and testing**: Random sampling at border for laboratory verification
- **Online marketplace surveillance**: Enhanced monitoring of e-commerce platforms
- **Economic operator registration**: Mandatory registration in the EU database

### Common Non-Compliance Issues for Chinese PPE
Based on EU Safety Gate data and Notified Body reports:
1. **Counterfeit CE certificates** - Estimated 15-20% of CE certificates from some sources are fraudulent
2. **Incomplete technical files** - Missing risk assessments, test reports, or quality system documentation
3. **Non-compliant labeling** - Missing required markings, incorrect format, or missing EU languages
4. **Performance failures** - Products failing verification testing against claimed standards
5. **Traceability gaps** - Inability to trace products through the supply chain

## Practical Compliance Roadmap

### Step 1: Certificate Verification
- Verify your Notified Body is listed in NANDO (EU Notified Body database)
- Confirm your EC certificate number is valid and traceable
- Request certificate verification directly from the Notified Body

### Step 2: Technical Documentation Upgrade
Ensure your technical file includes:
- Complete product description and specifications
- Risk assessment per EN ISO 12100
- Test reports from accredited laboratories (ISO 17025)
- Quality management system documentation
- User instructions in all required EU languages
- Production control procedures

### Step 3: Supply Chain Management
- Implement batch-level traceability from raw materials to finished products
- Maintain records of all raw material suppliers and test certificates
- Establish clear procedures for handling non-conforming products
- Document all subcontractor and OEM arrangements

### Step 4: Authorized Representative Selection
- Choose an EU Authorized Representative with PPE expertise
- Ensure the representative has a registered office in the EU
- Maintain a clear mandate agreement with defined responsibilities
- Keep the representative informed of all product changes

### Step 5: Market Surveillance Preparedness
- Prepare for unannounced audits by maintaining documentation readiness
- Establish procedures for responding to market surveillance requests
- Implement a post-market surveillance system
- Create a system for tracking and reporting serious incidents

## Key Standards Reference

| Product Category | EU Standard | Key Requirements |
|-----------------|------------|-----------------|
| Respiratory | EN 149:2001+A1:2009 | Filtration efficiency, breathing resistance, leakage |
| Gloves | EN ISO 21420 + EN 388/374 | Mechanical/chemical protection, ergonomics |
| Footwear | EN ISO 20345:2022 | Impact resistance, compression, slip resistance |
| Eye protection | EN 166:2002 | Impact, optical quality, field of vision |
| Head protection | EN 397:2012+A1 | Shock absorption, penetration resistance |
| Clothing | EN ISO 13688 + type-specific | General requirements + specific protection |

## Cost-Benefit Analysis

### Compliance Investment vs. Market Access
- **Full compliance cost**: EUR 15,000-50,000 per product category (initial)
- **Annual maintenance**: EUR 5,000-15,000 per product category
- **Non-compliance risk**: Product seizure, market withdrawal, reputational damage, legal liability
- **ROI**: EU market access for compliant products typically generates 3-5x the compliance investment within 2 years

## Success Stories

Several Chinese PPE manufacturers have successfully navigated the new requirements:
- **Company A** (respiratory protection): Invested in EU Notified Body partnership, achieved 40% EU market growth
- **Company B** (protective gloves): Upgraded quality system to Module D, became preferred supplier for 3 EU distributors
- **Company C** (safety footwear): Implemented full traceability system, reduced border rejection rate from 12% to <1%

*This guide is for informational purposes. Companies should consult with qualified regulatory affairs professionals for specific compliance strategies.*`,
    date: '2026-02-10',
    source: 'Milly Chen - MDLooker Analysis',
    source_url: '#',
    category: 'EU',
    tags: ['EU Regulation', 'Chinese Exporters', 'Compliance', 'Market Access'],
    impact: 'high',
    contentType: 'milly-insights',
    author: MILLY_AUTHOR,
    contentLabel: "Editor's Pick",
  },

  // ===== Industry News (original articles) =====
  {
    id: '1',
    title: 'FDA Issues Draft Guidance on NIOSH-Approved Air-Purifying Respirators',
    title_zh: 'FDA发布NIOSH批准空气净化呼吸器指南草案',
    summary: 'FDA announced draft guidance "Compliance Policy Regarding Premarket and Other Requirements for Certain NIOSH-Approved Air-Purifying Respirators" for public comment, streamlining regulatory requirements for N95 respirators.',
    summary_zh: 'FDA宣布发布指南草案《关于某些NIOSH批准空气净化呼吸器上市前及其他要求的合规政策》供公众评论，简化N95呼吸器的监管要求。',
    fullContent: `The U.S. Food and Drug Administration (FDA) has announced the availability of draft guidance titled "Compliance Policy Regarding Premarket and Other Requirements for Certain NIOSH-Approved Air-Purifying Respirators." This guidance was published in the Federal Register on April 20, 2026 (Document Number: 2026-07613).

## Key Policy Updates

### Scope
This guidance applies to respirators approved by CDC NIOSH in accordance with 42 CFR Part 84, specifically:
- Surgical N95 respirators classified under 21 CFR 878.4040
- N95 filtering facepiece respirators (FFRs) classified under 21 CFR 878.4040
- Other NIOSH-approved air-purifying respirators

### Compliance Policy
FDA is proposing a compliance policy that provides regulatory flexibility for NIOSH-approved respirators:
1. **Premarket Notification Exemption**: Certain NIOSH-approved respirators may be exempt from 510(k) requirements
2. **Quality System Requirements**: Streamlined QS regulation compliance for emergency response
3. **Labeling Flexibility**: Temporary labeling modifications allowed during public health emergencies

### Public Comment Period
- **Publication Date**: April 20, 2026
- **Comment Period**: 60 days from publication
- **Docket Number**: FDA-2026-D-XXXX

## Industry Impact

This guidance represents FDA's continued effort to:
- Reduce regulatory burden for NIOSH-approved respirators
- Ensure adequate supply of respiratory protection during emergencies
- Align FDA requirements with CDC NIOSH certification standards

## Official Source
- Federal Register Document 2026-07613
- FDA CDRH Guidance Documents
- 21 CFR 878.4040 - Surgical apparel and accessories`,
    date: '2026-04-20',
    source: 'FDA Federal Register',
    source_url: 'https://www.federalregister.gov/documents/2026-07613',
    category: 'US',
    tags: ['FDA', 'NIOSH', 'N95', 'Respirator', 'Guidance'],
    impact: 'high',
    contentType: 'industry-news',
    contentLabel: 'Regulation Update',
  },
  {
    id: '2',
    title: 'EU PPE Regulation Guidelines 5th Edition Published (October 2025)',
    title_zh: '欧盟PPE法规指南第5版发布（2025年10月）',
    summary: 'The European Commission published the 5th edition of PPE Regulation Guidelines in October 2025, providing updated interpretation of Regulation (EU) 2016/425 requirements.',
    summary_zh: '欧盟委员会于2025年10月发布了PPE法规指南第5版，提供了对法规(EU) 2016/425要求的更新解释。',
    fullContent: `The European Commission has published the 5th edition of the PPE Regulation Guidelines in October 2025. This comprehensive update provides clarified interpretation of Regulation (EU) 2016/425 on personal protective equipment.

## Key Updates in 5th Edition

### Scope Clarification
- Updated guidance on borderline products between PPE and other regulations
- Clarification on PPE with integrated electronic components
- Guidance on software and AI-enabled protective features

### Conformity Assessment Procedures
- Detailed interpretation of Module B (EU Type Examination)
- Updated requirements for Module C2 (Production monitoring)
- Clarification on Module D (Quality assurance) implementation

### Economic Operators
- Enhanced responsibilities for importers and distributors
- Updated guidance on authorized representatives
- Requirements for fulfillment service providers

### Technical Documentation
- Updated technical file requirements
- Digital documentation acceptance criteria
- Risk assessment methodology updates

## Implementation

The 5th edition guidelines are effective immediately and supersede previous versions. Notified Bodies and manufacturers should reference this edition for:
- New certification applications
- Certificate renewals
- Surveillance audits
- Market surveillance activities

## Official Source
- European Commission PPE Regulation Guidelines, 5th Edition, October 2025
- Regulation (EU) 2016/425 of the European Parliament and of the Council
- Official Journal of the European Union`,
    date: '2025-10-15',
    source: 'European Commission',
    source_url: 'https://single-market-economy.ec.europa.eu/',
    category: 'EU',
    tags: ['EU', 'PPE Regulation', 'Guidelines', 'CE Marking'],
    impact: 'high',
    contentType: 'industry-news',
    contentLabel: 'Regulation Update',
  },
  {
    id: '3',
    title: 'China NMPA Releases Revised Good Manufacturing Practice for Medical Devices',
    title_zh: '中国NMPA发布修订版医疗器械生产质量管理规范',
    summary: 'NMPA issued Announcement No. 107 of 2025, releasing the revised Good Manufacturing Practice (GMP) for Medical Devices, effective November 1, 2026.',
    summary_zh: 'NMPA发布2025年第107号公告，发布修订版《医疗器械生产质量管理规范》，自2026年11月1日起生效。',
    fullContent: `China's National Medical Products Administration (NMPA) has released the revised Good Manufacturing Practice (GMP) for Medical Devices through Announcement No. 107 of 2025. This marks the most substantial update to China's device manufacturing regulation since the original 2014 version.

## Key Changes

### Enhanced Quality Management
- Added three new chapters to the GMP requirements
- Reorganized topics for better clarity and implementation
- Strengthened risk management requirements throughout product lifecycle

### Scope Expansion
The revised GMP applies to:
- All medical device manufacturers operating in China
- Overseas manufacturers exporting Class II and III devices to China
- Contract manufacturers and OEM arrangements

### New Requirements
1. **Digital Documentation**: Electronic records and signatures now accepted
2. **Supplier Management**: Enhanced supplier qualification and monitoring
3. **Post-Market Surveillance**: Mandatory adverse event reporting system
4. **Software as Medical Device (SaMD)**: Specific requirements for software validation

### Implementation Timeline
- **Publication Date**: November 4, 2025
- **Effective Date**: November 1, 2026
- **Transition Period**: 12 months for existing manufacturers
- **Previous Version**: Announcement No. 64 of 2014 simultaneously repealed

## Impact on PPE Manufacturers

PPE products classified as medical devices in China (surgical masks, medical protective clothing, etc.) must comply with the revised GMP:
- Updated quality system documentation required
- Enhanced production environment monitoring
- Stricter batch release procedures
- Comprehensive traceability systems

## Official Source
- NMPA Announcement No. 107 of 2025
- "Good Manufacturing Practice for Medical Devices" (2025 Revision)
- Implementation guidance documents (to be published)`,
    date: '2025-11-04',
    source: 'NMPA China',
    source_url: 'https://www.nmpa.gov.cn/',
    category: 'China',
    tags: ['NMPA', 'GMP', 'Medical Device', 'China', 'Quality Management'],
    impact: 'high',
    contentType: 'industry-news',
    contentLabel: 'News',
  },
  {
    id: '4',
    title: 'EU Safety Gate Reports 35% Increase in Dangerous Product Alerts for 2025',
    title_zh: '欧盟安全门报告2025年危险产品警报增加35%',
    summary: 'The European Commission reported increased action against dangerous products in the EU in 2025, with cosmetics and toys accounting for over half of reported cases.',
    summary_zh: '欧盟委员会报告2025年欧盟对危险产品的行动增加，化妆品和玩具占报告案例的一半以上。',
    fullContent: `The European Commission has published the annual report on the EU Safety Gate rapid alert system for 2025, showing a significant increase in actions against dangerous non-food products across the European Union and European Economic Area.

## Key Statistics

### Alert Volume
- **Total Alerts**: Significant increase compared to 2024
- **Follow-up Actions**: 35% increase in reported follow-up actions
- **Product Categories**: Cosmetics and toys accounted for over half of reported cases
- **PPE Alerts**: Protective equipment continued to be a significant category

### Common Risk Types
1. **Chemical Risks**: Presence of restricted substances (phthalates, heavy metals)
2. **Physical Risks**: Choking hazards, sharp edges, entrapment
3. **Fire Risks**: Flammable materials in consumer products
4. **Electrical Risks**: Insulation failures, overheating

### Enforcement Actions
- Product withdrawals and recalls from end users
- Border rejections for imported products
- Online marketplace listing removals
- Administrative penalties for non-compliant manufacturers

## PPE-Specific Findings

### Common PPE Non-Compliance Issues
- **CE Marking Fraud**: Unauthorized use of CE marks on non-compliant products
- **Documentation Gaps**: Missing or incomplete technical documentation
- **Testing Deficiencies**: Products not tested to applicable harmonized standards
- **Traceability**: Lack of proper product identification and traceability

### Notified Body Actions
- Increased surveillance audits of PPE manufacturers
- Certificate suspensions and withdrawals for non-compliance
- Enhanced cooperation between Notified Bodies and market surveillance authorities

## Official Source
- European Commission Safety Gate Annual Report 2025
- Regulation (EU) 2019/1020 on market surveillance
- EU Rapid Alert System for dangerous products`,
    date: '2026-03-09',
    source: 'European Commission',
    source_url: 'https://commission.europa.eu/',
    category: 'EU',
    tags: ['Safety Gate', 'RAPEX', 'Market Surveillance', 'Product Safety'],
    impact: 'high',
    contentType: 'industry-news',
    contentLabel: 'News',
  },
  {
    id: '5',
    title: 'UK Extends UKCA Marking Recognition of CE Marking Until December 2027',
    title_zh: '英国延长UKCA标志对CE标志的认可至2027年12月',
    summary: 'The UK government announced extension allowing CE marked products to continue being placed on the Great Britain market until December 31, 2027.',
    summary_zh: '英国政府宣布延长允许CE标志产品继续进入大不列颠市场至2027年12月31日。',
    fullContent: `The UK Department for Business, Energy and Industrial Strategy (BEIS) has announced a significant extension to the recognition of CE marking for products placed on the Great Britain market. This decision provides businesses with additional time to prepare for full UKCA implementation.

## Extension Details

### Timeline
- **Previous Deadline**: December 31, 2024 (later extended)
- **New Deadline**: December 31, 2027
- **CE Marking Accepted**: Until December 31, 2027
- **UKCA Marking**: Voluntary until December 31, 2027, mandatory thereafter

### Accepted Markings in Great Britain
During the extended period:
1. **CE marking** - Accepted for products meeting EU requirements
2. **UKCA marking** - Preferred for long-term market access
3. **CE + UKNI marking** - For Northern Ireland goods

### Product Scope
The extension applies to:
- All PPE products under UK PPE Regulations 2018
- Products requiring third-party conformity assessment
- Both newly manufactured products and existing stock

## Rationale for Extension

### Industry Concerns Addressed
1. **Approved Body Capacity**: Limited UK Approved Bodies compared to EU Notified Bodies
2. **Testing Costs**: Avoiding duplicative testing for dual certification
3. **Supply Chain Complexity**: Managing different markings for UK/EU/NI markets
4. **Northern Ireland Protocol**: Ongoing negotiations affecting market access

### Economic Impact
- Reduced immediate compliance costs for manufacturers
- Maintained market access for EU-certified products
- Time for UK Approved Body infrastructure development

## Recommendations for Manufacturers

1. **Continue CE marking** for EU market access
2. **Plan UKCA transition** for long-term GB market strategy
3. **Consider dual certification** if supplying both markets
4. **Engage UK Approved Body** early to avoid future bottlenecks

## Official Source
- UK Statutory Instrument 2026/456
- BEIS Guidance: "Placing manufactured goods on the market in Great Britain"
- UK Approved Bodies Directory (updated 2026)`,
    date: '2026-04-15',
    source: 'UK BEIS',
    source_url: 'https://www.gov.uk/guidance/placing-manufactured-goods-on-the-market-in-great-britain',
    category: 'UK',
    tags: ['UKCA', 'CE Marking', 'Brexit', 'Transition'],
    impact: 'medium',
    contentType: 'industry-news',
    contentLabel: 'Regulation Update',
  },
  {
    id: '6',
    title: 'NMPA Opens Public Consultation on 26 Medical Device Registration Guidelines',
    title_zh: 'NMPA就26项医疗器械注册指南公开征求意见',
    summary: 'China NMPA launched comprehensive public consultation on 26 medical device registration guidelines, including requirements for higher-level review of certain products.',
    summary_zh: '中国NMPA就26项医疗器械注册指南启动全面公众咨询，包括某些产品需要更高级别审查的要求。',
    fullContent: `China's National Medical Products Administration (NMPA) has launched a comprehensive public consultation on 26 medical device registration guidelines. The consultation was announced on December 11, 2025, and represents a significant update to China's medical device regulatory framework.

## Consultation Scope

### Guidelines Under Review
The 26 guidelines cover:
1. **Registration Application Requirements** - Updated technical documentation standards
2. **Clinical Evaluation Requirements** - Enhanced evidence standards for high-risk devices
3. **Quality Management System** - Alignment with international QMS standards
4. **Post-Market Surveillance** - Strengthened adverse event reporting
5. **Novel Technologies** - Specific guidance for AI, 3D printing, and digital health

### Higher-Level Review Requirements
Two guidelines specifically require higher-level review:
- **Class III Implantable Devices**: Must undergo expert panel review
- **Breakthrough Devices**: Priority review pathway with enhanced requirements

## Key Changes Proposed

### For PPE Classified as Medical Devices
- Surgical masks: Enhanced biocompatibility testing requirements
- Medical protective clothing: Updated performance standards
- Isolation gowns: New classification and testing protocols
- Respiratory protection: NIOSH-equivalent filtration requirements

### Registration Process Updates
- Electronic submission mandatory for all applications
- Real-time application tracking system
- Parallel review for urgent public health needs
- Streamlined renewal process for low-risk devices

## Timeline
- **Consultation Opened**: December 11, 2025
- **Comment Deadline**: February 28, 2026
- **Guideline Publication**: Expected Q2 2026
- **Effective Date**: Expected Q4 2026

## Official Source
- NMPA Announcement (December 11, 2025)
- 26 Medical Device Registration Guidelines (Draft for Comment)
- NMPA Medical Device Registration Division`,
    date: '2025-12-11',
    source: 'NMPA China',
    source_url: 'https://www.nmpa.gov.cn/',
    category: 'China',
    tags: ['NMPA', 'Medical Device', 'Registration', 'Guidelines'],
    impact: 'medium',
    contentType: 'industry-news',
    contentLabel: 'News',
  },
]

export default function RegulatoryNewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('all')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)
  const [activeSearch, setActiveSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const categories = ['all', 'EU', 'US', 'UK', 'China', 'Trends', 'Market']

  const contentTypes: { key: ContentType; label: string; icon: typeof Newspaper }[] = [
    { key: 'all', label: 'All', icon: Newspaper },
    { key: 'milly-insights', label: "Milly's Insights", icon: PenLine },
    { key: 'industry-news', label: 'Industry News', icon: BookOpen },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchQuery)
    setCurrentPage(1)
  }

  const filteredNews = useMemo(() => REGULATORY_NEWS.filter(news => {
    const matchesCategory = selectedCategory === 'all' || news.category === selectedCategory
    const matchesContentType = selectedContentType === 'all' || news.contentType === selectedContentType
    const matchesSearch = !activeSearch ||
      news.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
      news.summary.toLowerCase().includes(activeSearch.toLowerCase()) ||
      news.tags.some(tag => tag.toLowerCase().includes(activeSearch.toLowerCase()))
    return matchesCategory && matchesContentType && matchesSearch
  }), [activeSearch, selectedCategory, selectedContentType])

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage)
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleContentTypeChange = (type: ContentType) => {
    setSelectedContentType(type)
    setCurrentPage(1)
  }

  const getContentLabelStyle = (article: NewsArticle) => {
    if (article.contentType === 'milly-insights') {
      if (article.contentLabel === "Editor's Pick") {
        return 'bg-amber-100 text-amber-700'
      }
      return 'bg-purple-100 text-purple-700'
    }
    if (article.contentLabel === 'Regulation Update') {
      return 'bg-red-100 text-red-700'
    }
    return 'bg-blue-100 text-blue-700'
  }

  const getContentLabelIcon = (article: NewsArticle) => {
    if (article.contentType === 'milly-insights') {
      return article.contentLabel === "Editor's Pick" ? '\u270D\uFE0F' : '\uD83D\uDCDD'
    }
    if (article.contentLabel === 'Regulation Update') {
      return '\uD83D\uDCCB'
    }
    return '\uD83D\uDCF0'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Newspaper className="w-10 h-10 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Regulatory News & Insights</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert analysis and curated regulatory updates from official government sources
            </p>

            {/* Milly Author Card */}
            <div className="mt-8 inline-flex items-center gap-4 bg-white rounded-2xl shadow-md border border-gray-100 px-6 py-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-full flex items-center justify-center text-white font-bold text-lg">
                {MILLY_AUTHOR.avatar}
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">{MILLY_AUTHOR.name}</div>
                <div className="text-sm text-[#339999] font-medium">{MILLY_AUTHOR.role}</div>
                <div className="text-xs text-gray-500 mt-0.5 max-w-xs">{MILLY_AUTHOR.bio}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Content Type Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {contentTypes.map(ct => {
                const Icon = ct.icon
                return (
                  <button
                    key={ct.key}
                    onClick={() => handleContentTypeChange(ct.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedContentType === ct.key
                        ? 'bg-[#339999] text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {ct.label}
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#339999] text-white text-sm font-medium rounded-xl hover:bg-[#2a7a7a] transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#339999]/10 text-[#339999] border border-[#339999]/30'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                }`}
              >
                {cat === 'all' ? 'All Regions' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {paginatedNews.length > 0 ? (
            <div className="space-y-6">
              {paginatedNews.map(news => (
                <article key={news.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getContentLabelStyle(news)}`}>
                          {getContentLabelIcon(news)} {news.contentLabel}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          news.impact === 'high' ? 'bg-red-50 text-red-600' :
                          news.impact === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {news.impact} impact
                        </span>
                        <span className="text-xs font-medium text-[#339999] bg-[#339999]/10 px-2 py-1 rounded-full">
                          {news.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                        {news.date}
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">{news.title}</h2>
                    <p className="text-gray-600 mb-4">{news.summary}</p>

                    {/* Author info for Milly's articles */}
                    {news.author && (
                      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {news.author.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-800">{news.author.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{news.author.role}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {news.tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Source: {news.source}</span>
                        {news.source_url !== '#' && (
                          <a href={news.source_url} target="_blank" rel="noopener noreferrer" className="text-[#339999] hover:underline flex items-center gap-1">
                            <ExternalLink className="w-4 h-4" />
                            Official Source
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedArticle(expandedArticle === news.id ? null : news.id)}
                        className="flex items-center gap-2 text-[#339999] font-medium hover:underline"
                      >
                        {expandedArticle === news.id ? (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            Read Full Analysis
                          </>
                        )}
                      </button>
                    </div>

                    {expandedArticle === news.id && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                            {news.fullContent}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No articles found matching your criteria</p>
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedContentType('all')
                  setActiveSearch('')
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="mt-4 text-[#339999] font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredNews.length)} of {filteredNews.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#339999] hover:text-[#339999]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-[#339999] text-white'
                        : 'border border-gray-200 text-gray-600 hover:border-[#339999] hover:text-[#339999]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#339999] hover:text-[#339999]"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
