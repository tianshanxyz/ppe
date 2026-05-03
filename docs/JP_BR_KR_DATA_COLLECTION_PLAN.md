# 日本/巴西/韩国PPE数据采集计划

## 一、调研结论

### 1.1 数据源评估

| 地区 | 数据源 | 可行性 | 数据量预估 | 权威性 |
|------|--------|--------|-----------|--------|
| 🇧🇷 巴西 | CAEPI FTP公开数据库 | ⭐⭐⭐⭐⭐ | 10,000+ EPI记录 | 官方权威 |
| 🇯🇵 日本 | PMDA承認品目一覧 + Pure Global | ⭐⭐⭐⭐ | 500+ PPE记录 | 官方权威 |
| 🇰🇷 韩国 | MFDS e-INFOS + Pure Global | ⭐⭐⭐ | 300+ PPE记录 | 官方权威 |
| 🌐 全球 | Pure Global AI统一数据库 | ⭐⭐⭐⭐ | 覆盖30+国家 | 第三方整合 |

### 1.2 关键发现

1. **巴西CAEPI** - 最佳数据源！巴西劳动部提供FTP公开下载：
   - FTP地址：`ftp://ftp.mtps.gov.br/portal/fiscalizacao/seguranca-e-saude-notrabalho/caepi/`
   - 文件：`tgg_export_caepi.zip`（每日20:00更新）
   - 包含所有EPI（Equipamento de Proteção Individual）的CA认证数据
   - CSV格式，约6.8MB，包含CA编号、设备类型、制造商、有效期等

2. **日本PMDA** - 可通过以下方式获取：
   - PMDA官网承認品目一覧（CSV/PDF下载）
   - PMDA添付文書検索系统（支持搜索和CSV导出）
   - Pure Global AI日本数据库（覆盖PMDA注册数据）

3. **韩国MFDS** - 数据获取渠道：
   - MFDS开放数据门户 data.mfds.go.kr
   - MFDS电子民愿系统（의료기기 인허가 정보）
   - Pure Global AI韩国数据库

4. **Pure Global AI** - 统一全球医疗器械数据库：
   - 覆盖30+国家，190万+设备记录
   - 目前公开免费查询：美国FDA + 巴西ANVISA
   - 有API（collectpure.com），需联系获取API Key
   - 网站URL格式：`https://www.pureglobal.ai/{country}/medical-device/database/{id}`

---

## 二、执行计划

### Phase 1: 巴西CAEPI数据采集（优先级最高）

**方案**：直接从FTP下载CAEPI公开数据库

**步骤**：
1. 下载 `ftp://ftp.mtps.gov.br/portal/fiscalizacao/seguranca-e-saude-notrabalho/caepi/tgg_export_caepi.zip`
2. 解压获取 `tgg_export_caepi.txt`（CSV格式，分号分隔）
3. 解析CSV，筛选PPE相关记录（按设备类型过滤）
4. 数据映射到Supabase ppe_products表字段
5. 去重后批量插入数据库

**数据映射**：
| CAEPI字段 | Supabase字段 |
|-----------|-------------|
| NumeroCA | registration_number |
| Equipamento | name |
| Fabricante | manufacturer_name |
| Natureza | category (需映射) |
| Situacao | status |
| Validade | registration_valid_until |
| CNPJ | metadata |

**预期结果**：10,000+ 条巴西PPE产品数据

### Phase 2: Pure Global AI数据采集

**方案**：爬取Pure Global AI网站，获取日本/韩国/巴西医疗器械数据

**步骤**：
1. 分析Pure Global AI网站结构
   - URL格式：`https://www.pureglobal.ai/{country}/medical-device/database`
   - 设备页面：`https://www.pureglobal.ai/{country}/medical-device/database/{id}`
2. 按FDA产品代码搜索PPE相关设备（使用PPE产品代码列表）
3. 爬取日本/韩国/巴西的PPE设备详情页
4. 解析HTML提取设备信息
5. 去重后插入数据库

**目标国家**：
- 🇯🇵 Japan: `https://www.pureglobal.ai/japan/medical-device/database`
- 🇰🇷 Korea: `https://www.pureglobal.ai/korea/medical-device/database`
- 🇧🇷 Brazil: `https://www.pureglobal.ai/brazil/medical-device/database`

**预期结果**：500-1,000 条日本/韩国/巴西PPE数据

### Phase 3: 日本PMDA数据采集

**方案**：爬取PMDA官网承認品目一覧 + 添付文書検索

**步骤**：
1. 访问PMDA承認品目一覧页面
   - URL: `https://www.pmda.go.jp/review-services/drug-reviews/review-information/devices/0055.html`
2. 下载CSV格式的承認品目数据
3. 按PPE关键词过滤（マスク、呼吸器、手袋、保護具、ヘルメット等）
4. 对筛选出的产品，通过添付文書検索获取详细信息
   - URL: `https://www.info.pmda.go.jp/kaisyaku/`
5. 数据映射和去重后插入数据库

**PPE日语关键词**：
- マスク（口罩）、呼吸用保護具（呼吸防护）、手袋（手套）
- 保護めがね（护目镜）、防護服（防护服）、ヘルメット（头盔）
- 耳栓（耳塞）、安全靴（安全鞋）、保護衣（防护衣）

**预期结果**：300-500 条日本PPE产品数据

### Phase 4: 韩国MFDS数据采集

**方案**：爬取MFDS医疗器械查询系统 + 开放数据

**步骤**：
1. 访问MFDS医疗器械查询系统
   - URL: `https://emed.mfds.go.kr/` 或 `https://www.mfds.go.kr/`
2. 按PPE关键词搜索（마스크、호흡보호구、장갑、보호구等）
3. 解析搜索结果页面
4. 如API可用，通过data.mfds.go.kr获取结构化数据
5. 数据映射和去重后插入数据库

**PPE韩语关键词**：
- 마스크（口罩）、호흡보호구（呼吸防护）、장갑（手套）
- 보호안경（护目镜）、보호복（防护服）、안전모（安全帽）
- 귀마개（耳塞）、안전화（安全鞋）、보호면（面罩）

**预期结果**：200-400 条韩国PPE产品数据

### Phase 5: 数据质量保障

**步骤**：
1. 所有新数据与现有数据去重（基于name+manufacturer_name+product_code）
2. 分类映射：将各国PPE分类映射到统一的8大类别
3. 国家代码标准化：JP/KR/BR
4. 数据来源标记：CAEPI/PMDA/MFDS/Pure Global
5. 最终质量验证报告

---

## 三、技术实现

### 3.1 脚本清单

| 脚本 | 功能 | 优先级 |
|------|------|--------|
| `collect-brazil-caepi.js` | 下载解析CAEPI FTP数据 | P0 |
| `collect-pureglobal.js` | 爬取Pure Global AI网站数据 | P1 |
| `collect-japan-pmda.js` | 爬取PMDA承認品目数据 | P1 |
| `collect-korea-mfds.js` | 爬取MFDS医疗器械数据 | P2 |
| `verify-new-data.js` | 新数据质量验证 | P2 |

### 3.2 去重策略

- 主键：`name + manufacturer_name + product_code`（小写去空格）
- 注册号去重：`registration_number`（如已存在则跳过）
- 来源优先级：官方API > 官方CSV > 网站爬取 > 第三方数据

### 3.3 预期总增量

| 来源 | 预估新增产品 | 预估新增制造商 |
|------|------------|--------------|
| 巴西CAEPI | 8,000-12,000 | 500-1,000 |
| Pure Global | 500-1,000 | 100-300 |
| 日本PMDA | 300-500 | 50-100 |
| 韩国MFDS | 200-400 | 30-80 |
| **合计** | **9,000-14,000** | **680-1,480** |

---

## 四、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| CAEPI FTP无法访问 | 高 | 备用：从gov.br网站下载CSV |
| Pure Global反爬 | 中 | 控制请求频率，模拟浏览器行为 |
| PMDA页面为日语 | 中 | 使用日语关键词搜索，翻译字段 |
| MFDS需要Service Key | 中 | 备用：网站爬取或已知制造商数据 |
| 数据格式不统一 | 低 | 统一映射到Supabase字段规范 |

---

## 五、执行顺序

1. ✅ Phase 1: 巴西CAEPI（最可靠，数据量最大）
2. ✅ Phase 2: Pure Global AI（覆盖多国）
3. ✅ Phase 3: 日本PMDA
4. ✅ Phase 4: 韩国MFDS
5. ✅ Phase 5: 质量验证
