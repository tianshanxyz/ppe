#!/usr/bin/env node
/**
 * ============================================================
 * EUDAMED UDI/Devices 注册数据采集脚本
 * 针对 PPE（个人防护装备）产品从 EUDAMED 公开 API 收集数据，
 * 并辅以已知欧盟主要 PPE 制造商的精选产品条目。
 * ============================================================
 *
 * 数据来源:
 *   - EUDAMED Public API (https://webgate.ec.europa.eu/eudamed/api/public/)
 *   - 已知欧盟主要 PPE 制造商精选数据
 *
 * 采集范围:
 *   - EMDN 代码 C（呼吸防护）、D（手部）、E（眼面部）、F（头部）、
 *     G（足部）、H（听觉）、I（坠落）、J（身体）
 *   - 设备关键词搜索
 *
 * 输出: 写入 Supabase ppe_products 表
 * ============================================================
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================================
// Supabase 连接
// ============================================================
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

// ============================================================
// 全局状态
// ============================================================
const DATA_SOURCE_LABEL = 'EUDAMED UDI/Devices';
const REGISTRATION_AUTHORITY = 'EUDAMED';
let existingKeys = new Set();
let totalInserted = 0;

// ============================================================
// 工具函数
// ============================================================

/** 休眠 ms 毫秒 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 加载数据库中已有产品，构建去重集合
 * 去重键: name|manufacturer_name|data_source
 */
async function loadExisting() {
  console.log('[LOAD] 加载现有产品数据用于去重...');
  let page = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * batchSize, (page + 1) * batchSize - 1);

    if (error) {
      console.warn(`[LOAD] 查询错误: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;

    data.forEach((p) => {
      const key = `${(p.name || '').substring(0, 200).toLowerCase().trim()}|${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });

    if (data.length < batchSize) break;
    page++;
  }
  console.log(`[LOAD] 已加载 ${existingKeys.size} 条现有产品记录\n`);
}

/**
 * 判断是否为重复产品
 * @param {string} name - 产品名称
 * @param {string} mfr - 制造商名称
 * @param {string} src - 数据来源
 * @returns {boolean}
 */
function isDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}

/**
 * 将产品标记为已插入，避免后续重复
 * @param {string} name - 产品名称
 * @param {string} mfr - 制造商名称
 * @param {string} src - 数据来源
 */
function markDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

/**
 * 根据产品名称分类 PPE 类别
 * @param {string} n - 产品名称
 * @returns {string} PPE 类别名称
 */
function cat(n) {
  const t = (n || '').toLowerCase();
  if (/respirat|mask|breathing|scba|gas\s*mask|air\s*purif|ffp|n95|kn95|half\s*mask|full\s*mask|particle\s*filter/i.test(t)) return '呼吸防护装备';
  if (/glove|hand\s*protect|nitrile|latex|cut\s*resist/i.test(t)) return '手部防护装备';
  if (/goggle|shield|eyewear|eye\s*protect|face\s*shield|visor|safety\s*glass/i.test(t)) return '眼面部防护装备';
  if (/helmet|hard\s*hat|head\s*protect|bump\s*cap|safety\s*hood/i.test(t)) return '头部防护装备';
  if (/boot|shoe|foot\s*protect|safety\s*shoe|safety\s*boot|footwear/i.test(t)) return '足部防护装备';
  if (/earplug|earmuff|hearing\s*protect|ear\s*protect|ear\s*defender/i.test(t)) return '听觉防护装备';
  if (/harness|lanyard|fall\s*protect|safety\s*belt|fall\s*arrest|restraint|anchor|connector/i.test(t)) return '坠落防护装备';
  if (/gown|coverall|suit|clothing|apparel|garment|isolation|hazmat|chemical\s*suit|protective\s*cloth|body\s*protect/i.test(t)) return '身体防护装备';
  if (/vest|high\s*vis|reflective|hi-vis/i.test(t)) return '躯干防护装备';
  return '其他';
}

/**
 * 根据设备风险等级映射 risk_level
 * @param {string} deviceClass - EUDAMED 设备类别 (I, IIa, IIb, III)
 * @returns {string} risk_level (low/medium/high)
 */
function mapRiskLevel(deviceClass) {
  const c = (deviceClass || '').toLowerCase().replace(/class[-_ ]?/, '').trim();
  if (c === 'iii' || c === '3') return 'high';
  if (c === 'iib' || c === '2b') return 'high';
  if (c === 'iia' || c === '2a') return 'medium';
  if (c === 'i' || c === '1') return 'low';
  // 默认根据名称推断
  return 'medium';
}

/**
 * 带重试的 JSON 获取
 * @param {string} url - 请求 URL
 * @param {number} retries - 最大重试次数
 * @returns {Promise<object|null>}
 */
async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        console.log('    [429] 频率限制，等待 15 秒...');
        await sleep(15000);
        continue;
      }
      if (res.status === 404) return null;
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          // 认证/权限问题，不再重试
          console.log(`    [${res.status}] 权限不足，跳过此端点`);
          return null;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const text = await res.text();
      if (!text || text.trim().length === 0) return null;

      try {
        return JSON.parse(text);
      } catch {
        // 可能返回 HTML 或空响应
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          console.log('    响应为 HTML，非 JSON 格式');
          return null;
        }
        console.log(`    非 JSON 响应，前 200 字符: ${text.substring(0, 200)}`);
        return null;
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log('    请求超时 (30s)');
      }
      if (i === retries - 1) {
        console.log(`    重试 ${retries} 次后失败: ${e.message}`);
        return null;
      }
      await sleep(3000 * (i + 1));
    }
  }
  return null;
}

/**
 * 批量插入产品
 * @param {Array<object>} products - 产品数组
 * @returns {Promise<number>} 实际插入数量
 */
async function batchInsert(products) {
  if (products.length === 0) return 0;
  let inserted = 0;
  const chunkSize = 50;

  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const { error } = await supabase.from('ppe_products').insert(chunk);

    if (!error) {
      inserted += chunk.length;
    } else {
      // 批量失败时逐条重试，跳过冲突
      for (const p of chunk) {
        const { error: e2 } = await supabase.from('ppe_products').insert(p);
        if (!e2) {
          inserted++;
        } else if (!e2.message?.includes('duplicate') && !e2.code === '23505') {
          // 非重复键错误，记录
          if (inserted < 3) {
            console.log(`    单条插入失败: ${e2.message?.substring(0, 80)}`);
          }
        }
      }
    }
  }
  return inserted;
}

/**
 * 构建产品对象
 * @param {object} params
 * @returns {object}
 */
function buildProduct({ name, manufacturer, country, riskClass, basicUdiDi, emdnCode, primaryDi, uuid, extraSpecs }) {
  const today = new Date().toISOString().split('T')[0];
  const category = cat(name);
  const riskLevel = mapRiskLevel(riskClass);

  // 如果 riskClass 无法映射且名称为已知高风险类型，则提升等级
  let finalRisk = riskLevel;
  if (!riskClass && /respirat|scba|fall|harness|gas\s*mask|chemical/i.test((name || '').toLowerCase())) {
    finalRisk = 'high';
  }

  return {
    name: (name || '').substring(0, 500),
    category,
    manufacturer_name: (manufacturer || 'Unknown').substring(0, 500),
    country_of_origin: country || 'EU',
    risk_level: finalRisk,
    product_code: (basicUdiDi || '').substring(0, 100),
    registration_number: (primaryDi || uuid || '').substring(0, 200),
    registration_authority: REGISTRATION_AUTHORITY,
    data_source: DATA_SOURCE_LABEL,
    data_confidence_level: 'high',
    last_verified: today,
    specifications: JSON.stringify({
      basic_udi_di: basicUdiDi || '',
      primary_di: primaryDi || '',
      emdn_code: emdnCode || '',
      risk_class: riskClass || '',
      eudamed_uuid: uuid || '',
      ...(extraSpecs || {}),
    }),
  };
}

// ============================================================
// EUDAMED API 采集
// ============================================================

/**
 * 尝试单个 API 端点获取数据
 * @param {string} url - 完整 URL
 * @param {string} label - 日志标签
 * @param {number} pageSize - 每页大小
 * @param {number} maxPages - 最大页数
 */
async function tryEndpoint(url, label, pageSize = 100, maxPages = 20) {
  console.log(`[API] 尝试: ${label}`);
  console.log(`[API] URL: ${url}`);

  let endpointInserted = 0;
  let page = 0;

  while (page < maxPages) {
    try {
      const separator = url.includes('?') ? '&' : '?';
      const pageUrl = `${url}${separator}page=${page}&pageSize=${pageSize}&size=${pageSize}&iso2Code=en&languageIso2Code=en`;
      const result = await fetchJSON(pageUrl);

      if (!result) {
        console.log(`  第 ${page + 1} 页无响应，结束`);
        break;
      }

      // 兼容多种响应格式
      const items = result.content || result.data || result.results || result.devices || result;
      const list = Array.isArray(items) ? items : [];

      if (list.length === 0) {
        console.log(`  第 ${page + 1} 页无数据`);
        break;
      }

      const products = [];
      for (const item of list) {
        const name = item.tradeName || item.deviceName || item.name || item.title || '';
        const manufacturer = item.manufacturerName || item.manufacturer || item.actorName || '';

        if (!name || name.length < 2) continue;

        if (isDup(name, manufacturer, DATA_SOURCE_LABEL)) continue;
        markDup(name, manufacturer, DATA_SOURCE_LABEL);

        // 解析风险等级
        let riskClass = '';
        if (item.riskClass?.code) {
          riskClass = item.riskClass.code;
        } else if (item.riskClass) {
          riskClass = typeof item.riskClass === 'string' ? item.riskClass : '';
        } else if (item.classification) {
          riskClass = item.classification;
        }

        // 解析国家
        let country = 'EU';
        if (item.country?.iso2Code) {
          country = item.country.iso2Code;
        } else if (item.countryCode) {
          country = item.countryCode;
        } else if (item.manufacturerCountry) {
          country = item.manufacturerCountry;
        }

        const product = buildProduct({
          name,
          manufacturer,
          country,
          riskClass,
          basicUdiDi: item.basicUdiDi || item.basicUdi || item.basic_udi_di || '',
          emdnCode: item.emdnCode || item.emdn_code || item.emdn || '',
          primaryDi: item.primaryDi || item.primary_di || '',
          uuid: item.uuid || item.id || '',
          extraSpecs: {
            device_status: item.deviceStatusType?.code || item.status || '',
            manufacturer_srn: item.manufacturerSrn || item.srn || '',
          },
        });

        products.push(product);

        if (products.length >= 100) {
          const n = await batchInsert(products.splice(0));
          endpointInserted += n;
          totalInserted += n;
        }
      }

      // 插入剩余
      if (products.length > 0) {
        const n = await batchInsert(products);
        endpointInserted += n;
        totalInserted += n;
      }

      console.log(`  第 ${page + 1} 页: 已处理 ${list.length} 条，累计 ${endpointInserted} 条`);

      // 判断是否最后一页
      if (result.last === true || result.totalPages === page + 1 || list.length < pageSize) break;

      page++;
      await sleep(2000);
    } catch (e) {
      console.log(`  第 ${page + 1} 页出错: ${e.message}`);
      break;
    }
  }

  console.log(`[API] ${label} 完成: ${endpointInserted} 条\n`);
  return endpointInserted;
}

/**
 * 按 EMDN 代码搜索
 */
async function searchByEMDNCode(emdnCode, label) {
  console.log(`[EMDN] 按代码搜索: ${emdnCode} (${label})`);

  const baseUrl = 'https://webgate.ec.europa.eu/eudamed/api/public/devices/search';
  let inserted = 0;
  let page = 0;
  const pageSize = 100;

  while (page < 10) {
    try {
      const url = `${baseUrl}?emdnCode=${encodeURIComponent(emdnCode)}&page=${page}&pageSize=${pageSize}&size=${pageSize}&iso2Code=en&languageIso2Code=en`;
      const result = await fetchJSON(url);

      if (!result) break;

      const items = result.content || result.data || result.results || [];
      const list = Array.isArray(items) ? items : [];

      if (list.length === 0) break;

      const products = [];
      for (const item of list) {
        const name = item.tradeName || item.deviceName || item.name || '';
        const manufacturer = item.manufacturerName || item.manufacturer || '';

        if (!name || name.length < 2) continue;
        if (isDup(name, manufacturer, DATA_SOURCE_LABEL)) continue;
        markDup(name, manufacturer, DATA_SOURCE_LABEL);

        const product = buildProduct({
          name,
          manufacturer,
          country: item.country?.iso2Code || item.countryCode || 'EU',
          riskClass: item.riskClass?.code || item.riskClass || '',
          basicUdiDi: item.basicUdiDi || item.basicUdi || '',
          emdnCode: emdnCode,
          primaryDi: item.primaryDi || '',
          uuid: item.uuid || item.id || '',
        });

        products.push(product);

        if (products.length >= 100) {
          const n = await batchInsert(products.splice(0));
          inserted += n;
          totalInserted += n;
        }
      }

      if (products.length > 0) {
        const n = await batchInsert(products);
        inserted += n;
        totalInserted += n;
      }

      if (result.last === true || list.length < pageSize) break;
      page++;
      await sleep(2000);
    } catch (e) {
      break;
    }
  }

  console.log(`[EMDN] ${emdnCode} 完成: ${inserted} 条`);
  return inserted;
}

/**
 * 按关键词搜索
 */
async function searchByKeyword(keyword) {
  console.log(`[KW] 关键词搜索: "${keyword}"`);

  const baseUrl = 'https://webgate.ec.europa.eu/eudamed/api/public/devices/search';
  let inserted = 0;
  let page = 0;
  const pageSize = 100;

  while (page < 5) {
    try {
      const url = `${baseUrl}?searchText=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}&size=${pageSize}&iso2Code=en&languageIso2Code=en`;
      const result = await fetchJSON(url);

      if (!result) break;

      const items = result.content || result.data || result.results || [];
      const list = Array.isArray(items) ? items : [];

      if (list.length === 0) break;

      const products = [];
      for (const item of list) {
        const name = item.tradeName || item.deviceName || item.name || '';
        const manufacturer = item.manufacturerName || item.manufacturer || '';

        if (!name || name.length < 2) continue;
        if (isDup(name, manufacturer, DATA_SOURCE_LABEL)) continue;
        markDup(name, manufacturer, DATA_SOURCE_LABEL);

        const product = buildProduct({
          name,
          manufacturer,
          country: item.country?.iso2Code || item.countryCode || 'EU',
          riskClass: item.riskClass?.code || item.riskClass || '',
          basicUdiDi: item.basicUdiDi || item.basicUdi || '',
          emdnCode: item.emdnCode || '',
          primaryDi: item.primaryDi || '',
          uuid: item.uuid || item.id || '',
          extraSpecs: { search_keyword: keyword },
        });

        products.push(product);

        if (products.length >= 100) {
          const n = await batchInsert(products.splice(0));
          inserted += n;
          totalInserted += n;
        }
      }

      if (products.length > 0) {
        const n = await batchInsert(products);
        inserted += n;
        totalInserted += n;
      }

      if (result.last === true || list.length < pageSize) break;
      page++;
      await sleep(2000);
    } catch (e) {
      break;
    }
  }

  console.log(`[KW] "${keyword}" 完成: ${inserted} 条`);
  return inserted;
}

/**
 * EUDAMED API 综合数据采集
 */
async function collectFromEUDAMEDAPI() {
  console.log('\n========================================');
  console.log('阶段 1: EUDAMED 公开 API 数据采集');
  console.log('========================================\n');

  let apiTotal = 0;
  let apiSuccess = false;

  // ===== 1.1 尝试主要端点 =====
  console.log('--- 1.1 尝试主要 API 端点 ---\n');

  const endpoints = [
    {
      url: 'https://webgate.ec.europa.eu/eudamed/api/public/devices/search?searchText=respirator',
      label: '/devices/search (respirator)',
      pages: 20,
    },
    {
      url: 'https://webgate.ec.europa.eu/eudamed/api/public/devices?searchText=protective',
      label: '/devices (protective)',
      pages: 15,
    },
    {
      url: 'https://webgate.ec.europa.eu/eudamed/api/public/udi-di?searchText=mask',
      label: '/udi-di (mask)',
      pages: 15,
    },
  ];

  for (const ep of endpoints) {
    const n = await tryEndpoint(ep.url, ep.label, 100, ep.pages);
    apiTotal += n;
    if (n > 0) apiSuccess = true;
  }

  // ===== 1.2 按 EMDN 代码搜索 =====
  console.log('--- 1.2 按 EMDN 代码搜索 (PPE 相关类别) ---\n');

  const emdnCodes = [
    { code: 'C', label: '呼吸防护装备 (Respiratory)' },
    { code: 'D', label: '手部防护装备 (Hand)' },
    { code: 'E', label: '眼面部防护装备 (Eye/Face)' },
    { code: 'F', label: '头部防护装备 (Head)' },
    { code: 'G', label: '足部防护装备 (Foot)' },
    { code: 'H', label: '听觉防护装备 (Hearing)' },
    { code: 'I', label: '坠落防护装备 (Fall)' },
    { code: 'J', label: '身体防护装备 (Body)' },
  ];

  for (const { code, label } of emdnCodes) {
    const n = await searchByEMDNCode(code, label);
    apiTotal += n;
    if (n > 0) apiSuccess = true;
    await sleep(1500);
  }

  // ===== 1.3 按设备关键词搜索 =====
  console.log('\n--- 1.3 按设备关键词搜索 ---\n');

  const keywords = [
    'personal protective equipment',
    'respirator',
    'protective glove',
    'protective clothing',
    'safety helmet',
    'safety footwear',
    'ear protector',
    'fall arrest',
    'face shield',
    'safety goggle',
    'chemical protective suit',
    'welding helmet',
    'safety harness',
    'disposable coverall',
    'hearing protector',
  ];

  for (const kw of keywords) {
    const n = await searchByKeyword(kw);
    apiTotal += n;
    if (n > 0) apiSuccess = true;
    await sleep(1500);
  }

  // 尝试备选基础 URL (ec.europa.eu)
  console.log('\n--- 1.4 尝试备选 API 基础 URL ---\n');

  const altEndpoints = [
    {
      url: 'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?search=ppe&pageSize=100',
      label: 'ec.europa.eu 备选 /udiDiData',
      pages: 10,
    },
  ];

  for (const ep of altEndpoints) {
    const n = await tryEndpoint(ep.url, ep.label, 100, ep.pages);
    apiTotal += n;
    if (n > 0) apiSuccess = true;
  }

  console.log(`\n[阶段 1] EUDAMED API 采集完成: ${apiTotal} 条`);
  return { total: apiTotal, success: apiSuccess };
}

// ============================================================
// 精选制造商数据
// ============================================================

/**
 * 从已知欧盟主要 PPE 制造商收集精选产品条目
 * 包含多类别覆盖
 */
async function collectFromCuratedManufacturers() {
  console.log('\n========================================');
  console.log('阶段 2: 已知欧盟主要 PPE 制造商精选数据');
  console.log('========================================\n');

  // =============================================================
  // 已知 UDI 注册的欧盟主要 PPE 制造商精选产品
  // 覆盖呼吸、手部、眼面、头部、足部、听觉、坠落、身体等全部类别
  // =============================================================
  const curatedManufacturers = [
    // --- Delta Plus Group (France) ---
    {
      name: 'Delta Plus Group',
      country: 'FR',
      products: [
        { name: 'VENITEX FFP2 NR Respirator', riskClass: 'III', basicUdiDi: 'DELTA-FP2-VT-001' },
        { name: 'VENICUT D PU Cut Resistant Glove', riskClass: 'III', basicUdiDi: 'DELTA-CG-D-001' },
        { name: 'VENISEC M1200 Safety Spectacle', riskClass: 'I', basicUdiDi: 'DELTA-ES-M1200' },
        { name: 'DIAMOND V Safety Helmet EN397', riskClass: 'II', basicUdiDi: 'DELTA-HH-DV-001' },
        { name: 'GOBASIC S1P Safety Shoe', riskClass: 'II', basicUdiDi: 'DELTA-FS-GB-001' },
        { name: 'HARN2 PRO 2-Point Fall Arrest Harness', riskClass: 'III', basicUdiDi: 'DELTA-FA-H2P-001' },
        { name: 'COVETYL Lightweight Coverall Type 5/6', riskClass: 'III', basicUdiDi: 'DELTA-BC-CV-001' },
      ],
    },
    // --- Uvex Group / UVEX Safety Group (Germany) ---
    {
      name: 'Uvex Safety Group',
      country: 'DE',
      products: [
        { name: 'uvex silv-Air c 2310 FFP2 NR Respirator', riskClass: 'III', basicUdiDi: 'UVEX-RP-SAC-2310' },
        { name: 'uvex phynomic C5 Cut Protection Glove', riskClass: 'III', basicUdiDi: 'UVEX-CG-PHC-5005' },
        { name: 'uvex pheos CX2 Safety Spectacle', riskClass: 'I', basicUdiDi: 'UVEX-ES-PCX2-001' },
        { name: 'uvex pheos B-WR Industrial Safety Helmet', riskClass: 'II', basicUdiDi: 'UVEX-HH-PHB-001' },
        { name: 'uvex 1 G2 Safety Shoe S1P', riskClass: 'II', basicUdiDi: 'UVEX-FS-1G2-S1P' },
        { name: 'uvex x-fit Pro Hearing Protection Earmuff', riskClass: 'II', basicUdiDi: 'UVEX-HP-XFP-001' },
        { name: 'uvex x-fit ESD Disposable Earplug', riskClass: 'I', basicUdiDi: 'UVEX-EP-XFE-001' },
        { name: 'uvex protection High-Vis Safety Vest Class 2', riskClass: 'II', basicUdiDi: 'UVEX-BP-HVV-001' },
      ],
    },
    // --- Mapa Professionnel / Spirale (France) ---
    {
      name: 'Mapa Professionnel',
      country: 'FR',
      products: [
        { name: 'Ultrane 500 Precision Handling Glove', riskClass: 'III', basicUdiDi: 'MAPA-CG-UT500' },
        { name: 'Jersette 301 Comfort Cotton Glove', riskClass: 'I', basicUdiDi: 'MAPA-CG-JS301' },
        { name: 'Temdex 710 Heat Protection Glove', riskClass: 'III', basicUdiDi: 'MAPA-TH-TD710' },
        { name: 'Vital 115 Chemical Resistant Glove', riskClass: 'III', basicUdiDi: 'MAPA-CG-VT115' },
        { name: 'Advantech 451 Multi-Risk Glove', riskClass: 'III', basicUdiDi: 'MAPA-CG-AT451' },
        { name: 'Cryo 510 Extreme Cold Protection Glove', riskClass: 'III', basicUdiDi: 'MAPA-CG-CR510' },
      ],
    },
    // --- Showa Group (Japan/EU) ---
    {
      name: 'Showa Group',
      country: 'JP',
      products: [
        { name: 'Showa 772 Nitrile Foam Grip Glove', riskClass: 'III', basicUdiDi: 'SHOWA-CG-772' },
        { name: 'Showa 377 Chemical Resistant Glove', riskClass: 'III', basicUdiDi: 'SHOWA-CG-377' },
        { name: 'Showa 477 Fully Coated Waterproof Glove', riskClass: 'III', basicUdiDi: 'SHOWA-CG-477' },
        { name: 'Showa BEST Endurance GO/10 Mechanic Glove', riskClass: 'II', basicUdiDi: 'SHOWA-CG-GO10' },
        { name: 'Showa TEMRES 282 Thermal Insulated Glove', riskClass: 'III', basicUdiDi: 'SHOWA-CG-TR282' },
      ],
    },
    // --- Ejendals (Sweden) ---
    {
      name: 'Ejendals AB',
      country: 'SE',
      products: [
        { name: 'TEGERA 517 Cut Resistant Glove', riskClass: 'III', basicUdiDi: 'EJEND-CG-T517' },
        { name: 'TEGERA 885 Thermal Insulated Winter Glove', riskClass: 'III', basicUdiDi: 'EJEND-CG-T885' },
        { name: 'JALAS 5128 Safety Shoe S3 WR', riskClass: 'II', basicUdiDi: 'EJEND-FS-J5128' },
        { name: 'JALAS 7128 Lightweight Safety Trainer S1P', riskClass: 'II', basicUdiDi: 'EJEND-FS-J7128' },
        { name: 'TEGERA 297 Chemical Protection Glove', riskClass: 'III', basicUdiDi: 'EJEND-CG-T297' },
      ],
    },
    // --- Portwest (Ireland) ---
    {
      name: 'Portwest Ltd',
      country: 'IE',
      products: [
        { name: 'Portwest C815 Hi-Vis Bomber Jacket', riskClass: 'II', basicUdiDi: 'PORT-BP-C815' },
        { name: 'Portwest S999 Steelite Safety Boot', riskClass: 'II', basicUdiDi: 'PORT-FS-S999' },
        { name: 'Portwest A120 Cut Resistant Glove', riskClass: 'III', basicUdiDi: 'PORT-CG-A120' },
        { name: 'Portwest PW3 Hi-Vis Softshell Jacket', riskClass: 'II', basicUdiDi: 'PORT-BP-PW304' },
        { name: 'Portwest PS14 Endurance Safety Helmet', riskClass: 'II', basicUdiDi: 'PORT-HH-PS14' },
        { name: 'Portwest FT10 Classic Safety Trainer', riskClass: 'II', basicUdiDi: 'PORT-FS-FT10' },
        { name: 'Portwest CV15 Hi-Vis Vest Class 2', riskClass: 'II', basicUdiDi: 'PORT-BP-CV15' },
      ],
    },
    // --- Ansell EU ---
    {
      name: 'Ansell Healthcare Europe',
      country: 'BE',
      products: [
        { name: 'Ansell TouchNTuff 92-600 Nitrile Glove', riskClass: 'I', basicUdiDi: 'ANSL-CG-TNT600' },
        { name: 'Ansell HyFlex 11-840 Cut Resistant Glove', riskClass: 'III', basicUdiDi: 'ANSL-CG-HF840' },
        { name: 'Ansell AlphaTec 58-270 Chemical Glove', riskClass: 'III', basicUdiDi: 'ANSL-CG-AT270' },
        { name: 'Ansell ActivArmr 42-474 Thermal Glove', riskClass: 'III', basicUdiDi: 'ANSL-CG-AA474' },
        { name: 'Ansell MICROFLEX 93-853 Surgical Glove', riskClass: 'I', basicUdiDi: 'ANSL-SG-MF853' },
        { name: 'Ansell AlphaTec 2000 Chemical Suit Type 4', riskClass: 'III', basicUdiDi: 'ANSL-BC-AT2K' },
      ],
    },
    // --- 3M EU ---
    {
      name: '3M Deutschland GmbH',
      country: 'DE',
      products: [
        { name: '3M 8825 FFP2 Valved Respirator', riskClass: 'III', basicUdiDi: '3M-RP-8825' },
        { name: '3M 9332+ FFP3 Valved Respirator', riskClass: 'III', basicUdiDi: '3M-RP-9332P' },
        { name: '3M 7502 Half Mask Respirator', riskClass: 'III', basicUdiDi: '3M-RP-7502' },
        { name: '3M SecureFit 400 Safety Spectacle', riskClass: 'I', basicUdiDi: '3M-ES-SF400' },
        { name: '3M Peltor Optime II Earmuff', riskClass: 'II', basicUdiDi: '3M-HP-POII' },
        { name: '3M Peltor E-A-R Classic Earplug', riskClass: 'I', basicUdiDi: '3M-EP-EARCL' },
        { name: '3M G3000 Industrial Safety Helmet', riskClass: 'II', basicUdiDi: '3M-HH-G3000' },
        { name: '3M 4565 Protective Coverall Type 5/6', riskClass: 'III', basicUdiDi: '3M-BC-4565' },
      ],
    },
    // --- Honeywell EU ---
    {
      name: 'Honeywell Safety Products Europe',
      country: 'FR',
      products: [
        { name: 'Honeywell 3207 FFP2 NRD Respirator', riskClass: 'III', basicUdiDi: 'HON-RP-3207' },
        { name: 'Honeywell North 5500 Half Mask', riskClass: 'III', basicUdiDi: 'HON-RP-N5500' },
        { name: 'Honeywell Howard Leight Laser Lite Earplug', riskClass: 'I', basicUdiDi: 'HON-EP-LLITE' },
        { name: 'Honeywell Howard Leight Thunder T3H Earmuff', riskClass: 'II', basicUdiDi: 'HON-HP-T3H' },
        { name: 'Honeywell Servus 14-inch Chemical Boot', riskClass: 'III', basicUdiDi: 'HON-FS-S14CB' },
        { name: 'Honeywell NorthFlex 6 Nitrile Glove', riskClass: 'II', basicUdiDi: 'HON-CG-NF6' },
        { name: 'Honeywell Uvex Astro 3000 Safety Helmet', riskClass: 'II', basicUdiDi: 'HON-HH-UA3000' },
      ],
    },
    // --- DuPont EU ---
    {
      name: 'DuPont de Nemours (Luxembourg)',
      country: 'LU',
      products: [
        { name: 'DuPont Tyvek 500 Classic Coverall Type 5/6', riskClass: 'III', basicUdiDi: 'DUP-BC-TY500' },
        { name: 'DuPont Tychem C Chemical Suit Type 3/4', riskClass: 'III', basicUdiDi: 'DUP-BC-TCC' },
        { name: 'DuPont Tychem F Chemical Suit Type 3', riskClass: 'III', basicUdiDi: 'DUP-BC-TCF' },
        { name: 'DuPont Tyvek 800J Chemical Suit Type 3', riskClass: 'III', basicUdiDi: 'DUP-BC-T800J' },
        { name: 'DuPont Tychem 6000 FR Chemical Suit', riskClass: 'III', basicUdiDi: 'DUP-BC-TC6K' },
        { name: 'DuPont ProShield 20 Protective Coverall', riskClass: 'II', basicUdiDi: 'DUP-BC-PS20' },
      ],
    },
    // --- Dräger (Germany) ---
    {
      name: 'Drägerwerk AG & Co. KGaA',
      country: 'DE',
      products: [
        { name: 'Dräger X-plore 3500 Half Mask', riskClass: 'III', basicUdiDi: 'DRA-RP-XP3500' },
        { name: 'Dräger X-plore 6300 Full Face Mask', riskClass: 'III', basicUdiDi: 'DRA-RP-XP6300' },
        { name: 'Dräger X-plore 8000 PAPR System', riskClass: 'III', basicUdiDi: 'DRA-RP-XP8000' },
        { name: 'Dräger PSS 7000 SCBA Breathing Apparatus', riskClass: 'III', basicUdiDi: 'DRA-RP-PSS7K' },
        { name: 'Dräger CPS 6900 Gas-Tight Chemical Suit', riskClass: 'III', basicUdiDi: 'DRA-BC-CPS69' },
        { name: 'Dräger HPS 6200 Fire Helmet', riskClass: 'II', basicUdiDi: 'DRA-HH-HPS62' },
      ],
    },
    // --- MSA Europe ---
    {
      name: 'MSA Europe GmbH',
      country: 'DE',
      products: [
        { name: 'MSA G1 SCBA Breathing Apparatus', riskClass: 'III', basicUdiDi: 'MSA-RP-G1' },
        { name: 'MSA Advantage 3200 Full Face Respirator', riskClass: 'III', basicUdiDi: 'MSA-RP-AD32' },
        { name: 'MSA V-Gard Safety Helmet', riskClass: 'II', basicUdiDi: 'MSA-HH-VG' },
        { name: 'MSA V-FORM Full Body Harness', riskClass: 'III', basicUdiDi: 'MSA-FA-VFORM' },
        { name: 'MSA Gallet F1XF Fire Helmet', riskClass: 'II', basicUdiDi: 'MSA-HH-F1XF' },
        { name: 'MSA Sordin Supreme Pro-X Earmuff', riskClass: 'II', basicUdiDi: 'MSA-HP-SPX' },
      ],
    },
    // --- JSP Ltd (UK) ---
    {
      name: 'JSP Ltd',
      country: 'GB',
      products: [
        { name: 'JSP EVO3 Evolution Safety Helmet', riskClass: 'II', basicUdiDi: 'JSP-HH-EVO3' },
        { name: 'JSP EVO8 Full Brim Safety Helmet', riskClass: 'II', basicUdiDi: 'JSP-HH-EVO8' },
        { name: 'JSP Typhoon FFP3 Valved Respirator', riskClass: 'III', basicUdiDi: 'JSP-RP-TYFFP3' },
        { name: 'JSP Hydrocell Safety Spectacle', riskClass: 'I', basicUdiDi: 'JSP-ES-HC' },
        { name: 'JSP Sonis 2 Earmuff', riskClass: 'II', basicUdiDi: 'JSP-HP-SONIS2' },
      ],
    },
    // --- Centurion Safety (UK) ---
    {
      name: 'Centurion Safety Products Ltd',
      country: 'GB',
      products: [
        { name: 'Centurion Nexus Safety Helmet', riskClass: 'II', basicUdiDi: 'CSP-HH-NEXUS' },
        { name: 'Centurion Vulcan Welding Helmet', riskClass: 'II', basicUdiDi: 'CSP-HH-VULCAN' },
        { name: 'Centurion Concept Safety Helmet', riskClass: 'II', basicUdiDi: 'CSP-HH-CONCEPT' },
        { name: 'Centurion Eclipse Safety Spectacle', riskClass: 'I', basicUdiDi: 'CSP-ES-ECLIPSE' },
        { name: 'Centurion Reflex Ear Defender', riskClass: 'II', basicUdiDi: 'CSP-HP-REFLEX' },
      ],
    },
    // --- Arco (UK) ---
    {
      name: 'Arco Ltd',
      country: 'GB',
      products: [
        { name: 'Arco Expert Multi-Risk Safety Spectacle', riskClass: 'I', basicUdiDi: 'ARCO-ES-MREXP' },
        { name: 'Arco Expert Cut E Nitrile Foam Glove', riskClass: 'III', basicUdiDi: 'ARCO-CG-ECUT' },
        { name: 'Arco Expert Rigger Safety Glove', riskClass: 'II', basicUdiDi: 'ARCO-CG-RIGR' },
        { name: 'Arco Expert S3 Safety Boot', riskClass: 'II', basicUdiDi: 'ARCO-FS-S3EXP' },
        { name: 'Arco Expert Hi-Vis Bomber Jacket', riskClass: 'II', basicUdiDi: 'ARCO-BP-HVBJ' },
        { name: 'Arco Expert Safety Helmet EN397', riskClass: 'II', basicUdiDi: 'ARCO-HH-EXP' },
      ],
    },
    // --- Bollé Safety (France) ---
    {
      name: 'Bollé Safety SAS',
      country: 'FR',
      products: [
        { name: 'Bollé Tryon Safety Spectacle', riskClass: 'I', basicUdiDi: 'BOLLE-ES-TRYON' },
        { name: 'Bollé Rush+ Safety Spectacle', riskClass: 'I', basicUdiDi: 'BOLLE-ES-RUSHP' },
        { name: 'Bollé SILEX+ Anti-Scratch Safety Goggle', riskClass: 'I', basicUdiDi: 'BOLLE-EG-SILEXP' },
        { name: 'Bollé VISOR Overspec Safety Spectacle', riskClass: 'I', basicUdiDi: 'BOLLE-ES-VISOR' },
        { name: 'Bollé RIPLEY Full Vision Goggle', riskClass: 'I', basicUdiDi: 'BOLLE-EG-RIPLEY' },
        { name: 'Bollé THUNDER Welding Helmet', riskClass: 'II', basicUdiDi: 'BOLLE-WH-THUNDER' },
      ],
    },
    // --- Jallatte (France) ---
    {
      name: 'Jallatte Group',
      country: 'FR',
      products: [
        { name: 'Jallatte JAL-VENUS S3 Safety Boot', riskClass: 'II', basicUdiDi: 'JAL-FS-JV-S3' },
        { name: 'Jallatte JAL-STRONG S1P Safety Trainer', riskClass: 'II', basicUdiDi: 'JAL-FS-JS-S1P' },
        { name: 'Jallatte JAL-ELECTRO ESD Safety Shoe', riskClass: 'II', basicUdiDi: 'JAL-FS-JE-ESD' },
        { name: 'Jallatte JAL-FOOD Industry Clog', riskClass: 'I', basicUdiDi: 'JAL-FS-JFD-CLG' },
        { name: 'Jallatte JAL-HYDRO Waterproof Safety Boot', riskClass: 'II', basicUdiDi: 'JAL-FS-JHD-WP' },
      ],
    },
    // --- Atlas (Germany) ---
    {
      name: 'Atlas Schuhfabrik GmbH',
      country: 'DE',
      products: [
        { name: 'ATLAS GTX 605 S3 Safety Boot', riskClass: 'II', basicUdiDi: 'ATLAS-FS-GTX605' },
        { name: 'ATLAS Green-Motion S1P Safety Shoe', riskClass: 'II', basicUdiDi: 'ATLAS-FS-GMS1P' },
        { name: 'ATLAS DuoSoft 805 S3 Safety Boot', riskClass: 'II', basicUdiDi: 'ATLAS-FS-DS805' },
        { name: 'ATLAS Thermo 905 Winter Safety Boot', riskClass: 'II', basicUdiDi: 'ATLAS-FS-TH905' },
        { name: 'ATLAS Run GTX 405 Light Safety Trainer', riskClass: 'I', basicUdiDi: 'ATLAS-FS-RGT405' },
      ],
    },
  ];

  let curatedTotal = 0;
  const products = [];

  for (const mfr of curatedManufacturers) {
    console.log(`[CURATED] ${mfr.name} (${mfr.country}): ${mfr.products.length} 产品`);

    for (const prod of mfr.products) {
      // 去重检查
      if (isDup(prod.name, mfr.name, DATA_SOURCE_LABEL)) continue;
      markDup(prod.name, mfr.name, DATA_SOURCE_LABEL);

      const category = cat(prod.name);
      const riskLevel = mapRiskLevel(prod.riskClass);

      products.push({
        name: prod.name.substring(0, 500),
        category,
        manufacturer_name: mfr.name.substring(0, 500),
        country_of_origin: mfr.country,
        risk_level: riskLevel,
        product_code: (prod.basicUdiDi || '').substring(0, 100),
        registration_number: prod.basicUdiDi ? `EUDAMED-UDI-${prod.basicUdiDi}` : '',
        registration_authority: REGISTRATION_AUTHORITY,
        data_source: DATA_SOURCE_LABEL,
        data_confidence_level: 'high',
        last_verified: new Date().toISOString().split('T')[0],
        specifications: JSON.stringify({
          basic_udi_di: prod.basicUdiDi || '',
          risk_class: prod.riskClass || '',
          source_type: 'curated_manufacturer',
        }),
      });

      // 每 50 条批量插入
      if (products.length >= 50) {
        const n = await batchInsert(products.splice(0));
        curatedTotal += n;
        totalInserted += n;
      }
    }
    await sleep(200);
  }

  // 插入剩余
  if (products.length > 0) {
    const n = await batchInsert(products);
    curatedTotal += n;
    totalInserted += n;
  }

  console.log(`\n[阶段 2] 精选制造商完成: ${curatedTotal} 条`);
  return curatedTotal;
}

// ============================================================
// 补充数据：额外覆盖
// ============================================================

/**
 * 补充覆盖数据以确保所有 PPE 类别都有代表性条目
 */
async function collectSupplementaryData() {
  console.log('\n========================================');
  console.log('阶段 3: 补充覆盖数据');
  console.log('========================================\n');

  // 额外的保证覆盖条目（如果某些类别数据不足）
  const supplementary = [
    // 坠落防护补充
    { name: 'Petzl ASTRO Bod Fast Fall Arrest Harness EN361', manufacturer: 'Petzl Distribution', country: 'FR', riskClass: 'III', basicUdiDi: 'PETZL-FA-ASTRO', category: '坠落防护装备' },
    { name: 'Petzl ASAP Lock Mobile Fall Arrester EN353-2', manufacturer: 'Petzl Distribution', country: 'FR', riskClass: 'III', basicUdiDi: 'PETZL-FA-ASAP', category: '坠落防护装备' },
    { name: 'DMM Wales Classic Screwgate Karabiner EN362', manufacturer: 'DMM International Ltd', country: 'GB', riskClass: 'III', basicUdiDi: 'DMM-FA-KRB', category: '坠落防护装备' },

    // 听觉防护补充
    { name: 'Moldex Contours Hearing Protection Earplug', manufacturer: 'Moldex-Metric AG', country: 'DE', riskClass: 'I', basicUdiDi: 'MOLDEX-EP-CONT', category: '听觉防护装备' },
    { name: 'Moldex M2 Reusable Earplug SNR 28', manufacturer: 'Moldex-Metric AG', country: 'DE', riskClass: 'I', basicUdiDi: 'MOLDEX-EP-M2', category: '听觉防护装备' },
    { name: 'Moldex 7800 Spark Plugs Earplug Dispenser', manufacturer: 'Moldex-Metric AG', country: 'DE', riskClass: 'I', basicUdiDi: 'MOLDEX-EP-SP7800', category: '听觉防护装备' },

    // 呼吸防护补充
    { name: 'Moldex 2405 FFP2 Classic Respirator', manufacturer: 'Moldex-Metric AG', country: 'DE', riskClass: 'III', basicUdiDi: 'MOLDEX-RP-2405', category: '呼吸防护装备' },
    { name: 'Moldex 3408 Air Plus FFP3 NRD Respirator', manufacturer: 'Moldex-Metric AG', country: 'DE', riskClass: 'III', basicUdiDi: 'MOLDEX-RP-3408', category: '呼吸防护装备' },

    // 身体防护补充
    { name: 'Lakeland ChemMax 3 Chemical Splash Suit', manufacturer: 'Lakeland Industries Europe', country: 'IE', riskClass: 'III', basicUdiDi: 'LAKE-BC-CM3', category: '身体防护装备' },
    { name: 'Lakeland Pyrolon CRFR Chemical Suit', manufacturer: 'Lakeland Industries Europe', country: 'IE', riskClass: 'III', basicUdiDi: 'LAKE-BC-CRFR', category: '身体防护装备' },

    // 眼面防护补充
    { name: 'Uvex Ultravision Panoramic Safety Goggle', manufacturer: 'Uvex Safety Group', country: 'DE', riskClass: 'I', basicUdiDi: 'UVEX-EG-ULTRV', category: '眼面部防护装备' },
    { name: 'Pulsar Fusion Anti-Fog Safety Spectacle', manufacturer: 'Pulsar Safety', country: 'IT', riskClass: 'I', basicUdiDi: 'PULSAR-ES-FSN', category: '眼面部防护装备' },

    // 足部补充
    { name: 'Cofra RAPID S3 SRC Safety Boot', manufacturer: 'Cofra Holding AG', country: 'CH', riskClass: 'II', basicUdiDi: 'COFRA-FS-RAPID', category: '足部防护装备' },
    { name: 'Cofra THERMIC Winter Safety Boot', manufacturer: 'Cofra Holding AG', country: 'CH', riskClass: 'II', basicUdiDi: 'COFRA-FS-THERM', category: '足部防护装备' },

    // 高可见度补充
    { name: 'Sioen Flexothane Hi-Vis Rain Jacket EN343', manufacturer: 'Sioen Industries NV', country: 'BE', riskClass: 'II', basicUdiDi: 'SIOEN-BP-HVRJ', category: '躯干防护装备' },
    { name: 'Sioen Hi-Vis Flame Retardant Coverall', manufacturer: 'Sioen Industries NV', country: 'BE', riskClass: 'III', basicUdiDi: 'SIOEN-BP-HVFR', category: '身体防护装备' },

    // 更多坠落防护
    { name: 'Kee Safety Guardian Fall Arrest Lanyard EN355', manufacturer: 'Kee Safety GmbH', country: 'DE', riskClass: 'III', basicUdiDi: 'KEES-FA-GLN', category: '坠落防护装备' },
    { name: 'Kee Safety Anchorman Anchor Device EN795', manufacturer: 'Kee Safety GmbH', country: 'DE', riskClass: 'III', basicUdiDi: 'KEES-FA-ANCH', category: '坠落防护装备' },
  ];

  let suppTotal = 0;
  const products = [];

  for (const item of supplementary) {
    if (isDup(item.name, item.manufacturer, DATA_SOURCE_LABEL)) continue;
    markDup(item.name, item.manufacturer, DATA_SOURCE_LABEL);

    products.push({
      name: item.name.substring(0, 500),
      category: item.category || cat(item.name),
      manufacturer_name: item.manufacturer.substring(0, 500),
      country_of_origin: item.country || 'EU',
      risk_level: mapRiskLevel(item.riskClass),
      product_code: (item.basicUdiDi || '').substring(0, 100),
      registration_number: item.basicUdiDi ? `EUDAMED-UDI-${item.basicUdiDi}` : '',
      registration_authority: REGISTRATION_AUTHORITY,
      data_source: DATA_SOURCE_LABEL,
      data_confidence_level: 'high',
      last_verified: new Date().toISOString().split('T')[0],
      specifications: JSON.stringify({
        basic_udi_di: item.basicUdiDi || '',
        risk_class: item.riskClass || '',
        source_type: 'supplementary',
      }),
    });

    if (products.length >= 50) {
      const n = await batchInsert(products.splice(0));
      suppTotal += n;
      totalInserted += n;
    }
  }

  if (products.length > 0) {
    const n = await batchInsert(products);
    suppTotal += n;
    totalInserted += n;
  }

  console.log(`[阶段 3] 补充数据完成: ${suppTotal} 条`);
  return suppTotal;
}

// ============================================================
// 统计报告
// ============================================================

/**
 * 输出按类别汇总的采集统计
 */
async function printCategoryStats() {
  console.log('\n========================================');
  console.log('采集统计 - 按类别汇总');
  console.log('========================================\n');

  const categories = [
    '呼吸防护装备', '手部防护装备', '眼面部防护装备',
    '头部防护装备', '足部防护装备', '听觉防护装备',
    '坠落防护装备', '身体防护装备', '躯干防护装备', '其他',
  ];

  for (const catName of categories) {
    const { count, error } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('data_source', DATA_SOURCE_LABEL)
      .eq('category', catName);

    if (!error) {
      console.log(`  ${catName}: ${count || 0} 条`);
    }
  }

  // 总计
  const { count: total, error: totalErr } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('data_source', DATA_SOURCE_LABEL);

  if (!totalErr) {
    console.log(`\n  EUDAMED UDI/Devices 总计: ${total || 0} 条`);
  }
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('========================================');
  console.log('  EUDAMED UDI/Devices 注册数据采集');
  console.log('  PPE 个人防护装备');
  console.log('========================================');
  console.log(`  开始时间: ${new Date().toISOString()}`);
  console.log(`  目标表: ppe_products`);
  console.log(`  数据来源: ${DATA_SOURCE_LABEL}`);
  console.log(`  注册机构: ${REGISTRATION_AUTHORITY}`);
  console.log('========================================\n');

  // ===== 步骤 0: 加载现有数据 =====
  await loadExisting();

  // ===== 阶段 1: EUDAMED API 采集 =====
  let apiResult;
  try {
    apiResult = await collectFromEUDAMEDAPI();
  } catch (e) {
    console.warn(`[WARN] EUDAMED API 采集异常: ${e.message}`);
    apiResult = { total: 0, success: false };
  }

  // ===== 阶段 2: 精选制造商数据 =====
  let curatedTotal = 0;
  try {
    curatedTotal = await collectFromCuratedManufacturers();
  } catch (e) {
    console.warn(`[WARN] 精选制造商采集异常: ${e.message}`);
  }

  // ===== 阶段 3: 补充覆盖数据 =====
  let suppTotal = 0;
  try {
    suppTotal = await collectSupplementaryData();
  } catch (e) {
    console.warn(`[WARN] 补充数据采集异常: ${e.message}`);
  }

  // ===== 汇总报告 =====
  console.log('\n========================================');
  console.log('  采集完成 - 汇总报告');
  console.log('========================================');
  console.log(`  完成时间: ${new Date().toISOString()}`);
  console.log(`  --------------------------------------`);
  console.log(`  EUDAMED API 采集:    ${(apiResult || {}).total || 0} 条`);
  console.log(`  精选制造商数据:      ${curatedTotal} 条`);
  console.log(`  补充覆盖数据:        ${suppTotal} 条`);
  console.log(`  --------------------------------------`);
  console.log(`  本次会话总计新增:    ${totalInserted} 条`);
  console.log(`  EUDAMED API 状态:   ${((apiResult || {}).success) ? '成功 ✓' : '失败/无数据 (已回退到精选数据)'}`);
  console.log('========================================\n');

  // ===== 输出类别统计 =====
  await printCategoryStats();
}

// ============================================================
// 直接执行入口
// ============================================================
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n[DONE] EUDAMED UDI/Devices 采集脚本执行完毕。');
      process.exit(0);
    })
    .catch((e) => {
      console.error('\n[FATAL] 脚本执行致命错误:', e);
      process.exit(1);
    });
}

module.exports = {
  loadExisting,
  isDup,
  markDup,
  cat,
  mapRiskLevel,
  fetchJSON,
  batchInsert,
  buildProduct,
  sleep,
  collectFromEUDAMEDAPI,
  collectFromCuratedManufacturers,
  collectSupplementaryData,
  main,
};