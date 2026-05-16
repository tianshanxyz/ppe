#!/usr/bin/env node
/**
 * collect-fda-maude.js
 * 采集 FDA MAUDE（Manufacturer and User Facility Device Experience）不良事件数据
 * 通过 openFDA API 的 device/event 端点获取 PPE 相关的不良事件报告
 *
 * 数据源：https://api.fda.gov/device/event.json
 * 时间范围：2020-01-01 至 2025-12-31
 * 每页限制：100 条，最多 5000 条
 */

const { createClient } = require('@supabase/supabase-js');

// ==================== Supabase 连接 ====================
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

// ==================== 工具函数 ====================

/** 延迟函数 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 已存在的 key 集合（name|manufacturer_name|data_source） */
let existingKeys = new Set();

/**
 * 加载现有产品的去重 key
 * key 格式：name|manufacturer_name|data_source（各截取 200 字符并小写去空白）
 */
async function loadExisting() {
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key =
        `${(p.name || '').substring(0, 200).toLowerCase().trim()}|` +
        `${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|` +
        `${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });
    if (data.length < 1000) break;
    page++;
  }
  console.log(`已加载 ${existingKeys.size} 条现有记录`);
}

/** 检查是否已存在重复记录 */
function isDup(name, mfr, src) {
  const key =
    `${(name || '').substring(0, 200).toLowerCase().trim()}|` +
    `${(mfr || '').substring(0, 200).toLowerCase().trim()}|` +
    `${(src || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}

/** 标记记录已存在 */
function markDup(name, mfr, src) {
  const key =
    `${(name || '').substring(0, 200).toLowerCase().trim()}|` +
    `${(mfr || '').substring(0, 200).toLowerCase().trim()}|` +
    `${(src || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

/**
 * PPE 产品分类函数（与 restore-fast.js 保持一致）
 * 根据产品名称/描述进行分类
 */
function cat(n) {
  const s = (n || '').toLowerCase();
  if (/respirat|n95|kn95|ffp[123]|mask|breathing|scba|gas.?mask|air.?purif|papr|filter.*cartr|half.?mask|full.?face|supplied.?air|dust.?mask|particulate|smoke.?hood|escape.?hood|powered.*air|p100|p99|r95|kp95|kf94|kf95/i.test(s))
    return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|过滤式|送风式/i.test(n))
    return '呼吸防护装备';
  if (/glove|gauntlet|hand.?protect|fingercot|nitrile|latex|vinyl|cut.?resist|welding.*glove|chemical.*glove|examination.*glove|surgical.*glove|chainmail|anti.?vibration/i.test(s))
    return '手部防护装备';
  if (/手套|手部防护|防切割/i.test(n))
    return '手部防护装备';
  if (/goggle|eye.?protect|face.?shield|visor|safety.*glass|welding.*helmet|welding.*mask|auto.?dark|faceshield/i.test(s))
    return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|电焊|防飞溅/i.test(n))
    return '眼面部防护装备';
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat/i.test(s))
    return '头部防护装备';
  if (/安全帽|头盔|头部防护/i.test(n))
    return '头部防护装备';
  if (/safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|composite.*toe/i.test(s))
    return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋/i.test(n))
    return '足部防护装备';
  if (/earplug|ear.*muff|hearing.*protect|noise.*reduc|earmuff/i.test(s))
    return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪/i.test(n))
    return '听觉防护装备';
  if (/safety.*harness|lanyard|self.?retract|lifeline|fall.*arrest|fall.*protect|shock.*absorb|retractable|carabiner/i.test(s))
    return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线/i.test(n))
    return '坠落防护装备';
  if (/coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.*flash|isolation.*gown|surgical.*gown|protective.*gown|tyvek|tychem|nomex|fire.*suit|flame.*resist|fire.*resist|fire.*fight|turnout|aluminized|leather.*apron|overall|smock|jumpsuit|lab.*coat|knee.*pad/i.test(s))
    return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|阻燃|防静电|防电弧|防寒|围裙|护膝|连体服/i.test(n))
    return '身体防护装备';
  if (/hi.?vis|safety.*vest|reflective.*vest|high.?visibility|fluorescent|mesh.*vest/i.test(s))
    return '躯干防护装备';
  if (/反光衣|反光背心|安全背心|高可见|荧光服|警示服/i.test(n))
    return '躯干防护装备';
  return null;
}

/**
 * fetchJSON - 带重试逻辑的 HTTP GET 请求
 * 处理 429 限速、网络错误和超时
 */
async function fetchJSON(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MDLooker/2.0' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) {
        await sleep(5000);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      if (i === 2) return null;
      await sleep(2000);
    }
  }
  return null;
}

/**
 * batchInsert - 批量插入产品记录
 * 以 100 条为一批插入，失败时逐条重试
 */
async function batchInsert(products) {
  if (products.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < products.length; i += 100) {
    const batch = products.slice(i, i + 100);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (!error) {
      inserted += batch.length;
    } else {
      // 批量插入失败时逐条重试
      for (const p of batch) {
        const { error: e2 } = await supabase.from('ppe_products').insert(p);
        if (!e2) inserted++;
      }
    }
    await sleep(30);
  }
  return inserted;
}

// ==================== 配置常量 ====================

/** 数据源名称 */
const DATA_SOURCE = 'FDA MAUDE Database';

/** 注册机构 */
const REG_AUTHORITY = 'FDA';

/** 原产国 */
const COUNTRY_ORIGIN = 'US';

/** 数据可信度 */
const CONFIDENCE_LEVEL = 'high';

/** 今天的日期 */
const TODAY = new Date().toISOString().split('T')[0];

/** API 基础 URL */
const BASE_URL = 'https://api.fda.gov/device/event.json';

/** 时间范围（openFDA 格式：[YYYYMMDD+TO+YYYYMMDD]） */
const DATE_RANGE = '[20200101+TO+20251231]';

/** 每页条数 */
const LIMIT = 100;

/** 最大采集总数 */
const MAX_TOTAL = 5000;

/** API 请求间隔（毫秒），遵守 openFDA 限速 */
const REQUEST_DELAY = 700;

/**
 * PPE 相关的 FDA 产品代码
 * FXX  - 手套（通用）
 * FYA  - 外科手套
 * LYU  - 外科服装/手术衣
 * OUK  - 防护服
 * LMK  - 外科口罩
 * MSH  - 呼吸器
 * NZY  - 呼吸器
 * OTI  - 眼部防护
 */
const PRODUCT_CODES = ['FXX', 'FYA', 'LYU', 'OUK', 'LMK', 'MSH', 'NZY', 'OTI'];

/**
 * 品牌名称关键词
 * 用于在 device.brand_name 字段中搜索
 */
const BRAND_KEYWORDS = [
  'mask',
  'respirator',
  'glove',
  'gown',
  'shield',
  'protective',
  'PPE',
  'N95',
  'KN95',
];

// ==================== 风险等级判断 ====================

/**
 * 根据 MAUDE 事件中的患者问题判断风险等级
 * 如果涉及死亡或严重伤害 -> 'high'，否则 -> 'medium'
 */
function determineRiskLevel(event) {
  // 检查 event_type 是否为 death
  if (event.event_type && event.event_type.toLowerCase() === 'death') {
    return 'high';
  }

  // 检查患者问题列表
  const patients = event.patient || [];
  for (const patient of patients) {
    const raw = patient.patient_problems;
    const problems = Array.isArray(raw) ? raw.join(' ').toLowerCase() : (typeof raw === 'string' ? raw.toLowerCase() : '');
    // 死亡相关标记
    if (
      problems.includes('death') ||
      problems.includes('died') ||
      problems.includes('fatal') ||
      problems.includes('life threatening') ||
      problems.includes('cardiac arrest') ||
      problems.includes('respiratory failure') ||
      problems.includes('organ failure') ||
      problems.includes('sepsis') ||
      problems.includes('anaphylactic') ||
      problems.includes('permanent') ||
      problems.includes('disability') ||
      problems.includes('serious injury') ||
      problems.includes('severe')
    ) {
      return 'high';
    }
  }

  // 检查 event_type 中是否有严重标记
  if (event.event_type) {
    const et = event.event_type.toLowerCase();
    if (
      et.includes('serious') ||
      et.includes('injury') ||
      et.includes('malfunction')
    ) {
      return 'high';
    }
  }

  return 'medium';
}

// ==================== 事件解析 ====================

/**
 * 从 MAUDE 事件中提取产品信息
 * 每个事件可能包含多个 device 条目，每个 device 作为一个独立产品记录
 */
function extractProductsFromEvent(event) {
  const products = [];
  const devices = event.device || [];

  for (const device of devices) {
    // 提取品牌名称和通用名称
    const brandName = (device.brand_name || '').trim();
    const genericName = (device.generic_name || '').trim();
    const manufacturerName = (device.manufacturer_d_name || '').trim();
    const productCode = (device.device_report_product_code || '').trim();

    // 使用品牌名称，没有则用通用名称
    const name = brandName || genericName;
    if (!name) continue;

    // 分类
    const category = cat(name);
    if (!category) {
      // 尝试用 generic_name 再分类一次
      const cat2 = cat(genericName);
      if (!cat2) continue;
    }

    // 去重检查
    if (isDup(name, manufacturerName, DATA_SOURCE)) continue;
    markDup(name, manufacturerName, DATA_SOURCE);

    // 风险等级
    const riskLevel = determineRiskLevel(event);

    // 构建 specifications（存储 MAUDE 事件元数据）
    const specifications = {
      brand_name: brandName,
      generic_name: genericName,
      product_code: productCode,
      event_type: event.event_type || '',
      date_received: event.date_received || '',
      report_number: event.report_number || '',
      mdr_report_key: event.mdr_report_key || '',
      device_operator: device.device_operator || '',
      device_sequence_number: device.device_sequence_number || '',
    };

    // 尝试从 patient 中提取更多信息
    const patient0 = (event.patient || [])[0];
    if (patient0) {
      if (patient0.patient_problems) {
        specifications.patient_problems = patient0.patient_problems;
      }
      if (patient0.patient_sequence_number) {
        specifications.patient_sequence_number = patient0.patient_sequence_number;
      }
    }

    products.push({
      name: name.substring(0, 500),
      category: cat(name) || cat(genericName),
      manufacturer_name: (manufacturerName || 'Unknown').substring(0, 500),
      country_of_origin: COUNTRY_ORIGIN,
      risk_level: riskLevel,
      product_code: productCode.substring(0, 50),
      registration_number: event.report_number || '',
      registration_authority: REG_AUTHORITY,
      data_source: DATA_SOURCE,
      last_verified: TODAY,
      data_confidence_level: CONFIDENCE_LEVEL,
      specifications: JSON.stringify(specifications),
    });
  }

  return products;
}

// ==================== 按产品代码采集 ====================

/**
 * 按产品代码搜索 MAUDE 事件
 * 对每个 product_code 独立查询并分页
 */
async function collectByProductCode(code) {
  let codeTotal = 0;
  let skip = 0;

  while (skip < MAX_TOTAL) {
    // 构建 URL：按 product_code + 日期范围搜索
    const url =
      `${BASE_URL}?search=device.device_report_product_code:${code}` +
      `+AND+date_received:${DATE_RANGE}` +
      `&limit=${LIMIT}&skip=${skip}`;

    const data = await fetchJSON(url);
    if (!data || !data.results || data.results.length === 0) break;

    const batchProducts = [];
    for (const event of data.results) {
      const extracted = extractProductsFromEvent(event);
      batchProducts.push(...extracted);
    }

    if (batchProducts.length > 0) {
      const inserted = await batchInsert(batchProducts);
      codeTotal += inserted;
    }

    // 检查是否已到达最后一页
    if (data.results.length < LIMIT) break;

    skip += LIMIT;
    await sleep(REQUEST_DELAY);
  }

  return codeTotal;
}

// ==================== 按品牌名称关键词采集 ====================

/**
 * 按品牌名称关键词搜索 MAUDE 事件
 * 对每个关键词独立查询并分页
 */
async function collectByBrandKeyword(keyword) {
  let kwTotal = 0;
  let skip = 0;

  while (skip < MAX_TOTAL) {
    // 构建 URL：按 brand_name 包含关键词 + 日期范围搜索
    // openFDA 的精确匹配语法：device.brand_name:"keyword"
    const url =
      `${BASE_URL}?search=device.brand_name:"${keyword}"` +
      `+AND+date_received:${DATE_RANGE}` +
      `&limit=${LIMIT}&skip=${skip}`;

    const data = await fetchJSON(url);
    if (!data || !data.results || data.results.length === 0) break;

    const batchProducts = [];
    for (const event of data.results) {
      const extracted = extractProductsFromEvent(event);
      batchProducts.push(...extracted);
    }

    if (batchProducts.length > 0) {
      const inserted = await batchInsert(batchProducts);
      kwTotal += inserted;
    }

    // 检查是否已到达最后一页
    if (data.results.length < LIMIT) break;

    skip += LIMIT;
    await sleep(REQUEST_DELAY);
  }

  return kwTotal;
}

// ==================== 主流程 ====================

async function main() {
  console.log('========================================');
  console.log('  FDA MAUDE 不良事件数据采集');
  console.log(`  数据源: ${DATA_SOURCE}`);
  console.log(`  时间范围: 2020-01-01 至 2025-12-31`);
  console.log(`  每页限制: ${LIMIT} 条, 最大 ${MAX_TOTAL} 条`);
  console.log(`  开始时间: ${new Date().toISOString()}`);
  console.log('========================================\n');

  // 加载现有数据用于去重
  await loadExisting();

  const { count: before } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  console.log(`采集前记录数: ${before?.toLocaleString()}\n`);

  let grandTotal = 0;

  // ========== 阶段 1: 按产品代码采集 ==========
  console.log('-- 阶段 1: 按产品代码采集 MAUDE 事件 --');
  for (const code of PRODUCT_CODES) {
    console.log(`  正在采集产品代码: ${code} ...`);
    const count = await collectByProductCode(code);
    if (count > 0) {
      console.log(`    ${code}: 新增 ${count} 条`);
    } else {
      console.log(`    ${code}: 无新数据`);
    }
    grandTotal += count;
    // 每个产品代码之间额外延迟
    await sleep(500);
  }
  console.log(`  产品代码阶段小计: ${grandTotal}\n`);

  // ========== 阶段 2: 按品牌名称关键词采集 ==========
  console.log('-- 阶段 2: 按品牌名称关键词采集 MAUDE 事件 --');
  let kwPhaseTotal = 0;
  for (const kw of BRAND_KEYWORDS) {
    console.log(`  正在采集关键词: "${kw}" ...`);
    const count = await collectByBrandKeyword(kw);
    if (count > 0) {
      console.log(`    "${kw}": 新增 ${count} 条`);
    } else {
      console.log(`    "${kw}": 无新数据`);
    }
    kwPhaseTotal += count;
    grandTotal += count;
    // 每个关键词之间额外延迟
    await sleep(500);
  }
  console.log(`  品牌关键词阶段小计: ${kwPhaseTotal}\n`);

  // ========== 最终统计 ==========
  const { count: after } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });

  console.log('========================================');
  console.log('  采集完成');
  console.log(`  采集前: ${before?.toLocaleString()}`);
  console.log(`  采集后: ${after?.toLocaleString()}`);
  console.log(`  新增总计: ${grandTotal}`);
  console.log(`  完成时间: ${new Date().toISOString()}`);
  console.log('========================================');
}

// ==================== 直接执行 ====================
main().catch(e => {
  console.error('采集过程发生致命错误:', e);
  process.exit(1);
});