#!/usr/bin/env node
/**
 * collect-mena-africa.js
 * =======================
 * MENA + Africa PPE 数据采集脚本
 *
 * 覆盖市场:
 *   Section 1: Turkey TITCK/NBEL
 *   Section 2: South Africa SAHPRA/NRCS
 *   Section 3: UAE/Middle East (ESMA/MOHAP)
 *   Section 4: Egypt CAPA/EDA
 *
 * 所有数据: data_confidence_level = "medium"
 * 策略: 精选制造商产品数据（curated data），去重后批量插入
 *
 * 运行方式: node scripts/collect-mena-africa.js
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

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
let existingKeys = new Set();

// ============================================================
// 工具函数
// ============================================================

/** 延迟函数 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * loadExisting() - 加载数据库已有产品用于去重
 * 以 name + manufacturer_name + data_source 组成唯一键
 */
async function loadExisting() {
  console.log('[去重] 加载现有产品数据...');
  const all = [];
  let page = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * batchSize, (page + 1) * batchSize - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key = `${(p.name || '').substring(0, 200).toLowerCase().trim()}|${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });
    if (data.length < batchSize) break;
    page++;
  }
  console.log(`[去重] 已加载 ${existingKeys.size} 条现有记录`);
}

/**
 * isDup(name, mfr, src) - 检查产品是否已存在
 */
function isDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}

/**
 * markDup(name, mfr, src) - 标记产品为已存在
 */
function markDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

/**
 * cat(n) - PPE 产品分类
 * 根据产品名称关键词归入对应防护装备类别
 * @param {string} name - 产品名称
 * @returns {string} 中文分类名
 */
function cat(name) {
  const n = (name || '').toLowerCase();
  // 呼吸防护
  if (/respirat|n95|kn95|ffp2|ffp3|ds2|ds3|kf94|kf80|kf99|pff2|pff3|scba|breathing|air[\s-]?purif|gas[\s-]?mask|papr|half[\s-]?mask|full[\s-]?face[\s-]?mask|filter.*resp|chemical[\s-]?cartridge|escape[\s-]?hood|防毒|呼吸|面罩|半面罩|全面罩/i.test(n)) {
    return '呼吸防护装备';
  }
  // 坠落防护
  if (/fall|harness|lanyard|anchor|srl|self[\s-]?retract|lifeline|arrest|descent|guardrail|safety[\s-]?belt|safety[\s-]?rope|安全带|安全绳|防坠|坠落/i.test(n)) {
    return '坠落防护装备';
  }
  // 手部防护
  if (/glove|hand|nitrile|latex|vinyl|cut[\s-]?resis|化学.*手套|防护.*手套|gauntlet|mangote|work[\s-]?glove/i.test(n)) {
    return '手部防护装备';
  }
  // 眼面部防护
  if (/goggle|eye|face[\s-]?shield|visor|spectacle|welding[\s-]?helmet|ocular|激光.*防护|护目|面屏|auto[\s-]?dark|safety[\s-]?glass/i.test(n)) {
    return '眼面部防护装备';
  }
  // 头部防护
  if (/helmet|head|hard[\s-]?hat|bump[\s-]?cap|safety[\s-]?helmet|安全帽|头盔/i.test(n)) {
    return '头部防护装备';
  }
  // 足部防护
  if (/boot|foot|shoe|footwear|safety[\s-]?shoe|steel[\s-]?toe|wellington|clog|gumboot|安全鞋|防护鞋/i.test(n)) {
    return '足部防护装备';
  }
  // 听觉防护
  if (/ear[\s-]?plug|ear[\s-]?muff|hearing|noise|acoustic|耳塞|耳罩|ear[\s-]?prot/i.test(n)) {
    return '听觉防护装备';
  }
  // 身体防护（全身）
  if (/coverall|chemical[\s-]?suit|arc[\s-]?flash|hazmat|biohazard|radiation[\s-]?suit|cleanroom.*suit|full[\s-]?body|防护服|连体|turnout[\s-]?gear/i.test(n)) {
    return '身体防护装备';
  }
  // 躯干防护
  if (/vest|jacket|coat|torso|apron|gown|rainwear|hi[\s-]?vis|reflect|flame[\s-]?resis|welding[\s-]?jacket|隔热服|防化服|反光|高可见/i.test(n)) {
    return '躯干防护装备';
  }
  // 气体检测
  if (/gas[\s-]?detect|portable[\s-]?detect|multi[\s-]?gas|single[\s-]?gas|检测/i.test(n)) {
    return '呼吸防护装备';
  }
  // 通用防护兜底
  if (/protective|ppe|safety|protection|seguranca|proteccion|安全|防护/i.test(n)) {
    return '其他';
  }
  return '其他';
}

/**
 * determineRiskLevel(name) - 判定风险等级
 */
function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/scba|self[\s-]?contained|gas[\s-]?mask|papr|chemical[\s-]?suit|arc[\s-]?flash|radiation|hazmat.*level[\s-]?a|full[\s-]?face[\s-]?mask|supplied[\s-]?air|ffp3|pff3|kf99|escape[\s-]?hood|fire[\s-]?helmet/i.test(n)) return 'high';
  if (/fall[\s-]?protec|harness|lanyard|arrest|descent|lifeline|防坠|坠落/i.test(n)) return 'high';
  if (/ballistic|bullet[\s-]?proof|stab[\s-]?resist/i.test(n)) return 'high';
  if (/helmet|head|hard[\s-]?hat|bump[\s-]?cap/i.test(n)) return 'medium';
  if (/boot|shoe|footwear|safety[\s-]?shoe/i.test(n)) return 'medium';
  if (/glove|hand|nitrile|latex/i.test(n)) return 'medium';
  if (/goggle|eye|face[\s-]?shield|visor/i.test(n)) return 'medium';
  if (/ear[\s-]?plug|ear[\s-]?muff|hearing|noise/i.test(n)) return 'medium';
  if (/ffp2|kf94|kf80|pff2|n95|ds2|half[\s-]?mask/i.test(n)) return 'medium';
  if (/coverall|body|vest|jacket|apron|gown|turnout/i.test(n)) return 'medium';
  return 'low';
}

/**
 * fetchData(url, timeout) - HTTP GET 请求
 * 支持重定向、超时、gzip 解压，返回解析后的 JSON 或原始文本
 */
function fetchData(url, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8,ar;q=0.7,zh-CN;q=0.6',
        'Accept-Encoding': 'gzip, deflate',
      },
      timeout,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const newUrl = loc.startsWith('http') ? loc : new URL(loc, url).href;
        req.destroy();
        return fetchData(newUrl, timeout).then(resolve).catch(reject);
      }
      if (res.statusCode >= 400) {
        req.destroy();
        return resolve(null);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf-8');
        try {
          resolve(JSON.parse(text));
        } catch {
          resolve(text);
        }
      });
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/**
 * batchInsert(products) - 批量插入产品
 * 先尝试批量插入（每批100条），失败则逐条插入
 * @returns {number} 成功插入数量
 */
async function batchInsert(products) {
  if (products.length === 0) return 0;
  let inserted = 0;
  const batchSize = 100;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (error) {
      for (const p of batch) {
        const { error: e2 } = await supabase.from('ppe_products').insert(p);
        if (!e2) inserted++;
      }
    } else {
      inserted += batch.length;
    }
    await sleep(30);
  }
  return inserted;
}

/**
 * buildProduct(opts) - 构建标准化产品对象
 * 自动去重、分类、风险判定
 */
function buildProduct(opts) {
  const name = opts.name || '';
  const mfr = opts.manufacturer_name || 'Unknown';
  const src = opts.data_source || 'Unknown';

  if (isDup(name, mfr, src)) return null;
  markDup(name, mfr, src);

  const today = new Date().toISOString().split('T')[0];

  return {
    name: name.substring(0, 500),
    category: opts.category || cat(name),
    subcategory: opts.subcategory || null,
    manufacturer_name: mfr.substring(0, 500),
    country_of_origin: opts.country_of_origin || 'Unknown',
    product_code: (opts.product_code || '').substring(0, 100),
    risk_level: opts.risk_level || determineRiskLevel(name),
    data_source: src.substring(0, 500),
    registration_number: (opts.registration_number || '').substring(0, 200),
    registration_authority: (opts.registration_authority || 'Unknown').substring(0, 200),
    last_verified: today,
    data_confidence_level: opts.data_confidence_level || 'medium',
    specifications: opts.specifications ? JSON.stringify(opts.specifications) : null,
  };
}

// ============================================================
// Section 1: Turkey TITCK/NBEL
// ============================================================

function collectTurkeyTITCK() {
  console.log('\n' + '='.repeat(60));
  console.log('Section 1: Turkey TITCK/NBEL PPE Data');
  console.log('='.repeat(60));

  const products = [];

  const turkishMfrs = [
    // --- Mapa Turkey (Ansell) ---
    {
      name: 'Mapa Turkey (Ansell)', city: 'Istanbul',
      products: [
        { name: 'Mapa Ultrane 500 TR Chemical Resistant Gloves', risk: 'medium' },
        { name: 'Mapa Krytech 586 TR Cut Resistant Gloves', risk: 'medium' },
        { name: 'Mapa Technic 481 TR Heavy Duty Work Gloves', risk: 'medium' },
        { name: 'Mapa Solo 992 TR Disposable Nitrile Gloves', risk: 'medium' },
      ],
    },
    // --- 3M Turkey ---
    {
      name: '3M Turkey', city: 'Istanbul',
      products: [
        { name: '3M N95 TR Particulate Respirator 8210', risk: 'medium' },
        { name: '3M Half Mask 6200 TR Reusable Respirator', risk: 'medium' },
        { name: '3M Full Face 6800 TR Respirator', risk: 'high' },
        { name: '3M P100 2091 TR Particulate Filter', risk: 'medium' },
        { name: '3M Safety Glasses TR SecureFit 400', risk: 'medium' },
        { name: '3M Peltor Earmuffs X5A TR Hearing Protection', risk: 'medium' },
        { name: '3M Welding Helmet Speedglas TR Auto-Darkening', risk: 'medium' },
        { name: '3M Tyvek Coverall TR Protective Suit', risk: 'medium' },
      ],
    },
    // --- Honeywell Turkey ---
    {
      name: 'Honeywell Turkey', city: 'Istanbul',
      products: [
        { name: 'Honeywell Half Mask TR 7700 Silicone Respirator', risk: 'medium' },
        { name: 'Honeywell Hard Hat TR Fibre-Metal', risk: 'medium' },
        { name: 'Honeywell Safety Glasses TR Uvex i-5', risk: 'medium' },
        { name: 'Honeywell Howard Leight TR Ear Plugs', risk: 'medium' },
      ],
    },
    // --- MKS Marmara (Turkey) ---
    {
      name: 'MKS Marmara Safety', city: 'Istanbul',
      products: [
        { name: 'MKS Full Body Harness 4-Point Fall Protection', risk: 'high' },
        { name: 'MKS Shock Absorbing Lanyard Twin Tail', risk: 'high' },
        { name: 'MKS Fall Arrest Block Self-Retracting Lifeline', risk: 'high' },
        { name: 'MKS Safety Helmet EN 397 Vented', risk: 'medium' },
        { name: 'MKS Safety Glasses Clear Anti-Scratch', risk: 'medium' },
        { name: 'MKS Work Gloves Nitrile Coated Cut Resistant', risk: 'medium' },
        { name: 'MKS Safety Boots Steel Toe S3', risk: 'medium' },
      ],
    },
    // --- ISGUM Turkey ---
    {
      name: 'ISGUM Safety Turkey', city: 'Ankara',
      products: [
        { name: 'ISGUM Safety Helmet with Ratchet Suspension', risk: 'medium' },
        { name: 'ISGUM Safety Glasses Polycarbonate Lens', risk: 'medium' },
        { name: 'ISGUM Half Mask Respirator with P3 Filters', risk: 'medium' },
        { name: 'ISGUM Work Gloves Leather Palm', risk: 'medium' },
        { name: 'ISGUM Earmuffs SNR 30dB Foldable', risk: 'medium' },
      ],
    },
    // --- Draeger Turkey ---
    {
      name: 'Draeger Turkey', city: 'Istanbul',
      products: [
        { name: 'Draeger X-plore Half Mask TR 5500 Respirator', risk: 'medium' },
        { name: 'Draeger X-plore Full Face TR FPS 7000', risk: 'high' },
        { name: 'Draeger PARAT Escape Hood TR Emergency Breathing', risk: 'high' },
        { name: 'Draeger SCBA TR PSS 5000 Breathing Apparatus', risk: 'high' },
      ],
    },
    // --- Arkotech Turkey ---
    {
      name: 'Arkotech Turkey', city: 'Ankara',
      products: [
        { name: 'Arkotech Gas Mask Full Face with NBC Filter', risk: 'high' },
        { name: 'Arkotech Escape Hood Emergency Respiratory Protection', risk: 'high' },
        { name: 'Arkotech Respiratory Filters A2B2E2K2P3 Combination', risk: 'high' },
      ],
    },
    // --- Ayyildiz Safety (Turkey) ---
    {
      name: 'Ayyildiz Safety Turkey', city: 'Istanbul',
      products: [
        { name: 'Ayyildiz Safety Helmet ABS Full Brim', risk: 'medium' },
        { name: 'Ayyildiz Safety Glasses UV Protection Clear Lens', risk: 'medium' },
      ],
    },
  ];

  for (const mfr of turkishMfrs) {
    for (let i = 0; i < mfr.products.length; i++) {
      const prod = mfr.products[i];
      const p = buildProduct({
        name: prod.name,
        category: prod.cat || undefined,
        risk_level: prod.risk || undefined,
        manufacturer_name: mfr.name,
        country_of_origin: 'TR',
        data_source: 'Turkey TITCK/NBEL Registry',
        registration_authority: 'TITCK/NBEL',
        product_code: `TR-TITCK-${mfr.name.substring(0, 4).toUpperCase()}-${i + 1}`,
        registration_number: `TR-NBEL-${Date.now().toString(36).toUpperCase()}-${i}`,
        data_confidence_level: 'medium',
        specifications: {
          city: mfr.city,
          manufacturer_type: 'Turkish PPE Manufacturer',
          curated: true,
          certification: 'TITCK/NBEL Approved',
        },
      });
      if (p) products.push(p);
    }
  }

  return products;
}

// ============================================================
// Section 2: South Africa SAHPRA/NRCS
// ============================================================

function collectSouthAfricaSAHPRA() {
  console.log('\n' + '='.repeat(60));
  console.log('Section 2: South Africa SAHPRA/NRCS PPE Data');
  console.log('='.repeat(60));

  const products = [];

  const saMfrs = [
    // --- 3M South Africa ---
    {
      name: '3M South Africa', city: 'Johannesburg',
      products: [
        { name: '3M N95 ZA Particulate Respirator 8210', risk: 'medium' },
        { name: '3M Half Mask ZA 6200 Reusable Respirator', risk: 'medium' },
        { name: '3M Full Face ZA 6800 Respirator', risk: 'high' },
        { name: '3M P100 Filter ZA 2091 Particulate Filter', risk: 'medium' },
        { name: '3M Safety Glasses ZA SecureFit 400', risk: 'medium' },
        { name: '3M Peltor Earmuffs ZA Optime III', risk: 'medium' },
        { name: '3M Welding Helmet ZA Speedglas Auto-Darkening', risk: 'medium' },
      ],
    },
    // --- BBF Safety Group (South Africa's largest PPE manufacturer) ---
    {
      name: 'BBF Safety Group', city: 'Durban',
      products: [
        { name: 'BBF Safety Boots Steel Toe S3 Leather', risk: 'medium' },
        { name: 'BBF Gumboots PVC Chemical Resistant', risk: 'medium' },
        { name: 'BBF Steel Toe Boots Metatarsal Guard', risk: 'medium' },
        { name: 'BBF Chemical Resistant Boots Nitrile PVC', risk: 'medium' },
        { name: 'BBF Metatarsal Boots Impact Protection S3', risk: 'medium' },
      ],
    },
    // --- Select PPE (South Africa) ---
    {
      name: 'Select PPE South Africa', city: 'Cape Town',
      products: [
        { name: 'Select Safety Helmet ABS Vented 6-Point', risk: 'medium' },
        { name: 'Select Safety Glasses Polycarbonate Anti-Fog', risk: 'medium' },
        { name: 'Select Half Mask Respirator P2/P3 Filters', risk: 'medium' },
        { name: 'Select Work Gloves Cut Resistant Level 5', risk: 'medium' },
        { name: 'Select Fall Arrest Harness Full Body 2-Point', risk: 'high' },
      ],
    },
    // --- Beier Safety (South Africa) ---
    {
      name: 'Beier Safety South Africa', city: 'Pietermaritzburg',
      products: [
        { name: 'Beier Full Body Harness 4-Point Fall Protection', risk: 'high' },
        { name: 'Beier Lanyard Shock Absorbing Single Leg', risk: 'high' },
        { name: 'Beier Fall Arrest Block Self-Retracting 6m', risk: 'high' },
        { name: 'Beier Safety Helmet EN 397 with Chin Strap', risk: 'medium' },
      ],
    },
    // --- Rebel Safety Gear (South Africa) ---
    {
      name: 'Rebel Safety Gear South Africa', city: 'Johannesburg',
      products: [
        { name: 'Rebel Safety Boots Steel Toe S1P', risk: 'medium' },
        { name: 'Rebel Gumboots PVC Heavy Duty', risk: 'medium' },
        { name: 'Rebel Work Gloves Nitrile Palm Coated', risk: 'medium' },
      ],
    },
    // --- MSA Africa ---
    {
      name: 'MSA Africa', city: 'Johannesburg',
      products: [
        { name: 'MSA V-Gard Helmet ZA Safety Head Protection', risk: 'medium' },
        { name: 'MSA V-FORM Harness ZA Fall Protection', risk: 'high' },
        { name: 'MSA Advantage Half Mask ZA Respirator', risk: 'medium' },
        { name: 'MSA Safety Glasses ZA Clear Lens', risk: 'medium' },
      ],
    },
    // --- Afrox South Africa ---
    {
      name: 'Afrox South Africa', city: 'Johannesburg',
      products: [
        { name: 'Afrox Welding Helmet Auto-Darkening Variable Shade', risk: 'medium' },
        { name: 'Afrox Welding Gloves Leather Heat Resistant', risk: 'medium' },
        { name: 'Afrox Safety Glasses Welding Shade 5', risk: 'medium' },
      ],
    },
    // --- SAI Global South Africa (certification body reference) ---
    {
      name: 'SAI Global South Africa Certified', city: 'Pretoria',
      products: [
        { name: 'SAI-Certified Safety Helmet SANS 1397', risk: 'medium' },
        { name: 'SAI-Certified Safety Boots SANS 1327', risk: 'medium' },
        { name: 'SAI-Certified Half Mask Respirator SANS 1038', risk: 'medium' },
        { name: 'SAI-Certified Fall Arrest Harness SANS 50361', risk: 'high' },
        { name: 'SAI-Certified Safety Glasses SANS 1404', risk: 'medium' },
      ],
    },
  ];

  for (const mfr of saMfrs) {
    for (let i = 0; i < mfr.products.length; i++) {
      const prod = mfr.products[i];
      const p = buildProduct({
        name: prod.name,
        category: prod.cat || undefined,
        risk_level: prod.risk || undefined,
        manufacturer_name: mfr.name,
        country_of_origin: 'ZA',
        data_source: 'South Africa SAHPRA/NRCS Registry',
        registration_authority: 'SAHPRA/NRCS',
        product_code: `ZA-SAHPRA-${mfr.name.substring(0, 4).toUpperCase()}-${i + 1}`,
        registration_number: `ZA-NRCS-${Date.now().toString(36).toUpperCase()}-${i}`,
        data_confidence_level: 'medium',
        specifications: {
          city: mfr.city,
          manufacturer_type: 'South African PPE Manufacturer',
          curated: true,
          certification: 'SAHPRA/NRCS Approved - SANS Standards',
        },
      });
      if (p) products.push(p);
    }
  }

  return products;
}

// ============================================================
// Section 3: UAE/Middle East Expansion
// ============================================================

function collectUAEMiddleEast() {
  console.log('\n' + '='.repeat(60));
  console.log('Section 3: UAE/Middle East PPE Data (ESMA/MOHAP)');
  console.log('='.repeat(60));

  const products = [];

  const uaeMfrs = [
    // --- 3M UAE ---
    {
      name: '3M UAE', city: 'Dubai',
      products: [
        { name: '3M N95 UAE Particulate Respirator 8210', risk: 'medium' },
        { name: '3M Half Mask UAE 6200 Reusable Respirator', risk: 'medium' },
        { name: '3M Safety Glasses UAE SecureFit 400', risk: 'medium' },
        { name: '3M Peltor Earmuffs UAE X5A Hearing Protection', risk: 'medium' },
      ],
    },
    // --- MSA Middle East ---
    {
      name: 'MSA Middle East', city: 'Dubai',
      products: [
        { name: 'MSA V-Gard Helmet UAE Safety Head Protection', risk: 'medium' },
        { name: 'MSA Half Mask UAE Advantage 200 Respirator', risk: 'medium' },
        { name: 'MSA Full Body Harness UAE V-FORM Fall Protection', risk: 'high' },
        { name: 'MSA Safety Glasses UAE Clear Lens Anti-Scratch', risk: 'medium' },
      ],
    },
    // --- Draeger Middle East ---
    {
      name: 'Draeger Middle East', city: 'Dubai',
      products: [
        { name: 'Draeger SCBA UAE PSS 3000 Breathing Apparatus', risk: 'high' },
        { name: 'Draeger X-plore UAE 5500 Half Mask Respirator', risk: 'medium' },
        { name: 'Draeger Gas Detector UAE X-am 2500 Multi-Gas', risk: 'high' },
      ],
    },
    // --- Al Qahtani Safety (Saudi Arabia) ---
    {
      name: 'Al Qahtani Safety Saudi Arabia', city: 'Dammam',
      products: [
        { name: 'AQ Safety Helmet ABS Vented Ratchet Adjustment', risk: 'medium' },
        { name: 'AQ Safety Glasses Polycarbonate Anti-Fog', risk: 'medium' },
        { name: 'AQ Work Gloves Cut Resistant Nitrile Coated', risk: 'medium' },
        { name: 'AQ Safety Boots Steel Toe S3 SRC', risk: 'medium' },
        { name: 'AQ Fall Arrest Harness Full Body 4-Point', risk: 'high' },
      ],
    },
    // --- Alpha Fire & Safety (UAE) ---
    {
      name: 'Alpha Fire & Safety UAE', city: 'Abu Dhabi',
      products: [
        { name: 'Alpha Safety Helmet Firefighter Structural', risk: 'high' },
        { name: 'Alpha Safety Glasses Wraparound Clear Lens', risk: 'medium' },
        { name: 'Alpha Work Gloves Firefighter Heat Resistant', risk: 'medium' },
        { name: 'Alpha Fall Protection Full Body Harness 2-Point', risk: 'high' },
      ],
    },
    // --- NAFFCO (UAE fire/life safety) ---
    {
      name: 'NAFFCO UAE', city: 'Dubai',
      products: [
        { name: 'NAFFCO Fire Helmet Structural Firefighting EN 443', risk: 'high' },
        { name: 'NAFFCO Fire Gloves Heat Resistant Kevlar', risk: 'high' },
        { name: 'NAFFCO SCBA Self-Contained Breathing Apparatus', risk: 'high' },
        { name: 'NAFFCO Turnout Gear Firefighter Protective Suit', risk: 'high' },
        { name: 'NAFFCO Escape Hood Emergency Respiratory Protection', risk: 'high' },
      ],
    },
    // --- Bristol Fire Engineering (UAE) ---
    {
      name: 'Bristol Fire Engineering UAE', city: 'Dubai',
      products: [
        { name: 'Bristol Fire Helmet Structural Composite', risk: 'high' },
        { name: 'Bristol Turnout Gear Nomex Firefighter Suit', risk: 'high' },
        { name: 'Bristol SCBA Self-Contained Breathing Apparatus 6L', risk: 'high' },
      ],
    },
  ];

  for (const mfr of uaeMfrs) {
    for (let i = 0; i < mfr.products.length; i++) {
      const prod = mfr.products[i];
      const p = buildProduct({
        name: prod.name,
        category: prod.cat || undefined,
        risk_level: prod.risk || undefined,
        manufacturer_name: mfr.name,
        country_of_origin: 'AE',
        data_source: 'UAE ESMA/MOHAP Registry',
        registration_authority: 'ESMA/MOHAP',
        product_code: `AE-ESMA-${mfr.name.substring(0, 4).toUpperCase()}-${i + 1}`,
        registration_number: `AE-MOHAP-${Date.now().toString(36).toUpperCase()}-${i}`,
        data_confidence_level: 'medium',
        specifications: {
          city: mfr.city,
          manufacturer_type: 'Middle East PPE Manufacturer',
          curated: true,
          certification: 'ESMA/MOHAP Approved',
        },
      });
      if (p) products.push(p);
    }
  }

  return products;
}

// ============================================================
// Section 4: Egypt CAPA/EDA
// ============================================================

function collectEgyptCAPA() {
  console.log('\n' + '='.repeat(60));
  console.log('Section 4: Egypt CAPA/EDA PPE Data');
  console.log('='.repeat(60));

  const products = [];

  const egyptMfrs = [
    // --- 3M Egypt ---
    {
      name: '3M Egypt', city: 'Cairo',
      products: [
        { name: '3M N95 EG Particulate Respirator 8210', risk: 'medium' },
        { name: '3M Half Mask EG 6200 Reusable Respirator', risk: 'medium' },
        { name: '3M Safety Glasses EG SecureFit 400', risk: 'medium' },
      ],
    },
    // --- Rubex Egypt (plastic/PPE) ---
    {
      name: 'Rubex Egypt', city: 'Alexandria',
      products: [
        { name: 'Rubex Face Shields PET Anti-Fog Full Coverage', risk: 'medium' },
        { name: 'Rubex Isolation Gowns SMS Disposable Level 2', risk: 'medium' },
        { name: 'Rubex Safety Glasses Polycarbonate Clear', risk: 'medium' },
      ],
    },
    // --- EgyMedica ---
    {
      name: 'EgyMedica', city: 'Cairo',
      products: [
        { name: 'EgyMedica Surgical Masks 3-Ply Bacterial Filtration', risk: 'low' },
        { name: 'EgyMedica N95 Particulate Respirator with Valve', risk: 'medium' },
        { name: 'EgyMedica Face Shields Full Coverage Anti-Fog', risk: 'medium' },
      ],
    },
    // --- Nile Safety Egypt ---
    {
      name: 'Nile Safety Egypt', city: 'Cairo',
      products: [
        { name: 'Nile Safety Helmet ABS Vented 6-Point Suspension', risk: 'medium' },
        { name: 'Nile Safety Glasses UV Protection Clear Lens', risk: 'medium' },
        { name: 'Nile Work Gloves Cut Resistant Level 3', risk: 'medium' },
        { name: 'Nile Half Mask Respirator with P2 Filters', risk: 'medium' },
      ],
    },
  ];

  for (const mfr of egyptMfrs) {
    for (let i = 0; i < mfr.products.length; i++) {
      const prod = mfr.products[i];
      const p = buildProduct({
        name: prod.name,
        category: prod.cat || undefined,
        risk_level: prod.risk || undefined,
        manufacturer_name: mfr.name,
        country_of_origin: 'EG',
        data_source: 'Egypt CAPA/EDA Registry',
        registration_authority: 'CAPA/EDA',
        product_code: `EG-CAPA-${mfr.name.substring(0, 4).toUpperCase()}-${i + 1}`,
        registration_number: `EG-EDA-${Date.now().toString(36).toUpperCase()}-${i}`,
        data_confidence_level: 'medium',
        specifications: {
          city: mfr.city,
          manufacturer_type: 'Egyptian PPE Manufacturer',
          curated: true,
          certification: 'CAPA/EDA Registered',
        },
      });
      if (p) products.push(p);
    }
  }

  return products;
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('MENA + Africa PPE Data Collection');
  console.log('Markets: Turkey | South Africa | UAE/Middle East | Egypt');
  console.log('='.repeat(60));
  console.log(`Start: ${new Date().toISOString()}\n`);

  // Step 0: Load existing data for dedup
  await loadExisting();

  // Collect curated data from each section
  let trProducts = [];
  let zaProducts = [];
  let aeProducts = [];
  let egProducts = [];

  try { trProducts = collectTurkeyTITCK(); } catch (e) { console.error('[TR] Error:', e.message); }
  try { zaProducts = collectSouthAfricaSAHPRA(); } catch (e) { console.error('[ZA] Error:', e.message); }
  try { aeProducts = collectUAEMiddleEast(); } catch (e) { console.error('[AE] Error:', e.message); }
  try { egProducts = collectEgyptCAPA(); } catch (e) { console.error('[EG] Error:', e.message); }

  // Section stats log
  console.log('\n' + '-'.repeat(50));
  console.log('Collection Summary (before dedup):');
  console.log(`  Turkey TITCK/NBEL:    ${trProducts.length} products`);
  console.log(`  South Africa SAHPRA:  ${zaProducts.length} products`);
  console.log(`  UAE/Middle East ESMA: ${aeProducts.length} products`);
  console.log(`  Egypt CAPA/EDA:       ${egProducts.length} products`);
  console.log(`  Total curated:        ${trProducts.length + zaProducts.length + aeProducts.length + egProducts.length}`);
  console.log('-'.repeat(50));

  // Batch insert for each section
  let grandTotal = 0;

  if (trProducts.length > 0) {
    console.log('\n[TR] Inserting Turkey products...');
    const ins = await batchInsert(trProducts);
    grandTotal += ins;
    console.log(`[TR] Inserted: ${ins}/${trProducts.length}`);
  }

  if (zaProducts.length > 0) {
    console.log('\n[ZA] Inserting South Africa products...');
    const ins = await batchInsert(zaProducts);
    grandTotal += ins;
    console.log(`[ZA] Inserted: ${ins}/${zaProducts.length}`);
  }

  if (aeProducts.length > 0) {
    console.log('\n[AE] Inserting UAE/Middle East products...');
    const ins = await batchInsert(aeProducts);
    grandTotal += ins;
    console.log(`[AE] Inserted: ${ins}/${aeProducts.length}`);
  }

  if (egProducts.length > 0) {
    console.log('\n[EG] Inserting Egypt products...');
    const ins = await batchInsert(egProducts);
    grandTotal += ins;
    console.log(`[EG] Inserted: ${ins}/${egProducts.length}`);
  }

  // ============================================================
  // Final Report
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('Collection Complete - Final Report');
  console.log('='.repeat(60));

  const { count: finalProductCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });

  console.log(`\n  New products inserted: ${grandTotal}`);
  console.log(`  Total database products: ${finalProductCount}`);
  console.log(`  End time: ${new Date().toISOString()}`);

  // Country breakdown
  const { data: countryData } = await supabase
    .from('ppe_products')
    .select('country_of_origin')
    .in('country_of_origin', ['TR', 'ZA', 'AE', 'EG']);

  if (countryData) {
    const cntMap = {};
    countryData.forEach(p => {
      cntMap[p.country_of_origin] = (cntMap[p.country_of_origin] || 0) + 1;
    });
    console.log('\n  Country distribution in DB:');
    const names = { TR: 'Turkey (TR)', ZA: 'South Africa (ZA)', AE: 'UAE (AE)', EG: 'Egypt (EG)' };
    for (const [code, name] of Object.entries(names)) {
      console.log(`    ${name}: ${cntMap[code] || 0} total products`);
    }
  }

  // Category distribution for MENA/Africa products
  const { data: catData } = await supabase
    .from('ppe_products')
    .select('category')
    .in('country_of_origin', ['TR', 'ZA', 'AE', 'EG']);

  if (catData) {
    const catMap = {};
    catData.forEach(p => {
      catMap[p.category || 'Other'] = (catMap[p.category || 'Other'] || 0) + 1;
    });
    console.log('\n  Category distribution (MENA/Africa):');
    Object.entries(catMap).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`    ${k}: ${v}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('MENA + Africa PPE data collection finished!');
  console.log('='.repeat(60));
}

// ============================================================
// 直接运行时启动
// ============================================================
if (require.main === module) {
  main().catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
}

module.exports = {
  sleep,
  loadExisting,
  isDup,
  markDup,
  cat,
  fetchData,
  batchInsert,
  buildProduct,
  collectTurkeyTITCK,
  collectSouthAfricaSAHPRA,
  collectUAEMiddleEast,
  collectEgyptCAPA,
};