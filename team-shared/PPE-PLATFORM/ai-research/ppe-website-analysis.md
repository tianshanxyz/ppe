# PPE 网站结构分析 - AI-001 预研文档

**任务**: AI-001 智能解析模型  
**分析日期**: 2026-04-18  
**负责人**: AI工程师  
**状态**: 🟡 进行中

---

## 📊 目标国家/地区 PPE 数据源

### 1. 美国 (US)

#### FDA (食品和药物管理局)
- **网址**: https://www.fda.gov/medical-devices
- **数据类型**: 医疗器械注册、510(k) 预市场通知
- **关键页面**:
  - 510(k) 数据库: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm
  - 设备分类: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm
- **页面结构特点**:
  - 表格数据为主
  - 分页查询
  - 表单提交获取结果
- **反爬策略**: 中等（有频率限制）

#### NIOSH (国家职业安全与健康研究所)
- **网址**: https://www.cdc.gov/niosh/npptl/topics/respirators/
- **数据类型**: 呼吸防护设备认证
- **关键页面**:
  - 认证设备列表: https://www.cdc.gov/niosh/npptl/topics/respirators/disp_part/resplist.html
- **页面结构特点**:
  - 静态 HTML 表格
  - 结构化数据

---

### 2. 欧盟 (EU)

#### EUDAMED (欧洲医疗器械数据库)
- **网址**: https://ec.europa.eu/tools/eudamed
- **数据类型**: 医疗器械注册、CE 认证
- **关键页面**:
  - 公开查询界面
- **页面结构特点**:
  - 现代化 SPA 应用
  - API 驱动
  - 需要处理动态加载
- **反爬策略**: 高（有验证码和频率限制）

#### 公告机构 (Notified Bodies)
- **NANDO 数据库**: https://ec.europa.eu/growth/tools-databases/nando/
- **数据类型**: 认证机构信息
- **页面结构特点**:
  - 表格数据
  - 多语言支持

---

### 3. 中国 (CN)

#### NMPA (国家药品监督管理局)
- **网址**: https://www.nmpa.gov.cn/
- **数据类型**: 医疗器械注册证
- **关键页面**:
  - 国产器械: https://www.nmpa.gov.cn/datasearch/home-index.html#category=ylqx
  - 进口器械: https://www.nmpa.gov.cn/datasearch/home-index.html#category=ylqx
- **页面结构特点**:
  - 动态加载
  - 分页查询
  - 详情页需要二次请求
- **反爬策略**: 高（验证码、IP限制）

---

### 4. 日本 (JP)

#### PMDA (医药品医疗器械综合机构)
- **网址**: https://www.pmda.go.jp/
- **数据类型**: 医疗器械认证
- **关键页面**:
  - 医疗器械数据库
- **页面结构特点**:
  - 日语界面
  - 表格数据
  - PDF 文档较多

---

### 5. 澳大利亚 (AU)

#### TGA (治疗用品管理局)
- **网址**: https://www.tga.gov.au/
- **数据类型**: ARTG (澳大利亚治疗用品注册)
- **关键页面**:
  - 公共摘要: https://www.tga.gov.au/resources/artg
- **页面结构特点**:
  - 结构化数据
  - 支持 CSV 导出

---

### 6. 加拿大 (CA)

#### Health Canada
- **网址**: https://www.canada.ca/en/health-canada.html
- **数据类型**: 医疗器械许可证
- **关键页面**:
  - 医疗器械数据库
- **页面结构特点**:
  - 表格数据
  - 分页查询

---

## 🔍 HTML 结构模式分析

### 常见数据结构

#### 1. 列表页结构
```html
<!-- 典型列表页 -->
<table class="data-table">
  <thead>
    <tr>
      <th>产品名称</th>
      <th>企业名称</th>
      <th>注册证号</th>
      <th>批准日期</th>
    </tr>
  </thead>
  <tbody>
    <tr data-id="12345">
      <td><a href="/detail/12345">产品A</a></td>
      <td>企业A</td>
      <td>国械注准20201234567</td>
      <td>2020-01-01</td>
    </tr>
  </tbody>
</table>

<!-- 分页 -->
<div class="pagination">
  <a href="?page=1">1</a>
  <a href="?page=2">2</a>
  <span class="current">3</span>
</div>
```

#### 2. 详情页结构
```html
<!-- 典型详情页 -->
<div class="detail-page">
  <h1 class="product-name">产品名称</h1>
  <div class="info-section">
    <dl>
      <dt>注册证号</dt>
      <dd>国械注准20201234567</dd>
      <dt>生产企业</dt>
      <dd>某某医疗器械有限公司</dd>
      <dt>产品分类</dt>
      <dd>II类医疗器械</dd>
    </dl>
  </div>
</div>
```

#### 3. 动态加载结构 (SPA)
```javascript
// 现代网站使用 API 获取数据
fetch('/api/devices?page=1&size=20')
  .then(res => res.json())
  .then(data => {
    // 动态渲染表格
    renderTable(data.items);
  });
```

---

## 🛠️ 技术挑战与解决方案

### 挑战 1: 多语言支持
**问题**: 6 个国家，多种语言（英、中、日、法、德等）
**解决方案**:
- 使用多语言 HTML 结构识别模型
- 基于 DOM 结构而非文本内容识别
- 预定义字段映射表

### 挑战 2: 反爬虫机制
**问题**: 验证码、IP限制、频率限制
**解决方案**:
- 使用代理池轮换 IP
- 控制请求频率（随机延迟）
- 模拟真实浏览器行为（User-Agent、Cookies）
- 使用无头浏览器（Puppeteer/Playwright）处理复杂验证

### 挑战 3: 动态内容加载
**问题**: SPA 应用、AJAX 加载
**解决方案**:
- 分析 API 接口直接请求数据
- 使用无头浏览器等待页面加载完成
- 监听网络请求拦截数据

### 挑战 4: 数据格式不一致
**问题**: 不同国家字段命名、数据格式差异大
**解决方案**:
- 建立标准化字段映射
- 使用 AI 模型自动识别字段含义
- 数据清洗和标准化流程

---

## 📈 数据量估算

| 国家 | 预计数据量 | 更新频率 | 优先级 |
|------|-----------|---------|--------|
| 美国 FDA | 100,000+ | 每日 | P0 |
| 欧盟 EUDAMED | 500,000+ | 每日 | P0 |
| 中国 NMPA | 200,000+ | 每日 | P0 |
| 日本 PMDA | 50,000+ | 每周 | P1 |
| 澳大利亚 TGA | 30,000+ | 每周 | P1 |
| 加拿大 Health Canada | 40,000+ | 每周 | P1 |

**总计**: 约 920,000+ 条记录

---

## 🎯 下一步行动

1. **技术选型** (本周)
   - [ ] 确定 HTML 解析框架（Cheerio vs Puppeteer）
   - [ ] 选择 AI 模型架构（BERT vs 专用 CNN）
   - [ ] 设计数据存储方案

2. **原型开发** (下周)
   - [ ] 实现 FDA 网站解析器
   - [ ] 实现 NMPA 网站解析器
   - [ ] 测试解析准确率

3. **模型训练** (W5-W6)
   - [ ] 收集训练数据
   - [ ] 训练结构识别模型
   - [ ] 优化模型性能

---

**最后更新**: 2026-04-18  
**下次更新**: 完成技术选型后
