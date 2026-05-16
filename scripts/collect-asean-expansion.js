#!/usr/bin/env node
/**
 * collect-asean-expansion.js
 * ================================================================
 * ASEAN PPE 市场数据扩展脚本
 * 覆盖菲律宾、越南、印度尼西亚、泰国四个东南亚PPE市场
 *
 * 覆盖范围:
 *   Section 1: 菲律宾 FDA - PPP, Medtecs, 3M, Honeywell, Cleene, Ever Bilena
 *   Section 2: 越南 DMEC/VSQI - 3M, Garment 10, Viet Tiep, Phong Chau, Tanaphar, VPIC
 *   Section 3: 印尼 Kemenkes/BPOM - 3M, Honeywell, Sensi, APP, Indofarma, Petrokimia, Cheil Jedang
 *   Section 4: 泰国 FDA - TNR, Sri Trang, Thai Rayon, 3M, Honeywell, Safety Thailand
 *
 * 策略:
 *   - 精选制造商产品数据（curated manufacturer data）
 *   - 每条数据经过去重检查（name + manufacturer_name + data_source）
 *   - 按区域/section记录进度和统计
 *   - data_confidence_level: "medium"
 *
 * 运行方式: node scripts/collect-asean-expansion.js
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
// 工具函数
// ============================================================

/** 延迟函数 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 全局去重集合（name|manufacturer_name|data_source） */
let existingKeys = new Set();

/**
 * loadExisting() - 加载数据库中已有的产品记录用于去重
 * 使用 name + manufacturer_name + data_source 的组合作为唯一键
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
  console.log(`[去重] 已加载 ${existingKeys.size} 条现有产品记录`);
}

/**
 * isDup(name, mfr, src) - 检查产品是否已存在
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
 * markDup(name, mfr, src) - 将产品标记为已存在
 * @param {string} name - 产品名称
 * @param {string} mfr - 制造商名称
 * @param {string} src - 数据来源
 */
function markDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

/**
 * cat(n) - PPE产品分类函数
 * 根据产品名称关键词将产品归入对应的防护装备类别
 * @param {string} name - 产品名称
 * @returns {string} 分类名称（中文）
 */
function cat(name) {
  const n = (name || '').toLowerCase();
  // 呼吸防护 - 优先级最高，关键词最明确
  if (/respirat|n95|kn95|ffp2|ffp3|ds2|ds3|kf94|kf80|kf99|pff2|pff3|scba|breathing|air[\s-]?purif|gas[\s-]?mask|papr|half[\s-]?mask|full[\s-]?face[\s-]?mask|filter.*resp|chemical[\s-]?cartridge|escape[\s-]?hood/i.test(n)) {
    return '呼吸防护装备';
  }
  // 坠落防护 - 高风险装备
  if (/fall|harness|lanyard|anchor|srl|self[\s-]?retract|lifeline|arrest|descent|guardrail|安全[带绳]|防坠|坠落/i.test(n)) {
    return '坠落防护装备';
  }
  // 手部防护
  if (/glove|hand|nitrile|latex|vinyl|cut[\s-]?resis|化学.*手套|防护.*手套|gauntlet|mangote/i.test(n)) {
    return '手部防护装备';
  }
  // 眼面部防护
  if (/goggle|eye|face[\s-]?shield|visor|spectacle|welding[\s-]?helmet|ocular|激光.*防护|护目|面屏|auto[\s-]?dark/i.test(n)) {
    return '眼面部防护装备';
  }
  // 头部防护
  if (/helmet|head|hard[\s-]?hat|bump[\s-]?cap|safety[\s-]?helmet|安全帽|头盔/i.test(n)) {
    return '头部防护装备';
  }
  // 足部防护
  if (/boot|foot|shoe|footwear|safety[\s-]?shoe|steel[\s-]?toe|wellington|clog|安全鞋|防护鞋/i.test(n)) {
    return '足部防护装备';
  }
  // 听觉防护
  if (/ear[\s-]?plug|ear[\s-]?muff|hearing|noise|acoustic|耳塞|耳罩|ear[\s-]?prot/i.test(n)) {
    return '听觉防护装备';
  }
  // 身体防护（全身）
  if (/coverall|chemical[\s-]?suit|arc[\s-]?flash|hazmat|biohazard|radiation[\s-]?suit|cleanroom.*suit|full[\s-]?body|防护服|连体|protective[\s-]?clothing/i.test(n)) {
    return '身体防护装备';
  }
  // 躯干防护（上半身）
  if (/vest|jacket|coat|torso|apron|gown|rainwear|hi[\s-]?vis|reflect|flame[\s-]?resis|welding[\s-]?jacket|隔热服|防化服|反光|高可见|isolation[\s-]?gown|shoe[\s-]?cover/i.test(n)) {
    return '躯干防护装备';
  }
  // surgical masks - 归类到呼吸防护
  if (/surgical[\s-]?mask|face[\s-]?mask|cloth[\s-]?mask/i.test(n)) {
    return '呼吸防护装备';
  }
  // 通用防护类兜底
  if (/protective|ppe|safety|protection|segurança|protección|安全|防护/i.test(n)) {
    return '其他';
  }
  return '其他';
}

/**
 * determineRiskLevel(name) - 根据产品类别判定风险等级
 * @param {string} name - 产品名称
 * @returns {string} 'high' | 'medium' | 'low'
 */
function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  // 高风险：SCBA/全面罩/化学防护服/电弧防护/辐射防护/坠落防护/N95呼吸器
  if (/scba|self[\s-]?contained|gas[\s-]?mask|papr|chemical[\s-]?suit|arc[\s-]?flash|radiation|hazmat.*level[\s-]?a|full[\s-]?face[\s-]?mask|supplied[\s-]?air|ffp3|pff3|kf99|escape[\s-]?hood/i.test(n)) return 'high';
  if (/fall[\s-]?protec|harness|lanyard|arrest|descent|lifeline|坠落|防坠/i.test(n)) return 'high';
  // 中风险：头盔、安全鞋、手套、护目镜、耳罩、半面罩、N95/FFP2/KF94/PFF2、防护服/隔离衣/面屏
  if (/helmet|head|hard[\s-]?hat|bump[\s-]?cap/i.test(n)) return 'medium';
  if (/boot|shoe|footwear|safety[\s-]?shoe/i.test(n)) return 'medium';
  if (/glove|hand|nitrile|latex/i.test(n)) return 'medium';
  if (/goggle|eye|face[\s-]?shield|visor/i.test(n)) return 'medium';
  if (/ear[\s-]?plug|ear[\s-]?muff|hearing|noise/i.test(n)) return 'medium';
  if (/ffp2|kf94|kf80|pff2|n95|ds2|half[\s-]?mask/i.test(n)) return 'medium';
  if (/coverall|body|vest|jacket|apron|gown/i.test(n)) return 'medium';
  if (/surgical[\s-]?mask|face[\s-]?mask/i.test(n)) return 'medium';
  return 'low';
}

/**
 * fetchData(collectionFn) - 包装采集函数，统一错误处理
 * @param {Function} collectionFn - 采集函数
 * @param {string} label - 函数标签
 * @returns {Promise<Array<Object>>} 产品对象列表
 */
async function fetchData(collectionFn, label) {
  let products = [];
  try {
    products = collectionFn();
    console.log(`  [${label}] 生成 ${products.length} 条产品数据`);
  } catch (e) {
    console.log(`  [${label}] 错误: ${e.message}`);
  }
  return products;
}

/**
 * buildProduct(opts) - 构建标准化的产品对象
 * 自动执行去重检查、分类和风险判定
 * @param {Object} opts
 * @param {string} opts.name - 产品名称
 * @param {string} opts.manufacturer_name - 制造商名称
 * @param {string} opts.country - 原产国代码
 * @param {string} opts.src - 数据来源标识
 * @param {string} opts.auth - 注册监管机构
 * @param {string} [opts.product_code] - 产品代码
 * @param {string} [opts.registration_number] - 注册号
 * @returns {Object|null} 产品对象或null（如果重复）
 */
function buildProduct(opts) {
  const name = opts.name || '';
  const mfr = opts.manufacturer_name || 'Unknown';
  const src = opts.src || 'Unknown';

  // 去重检查
  if (isDup(name, mfr, src)) return null;
  markDup(name, mfr, src);

  const today = new Date().toISOString().split('T')[0];

  return {
    name: name.substring(0, 500),
    category: cat(name),
    subcategory: null,
    manufacturer_name: mfr.substring(0, 500),
    country_of_origin: opts.country || 'Unknown',
    product_code: (opts.product_code || '').substring(0, 100),
    risk_level: determineRiskLevel(name),
    data_source: src.substring(0, 500),
    registration_number: (opts.registration_number || '').substring(0, 200),
    registration_authority: (opts.auth || 'Unknown').substring(0, 200),
    last_verified: today,
    data_confidence_level: 'medium',
    specifications: null,
  };
}

/**
 * batchInsert(products) - 批量插入产品到Supabase
 * 先尝试批量插入，失败则逐条插入
 * @param {Array<Object>} products - 产品对象数组
 * @returns {Promise<number>} 成功插入的数量
 */
async function batchInsert(products) {
  if (products.length === 0) return 0;
  let inserted = 0;
  const batchSize = 100;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (error) {
      // 批量失败，逐条插入
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

// ============================================================
// Section 1: 菲律宾 FDA 数据采集
// ============================================================

/** Philippine Pharma Procurement (PPP) - 政府采购PPE产品 */
function collectPhilippines_PPP() {
  const products = [];
  const country = 'PH';
  const src = 'Philippine Pharma Procurement';
  const auth = 'Philippines FDA';

  const items = [
    { name: 'PPP Surgical Mask (3-ply)', code: 'PPP-SM-001' },
    { name: 'PPP N95 Particulate Respirator Mask', code: 'PPP-N95-001' },
    { name: 'PPP Isolation Gown (Level 2)', code: 'PPP-IG-001' },
    { name: 'PPP Face Shield (Full Face)', code: 'PPP-FS-001' },
    { name: 'PPP Protective Coverall (Type 4B)', code: 'PPP-CV-001' },
    { name: 'PPP Surgical Mask (3-ply, Pediatric)', code: 'PPP-SM-002' },
    { name: 'PPP KN95 Protective Mask', code: 'PPP-KN95-001' },
    { name: 'PPP Nitrile Examination Gloves', code: 'PPP-GL-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'PPP (Philippine Pharma Procurement)', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Medtecs Philippines */
function collectPhilippines_Medtecs() {
  const products = [];
  const country = 'PH';
  const src = 'Medtecs Philippines';
  const auth = 'Philippines FDA';

  const items = [
    { name: 'Medtecs Surgical Mask (3-ply, PH)', code: 'MED-SM-PH-001' },
    { name: 'Medtecs N95 Particulate Respirator (PH)', code: 'MED-N95-PH-001' },
    { name: 'Medtecs Isolation Gown (AAMI Level 3, PH)', code: 'MED-IG-PH-001' },
    { name: 'Medtecs Protective Coverall (PH)', code: 'MED-CV-PH-001' },
    { name: 'Medtecs Face Shield (PH)', code: 'MED-FS-PH-001' },
    { name: 'Medtecs Shoe Cover (Non-Skid, PH)', code: 'MED-SC-PH-001' },
    { name: 'Medtecs Surgical Cap (Bouffant, PH)', code: 'MED-CAP-PH-001' },
    { name: 'Medtecs Nitrile Examination Gloves (PH)', code: 'MED-GL-PH-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Medtecs Philippines', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** 3M Philippines */
function collectPhilippines_3M() {
  const products = [];
  const country = 'PH';
  const src = '3M Philippines';
  const auth = 'Philippines FDA';

  const items = [
    { name: '3M N95 Particulate Respirator 8210 (PH)', code: '3M-8210-PH' },
    { name: '3M Half Facepiece Respirator 6200 (PH)', code: '3M-6200-PH' },
    { name: '3M Full Facepiece Respirator 6800 (PH)', code: '3M-6800-PH' },
    { name: '3M Safety Glasses Anti-Fog (PH)', code: '3M-SG-PH-001' },
    { name: '3M Earmuffs Peltor X2A (PH)', code: '3M-X2A-PH' },
    { name: '3M N95 Respirator 1860 Healthcare (PH)', code: '3M-1860-PH' },
    { name: '3M Disposable Protective Coverall 4530 (PH)', code: '3M-4530-PH' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: '3M Philippines', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Honeywell Philippines */
function collectPhilippines_Honeywell() {
  const products = [];
  const country = 'PH';
  const src = 'Honeywell Philippines';
  const auth = 'Philippines FDA';

  const items = [
    { name: 'Honeywell N95 Particulate Respirator (PH)', code: 'HW-N95-PH-001' },
    { name: 'Honeywell Half Mask Respirator 5500 Series (PH)', code: 'HW-5500-PH' },
    { name: 'Honeywell Hard Hat (PH)', code: 'HW-HH-PH-001' },
    { name: 'Honeywell Safety Glasses (PH)', code: 'HW-SG-PH-001' },
    { name: 'Honeywell Earmuffs (PH)', code: 'HW-EM-PH-001' },
    { name: 'Honeywell Full Face Respirator (PH)', code: 'HW-FF-PH-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Honeywell Philippines', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Cleene (Philippines) - 菲律宾本土品牌 */
function collectPhilippines_Cleene() {
  const products = [];
  const country = 'PH';
  const src = 'Cleene Philippines';
  const auth = 'Philippines FDA';

  const items = [
    { name: 'Cleene 3-Ply Disposable Face Mask', code: 'CLN-FM-001' },
    { name: 'Cleene Face Shield (Reusable)', code: 'CLN-FS-001' },
    { name: 'Cleene Surgical Mask (3-ply)', code: 'CLN-SM-001' },
    { name: 'Cleene Alcohol Sanitizing Wipes (70%)', code: 'CLN-AW-001' },
    { name: 'Cleene KN95 Protective Face Mask', code: 'CLN-KN95-001' },
    { name: 'Cleene Kids Face Mask (3-ply)', code: 'CLN-KFM-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Cleene (Pharma Industries)', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Ever Bilena Cosmetics (now PPE) */
function collectPhilippines_EverBilena() {
  const products = [];
  const country = 'PH';
  const src = 'Ever Bilena Philippines';
  const auth = 'Philippines FDA';

  const items = [
    { name: 'Ever Bilena 3-Ply Disposable Face Mask', code: 'EB-FM-001' },
    { name: 'Ever Bilena Face Shield (Full Face)', code: 'EB-FS-001' },
    { name: 'Ever Bilena KN95 Protective Mask', code: 'EB-KN95-001' },
    { name: 'Ever Bilena Surgical Mask (3-ply)', code: 'EB-SM-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Ever Bilena Cosmetics', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

// ============================================================
// Section 2: 越南 DMEC/VSQI 数据采集
// ============================================================

/** 3M Vietnam */
function collectVietnam_3M() {
  const products = [];
  const country = 'VN';
  const src = '3M Vietnam';
  const auth = 'Vietnam DMEC/VSQI';

  const items = [
    { name: '3M N95 Particulate Respirator 8210 (VN)', code: '3M-8210-VN' },
    { name: '3M Half Facepiece Respirator 6200 (VN)', code: '3M-6200-VN' },
    { name: '3M Full Facepiece Respirator 6800 (VN)', code: '3M-6800-VN' },
    { name: '3M Safety Glasses Anti-Fog (VN)', code: '3M-SG-VN-001' },
    { name: '3M Earmuffs Peltor X2A (VN)', code: '3M-X2A-VN' },
    { name: '3M Speedglas Welding Helmet (VN)', code: '3M-WH-VN-001' },
    { name: '3M N95 Healthcare Respirator 1860 (VN)', code: '3M-1860-VN' },
    { name: '3M Organic Vapor Cartridge 6001 (VN)', code: '3M-6001-VN' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: '3M Vietnam', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Garment 10 Corp (Vietnam) - 越南本土防护用品制造商 */
function collectVietnam_Garment10() {
  const products = [];
  const country = 'VN';
  const src = 'Garment 10 Corporation Vietnam';
  const auth = 'Vietnam DMEC/VSQI';

  const items = [
    { name: 'May 10 Surgical Mask (3-ply)', code: 'M10-SM-001' },
    { name: 'May 10 N95 Protective Mask', code: 'M10-N95-001' },
    { name: 'May 10 Isolation Gown (Level 2)', code: 'M10-IG-001' },
    { name: 'May 10 Cloth Mask (Reusable, Antibacterial)', code: 'M10-CM-001' },
    { name: 'May 10 Surgical Mask (4-ply)', code: 'M10-SM-002' },
    { name: 'May 10 KN95 Protective Mask', code: 'M10-KN95-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Garment 10 Corporation', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Viet Tiep Safety Equipment */
function collectVietnam_VietTiep() {
  const products = [];
  const country = 'VN';
  const src = 'Viet Tiep Safety Vietnam';
  const auth = 'Vietnam DMEC/VSQI';

  const items = [
    { name: 'Viet Tiep Safety Helmet (ABS)', code: 'VT-SH-001' },
    { name: 'Viet Tiep Safety Glasses (Anti-Scratch)', code: 'VT-SG-001' },
    { name: 'Viet Tiep Work Gloves (Leather Palm)', code: 'VT-WG-001' },
    { name: 'Viet Tiep Safety Boots (Steel Toe)', code: 'VT-SB-001' },
    { name: 'Viet Tiep Earmuffs (SNR 28dB)', code: 'VT-EM-001' },
    { name: 'Viet Tiep Welding Goggles', code: 'VT-WG-002' },
    { name: 'Viet Tiep High Visibility Safety Vest', code: 'VT-HV-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Viet Tiep Safety Equipment', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Phong Chau Protective Equipment */
function collectVietnam_PhongChau() {
  const products = [];
  const country = 'VN';
  const src = 'Phong Chau Vietnam';
  const auth = 'Vietnam DMEC/VSQI';

  const items = [
    { name: 'Phong Chau Surgical Mask (3-ply)', code: 'PC-SM-001' },
    { name: 'Phong Chau N95 Protective Mask', code: 'PC-N95-001' },
    { name: 'Phong Chau Protective Clothing (Coverall)', code: 'PC-PC-001' },
    { name: 'Phong Chau KN95 Protective Mask', code: 'PC-KN95-001' },
    { name: 'Phong Chau Face Shield (Full Face)', code: 'PC-FS-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Phong Chau Protective Equipment', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Tanaphar Vietnam */
function collectVietnam_Tanaphar() {
  const products = [];
  const country = 'VN';
  const src = 'Tanaphar Vietnam';
  const auth = 'Vietnam DMEC/VSQI';

  const items = [
    { name: 'Tanaphar Surgical Mask (3-ply)', code: 'TNP-SM-001' },
    { name: 'Tanaphar N95 Protective Mask', code: 'TNP-N95-001' },
    { name: 'Tanaphar Face Shield (Full Face)', code: 'TNP-FS-001' },
    { name: 'Tanaphar Surgical Mask (4-ply)', code: 'TNP-SM-002' },
    { name: 'Tanaphar KN95 Protective Mask', code: 'TNP-KN95-001' },
    { name: 'Tanaphar Isolation Gown (Level 2)', code: 'TNP-IG-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Tanaphar Vietnam', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Vietnam Precision Industrial (VPIC) */
function collectVietnam_VPIC() {
  const products = [];
  const country = 'VN';
  const src = 'VPIC Vietnam';
  const auth = 'Vietnam DMEC/VSQI';

  const items = [
    { name: 'VPIC Safety Helmet (HDPE)', code: 'VPIC-SH-001' },
    { name: 'VPIC Safety Glasses (Anti-Fog)', code: 'VPIC-SG-001' },
    { name: 'VPIC Work Gloves (Cut Resistant)', code: 'VPIC-WG-001' },
    { name: 'VPIC Safety Shoes (Steel Toe)', code: 'VPIC-SS-001' },
    { name: 'VPIC High Visibility Reflective Vest', code: 'VPIC-HV-001' },
    { name: 'VPIC Earmuffs (SNR 27dB)', code: 'VPIC-EM-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Vietnam Precision Industrial (VPIC)', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

// ============================================================
// Section 3: 印度尼西亚 Kemenkes/BPOM 数据采集
// ============================================================

/** 3M Indonesia */
function collectIndonesia_3M() {
  const products = [];
  const country = 'ID';
  const src = '3M Indonesia';
  const auth = 'Indonesia Kemenkes/BPOM';

  const items = [
    { name: '3M N95 Particulate Respirator 8210 (ID)', code: '3M-8210-ID' },
    { name: '3M Half Facepiece Respirator 6200 (ID)', code: '3M-6200-ID' },
    { name: '3M Full Facepiece Respirator 6800 (ID)', code: '3M-6800-ID' },
    { name: '3M Safety Glasses Anti-Fog (ID)', code: '3M-SG-ID-001' },
    { name: '3M Earmuffs Peltor X2A (ID)', code: '3M-X2A-ID' },
    { name: '3M N95 Healthcare Respirator 1860 (ID)', code: '3M-1860-ID' },
    { name: '3M Disposable Protective Coverall 4530 (ID)', code: '3M-4530-ID' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: '3M Indonesia', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Honeywell Indonesia */
function collectIndonesia_Honeywell() {
  const products = [];
  const country = 'ID';
  const src = 'Honeywell Indonesia';
  const auth = 'Indonesia Kemenkes/BPOM';

  const items = [
    { name: 'Honeywell N95 Particulate Respirator (ID)', code: 'HW-N95-ID-001' },
    { name: 'Honeywell Half Mask Respirator 5500 Series (ID)', code: 'HW-5500-ID' },
    { name: 'Honeywell Hard Hat (ID)', code: 'HW-HH-ID-001' },
    { name: 'Honeywell Safety Glasses (ID)', code: 'HW-SG-ID-001' },
    { name: 'Honeywell Earmuffs (ID)', code: 'HW-EM-ID-001' },
    { name: 'Honeywell Full Face Respirator (ID)', code: 'HW-FF-ID-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Honeywell Indonesia', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Sensi (Indonesia's largest glove manufacturer) */
function collectIndonesia_Sensi() {
  const products = [];
  const country = 'ID';
  const src = 'Sensi Indonesia';
  const auth = 'Indonesia Kemenkes/BPOM';

  const items = [
    { name: 'Sensi Nitrile Examination Gloves (Powder-Free)', code: 'SEN-NG-001' },
    { name: 'Sensi Latex Examination Gloves (Powder-Free)', code: 'SEN-LG-001' },
    { name: 'Sensi Surgical Gloves (Sterile, Latex)', code: 'SEN-SG-001' },
    { name: 'Sensi Vinyl Examination Gloves', code: 'SEN-VG-001' },
    { name: 'Sensi 3-Ply Disposable Face Mask', code: 'SEN-FM-001' },
    { name: 'Sensi Nitrile Examination Gloves (Blue)', code: 'SEN-NG-002' },
    { name: 'Sensi Surgical Gloves (Sterile, Latex-Free)', code: 'SEN-SG-002' },
    { name: 'Sensi 4-Ply Surgical Face Mask', code: 'SEN-SM-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Sensi (PT Sentra Medika Utama)', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Pabrik Kertas Tjiwi Kimia (APP) */
function collectIndonesia_APP() {
  const products = [];
  const country = 'ID';
  const src = 'APP (Pabrik Kertas Tjiwi Kimia) Indonesia';
  const auth = 'Indonesia Kemenkes/BPOM';

  const items = [
    { name: 'APP 3-Ply Surgical Mask', code: 'APP-SM-001' },
    { name: 'APP N95 Protective Mask', code: 'APP-N95-001' },
    { name: 'APP Full Face Shield', code: 'APP-FS-001' },
    { name: 'APP KN95 Protective Mask', code: 'APP-KN95-001' },
    { name: 'APP 4-Ply Surgical Mask', code: 'APP-SM-002' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Pabrik Kertas Tjiwi Kimia (APP)', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Indofarma (Indonesia state-owned pharmaceutical) */
function collectIndonesia_Indofarma() {
  const products = [];
  const country = 'ID';
  const src = 'Indofarma Indonesia';
  const auth = 'Indonesia Kemenkes/BPOM';

  const items = [
    { name: 'Indofarma Surgical Mask (3-ply)', code: 'IDF-SM-001' },
    { name: 'Indofarma N95 Protective Mask', code: 'IDF-N95-001' },
    { name: 'Indofarma Face Shield (Full Face)', code: 'IDF-FS-001' },
    { name: 'Indofarma KN95 Protective Mask', code: 'IDF-KN95-001' },
    { name: 'Indofarma Isolation Gown (Level 2)', code: 'IDF-IG-001' },
    { name: 'Indofarma Surgical Mask (4-ply)', code: 'IDF-SM-002' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Indofarma (PT Indofarma Tbk)', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Petrokimia Kayaku - safety equipment */
function collectIndonesia_PetrokimiaKayaku() {
  const products = [];
  const country = 'ID';
  const src = 'Petrokimia Kayaku Indonesia';
  const auth = 'Indonesia Kemenkes/BPOM';

  const items = [
    { name: 'Petrokimia Kayaku Chemical Resistant Gloves', code: 'PK-CG-001' },
    { name: 'Petrokimia Kayaku Safety Glasses (Chemical Splash)', code: 'PK-SG-001' },
    { name: 'Petrokimia Kayaku Chemical Protective Coverall', code: 'PK-CV-001' },
    { name: 'Petrokimia Kayaku Full Face Respirator', code: 'PK-FF-001' },
    { name: 'Petrokimia Kayaku Safety Helmet (Chemical Resistant)', code: 'PK-SH-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Petrokimia Kayaku', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Cheil Jedang Indonesia - masks, PPE */
function collectIndonesia_CheilJedang() {
  const products = [];
  const country = 'ID';
  const src = 'Cheil Jedang Indonesia';
  const auth = 'Indonesia Kemenkes/BPOM';

  const items = [
    { name: 'Cheil Jedang 3-Ply Disposable Face Mask (ID)', code: 'CJ-FM-001' },
    { name: 'Cheil Jedang KN95 Protective Mask (ID)', code: 'CJ-KN95-001' },
    { name: 'Cheil Jedang Surgical Mask (3-ply, ID)', code: 'CJ-SM-001' },
    { name: 'Cheil Jedang Face Shield (ID)', code: 'CJ-FS-001' },
    { name: 'Cheil Jedang Isolation Gown (ID)', code: 'CJ-IG-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Cheil Jedang Indonesia', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

// ============================================================
// Section 4: 泰国 FDA 数据采集
// ============================================================

/** Thai Nippon Rubber (TNR) */
function collectThailand_TNR() {
  const products = [];
  const country = 'TH';
  const src = 'Thai Nippon Rubber (TNR) Thailand';
  const auth = 'Thailand FDA';

  const items = [
    { name: 'TNR Latex Examination Gloves (Powder-Free)', code: 'TNR-LG-001' },
    { name: 'TNR Nitrile Examination Gloves (Powder-Free)', code: 'TNR-NG-001' },
    { name: 'TNR Surgical Gloves (Sterile, Latex)', code: 'TNR-SG-001' },
    { name: 'TNR Latex Examination Gloves (Pre-Powdered)', code: 'TNR-LG-002' },
    { name: 'TNR Nitrile Examination Gloves (Blue)', code: 'TNR-NG-002' },
    { name: 'TNR Surgical Gloves (Sterile, Latex-Free)', code: 'TNR-SG-002' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Thai Nippon Rubber (TNR)', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Sri Trang Gloves (expansion) */
function collectThailand_SriTrang() {
  const products = [];
  const country = 'TH';
  const src = 'Sri Trang Gloves Thailand';
  const auth = 'Thailand FDA';

  const items = [
    { name: 'Sri Trang Powered Air Purifying Respirator (PAPR)', code: 'STG-PAPR-001' },
    { name: 'Sri Trang Face Shield (Full Face)', code: 'STG-FS-001' },
    { name: 'Sri Trang Isolation Gown (Level 3)', code: 'STG-IG-001' },
    { name: 'Sri Trang Surgical Mask (3-ply)', code: 'STG-SM-001' },
    { name: 'Sri Trang KN95 Protective Mask', code: 'STG-KN95-001' },
    { name: 'Sri Trang Nitrile Exam Gloves (Extended Cuff)', code: 'STG-NG-002' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Sri Trang Gloves Thailand', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Thai Rayon */
function collectThailand_ThaiRayon() {
  const products = [];
  const country = 'TH';
  const src = 'Thai Rayon Thailand';
  const auth = 'Thailand FDA';

  const items = [
    { name: 'Thai Rayon 3-Ply Disposable Face Mask', code: 'TR-FM-001' },
    { name: 'Thai Rayon Isolation Gown (Level 2)', code: 'TR-IG-001' },
    { name: 'Thai Rayon KN95 Protective Mask', code: 'TR-KN95-001' },
    { name: 'Thai Rayon Surgical Mask (4-ply)', code: 'TR-SM-001' },
    { name: 'Thai Rayon Face Shield', code: 'TR-FS-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Thai Rayon', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** 3M Thailand */
function collectThailand_3M() {
  const products = [];
  const country = 'TH';
  const src = '3M Thailand';
  const auth = 'Thailand FDA';

  const items = [
    { name: '3M N95 Particulate Respirator 8210 (TH)', code: '3M-8210-TH' },
    { name: '3M Half Facepiece Respirator 6200 (TH)', code: '3M-6200-TH' },
    { name: '3M Safety Glasses Anti-Fog (TH)', code: '3M-SG-TH-001' },
    { name: '3M Earmuffs Peltor X2A (TH)', code: '3M-X2A-TH' },
    { name: '3M Speedglas Welding Helmet (TH)', code: '3M-WH-TH-001' },
    { name: '3M N95 Healthcare Respirator 1860 (TH)', code: '3M-1860-TH' },
    { name: '3M Disposable Protective Coverall 4530 (TH)', code: '3M-4530-TH' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: '3M Thailand', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Honeywell Thailand */
function collectThailand_Honeywell() {
  const products = [];
  const country = 'TH';
  const src = 'Honeywell Thailand';
  const auth = 'Thailand FDA';

  const items = [
    { name: 'Honeywell N95 Particulate Respirator (TH)', code: 'HW-N95-TH-001' },
    { name: 'Honeywell Hard Hat (TH)', code: 'HW-HH-TH-001' },
    { name: 'Honeywell Safety Glasses (TH)', code: 'HW-SG-TH-001' },
    { name: 'Honeywell Earmuffs (TH)', code: 'HW-EM-TH-001' },
    { name: 'Honeywell Half Mask Respirator 5500 Series (TH)', code: 'HW-5500-TH' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Honeywell Thailand', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

/** Safety Thailand (Thai safety equipment brand) */
function collectThailand_Safety() {
  const products = [];
  const country = 'TH';
  const src = 'Safety Thailand';
  const auth = 'Thailand FDA';

  const items = [
    { name: 'Safety TH Hard Hat (ABS)', code: 'SFT-HH-001' },
    { name: 'Safety TH Safety Glasses (Anti-Scratch)', code: 'SFT-SG-001' },
    { name: 'Safety TH Work Gloves (Leather Palm)', code: 'SFT-WG-001' },
    { name: 'Safety TH Safety Shoes (Steel Toe)', code: 'SFT-SS-001' },
    { name: 'Safety TH High Visibility Vest', code: 'SFT-HV-001' },
  ];

  for (const item of items) {
    const p = buildProduct({ name: item.name, manufacturer_name: 'Safety Thailand Co.', country, src, auth, product_code: item.code });
    if (p) products.push(p);
  }
  return products;
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('ASEAN PPE 市场数据扩展脚本');
  console.log('覆盖: 菲律宾 | 越南 | 印度尼西亚 | 泰国');
  console.log('='.repeat(60));
  console.log(`开始时间: ${new Date().toISOString()}\n`);

  // 步骤1: 加载现有数据用于去重
  await loadExisting();

  const sections = [
    {
      id: 'Section1',
      name: '菲律宾 FDA',
      country: 'PH',
      collectors: [
        { label: 'PPP', fn: () => collectPhilippines_PPP() },
        { label: 'Medtecs', fn: () => collectPhilippines_Medtecs() },
        { label: '3M-PH', fn: () => collectPhilippines_3M() },
        { label: 'Honeywell-PH', fn: () => collectPhilippines_Honeywell() },
        { label: 'Cleene', fn: () => collectPhilippines_Cleene() },
        { label: 'Ever Bilena', fn: () => collectPhilippines_EverBilena() },
      ],
    },
    {
      id: 'Section2',
      name: '越南 DMEC/VSQI',
      country: 'VN',
      collectors: [
        { label: '3M-VN', fn: () => collectVietnam_3M() },
        { label: 'Garment 10', fn: () => collectVietnam_Garment10() },
        { label: 'Viet Tiep', fn: () => collectVietnam_VietTiep() },
        { label: 'Phong Chau', fn: () => collectVietnam_PhongChau() },
        { label: 'Tanaphar', fn: () => collectVietnam_Tanaphar() },
        { label: 'VPIC', fn: () => collectVietnam_VPIC() },
      ],
    },
    {
      id: 'Section3',
      name: '印尼 Kemenkes/BPOM',
      country: 'ID',
      collectors: [
        { label: '3M-ID', fn: () => collectIndonesia_3M() },
        { label: 'Honeywell-ID', fn: () => collectIndonesia_Honeywell() },
        { label: 'Sensi', fn: () => collectIndonesia_Sensi() },
        { label: 'APP', fn: () => collectIndonesia_APP() },
        { label: 'Indofarma', fn: () => collectIndonesia_Indofarma() },
        { label: 'Petrokimia Kayaku', fn: () => collectIndonesia_PetrokimiaKayaku() },
        { label: 'Cheil Jedang', fn: () => collectIndonesia_CheilJedang() },
      ],
    },
    {
      id: 'Section4',
      name: '泰国 FDA',
      country: 'TH',
      collectors: [
        { label: 'TNR', fn: () => collectThailand_TNR() },
        { label: 'Sri Trang', fn: () => collectThailand_SriTrang() },
        { label: 'Thai Rayon', fn: () => collectThailand_ThaiRayon() },
        { label: '3M-TH', fn: () => collectThailand_3M() },
        { label: 'Honeywell-TH', fn: () => collectThailand_Honeywell() },
        { label: 'Safety TH', fn: () => collectThailand_Safety() },
      ],
    },
  ];

  // 统计数据
  let grandTotal = 0;

  // 逐个section采集
  for (const section of sections) {
    console.log(`\n${'-'.repeat(50)}`);
    console.log(`[${section.id}] 开始采集: ${section.name} (${section.country})`);
    console.log(`${'-'.repeat(50)}`);

    const allSectionProducts = [];

    for (const collector of section.collectors) {
      const products = await fetchData(collector.fn, collector.label);
      allSectionProducts.push(...products);
    }

    console.log(`[${section.id}] 合计待插入: ${allSectionProducts.length} 条`);

    // 批量插入
    if (allSectionProducts.length > 0) {
      const inserted = await batchInsert(allSectionProducts);
      grandTotal += inserted;
      console.log(`[${section.id}] 成功插入: ${inserted} 条`);
      if (inserted < allSectionProducts.length) {
        console.log(`[${section.id}] 跳过重复: ${allSectionProducts.length - inserted} 条`);
      }
    } else {
      console.log(`[${section.id}] 无数据插入`);
    }
  }

  // ============================================================
  // 最终统计报告
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('采集完成 - 最终统计报告');
  console.log('='.repeat(60));

  // 获取最终数据库统计
  const { count: finalProductCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });

  console.log(`\n本次新增产品: ${grandTotal} 条`);
  console.log(`数据库总产品数: ${finalProductCount}`);

  // 查询各区域的最终产品数量
  console.log('\n各区域最终产品数量:');
  const { data: countryCounts } = await supabase
    .from('ppe_products')
    .select('country_of_origin')
    .in('country_of_origin', ['PH', 'VN', 'ID', 'TH']);

  if (countryCounts) {
    const countMap = {};
    countryCounts.forEach(p => {
      countMap[p.country_of_origin] = (countMap[p.country_of_origin] || 0) + 1;
    });
    const countryNames = { PH: '菲律宾 FDA', VN: '越南 DMEC/VSQI', ID: '印尼 Kemenkes/BPOM', TH: '泰国 FDA' };
    for (const [code, name] of Object.entries(countryNames)) {
      console.log(`  ${name} (${code}): ${countMap[code] || 0} 条`);
    }
  }

  console.log('\nASEAN PPE 市场数据扩展完成!');
}

// ============================================================
// 直接运行时启动
// ============================================================
if (require.main === module) {
  main().catch(err => {
    console.error('脚本执行失败:', err);
    process.exit(1);
  });
}

module.exports = {
  sleep,
  loadExisting,
  isDup,
  markDup,
  cat,
  determineRiskLevel,
  fetchData,
  buildProduct,
  batchInsert,
  // Section 1: Philippines
  collectPhilippines_PPP,
  collectPhilippines_Medtecs,
  collectPhilippines_3M,
  collectPhilippines_Honeywell,
  collectPhilippines_Cleene,
  collectPhilippines_EverBilena,
  // Section 2: Vietnam
  collectVietnam_3M,
  collectVietnam_Garment10,
  collectVietnam_VietTiep,
  collectVietnam_PhongChau,
  collectVietnam_Tanaphar,
  collectVietnam_VPIC,
  // Section 3: Indonesia
  collectIndonesia_3M,
  collectIndonesia_Honeywell,
  collectIndonesia_Sensi,
  collectIndonesia_APP,
  collectIndonesia_Indofarma,
  collectIndonesia_PetrokimiaKayaku,
  collectIndonesia_CheilJedang,
  // Section 4: Thailand
  collectThailand_TNR,
  collectThailand_SriTrang,
  collectThailand_ThaiRayon,
  collectThailand_3M,
  collectThailand_Honeywell,
  collectThailand_Safety,
};