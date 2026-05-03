# 全球PPE行业数据收集计划

## 计划概述

本计划旨在全面调研全球PPE（个人防护装备）行业，系统性地收集PPE产品数据、相关企业数据和法规数据，并存储到Supabase数据库中。

**目标**：建立全球最全、最权威的PPE数据库  
**数据来源**：各国官方监管机构、国际组织、行业协会  
**数据类型**：产品注册信息、企业信息、法规标准、认证信息  
**去重策略**：基于唯一标识符（注册号、产品代码等）进行数据去重

---

## 一、PPE产品数据权威来源

### 1.1 北美地区

#### 美国 FDA (Food and Drug Administration)
- **数据库名称**: FDA 510(k) Premarket Notification Database
- **网址**: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm
- **数据类型**: 医疗器械上市前通知（包括PPE）
- **API接口**: FDA Open API (https://open.fda.gov/)
- **数据字段**: 产品名称、注册号(K号)、申请人、产品代码、分类、批准日期
- **更新频率**: 实时
- **获取方式**: API调用或CSV下载
- **预计数据量**: 100,000+

#### 美国 NIOSH (National Institute for Occupational Safety and Health)
- **数据库名称**: NIOSH Certified Equipment List (CEL)
- **网址**: https://www.cdc.gov/niosh/npptl/topics/respirators/disp_part/respsrc.html
- **数据类型**: 呼吸防护设备认证列表
- **数据字段**: 制造商、型号、认证号、防护等级、批准日期
- **预计数据量**: 10,000+

#### 加拿大 Health Canada
- **数据库名称**: MDALL (Medical Devices Active Licence Listing)
- **网址**: https://health-products.canada.ca/mdall-limh/
- **数据类型**: 医疗器械许可列表
- **数据字段**: 设备名称、许可证号、公司信息、设备分类、许可状态
- **预计数据量**: 50,000+

### 1.2 欧洲地区

#### 欧盟 EUDAMED
- **数据库名称**: European Database on Medical Devices
- **网址**: https://ec.europa.eu/tools/eudamed
- **数据类型**: 欧盟医疗器械数据库
- **数据字段**: 产品信息、制造商、授权代表、公告机构、证书信息
- **预计数据量**: 500,000+
- **注意**: 需要注册账号，部分数据公开

#### 英国 MHRA
- **数据库名称**: UK Medical Devices Register
- **网址**: https://www.gov.uk/guidance/regulating-medical-devices-in-the-uk
- **数据类型**: 英国医疗器械注册信息
- **数据字段**: 产品名称、注册号、制造商、UKRP信息
- **预计数据量**: 50,000+

### 1.3 亚太地区

#### 中国 NMPA (国家药品监督管理局)
- **数据库名称**: 医疗器械数据查询系统
- **网址**: https://www.nmpa.gov.cn/datasearch/home-index.html
- **数据类型**: 境内/进口医疗器械注册信息
- **数据字段**: 产品名称、注册证号、注册人、生产地址、适用范围、批准日期
- **预计数据量**: 300,000+
- **子数据库**:
  - 境内医疗器械（注册）
  - 进口医疗器械（注册）
  - 医疗器械备案信息

#### 日本 PMDA
- **数据库名称**: 医療機器承認情報データベース
- **网址**: https://www.pmda.go.jp/
- **数据类型**: 医疗器械批准信息
- **数据字段**: 产品名称、批准号、制造商、分类、批准日期
- **预计数据量**: 100,000+

#### 韩国 MFDS (食品药品安全部)
- **数据库名称**: 医疗器械注册数据库
- **网址**: https://www.mfds.go.kr/
- **数据类型**: 医疗器械注册信息
- **预计数据量**: 50,000+

#### 澳大利亚 TGA
- **数据库名称**: ARTG (Australian Register of Therapeutic Goods)
- **网址**: https://www.tga.gov.au/resources/australian-register-therapeutic-goods-artg
- **数据类型**: 治疗用品注册信息
- **数据字段**: 产品名称、ARTG号、赞助商、制造商、分类
- **预计数据量**: 60,000+

### 1.4 其他地区

#### 巴西 ANVISA
- **数据库名称**: ANVISA Medical Device Database
- **网址**: http://portal.anvisa.gov.br/
- **数据类型**: 医疗器械注册信息
- **数据字段**: 技术名称、商业名称、风险等级、注册持有人、制造商
- **预计数据量**: 100,000+

#### 印度 CDSCO
- **数据库名称**: Medical Device Registration Database
- **网址**: https://cdsco.gov.in/
- **预计数据量**: 30,000+

---

## 二、PPE企业数据权威来源

### 2.1 官方企业注册数据库

#### 美国
- **FDA Establishment Registration**: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRL/rl.cfm
- **OSHA Certified Respirator Manufacturers**: NIOSH CEL数据库中的制造商信息

#### 欧盟
- **EUDAMED Economic Operators**: 制造商、授权代表、进口商信息
- **NANDO Database**: 公告机构信息 https://ec.europa.eu/growth/tools-databases/nando/

#### 中国
- **NMPA企业信息**: 医疗器械生产企业、经营企业信息
- **国家企业信用信息公示系统**: http://www.gsxt.gov.cn/

### 2.2 行业协会会员目录

#### 全球
- **IAOMT (International Academy of Oral Medicine and Toxicology)**: 牙科PPE相关
- **IIRSM (International Institute of Risk & Safety Management)**: 安全管理

#### 中国
- **中国纺织品商业协会安全健康防护用品委员会**: 劳保用品企业
- **中国医疗器械行业协会**: 医疗器械企业

#### 美国
- **ISEA (International Safety Equipment Association)**: 安全装备制造商
  - 网址: https://www.safetyequipment.org/
  - 会员目录包含主要PPE制造商

### 2.3 商业数据库

- **Dun & Bradstreet**: 全球企业信息
- **Kompass**: B2B企业目录 https://www.kompass.com/
- **ThomasNet**: 北美制造商目录 https://www.thomasnet.com/

---

## 三、PPE法规数据权威来源

### 3.1 国际标准

#### ISO标准
- **ISO 45001**: 职业健康安全管理体系
- **ISO 13485**: 医疗器械质量管理体系
- **PPE相关ISO标准**:
  - ISO 20345 (安全鞋)
  - ISO 20347 (职业鞋)
  - ISO 13688 (防护服)
  - ISO 16602 (化学防护服)
  - ISO 27065 (农药防护服)

### 3.2 地区法规

#### 欧盟
- **EU Regulation 2016/425**: PPE法规
- **EU Regulation 2017/745 (MDR)**: 医疗器械法规
- **协调标准列表**: https://ec.europa.eu/growth/single-market/european-standards/harmonised-standards_en

#### 美国
- **29 CFR 1910.132**: 个人防护装备标准(OSHA)
- **42 CFR Part 84**: 呼吸防护设备批准(NIOSH)

#### 中国
- **GB 2626-2019**: 呼吸防护 自吸过滤式防颗粒物呼吸器
- **GB 19083-2010**: 医用防护口罩技术要求
- **GB 19082-2009**: 医用一次性防护服技术要求

### 3.3 法规数据库

- **EUR-Lex**: 欧盟法律数据库 https://eur-lex.europa.eu/
- **Code of Federal Regulations (CFR)**: 美国联邦法规 https://www.ecfr.gov/
- **国家法律法规数据库**: https://flk.npc.gov.cn/ (中国)

---

## 四、数据获取实施计划

### 4.1 第一阶段：核心数据源（优先级：高）

#### Week 1-2: 美国FDA数据
- [ ] 注册FDA API密钥
- [ ] 开发FDA 510(k)数据获取脚本
- [ ] 开发FDA Registration数据获取脚本
- [ ] 数据清洗与导入
- **预计数据量**: 50,000条

#### Week 3-4: 欧盟EUDAMED数据
- [ ] 申请EUDAMED访问权限
- [ ] 开发EUDAMED数据获取脚本
- [ ] 处理分页和速率限制
- **预计数据量**: 100,000条

#### Week 5-6: 中国NMPA数据
- [ ] 分析NMPA网站结构
- [ ] 开发爬虫脚本
- [ ] 数据解析与导入
- **预计数据量**: 150,000条

### 4.2 第二阶段：重要数据源（优先级：中）

#### Week 7-8: 日本PMDA + 韩国MFDS
- [ ] PMDA数据获取
- [ ] MFDS数据获取
- **预计数据量**: 80,000条

#### Week 9-10: 加拿大 + 澳大利亚 + 英国
- [ ] Health Canada MDALL
- [ ] TGA ARTG
- [ ] MHRA注册数据
- **预计数据量**: 100,000条

#### Week 11-12: 巴西ANVISA + 印度CDSCO
- [ ] ANVISA数据获取
- [ ] CDSCO数据获取
- **预计数据量**: 100,000条

### 4.3 第三阶段：补充数据源（优先级：低）

#### Week 13-14: 行业协会与商业数据库
- [ ] ISEA会员目录
- [ ] 中国行业协会数据
- [ ] 其他行业协会
- **预计数据量**: 50,000条

#### Week 15-16: 法规数据整理
- [ ] ISO标准收集
- [ ] 各国PPE法规整理
- [ ] 法规与产品关联
- **预计数据量**: 5,000条

---

## 五、数据去重与导入策略

### 5.1 唯一标识符设计

#### 产品唯一标识
```
复合键: {产品名称} + {制造商名称} + {产品代码/型号}
或
注册号: 各国注册证号（如K号、CE证书号、注册证号）
```

#### 企业唯一标识
```
标准化名称: 去除空格和特殊字符后的小写名称
或
官方ID: 如FDA Establishment Identifier
```

### 5.2 去重策略

#### 导入前检查
```javascript
// 伪代码
async function importProduct(productData) {
  // 1. 检查注册号是否已存在
  const existingByReg = await db.products.findOne({
    registration_number: productData.registration_number
  });
  if (existingByReg) {
    return { status: 'DUPLICATE', reason: 'Registration number exists' };
  }
  
  // 2. 检查复合键是否已存在
  const normalizedKey = normalizeKey(productData);
  const existingByKey = await db.products.findOne({
    unique_key: normalizedKey
  });
  if (existingByKey) {
    return { status: 'DUPLICATE', reason: 'Product key exists' };
  }
  
  // 3. 插入新数据
  return await db.products.insert(productData);
}
```

#### 数据合并策略
对于重复数据，保留信息最完整的版本：
1. 比较字段完整性（非空字段数量）
2. 优先保留有权威来源的数据（如FDA > 第三方）
3. 保留最新的数据（基于批准日期）

### 5.3 数据质量检查

#### 必填字段验证
- 产品名称（不能为空）
- 制造商名称（不能为空）
- 数据来源（必须记录）
- 数据获取时间（必须记录）

#### 数据标准化
- 国家代码统一使用ISO 3166-1 alpha-2
- 日期格式统一为ISO 8601
- 公司名称去除Ltd./Inc.等后缀后比较

---

## 六、技术实现方案

### 6.1 数据获取工具

#### API客户端
```javascript
// 示例：FDA API客户端
class FDAAPIClient {
  constructor(apiKey) {
    this.baseURL = 'https://api.fda.gov/device';
    this.apiKey = apiKey;
  }
  
  async get510kList(params) {
    const response = await fetch(
      `${this.baseURL}/510k.json?api_key=${this.apiKey}&${new URLSearchParams(params)}`
    );
    return response.json();
  }
}
```

#### 网页爬虫
```javascript
// 示例：NMPA爬虫
class NMPASpider {
  async crawlProductList(page) {
    // 使用Puppeteer或Playwright
    // 处理反爬虫机制
    // 数据解析
  }
}
```

### 6.2 数据存储结构

#### 产品表 (ppe_products)
```sql
CREATE TABLE ppe_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  model VARCHAR(200),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  description TEXT,
  manufacturer_name VARCHAR(500),
  manufacturer_id UUID REFERENCES ppe_manufacturers(id),
  country_of_origin VARCHAR(2),
  product_code VARCHAR(100),
  risk_level VARCHAR(20),
  
  -- 注册信息
  registration_number VARCHAR(100),
  registration_authority VARCHAR(100),
  registration_date DATE,
  expiry_date DATE,
  
  -- 数据来源
  data_source VARCHAR(200),
  data_source_url TEXT,
  last_verified TIMESTAMP,
  data_confidence_level VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 唯一索引
CREATE UNIQUE INDEX idx_product_unique_key 
ON ppe_products (LOWER(TRIM(name)), LOWER(TRIM(manufacturer_name)), LOWER(TRIM(product_code)));
```

#### 制造商表 (ppe_manufacturers)
```sql
CREATE TABLE ppe_manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  country VARCHAR(2),
  address TEXT,
  website VARCHAR(500),
  
  -- 联系信息
  contact_info JSONB,
  
  -- 认证信息
  certifications JSONB,
  
  -- 数据来源
  data_source VARCHAR(200),
  company_profile TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 唯一索引
CREATE UNIQUE INDEX idx_manufacturer_normalized_name 
ON ppe_manufacturers (LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g')));
```

#### 法规表 (ppe_regulations)
```sql
CREATE TABLE ppe_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  code VARCHAR(100),
  region VARCHAR(100),
  description TEXT,
  effective_date DATE,
  document_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 七、项目实施时间表

| 阶段 | 时间 | 任务 | 预计数据量 |
|------|------|------|-----------|
| 第一阶段 | Week 1-6 | 核心数据源 | 300,000 |
| 第二阶段 | Week 7-12 | 重要数据源 | 280,000 |
| 第三阶段 | Week 13-16 | 补充数据源 | 55,000 |
| 数据清洗 | Week 17-18 | 去重与质量提升 | - |
| **总计** | **18周** | | **635,000+** |

---

## 八、风险与应对

### 8.1 技术风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| API限流 | 数据获取缓慢 | 实现指数退避重试机制 |
| 网站反爬 | 无法获取数据 | 使用代理池、调整请求频率 |
| 数据格式变化 | 解析失败 | 增加数据验证和异常处理 |

### 8.2 数据风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 重复数据 | 数据库膨胀 | 严格的去重策略 |
| 数据不一致 | 质量问题 | 多源数据交叉验证 |
| 数据过期 | 信息不准确 | 定期更新机制 |

---

## 九、成功指标

### 9.1 数据覆盖度
- [ ] 覆盖全球主要PPE市场（美、欧、中、日等）
- [ ] 产品数据 ≥ 500,000条
- [ ] 企业数据 ≥ 50,000条
- [ ] 法规数据 ≥ 1,000条

### 9.2 数据质量
- [ ] 重复率 < 5%
- [ ] 字段完整率 > 80%
- [ ] 权威来源占比 > 90%

### 9.3 数据时效性
- [ ] 核心数据源每周更新
- [ ] 全量数据每月更新

---

## 十、附录

### A. 数据源联系信息

| 机构 | 联系方式 | 备注 |
|------|----------|------|
| FDA | open@fda.hhs.gov | API技术支持 |
| EUDAMED | SANTE-EUDAMED@ec.europa.eu | 访问权限申请 |
| NMPA | qixiejiucuo@nmpaic.org.cn | 数据纠错 |

### B. 参考资料

1. FDA Open API Documentation: https://open.fda.gov/apis/
2. EUDAMED User Guide: https://health.ec.europa.eu/medical-devices-eudamed_en
3. NMPA Data Query Help: https://www.nmpa.gov.cn/datasearch/search-help.html

---

**文档版本**: 1.0  
**创建日期**: 2026-01-19  
**最后更新**: 2026-01-19
