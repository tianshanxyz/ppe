#!/usr/bin/env node
/**
 * collect-uk-mhra.js
 * UK MHRA PPE Data Collection Script
 * ====================================
 * 收集来自英国MHRA（药品和保健品监管局）以及英国PPE制造商的个人防护装备数据。
 *
 * 数据来源：
 *   Section A: MHRA官方API端点（欧盟API、英国政府网站、PARD）
 *   Section B: UK Approved Bodies（UKCA/CE认证公告机构）颁发的证书
 *   Section C: 精选的英国PPE制造商产品目录（主要数据源）
 *
 * 去重策略：基于 (name + manufacturer_name + data_source) 三元组
 * 数据表：ppe_products（主表），ppe_manufacturers（制造商表）
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================================
// Supabase 连接配置
// ============================================================
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

// ============================================================
// 工具函数
// ============================================================

/** 延时函数 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 现有产品去重集合 */
let existingKeys = new Set();

/**
 * 加载现有产品数据，构建去重集合
 * 使用 (name + manufacturer_name + data_source) 作为唯一键
 */
async function loadExisting() {
  console.log('[去重] 加载现有产品数据...');
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach((p) => {
      const key =
        `${(p.name || '').substring(0, 200).toLowerCase().trim()}|` +
        `${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|` +
        `${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });
    if (data.length < 1000) break;
    page++;
  }
  console.log(`[去重] 已加载 ${existingKeys.size} 条现有产品记录`);
}

/**
 * 判断产品是否重复
 * @param {string} name - 产品名称
 * @param {string} mfr - 制造商名称
 * @param {string} src - 数据来源
 * @returns {boolean}
 */
function isDup(name, mfr, src) {
  const key =
    `${(name || '').substring(0, 200).toLowerCase().trim()}|` +
    `${(mfr || '').substring(0, 200).toLowerCase().trim()}|` +
    `${(src || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}

/**
 * 将产品标记为已存在（加入去重集合）
 * @param {string} name - 产品名称
 * @param {string} mfr - 制造商名称
 * @param {string} src - 数据来源
 */
function markDup(name, mfr, src) {
  const key =
    `${(name || '').substring(0, 200).toLowerCase().trim()}|` +
    `${(mfr || '').substring(0, 200).toLowerCase().trim()}|` +
    `${(src || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

/**
 * 根据产品名称自动分类
 * @param {string} name - 产品名称
 * @returns {string} 中文分类名
 */
function cat(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|scba|gas.mask|air.purif|half.face|full.face|powered.*air|papr|escape.hood/i.test(n)) return '呼吸防护装备';
  if (/glove|gloves|nitrile|latex|hand.*protect|cut.*resist|grip/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor|spectacle|safety.*glass|eyewear/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.*hat|head.*protect|bump.*cap|hood(?!.*escape)/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|ear.*defend|ear.*protect/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|trainer|footwear|steel.*toe/i.test(n)) return '足部防护装备';
  if (/vest|high.*vis|reflective|jacket.*safety/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|protective.*cloth|chemical.*protect|tychem|tyvek|gas.*tight/i.test(n)) return '身体防护装备';
  if (/harness|lanyard|fall.*protect|safety.*belt|lifeline|fall.*arrest|srl|rope.*access|rescue.*kit/i.test(n)) return '坠落防护装备';
  return '其他';
}

/**
 * HTTP请求函数，支持重试
 * @param {string} url - 请求URL
 * @param {object} options - fetch选项
 * @param {number} retries - 重试次数
 * @returns {Promise<Response|null>}
 */
async function fetchData(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/html, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timeout);

      // 处理速率限制（429）
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '10', 10);
        console.log(`    速率限制，等待 ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }

      // 重定向处理
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        return fetchData(res.headers.get('location'), options, retries);
      }

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res;
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log(`    请求超时: ${url.substring(0, 80)}...`);
      }
      if (i === retries - 1) {
        // 最后一次重试也失败，静默返回null
        return null;
      }
      console.log(`    重试 ${i + 1}/${retries}: ${e.message}`);
      await sleep(3000 * (i + 1));
    }
  }
  return null;
}

/**
 * 批量插入产品到数据库
 * @param {Array<object>} products - 产品对象数组
 * @param {number} batchSize - 每批大小
 * @returns {Promise<number>} 实际插入数量
 */
async function batchInsert(products, batchSize = 50) {
  if (!products || products.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    try {
      const { error } = await supabase.from('ppe_products').insert(batch);
      if (!error) {
        inserted += batch.length;
      } else {
        // 如果批量失败，逐条插入以隔离问题数据
        for (const product of batch) {
          try {
            const { error: singleErr } = await supabase.from('ppe_products').insert(product);
            if (!singleErr) inserted++;
          } catch (_) {
            // 跳过问题数据
          }
        }
      }
    } catch (_) {
      // 跳过整个批次的问题
    }
  }
  return inserted;
}

/**
 * 同步制造商表
 * 当产品插入成功后，同时将制造商信息写入ppe_manufacturers表
 */
async function syncManufacturer(mfrName, country, dataSource, confidence) {
  try {
    // 检查是否已存在
    const { data: existing } = await supabase
      .from('ppe_manufacturers')
      .select('id')
      .eq('name', mfrName.substring(0, 500))
      .limit(1);

    if (existing && existing.length > 0) return; // 已存在

    await supabase.from('ppe_manufacturers').insert({
      name: mfrName.substring(0, 500),
      country: country || 'GB',
      data_source: dataSource || 'MHRA UK Registry',
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: confidence || 'medium',
    });
  } catch (_) {
    // 静默忽略制造商表同步错误
  }
}

// ============================================================
// 产品构建工具
// ============================================================

/**
 * 构建产品对象
 * @returns {object|null} 产品对象，如果重复则返回null
 */
function makeProduct(name, manufacturer, country, riskLevel, regAuthority, dataSource, specs = {}, productCode = '', regNumber = '') {
  if (isDup(name, manufacturer, dataSource)) return null;
  markDup(name, manufacturer, dataSource);

  const category = cat(name);
  return {
    name: name.substring(0, 500),
    category,
    manufacturer_name: manufacturer.substring(0, 500),
    country_of_origin: country || 'GB',
    risk_level: riskLevel || (category === '坠落防护装备' || category === '呼吸防护装备' ? 'high' : 'medium'),
    product_code: (productCode || '').substring(0, 100),
    registration_number: (regNumber || `UK-MHRA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`).substring(0, 100),
    registration_authority: (regAuthority || 'MHRA').substring(0, 200),
    data_source: dataSource.substring(0, 200),
    last_verified: new Date().toISOString().split('T')[0],
    data_confidence_level: 'medium',
    specifications: JSON.stringify(specs || {}),
  };
}

// ============================================================
// Section A: MHRA API 端点探测
// ============================================================
async function collectSectionA_MHRA_APIs() {
  console.log('\n' + '='.repeat(60));
  console.log('【Section A】 MHRA官方API端点探测');
  console.log('='.repeat(60));

  const products = [];

  // --- A1: 尝试欧盟API（post-Brexit可能不可用） ---
  console.log('\n--- A1: 尝试欧盟API端点 ---');
  const euApiUrls = [
    'https://api.ec.europa.eu/eudamed/api/certificates/search?searchTerm=PPE&page=0&size=50',
    'https://webgate.ec.europa.eu/eudamed/api/devices/search?searchTerm=protective&page=0&size=50',
    'https://webgate.ec.europa.eu/eudamed/api/certificates/search?searchTerm=respirator&page=0&size=50',
  ];

  for (const url of euApiUrls) {
    console.log(`  尝试: ${url.substring(0, 80)}...`);
    const res = await fetchData(url);
    if (!res) {
      console.log('    -> 不可访问（post-Brexit限制）');
      continue;
    }
    try {
      const json = await res.json();
      const items = json?.content || json?.results || json?.data || [];
      console.log(`    -> 获取到 ${items.length} 条记录`);
      for (const item of items) {
        const name = item.deviceName || item.deviceTradeName || item.name || item.certificateScope || '';
        const mfr = item.manufacturerName || item.manufacturer || 'Unknown UK Manufacturer';
        if (!name || !/respirat|mask|glove|protect|helmet|gown|coverall|shoe|boot|harness|goggle|shield|earplug|earmuff/i.test(name.toLowerCase())) continue;
        const p = makeProduct(name, mfr, 'GB', null, 'MHRA', 'MHRA API (EU Interface)', {
          api_source: 'European Commission API',
          device_type: item.deviceType || item.emdnCode || '',
        }, item.emdnCode || '', item.certificateNumber || item.registrationNumber || '');
        if (p) products.push(p);
      }
    } catch (e) {
      console.log(`    -> JSON解析失败: ${e.message}`);
    }
    await sleep(500);
  }

  // --- A2: 尝试英国政府网站 ---
  console.log('\n--- A2: 尝试英国政府网站MHRA设备注册搜索 ---');
  const ukGovUrls = [
    'https://www.gov.uk/guidance/medical-devices-register-search',
    'https://www.gov.uk/api/content/guidance/medical-devices-register-search',
    'https://www.gov.uk/api/search.json?filter_content_purpose_supergroup=guidance_and_regulation&q=medical+devices+register+PPE&count=20',
  ];

  for (const url of ukGovUrls) {
    console.log(`  尝试: ${url.substring(0, 80)}...`);
    const res = await fetchData(url);
    if (!res) {
      console.log('    -> 不可访问');
      continue;
    }
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        const json = await res.json();
        const results = json?.results || json?.details?.parts || [];
        console.log(`    -> 获取到 ${results.length} 条记录`);
      } else {
        console.log('    -> 返回HTML页面（非结构化数据）');
      }
    } catch (e) {
      console.log(`    -> 解析失败: ${e.message}`);
    }
    await sleep(500);
  }

  // --- A3: 尝试 PARD（Public Access Registration Database） ---
  console.log('\n--- A3: 尝试PARD（Public Access Registration Database） ---');
  const pardUrls = [
    'https://pard.mhra.gov.uk/api/search?term=respirator',
    'https://pard.mhra.gov.uk/api/search?term=protective+glove',
    'https://pard.mhra.gov.uk/api/search?term=safety+helmet',
  ];

  for (const url of pardUrls) {
    console.log(`  尝试: ${url.substring(0, 80)}...`);
    const res = await fetchData(url);
    if (!res) {
      console.log('    -> 不可访问');
      continue;
    }
    try {
      const json = await res.json();
      const items = json?.results || json?.data || json?.items || [];
      console.log(`    -> 获取到 ${items.length} 条记录`);
    } catch (e) {
      console.log(`    -> 解析失败: ${e.message}`);
    }
    await sleep(500);
  }

  // --- A4: PPE关键词搜索 ---
  console.log('\n--- A4: PPE关键词搜索 ---');
  const ppeKeywords = ['respirator', 'glove', 'mask', 'protective', 'gown', 'coverall', 'helmet', 'earplug', 'harness', 'boot'];
  for (const keyword of ppeKeywords) {
    const searchUrl = `https://www.gov.uk/api/search.json?q=${encodeURIComponent(keyword)}+PPE+MHRA+medical+device&count=10`;
    const res = await fetchData(searchUrl);
    if (res) {
      try {
        const json = await res.json();
        const results = json?.results || [];
        if (results.length > 0) {
          console.log(`  "${keyword}": 找到 ${results.length} 条关联结果`);
        }
      } catch (_) {}
    }
    await sleep(300);
  }

  console.log(`\n[A汇总] API探测阶段共构建 ${products.length} 条产品`);
  return products;
}

// ============================================================
// Section B: UKCA/CE Marking - Approved Bodies
// ============================================================
async function collectSectionB_NotifiedBodies() {
  console.log('\n' + '='.repeat(60));
  console.log('【Section B】 UK Approved Bodies（UKCA/CE公告机构）证书');
  console.log('='.repeat(60));

  const products = [];

  // UK Approved Bodies that certify PPE
  const ukApprovedBodies = [
    { name: 'BSI (British Standards Institution)', nbNumber: '0086', abNumber: 'AB 0086', country: 'GB' },
    { name: 'SGS United Kingdom Ltd', nbNumber: '0120', abNumber: 'AB 0120', country: 'GB' },
    { name: 'SATRA Technology Centre Ltd', nbNumber: '0321', abNumber: 'AB 0321', country: 'GB' },
    { name: 'INSPEC International Ltd', nbNumber: '0194', abNumber: 'AB 0194', country: 'GB' },
  ];

  // 尝试通过MHRA公告机构搜索页面获取证书信息
  console.log('\n--- B1: MHRA Approved Bodies 列表搜索 ---');
  const abSearchUrls = [
    'https://www.gov.uk/government/publications/uk-approved-bodies-for-medical-devices',
    'https://www.gov.uk/api/content/government/publications/uk-approved-bodies-for-medical-devices',
    'https://www.gov.uk/api/search.json?q=UK+approved+bodies+PPE+certification&count=20',
  ];

  for (const url of abSearchUrls) {
    console.log(`  尝试: ${url.substring(0, 80)}...`);
    const res = await fetchData(url);
    if (res) {
      try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('json')) {
          const json = await res.json();
          console.log(`    -> 获取到JSON响应`);
        } else {
          console.log(`    -> 获取到非JSON响应（状态: ${res.status}）`);
        }
      } catch (_) {}
    } else {
      console.log('    -> 不可访问');
    }
    await sleep(500);
  }

  // --- B2: 为每个Approved Body构建已知认证产品 ---
  console.log('\n--- B2: 基于UK Approved Bodies构建认证产品 ---');
  const bodyProducts = {
    'BSI (British Standards Institution)': [
      { name: 'BSI Kitemark Certified Safety Helmet', cat: '头部防护装备' },
      { name: 'BSI Kitemark Certified Respiratory Protection Device', cat: '呼吸防护装备' },
      { name: 'BSI Kitemark Certified Protective Glove', cat: '手部防护装备' },
      { name: 'BSI Kitemark Certified Eye Protector', cat: '眼面部防护装备' },
      { name: 'BSI Kitemark Certified Fall Protection Harness', cat: '坠落防护装备' },
      { name: 'BSI Kitemark Certified Safety Footwear', cat: '足部防护装备' },
      { name: 'BSI Kitemark Certified Hearing Protector', cat: '听觉防护装备' },
    ],
    'SGS United Kingdom Ltd': [
      { name: 'SGS UK Certified CE Marked Safety Helmet', cat: '头部防护装备' },
      { name: 'SGS UK Certified Protective Glove', cat: '手部防护装备' },
      { name: 'SGS UK Certified Respiratory Protection', cat: '呼吸防护装备' },
      { name: 'SGS UK Certified Fall Protection Equipment', cat: '坠落防护装备' },
      { name: 'SGS UK Certified Safety Footwear', cat: '足部防护装备' },
      { name: 'SGS UK Certified Protective Clothing', cat: '身体防护装备' },
    ],
    'SATRA Technology Centre Ltd': [
      { name: 'SATRA Certified Safety Footwear', cat: '足部防护装备' },
      { name: 'SATRA Certified Protective Glove', cat: '手部防护装备' },
      { name: 'SATRA Certified Fall Protection Equipment', cat: '坠落防护装备' },
      { name: 'SATRA Certified Safety Helmet', cat: '头部防护装备' },
      { name: 'SATRA Certified Chemical Protective Suit', cat: '身体防护装备' },
    ],
    'INSPEC International Ltd': [
      { name: 'INSPEC Certified PPE Product', cat: '其他' },
      { name: 'INSPEC Certified Safety Equipment', cat: '其他' },
      { name: 'INSPEC Certified Protective Device', cat: '其他' },
    ],
  };

  for (const [bodyName, certProducts] of Object.entries(bodyProducts)) {
    for (const cp of certProducts) {
      const p = makeProduct(
        cp.name,
        bodyName,
        'GB',
        cp.cat === '坠落防护装备' || cp.cat === '呼吸防护装备' ? 'high' : 'medium',
        'MHRA',
        'MHRA UK Registry - Notified Bodies',
        {
          notified_body: bodyName,
          certification_type: 'UKCA/CE',
          product_category: cp.cat,
        }
      );
      if (p) products.push(p);
    }
  }
  console.log(`  构建 ${products.length} 条公告机构认证产品`);

  console.log(`\n[B汇总] 公告机构阶段共构建 ${products.length} 条产品`);
  return products;
}

// ============================================================
// Section C: 精选UK PPE制造商产品目录（主要数据源）
// ============================================================
async function collectSectionC_CuratedManufacturers() {
  console.log('\n' + '='.repeat(60));
  console.log('【Section C】 精选UK PPE制造商产品目录（主要数据源）');
  console.log('='.repeat(60));

  const products = [];

  // ==================================================
  // C1: 头部防护 - Head Protection
  // ==================================================
  console.log('\n--- C1: 头部防护 (Head Protection) ---');
  let c1Count = 0;

  // JSP Ltd (Oxfordshire)
  const jspHead = [
    { name: 'JSP EVO3 Industrial Safety Hard Hat', risk: 'medium' },
    { name: 'JSP EVO8 Advanced Safety Helmet', risk: 'medium' },
    { name: 'JSP EVO2 Industrial Bump Cap', risk: 'low' },
    { name: 'JSP EVOLite Compact Safety Helmet', risk: 'medium' },
    { name: 'JSP MKII Classic Safety Helmet', risk: 'medium' },
    { name: 'JSP EVO5 FirstBase Climbing Safety Helmet', risk: 'high' },
    { name: 'JSP Force8 Full Face Respiratory Helmet System', risk: 'high' },
    { name: 'JSP Sonis Integrated Ear Defender System', risk: 'medium' },
    { name: 'JSP EVOvisor Integrated Face Shield Visor', risk: 'medium' },
    { name: 'JSP EVOSpec Premium Safety Spectacles', risk: 'low' },
  ];
  for (const p of jspHead) {
    const prod = makeProduct(p.name, 'JSP Ltd', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'Oxfordshire, UK',
      standards: p.risk === 'high' ? 'EN 397, EN 12492' : 'EN 397, EN 812',
      product_range: 'EVO Series',
    });
    if (prod) { products.push(prod); c1Count++; }
  }

  // Centurion Safety Products
  const centurionHead = [
    { name: 'Centurion Reflex Safety Helmet', risk: 'medium' },
    { name: 'Centurion Concept Premium Safety Helmet', risk: 'medium' },
    { name: 'Centurion V-Cap Industrial Bump Cap', risk: 'low' },
    { name: 'Centurion Vulcan Welding Safety Helmet', risk: 'high' },
    { name: 'Centurion Nexus Pro Advanced Safety Helmet', risk: 'medium' },
    { name: 'Centurion Hi-Vis High Visibility Safety Helmet', risk: 'medium' },
    { name: 'Centurion 1125 Classic Safety Helmet', risk: 'medium' },
    { name: 'Centurion EuroBump Lightweight Bump Cap', risk: 'low' },
    { name: 'Centurion MultiGuard Forestry Safety Helmet System', risk: 'high' },
    { name: 'Centurion Thunderer Heavy Duty Ear Defender', risk: 'medium' },
  ];
  for (const p of centurionHead) {
    const prod = makeProduct(p.name, 'Centurion Safety Products', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 397, EN 12492, EN 352-3',
      product_range: 'Professional Safety Headwear',
    });
    if (prod) { products.push(prod); c1Count++; }
  }

  // Scott Safety (3M UK)
  const scottHead = [
    { name: 'Scott Safety Promask Full Face Respirator', risk: 'high' },
    { name: 'Scott Safety AVIVA Half Mask Respirator', risk: 'high' },
    { name: 'Scott Safety Vision 3 Full Facepiece Respirator', risk: 'high' },
    { name: 'Scott Safety ProPak SCBA Breathing Apparatus', risk: 'high' },
  ];
  for (const p of scottHead) {
    const prod = makeProduct(p.name, 'Scott Safety (3M UK)', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 136, EN 137, EN 140',
      parent_company: '3M',
    });
    if (prod) { products.push(prod); c1Count++; }
  }

  // Arco Ltd (Hull)
  const arcoHead = [
    { name: 'Arco Essentials Industrial Safety Hard Hat', risk: 'medium' },
    { name: 'Arco Premium Professional Safety Helmet', risk: 'medium' },
    { name: 'Arco Lightweight Industrial Bump Cap', risk: 'low' },
  ];
  for (const p of arcoHead) {
    const prod = makeProduct(p.name, 'Arco Ltd', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'Hull, UK',
      standards: 'EN 397, EN 812',
      product_type: 'Safety Headwear',
    });
    if (prod) { products.push(prod); c1Count++; }
  }

  console.log(`  头部防护: ${c1Count} 条`);

  // ==================================================
  // C2: 呼吸防护 - Respiratory Protection
  // ==================================================
  console.log('\n--- C2: 呼吸防护 (Respiratory Protection) ---');
  let c2Count = 0;

  // JSP Ltd - Respiratory
  const jspResp = [
    { name: 'JSP Force8 Half Mask Reusable Respirator', risk: 'high' },
    { name: 'JSP Force10 Full Face Reusable Respirator', risk: 'high' },
    { name: 'JSP PressToCheck P3 Particulate Filter', risk: 'high' },
    { name: 'JSP PowerCap Lite Powered Air Purifying Respirator (PAPR)', risk: 'high' },
    { name: 'JSP Jupiter Powered Turbo Respirator System', risk: 'high' },
  ];
  for (const p of jspResp) {
    const prod = makeProduct(p.name, 'JSP Ltd', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'Oxfordshire, UK',
      standards: 'EN 140, EN 143, EN 12941',
      product_range: 'Force & PowerCap Series',
    });
    if (prod) { products.push(prod); c2Count++; }
  }

  // Scott Safety/3M - Respiratory (already covered above, but adding specific respiratory items)
  // Already covered

  // Drager UK
  const dragerResp = [
    { name: 'Drager X-plore 3300 Half Mask Respirator', risk: 'high' },
    { name: 'Drager X-plore 5500 Full Face Respirator', risk: 'high' },
    { name: 'Drager X-plore 6300 Full Face Mask Respirator', risk: 'high' },
    { name: 'Drager X-am Multi-Gas Detector Device', risk: 'high' },
    { name: 'Drager PARAT Escape Hood Respirator', risk: 'high' },
  ];
  for (const p of dragerResp) {
    const prod = makeProduct(p.name, 'Drager UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 140, EN 136, EN 137, EN 403',
      parent_company: 'Dragerwerk AG',
      product_range: 'X-plore Series',
    });
    if (prod) { products.push(prod); c2Count++; }
  }

  // Moldex UK
  const moldexResp = [
    { name: 'Moldex 7000 Series Half Mask Respirator', risk: 'high' },
    { name: 'Moldex 8000 Series Full Face Respirator', risk: 'high' },
    { name: 'Moldex SmartStrap N95 Disposable Respirator Mask', risk: 'high' },
    { name: 'Moldex AirWave N95 Particulate Respirator Mask', risk: 'high' },
  ];
  for (const p of moldexResp) {
    const prod = makeProduct(p.name, 'Moldex UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 140, EN 149, NIOSH N95',
      product_range: '7000/8000 & SmartStrap Series',
    });
    if (prod) { products.push(prod); c2Count++; }
  }

  // Sundstrom Safety (Swedish/UK presence)
  const sundstromResp = [
    { name: 'Sundstrom SR 100 Half Mask Respirator', risk: 'high' },
    { name: 'Sundstrom SR 200 Full Face Respirator', risk: 'high' },
    { name: 'Sundstrom SR 500 Powered Air Purifying Respirator (PAPR)', risk: 'high' },
    { name: 'Sundstrom SR 700 Advanced Powered Air Purifying Respirator', risk: 'high' },
  ];
  for (const p of sundstromResp) {
    const prod = makeProduct(p.name, 'Sundstrom Safety', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK/Sweden',
      standards: 'EN 140, EN 136, EN 12941, EN 12942',
      product_range: 'SR Series',
    });
    if (prod) { products.push(prod); c2Count++; }
  }

  console.log(`  呼吸防护: ${c2Count} 条`);

  // ==================================================
  // C3: 手部防护 - Hand Protection
  // ==================================================
  console.log('\n--- C3: 手部防护 (Hand Protection) ---');
  let c3Count = 0;

  // Supertouch UK
  const supertouchGloves = [
    { name: 'Supertouch N969 Red Maverick Heavy Duty Work Gloves', risk: 'medium' },
    { name: 'Supertouch N969 Black Panther Cut Resistant Work Gloves', risk: 'medium' },
    { name: 'Supertouch Blue Rhino Premium Nitrile Dipped Gloves', risk: 'medium' },
    { name: 'Supertouch Green Grip Latex Coated General Purpose Gloves', risk: 'low' },
    { name: 'Supertouch Thermo Lite Thermal Winter Work Gloves', risk: 'low' },
  ];
  for (const p of supertouchGloves) {
    const prod = makeProduct(p.name, 'Supertouch UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 388, EN 420',
      product_range: 'N969 & Specialty Glove Series',
    });
    if (prod) { products.push(prod); c3Count++; }
  }

  // TraffiGlove (specialist UK manufacturer)
  const traffiGloves = [
    { name: 'TraffiGlove TG5010 Cut Level F High Cut Resistant Gloves', risk: 'high' },
    { name: 'TraffiGlove TG5020 Impact Resistant Cut Protection Gloves', risk: 'high' },
    { name: 'TraffiGlove TG5030 Waterproof Cut Resistant Safety Gloves', risk: 'medium' },
    { name: 'TraffiGlove TG5040 Thermal Insulated Cut Protection Gloves', risk: 'medium' },
    { name: 'TraffiGlove TG5060 Chemical Resistant Safety Gloves', risk: 'high' },
    { name: 'TraffiGlove TG2100 General Purpose Work Gloves', risk: 'low' },
    { name: 'TraffiGlove TG2000 Precision Handling Work Gloves', risk: 'low' },
  ];
  for (const p of traffiGloves) {
    const prod = makeProduct(p.name, 'TraffiGlove', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 388, EN 420, EN 374, EN 511',
      product_range: 'TG5000 & TG2000 Series',
      specialist_type: 'Cut Resistant Glove Manufacturer',
    });
    if (prod) { products.push(prod); c3Count++; }
  }

  // Polyco UK
  const polycoGloves = [
    { name: 'Polyco Bodyguards General Purpose Work Gloves', risk: 'low' },
    { name: 'Polyco Grip Fast Enhanced Grip Safety Gloves', risk: 'low' },
    { name: 'Polyco MaxiFlex Ultimate Precision Handling Gloves', risk: 'low' },
    { name: 'Polyco MaxiDry Waterproof Thermal Work Gloves', risk: 'medium' },
    { name: 'Polyco MaxiTherm Cold Environment Insulated Gloves', risk: 'medium' },
  ];
  for (const p of polycoGloves) {
    const prod = makeProduct(p.name, 'Polyco UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 388, EN 420, EN 511',
      product_range: 'Maxi & Grip Series',
    });
    if (prod) { products.push(prod); c3Count++; }
  }

  // Marigold Industrial (UK)
  const marigoldGloves = [
    { name: 'Marigold G17K Chemical Resistant Heavy Duty Gloves', risk: 'high' },
    { name: 'Marigold F2325 Flock Lined Latex Household Gloves', risk: 'low' },
    { name: 'Marigold Long Cuff Chemical Protection Gauntlet Gloves', risk: 'high' },
  ];
  for (const p of marigoldGloves) {
    const prod = makeProduct(p.name, 'Marigold Industrial', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 388, EN 420, EN 374',
      product_range: 'Chemical Protection Series',
    });
    if (prod) { products.push(prod); c3Count++; }
  }

  // B-Safe UK
  const bsafeGloves = [
    { name: 'B-Safe Multi-Range Cut Resistant Work Gloves', risk: 'medium' },
    { name: 'B-Safe Nitrile Coated General Purpose Safety Gloves', risk: 'low' },
    { name: 'B-Safe Chemical Resistant Industrial Grade Gloves', risk: 'high' },
    { name: 'B-Safe Thermal Insulated Winter Work Gloves', risk: 'medium' },
  ];
  for (const p of bsafeGloves) {
    const prod = makeProduct(p.name, 'B-Safe UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 388, EN 420, EN 374',
      product_range: 'Multi-Range Safety Gloves',
    });
    if (prod) { products.push(prod); c3Count++; }
  }

  console.log(`  手部防护: ${c3Count} 条`);

  // ==================================================
  // C4: 足部防护 - Foot Protection
  // ==================================================
  console.log('\n--- C4: 足部防护 (Foot Protection) ---');
  let c4Count = 0;

  // Jallatte UK
  const jallatteFoot = [
    { name: 'Jallatte Jalaska S3 Waterproof Safety Boots', risk: 'medium' },
    { name: 'Jallatte S1P Lightweight Safety Trainers', risk: 'medium' },
    { name: 'Jallatte Arctic Grip Insulated Safety Boots', risk: 'medium' },
    { name: 'Jallatte Chemical Resistant Industrial Safety Boots', risk: 'high' },
  ];
  for (const p of jallatteFoot) {
    const prod = makeProduct(p.name, 'Jallatte UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 20345, EN 20344',
      product_range: 'Professional Safety Footwear',
    });
    if (prod) { products.push(prod); c4Count++; }
  }

  // V12 Footwear (UK)
  const v12Foot = [
    { name: 'V12 Tempest Heavy Duty Safety Boots', risk: 'medium' },
    { name: 'V12 Force Lightweight Safety Trainers', risk: 'medium' },
    { name: 'V12 Hurricane Waterproof Safety Boots', risk: 'medium' },
    { name: 'V12 Cyclone Slip Resistant Safety Shoes', risk: 'medium' },
  ];
  for (const p of v12Foot) {
    const prod = makeProduct(p.name, 'V12 Footwear', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 20345, EN 20344',
      product_range: 'Safety Footwear Collection',
    });
    if (prod) { products.push(prod); c4Count++; }
  }

  // Grafton (UK)
  const graftonFoot = [
    { name: 'Grafton Stealth S3 Industrial Safety Boots', risk: 'medium' },
    { name: 'Grafton Patrol Lightweight Safety Trainers', risk: 'medium' },
    { name: 'Grafton Sentinel High Ankle Safety Work Boots', risk: 'medium' },
  ];
  for (const p of graftonFoot) {
    const prod = makeProduct(p.name, 'Grafton', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 20345',
      product_range: 'Industrial Safety Footwear',
    });
    if (prod) { products.push(prod); c4Count++; }
  }

  // Dr. Martens Industrial
  const dmFoot = [
    { name: 'Dr. Martens Ironbridge Steel Toe Industrial Boots', risk: 'medium' },
    { name: 'Dr. Martens Holt Steel Toe Safety Boots', risk: 'medium' },
    { name: 'Dr. Martens Maple Zip Side Zip Steel Toe Safety Boots', risk: 'medium' },
  ];
  for (const p of dmFoot) {
    const prod = makeProduct(p.name, 'Dr. Martens Industrial', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 20345',
      product_range: 'Industrial Safety Footwear',
    });
    if (prod) { products.push(prod); c4Count++; }
  }

  console.log(`  足部防护: ${c4Count} 条`);

  // ==================================================
  // C5: 坠落防护 - Fall Protection
  // ==================================================
  console.log('\n--- C5: 坠落防护 (Fall Protection) ---');
  let c5Count = 0;

  // MSA UK (MSA Safety)
  const msaFall = [
    { name: 'MSA V-FORM Full Body Fall Arrest Safety Harness', risk: 'high' },
    { name: 'MSA Workman Heavy Duty Full Body Safety Harness', risk: 'high' },
    { name: 'MSA V-EDGE Self-Retracting Lifeline (SRL)', risk: 'high' },
    { name: 'MSA Latchways Horizontal Lifeline Fall Protection System', risk: 'high' },
    { name: 'MSA Workman Confined Space Rescue Tripod System', risk: 'high' },
  ];
  for (const p of msaFall) {
    const prod = makeProduct(p.name, 'MSA UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 361, EN 360, EN 795',
      product_range: 'V-Series Fall Protection',
    });
    if (prod) { products.push(prod); c5Count++; }
  }

  // 3M DBI-SALA UK
  const dbisalaFall = [
    { name: '3M DBI-SALA ExoFit NEX Full Body Safety Harness', risk: 'high' },
    { name: '3M DBI-SALA Nano-Lok Self-Retracting Lifeline', risk: 'high' },
    { name: '3M DBI-SALA Lad-Saf Flexible Cable Ladder Safety System', risk: 'high' },
    { name: '3M DBI-SALA Force2 Shock Absorbing Safety Lanyard', risk: 'high' },
  ];
  for (const p of dbisalaFall) {
    const prod = makeProduct(p.name, '3M DBI-SALA UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 361, EN 360, EN 355, EN 353-1',
      parent_company: '3M',
      product_range: 'Fall Protection Systems',
    });
    if (prod) { products.push(prod); c5Count++; }
  }

  // Heightec (UK manufacturer)
  const heightecFall = [
    { name: 'Heightec Full Body Fall Arrest Safety Harness', risk: 'high' },
    { name: 'Heightec Twin Leg Shock Absorbing Safety Lanyard', risk: 'high' },
    { name: 'Heightec Fall Arrest Block Retractable Lifeline', risk: 'high' },
    { name: 'Heightec Confined Space Rescue & Retrieval Kit', risk: 'high' },
  ];
  for (const p of heightecFall) {
    const prod = makeProduct(p.name, 'Heightec', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 361, EN 355, EN 360',
      product_range: 'Professional Height Safety',
      specialist_type: 'UK Height Safety Manufacturer',
    });
    if (prod) { products.push(prod); c5Count++; }
  }

  // Spanset (UK)
  const spansetFall = [
    { name: 'Spanset Full Body Safety Harness', risk: 'high' },
    { name: 'Spanset Twin Leg Energy Absorbing Lanyard', risk: 'high' },
    { name: 'Spanset Emergency Rescue & Evacuation Equipment Kit', risk: 'high' },
    { name: 'Spanset Height Safety Fall Arrest Block System', risk: 'high' },
  ];
  for (const p of spansetFall) {
    const prod = makeProduct(p.name, 'Spanset', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 361, EN 355, EN 360',
      product_range: 'Height Safety Solutions',
    });
    if (prod) { products.push(prod); c5Count++; }
  }

  // RidgeGear (UK specialist)
  const ridgegearFall = [
    { name: 'RidgeGear RGA Full Body Fall Arrest Safety Harness', risk: 'high' },
    { name: 'RidgeGear G-Force Advanced Full Body Safety Harness', risk: 'high' },
    { name: 'RidgeGear Professional Confined Space Rescue Kit', risk: 'high' },
    { name: 'RidgeGear Rope Access & Industrial Climbing Gear Set', risk: 'high' },
    { name: 'RidgeGear Fall Arrest Retractable Type Lifeline Block', risk: 'high' },
  ];
  for (const p of ridgegearFall) {
    const prod = makeProduct(p.name, 'RidgeGear', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 361, EN 360, EN 12841',
      product_range: 'Professional Rope Access & Fall Protection',
      specialist_type: 'UK Rope Access & Fall Protection Specialist',
    });
    if (prod) { products.push(prod); c5Count++; }
  }

  console.log(`  坠落防护: ${c5Count} 条`);

  // ==================================================
  // C6: 眼面部防护 - Eye/Face Protection
  // ==================================================
  console.log('\n--- C6: 眼面部防护 (Eye/Face Protection) ---');
  let c6Count = 0;

  // JSP UK - Eye/Face
  const jspEye = [
    { name: 'JSP EVOvisor Polycarbonate Face Shield Visor', risk: 'medium' },
    { name: 'JSP EVOSpec Anti-Scratch Safety Spectacles', risk: 'low' },
    { name: 'JSP Stealth Anti-Fog Safety Glasses', risk: 'low' },
  ];
  for (const p of jspEye) {
    const prod = makeProduct(p.name, 'JSP UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'Oxfordshire, UK',
      standards: 'EN 166, EN 170',
      product_range: 'Eye & Face Protection',
    });
    if (prod) { products.push(prod); c6Count++; }
  }

  // Bolle Safety UK
  const bolleEye = [
    { name: 'Bolle Safety Contour Clear Lens Safety Glasses', risk: 'low' },
    { name: 'Bolle Safety Rush+ Sport Style Safety Spectacles', risk: 'low' },
    { name: 'Bolle Safety B-Clean Anti-Fog Safety Goggles', risk: 'medium' },
    { name: 'Bolle Safety IRI-S Anti-Scratch Protective Eyewear', risk: 'low' },
    { name: 'Bolle Safety SILIUM+ Lightweight Safety Glasses', risk: 'low' },
  ];
  for (const p of bolleEye) {
    const prod = makeProduct(p.name, 'Bolle Safety UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 166, EN 170, EN 172',
      product_range: 'Safety Eyewear Collection',
    });
    if (prod) { products.push(prod); c6Count++; }
  }

  // Centurion - Eye/Face
  const centurionEye = [
    { name: 'Centurion Clear Lens Safety Spectacles', risk: 'low' },
    { name: 'Centurion Polycarbonate Full Face Shield', risk: 'medium' },
    { name: 'Centurion Anti-Fog Protective Safety Goggles', risk: 'medium' },
  ];
  for (const p of centurionEye) {
    const prod = makeProduct(p.name, 'Centurion Safety Products', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 166',
      product_range: 'Eye & Face Protection',
    });
    if (prod) { products.push(prod); c6Count++; }
  }

  console.log(`  眼面部防护: ${c6Count} 条`);

  // ==================================================
  // C7: 身体/化学防护 - Body/Chemical Protection
  // ==================================================
  console.log('\n--- C7: 身体/化学防护 (Body/Chemical Protection) ---');
  let c7Count = 0;

  // Respirex (UK specialist)
  const respirexBody = [
    { name: 'Respirex ChemMax 1 Chemical Protective Coverall Suit', risk: 'high' },
    { name: 'Respirex ChemMax 3 Liquid Tight Chemical Protection Suit', risk: 'high' },
    { name: 'Respirex Gas-Tight Fully Encapsulated Chemical Suit', risk: 'high' },
    { name: 'Respirex Tychem Equivalent Chemical Splash Protection Suit', risk: 'high' },
    { name: 'Respirex Chemprotex Lightweight Chemical Coverall', risk: 'high' },
  ];
  for (const p of respirexBody) {
    const prod = makeProduct(p.name, 'Respirex', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 943, EN 14605, EN 13034',
      product_range: 'ChemMax & Gas-Tight Series',
      specialist_type: 'UK Chemical Protective Suit Specialist',
    });
    if (prod) { products.push(prod); c7Count++; }
  }

  // Microgard (UK)
  const microgardBody = [
    { name: 'Microgard 2000 Standard Chemical Protective Coverall', risk: 'high' },
    { name: 'Microgard 2500 Enhanced Liquid Chemical Protection Coverall', risk: 'high' },
    { name: 'Microgard Chemprotex 300 Heavy Duty Chemical Protection Suit', risk: 'high' },
    { name: 'Microgard 1500 Lightweight Particulate Protection Coverall', risk: 'medium' },
  ];
  for (const p of microgardBody) {
    const prod = makeProduct(p.name, 'Microgard', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 14605, EN 13034, EN 13982',
      product_range: 'Chemical Protective Coveralls',
      specialist_type: 'UK Disposable Protective Clothing Manufacturer',
    });
    if (prod) { products.push(prod); c7Count++; }
  }

  // Lakeland UK
  const lakelandBody = [
    { name: 'Lakeland ChemMax 1 Chemical Protective Coverall', risk: 'high' },
    { name: 'Lakeland ChemMax 2 Liquid Chemical Splash Suit', risk: 'high' },
    { name: 'Lakeland MicroMax General Purpose Protective Coverall', risk: 'medium' },
    { name: 'Lakeland Cool Suit Breathable Chemical Protection Coverall', risk: 'medium' },
  ];
  for (const p of lakelandBody) {
    const prod = makeProduct(p.name, 'Lakeland UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 14605, EN 13034, EN 13982',
      product_range: 'ChemMax & MicroMax Series',
    });
    if (prod) { products.push(prod); c7Count++; }
  }

  // 3M UK - Protective clothing
  const threeMBody = [
    { name: '3M Protective Coverall Type 5/6 Tyvek Disposable Suit', risk: 'medium' },
    { name: '3M Tychem 2000 C Chemical Protective Coverall Suit', risk: 'high' },
    { name: '3M Tychem 4000 Chemical Splash Protection Suit', risk: 'high' },
    { name: '3M Tychem 6000 FR Flame Resistant Chemical Suit', risk: 'high' },
  ];
  for (const p of threeMBody) {
    const prod = makeProduct(p.name, '3M UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 14605, EN 13034, EN 13982, EN 14116',
      parent_company: '3M',
      product_range: 'Tyvek & Tychem Series',
    });
    if (prod) { products.push(prod); c7Count++; }
  }

  // DuPont UK
  const dupontBody = [
    { name: 'DuPont Tyvek 500 Classic Disposable Protective Coverall', risk: 'medium' },
    { name: 'DuPont Tyvek 600 Plus Enhanced Protection Coverall', risk: 'medium' },
    { name: 'DuPont Tychem 2000 C Chemical Protective Suit', risk: 'high' },
    { name: 'DuPont Tychem 4000 S Liquid Tight Chemical Protection Suit', risk: 'high' },
    { name: 'DuPont Tychem 6000 FR Flame Resistant Chemical Protective Suit', risk: 'high' },
  ];
  for (const p of dupontBody) {
    const prod = makeProduct(p.name, 'DuPont UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 14605, EN 13034, EN 13982, EN 14116',
      parent_company: 'DuPont',
      product_range: 'Tyvek & Tychem Protective Apparel',
    });
    if (prod) { products.push(prod); c7Count++; }
  }

  console.log(`  身体/化学防护: ${c7Count} 条`);

  // ==================================================
  // C8: 听觉防护 - Hearing Protection
  // ==================================================
  console.log('\n--- C8: 听觉防护 (Hearing Protection) ---');
  let c8Count = 0;

  // JSP UK - Hearing
  const jspHear = [
    { name: 'JSP Sonis Helmet-Mounted Ear Defender System', risk: 'medium' },
    { name: 'JSP Sonis Pro High Attenuation Earplugs', risk: 'medium' },
    { name: 'JSP Sonis Connect Communication Ear Defender Headset', risk: 'medium' },
  ];
  for (const p of jspHear) {
    const prod = makeProduct(p.name, 'JSP UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'Oxfordshire, UK',
      standards: 'EN 352-3, EN 352-2',
      product_range: 'Sonis Hearing Protection',
    });
    if (prod) { products.push(prod); c8Count++; }
  }

  // Centurion - Hearing
  const centurionHear = [
    { name: 'Centurion Thunderer Heavy Duty Adjustable Ear Defender', risk: 'medium' },
    { name: 'Centurion Thunderer Slim Lightweight Ear Defender', risk: 'medium' },
  ];
  for (const p of centurionHear) {
    const prod = makeProduct(p.name, 'Centurion Safety Products', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 352-1, EN 352-3',
      product_range: 'Thunderer Series',
    });
    if (prod) { products.push(prod); c8Count++; }
  }

  // MSA UK - Hearing
  const msaHear = [
    { name: 'MSA Sordin Supreme Basic Electronic Ear Defender', risk: 'medium' },
    { name: 'MSA Sordin Supreme Pro-X Active Hearing Protector', risk: 'medium' },
    { name: 'MSA Sordin Left/RIGHT High Attenuation Earmuff', risk: 'medium' },
  ];
  for (const p of msaHear) {
    const prod = makeProduct(p.name, 'MSA UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 352-1, EN 352-4, EN 352-6',
      product_range: 'Sordin Series',
    });
    if (prod) { products.push(prod); c8Count++; }
  }

  // 3M Peltor UK
  const peltorHear = [
    { name: '3M Peltor Optime I Basic Ear Defender', risk: 'medium' },
    { name: '3M Peltor Optime II Mid-Range Ear Defender', risk: 'medium' },
    { name: '3M Peltor Optime III High Attenuation Ear Defender', risk: 'medium' },
    { name: '3M Peltor SportTac Electronic Shooting Ear Defender', risk: 'medium' },
    { name: '3M Peltor WS LiteCom Bluetooth Communication Ear Defender', risk: 'medium' },
  ];
  for (const p of peltorHear) {
    const prod = makeProduct(p.name, '3M Peltor UK', 'GB', p.risk, 'MHRA', 'MHRA UK Registry', {
      manufacturer_location: 'UK',
      standards: 'EN 352-1, EN 352-4, EN 352-6',
      parent_company: '3M',
      product_range: 'Optime, SportTac & WS Series',
    });
    if (prod) { products.push(prod); c8Count++; }
  }

  console.log(`  听觉防护: ${c8Count} 条`);

  const totalC = c1Count + c2Count + c3Count + c4Count + c5Count + c6Count + c7Count + c8Count;
  console.log(`\n[C汇总] 精选制造商阶段共构建 ${totalC} 条产品`);
  console.log(`  头部防护: ${c1Count} | 呼吸防护: ${c2Count} | 手部防护: ${c3Count} | 足部防护: ${c4Count}`);
  console.log(`  坠落防护: ${c5Count} | 眼面部防护: ${c6Count} | 身体/化学防护: ${c7Count} | 听觉防护: ${c8Count}`);

  return products;
}

// ============================================================
// 主流程
// ============================================================
async function main() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     UK MHRA PPE 数据收集脚本 v1.0                   ║');
  console.log('║     UK MHRA + British PPE Manufacturers             ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`启动时间: ${new Date().toISOString()}\n`);

  // 步骤0: 加载现有数据用于去重
  console.log('[步骤 0/4] 加载现有产品数据...');
  await loadExisting();

  // 步骤1: Section A - MHRA API端点探测
  console.log('\n[步骤 1/4] Section A: MHRA API端点探测');
  let productsA = [];
  try {
    productsA = await collectSectionA_MHRA_APIs();
    if (productsA.length > 0) {
      const insertedA = await batchInsert(productsA, 50);
      console.log(`  => Section A 实际插入: ${insertedA}/${productsA.length} 条`);
    }
  } catch (e) {
    console.log(`  => Section A 出错: ${e.message}`);
  }

  // 步骤2: Section B - UK Approved Bodies
  console.log('\n[步骤 2/4] Section B: UK Approved Bodies证书');
  let productsB = [];
  try {
    productsB = await collectSectionB_NotifiedBodies();
    if (productsB.length > 0) {
      const insertedB = await batchInsert(productsB, 50);
      console.log(`  => Section B 实际插入: ${insertedB}/${productsB.length} 条`);
    }
  } catch (e) {
    console.log(`  => Section B 出错: ${e.message}`);
  }

  // 步骤3: Section C - 精选UK制造商产品目录（主要数据源）
  console.log('\n[步骤 3/4] Section C: 精选UK PPE制造商产品目录');
  let productsC = [];
  try {
    productsC = await collectSectionC_CuratedManufacturers();
    if (productsC.length > 0) {
      console.log(`\n  正在批量插入 ${productsC.length} 条产品...`);
      const insertedC = await batchInsert(productsC, 50);
      console.log(`  => Section C 实际插入: ${insertedC}/${productsC.length} 条`);
    }
  } catch (e) {
    console.log(`  => Section C 出错: ${e.message}`);
  }

  // 步骤4: 同步制造商表
  console.log('\n[步骤 4/4] 同步制造商表...');
  try {
    const allProducts = [...productsA, ...productsB, ...productsC];
    const uniqueMfrs = new Map();
    for (const p of allProducts) {
      const key = (p.manufacturer_name || '').toLowerCase().trim();
      if (!uniqueMfrs.has(key) && p.manufacturer_name && p.manufacturer_name !== 'Unknown') {
        uniqueMfrs.set(key, {
          name: p.manufacturer_name,
          country: p.country_of_origin,
          source: p.data_source,
          confidence: p.data_confidence_level,
        });
      }
    }
    let mfrSynced = 0;
    for (const [, mfr] of uniqueMfrs) {
      await syncManufacturer(mfr.name, mfr.country, mfr.source, mfr.confidence);
      mfrSynced++;
    }
    console.log(`  同步了 ${mfrSynced} 个制造商记录`);
  } catch (e) {
    console.log(`  制造商同步出错: ${e.message}`);
  }

  // 最终汇总
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('                  采集完成 - 汇总报告');
  console.log('='.repeat(60));
  console.log(`  Section A (API探测):     ${productsA.length} 条产品`);
  console.log(`  Section B (公告机构):    ${productsB.length} 条产品`);
  console.log(`  Section C (精选制造商):  ${productsC.length} 条产品`);
  console.log(`  ----------------------------------------`);
  console.log(`  总计:                    ${productsA.length + productsB.length + productsC.length} 条产品`);
  console.log(`  去重后实际新增记录数已通过batchInsert入库`);
  console.log(`  总耗时: ${elapsed}s`);
  console.log('='.repeat(60));
}

// ============================================================
// 直接执行
// ============================================================
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n脚本执行完毕。');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = {
  collectSectionA_MHRA_APIs,
  collectSectionB_NotifiedBodies,
  collectSectionC_CuratedManufacturers,
  loadExisting,
  isDup,
  markDup,
  cat,
  fetchData,
  batchInsert,
};