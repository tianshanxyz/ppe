# 全量 PPE 数据库补全计划

> 生成时间: 2026-05-16 | 当前总量: 23,112 条 | 覆盖58国 | 总体完成度 ~55%

---

## 一、当前状态总览

### 1.1 数据库表状态

| 表名 | 记录数 | 状态 |
|------|:--:|:--:|
| `ppe_products` | 23,112 | 🟡 产品数据基本覆盖主要市场，缺图片/认证/标准 |
| `ppe_regulations` | 668 | 🟡 覆盖主要市场法规，缺标准数据 |
| `ppe_standards` | 0 | 🔴 空表 |
| `ppe_manufacturers` | 8,187 | 🔴 仅8国（CN占740），US/EU为0 |
| `ppe_companies` | 0 | 🔴 空表 |
| `ppe_risk_data` | 0 | 🔴 空表（脚本存在但未执行） |
| `ppe_adverse_events` | 0 | 🔴 空表 |
| `ppe_audit` | 0 | 🔴 空表 |
| `ppe_events` | 0 | 🔴 空表 |

### 1.2 中美欧三大市场专项审计

| 维度 | 🇺🇸 美国 | 🇨🇳 中国 | 🇪🇺 欧洲 |
|------|:--:|:--:|:--:|
| 产品总数 | 9,184 | 6,126 | 2,264 |
| 品类覆盖 | 7类 | 8类 | 10类 |
| 制造商数（产品中） | 1,505 | 1,248 | 180 |
| 制造商数（厂商表） | **0** 🔴 | **740** | **极少量** 🔴 |
| 注册号覆盖率 | 83.8% | 98.9% | **67.7%** 🔴 |
| 平均字段完整度 | 63.2% | 64.3% | 64.4% |
| 全字段完整产品 | 4 / 9,184 | 0 / 6,126 | 0 / 2,264 |
| 标准数据 | 0% | 0% | 0% |
| 认证数据 | 0% | 0% | 0% |
| 产品图片 | 0% | 0% | 0% |
| 法规数量 | 245条 | 60条 | 89条 |
| 缺失欧盟国家 | — | — | **PL,CZ,RO,HU,BG,HR,SK,SI,EE,LV,LT,CY,EL** (14国) |

### 1.3 关键发现

1. **美国厂商表完全空白** — 1,505家制造商有产品但无企业档案
2. **欧洲覆盖率严重不足** — 仅2,264条产品，14个欧盟国家零覆盖
3. **三大市场产品字段完整度均仅 ~64%** — metadata（model/description/subcategory/URL等）普遍缺失
4. **零标准/认证/图片数据** — 三大市场的 related_standards、certifications、product_images 全覆盖率为 0%
5. **中国产品混入FDA来源** — 1,840条CN产品标记为FDA来源，可能是中国厂商的FDA注册，需要区分

---

## 二、补全计划（按优先级排列）

### 🥇 Tier 1: 中美欧三大市场深度补全（最高优先级）

#### T1.1 美国市场厂商数据补全
- **目标表**: `ppe_manufacturers`
- **当前**: 0家 | **目标**: 1,500+ 家
- **数据来源**: FDA Establishment Registration, FDA 510(k) Owner/Operator, OSHA employer data
- **采集字段**: name, country, website, established_date, employee_count, certifications(FDA reg number), business_scope, compliance_status
- **预计新增**: ~1,500 条厂商记录

#### T1.2 欧洲市场全覆盖补全
- **目标表**: `ppe_products`
- **当前**: 2,264条 | **目标**: 6,000+ 条
- **缺失国家补全**: 波兰(PL)、捷克(CZ)、罗马尼亚(RO)、匈牙利(HU)、保加利亚(BG)、克罗地亚(HR)、斯洛伐克(SK)、斯洛文尼亚(SI)、爱沙尼亚(EE)、拉脱维亚(LV)、立陶宛(LT)、塞浦路斯(CY)、希腊(EL)
- **数据来源**: EUDAMED Public API（每个成员国过滤）、各国公告机构(NANDO)注册数据、欧洲安全联盟(ESF)厂商名录
- **预计新增**: ~3,000-4,000 条产品记录

#### T1.3 三大市场产品 metadata 补全
- **目标表**: `ppe_products`
- **补全字段**: model, subcategory, description, data_source_url, last_verified, registration_valid_until
- **方法**: 对现有产品按 registration_number 回查原始数据源
- **US**: FDA 510(k) database 通过 K-number 查询补充说明
- **CN**: NMPA UDID 通过注册证号查询补充规格
- **EU**: EUDAMED 通过 UDI-DI 查询补充技术文档
- **预计**: 字段完整度从 ~64% 提升至 ~85%

#### T1.4 中美欧法规标准数据补全
- **目标表**: `ppe_regulations` + `ppe_standards`
- **US**:
  - NIOSH 42 CFR Part 84（呼吸防护标准全文）
  - ANSI/ISEA 全系列标准（Z87.1眼面, Z89.1头部, Z87.1+…）
  - ASTM PPE 标准（D3578手套, F2413安全鞋等）
  - OSHA 29 CFR 1910 Subpart I（PPE通用要求）
- **CN**:
  - GB 2626（呼吸防护）, GB 8965（防护服）, GB 2811（安全帽）, GB 12624（手套）等全套国标
  - LA 安全标志认证目录
  - 特种劳动防护用品安全标志管理规定
- **EU**:
  - EN 全系列 harmonized standards（EN 149, EN 166, EN 388, EN 397, EN 420 等 ~50个标准）
  - Regulation (EU) 2016/425 及配套指南
- **预计新增**: `ppe_regulations` +150条, `ppe_standards` 新表独立存储 ~200条标准

#### T1.5 中美欧风险与事件数据
- **目标表**: `ppe_risk_data`, `ppe_adverse_events`
- **US**:
  - FDA MAUDE adverse event reports（已有2,571条在ppe_products，需迁移至ppe_adverse_events）
  - FDA Recall database（已有403条，需分类结构化）
  - BLS Injury Statistics API（已有脚本 `collect-risk-data-comprehensive.js`，重新执行）
  - OSHA Inspection Data (NAICS 339113 PPE manufacturing)
- **CN**:
  - NMPA 不良事件监测数据
  - 市场监管总局 PPE 抽检不合格公告
- **EU**:
  - Safety Gate/RAPEX 快速预警系统（抽取PPE相关）
  - EUDAMED Vigilance 模块
- **预计新增**: `ppe_risk_data` ~500条, `ppe_adverse_events` ~3,000条

---

### 🥈 Tier 2: 法规标准体系完善（次优先级）

#### T2.1 全球标准库建设
- **目标表**: `ppe_standards`
- 涵盖 ISO PPE 标准全系列（~80条）
- 涵盖 CEN/EN harmonized standards（~50条）
- 涵盖各国等同/转换标准（GB≅EN, JIS≅ISO等对照表）
- **预计新增**: ~200条标准记录

#### T2.2 其他主要市场法规补全
- 日本 PMDA/MHLW 法规
- 韩国 MFDS/KOSHA 法规
- 澳大利亚/新西兰 TGA + AS/NZS 标准
- 加拿大 Health Canada Medical Devices Regulations
- 巴西 ANVISA/INMETRO 法规
- 印度 BIS/CDSCO 法规
- 海湾 GCC/GSO 标准
- **预计新增**: `ppe_regulations` +150条

---

### 🥉 Tier 3: 厂商企业数据库建设（中等优先级）

#### T3.1 全球厂商补全
- **目标表**: `ppe_manufacturers`
- 对 `ppe_products` 中出现的 3,635 家制造商逐一建立档案
- 优先补全 US(1,505家) 和 EU(180家) 厂商
- 补全字段: website, established_date, employee_count, certifications, compliance_status, contact_info
- **预计**: 从 8,187 → 10,000+ 厂商

#### T3.2 企业关联数据
- **目标表**: `ppe_companies`
- Brand owner vs manufacturer 区分（如3M品牌 vs 代工厂）
- 集团/子公司关系梳理
- 全球生产基地关联
- **预计新增**: ~500条企业级记录

---

### 🏅 Tier 4: 国家覆盖率补全（较低优先级）

#### T4.1 缺失国家补全
- 东欧 14 国（已在 T1.2 覆盖）
- 尼日利亚(NG)、肯尼亚(KE)、加纳(GH)、埃塞俄比亚(ET) — 非洲主要市场
- 孟加拉(BD)、巴基斯坦(PK) — PPE制造大国
- 乌克兰(UA)、伊朗(IR)、摩洛哥(MA)
- 缅甸(MM)、尼泊尔(NP)
- **预计新增**: ~1,000条产品记录

---

### 🏅 Tier 5: 富媒体与丰富数据（最低优先级）

#### T5.1 产品图片采集
- 从 EUDAMED/FDA/NMPA 公开数据库抓取产品图片URL
- 从制造商官网抓取产品图片
- **预计**: 覆盖 Top 500 产品

#### T5.2 认证数据关联
- 将产品关联到具体认证标准
- CE模块认证、FDA 510(k) clearance number、NMPA注册证详细信息

---

## 三、执行路线图

```
Phase 1 (立即) ─ T1.1 美国厂商 → T1.3 metadata → T1.4 中美欧法规标准
                └ T1.5 风险数据 → T1.2 欧洲产品扩展
                
Phase 2 (后续) ─ T2.1 全球标准库 → T2.2 其他市场法规
                └ T3.1 全球厂商补全

Phase 3 (远期) ─ T3.2 企业关联 → T4.1 国家补全 → T5 富媒体
```

### 预期成果

| 指标 | 当前值 | Phase 1 后 | Phase 2 后 | 最终目标 |
|------|:--:|:--:|:--:|:--:|
| `ppe_products` 总数 | 23,112 | 28,000+ | 28,500+ | 30,000+ |
| 覆盖国家数 | 58 | 72 | 80 | 85+ |
| 美国厂商表 | 0 | 1,500+ | 1,500+ | 2,000+ |
| 欧洲产品数 | 2,264 | 6,000+ | 6,500+ | 7,000+ |
| 字段完整度(US) | 63% | 85% | 85% | 90% |
| 字段完整度(CN) | 64% | 85% | 85% | 90% |
| 字段完整度(EU) | 64% | 85% | 85% | 90% |
| 法规总数 | 668 | 900+ | 1,050+ | 1,100+ |
| 标准数据 | 0 | 200+ | 250+ | 300+ |
| 风险/事件数据 | 0 | 3,500+ | 4,000+ | 5,000+ |
| 厂商总数 | 8,187 | 9,500+ | 10,500+ | 11,000+ |
| 总体完成度 | ~55% | ~80% | ~90% | ~95% |

---

## 四、数据可靠性保障措施

1. **字段一致性验证**: 每条插入数据需校验必填字段、枚举值范围、外键关联
2. **去重策略**: name + manufacturer_name + data_source 三字段联合去重
3. **可信度分级**: high(官方API/数据库直接获取) vs medium(curated/二手数据)
4. **来源可追溯**: 每条记录必须有 data_source + data_source_url(如有) + last_verified
5. **数据一致性检查**: 同产品跨来源信息冲突标记