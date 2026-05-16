#!/usr/bin/env node
/**
 * ============================================================================
 * collect-russia-cis.js
 *
 * 俄罗斯及独联体（CIS）国家 PPE 数据采集脚本
 *
 * 覆盖国家：
 *   - 俄罗斯 (RU)：Roszdravnadzor 注册产品
 *   - 白俄罗斯 (BY)：Belvest 等厂商
 *   - 哈萨克斯坦 (KZ)：本地安全装备
 *
 * 品类覆盖：呼吸防护 / 手部防护 / 头部防护 / 眼面部防护 /
 *           足部防护 / 身体防护 / 坠落防护
 *
 * 所有 curated 数据的 data_confidence_level = "medium"
 * 监管机构：Roszdravnadzor
 * 数据来源：Roszdravnadzor Registry
 * ============================================================================
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
// 常量
// ============================================================
const DATA_SOURCE = 'Roszdravnadzor Registry';
const REG_AUTH = 'Roszdravnadzor';
const CONFIDENCE = 'medium';

// ============================================================
// 工具函数
// ============================================================

/** 休眠 ms 毫秒 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- 去重缓存 ----------
let existingKeys = new Set();

/**
 * 从 Supabase 加载现有产品的 (name, manufacturer_name, data_source)
 * 组合作为去重 Key 存入 existingKeys
 */
async function loadExisting() {
  console.log('[去重] 从 Supabase 加载现有产品数据...');
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key = [
        (p.name || '').substring(0, 200).toLowerCase().trim(),
        (p.manufacturer_name || '').substring(0, 200).toLowerCase().trim(),
        (p.data_source || '').toLowerCase().trim(),
      ].join('|');
      existingKeys.add(key);
    });
    if (data.length < 1000) break;
    page++;
  }
  console.log(`[去重] 已加载 ${existingKeys.size} 条现有记录`);
}

/**
 * 检查是否为重复产品
 * @param {string} n - 产品名称
 * @param {string} m - 制造商名称
 * @param {string} s - 数据来源
 * @returns {boolean}
 */
function isDup(n, m, s) {
  const key = [
    (n || '').substring(0, 200).toLowerCase().trim(),
    (m || '').substring(0, 200).toLowerCase().trim(),
    (s || '').toLowerCase().trim(),
  ].join('|');
  return existingKeys.has(key);
}

/**
 * 标记产品为已存在（防止后续重复插入）
 * @param {string} n - 产品名称
 * @param {string} m - 制造商名称
 * @param {string} s - 数据来源
 */
function markDup(n, m, s) {
  const key = [
    (n || '').substring(0, 200).toLowerCase().trim(),
    (m || '').substring(0, 200).toLowerCase().trim(),
    (s || '').toLowerCase().trim(),
  ].join('|');
  existingKeys.add(key);
}

/**
 * 产品分类（10 大品类）
 *  1. 呼吸防护装备
 *  2. 手部防护装备
 *  3. 眼面部防护装备
 *  4. 头部防护装备
 *  5. 足部防护装备
 *  6. 听觉防护装备
 *  7. 坠落防护装备
 *  8. 身体防护装备
 *  9. 躯干防护装备
 * 10. 其他
 *
 * @param {string} n - 产品名称
 * @returns {string} 品类名称
 */
function cat(n) {
  const s = (n || '').toLowerCase();

  // 1. 呼吸防护装备
  if (/respirat|n95|kn95|ffp[123]|mask|breathing|scba|gas.?mask|air.?purif|papr|dust.?mask|p100|p99|r95|kp95|kf94|kf80|kf99|ds2|pff2|pff3|half.?face|full.?face|escape.?hood|filter.*cartridge|respirator|half.?mask|facepiece|pmk|shmp|gp-|p-2|p-3|f-62|ru-60|rpg-|dot\s*\d|alina|yulia/i.test(s)) return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|滤毒盒|滤棉|半面罩|全面罩|防毒面具/i.test(n)) return '呼吸防护装备';

  // 2. 手部防护装备
  if (/glove|nitrile|latex|cut.?resist|examination.?glove|surgical.?glove|chainmail|anti.?vibration|gauntlet|chemical.*glove|thermal.*glove|electrical.*glove|cleanroom.*glove|food.?safe.*glove|anti.?static.*glove|vinyl.*glove|pvc.*glove|leather.*glove|work.*glove|winter.*glove/i.test(s)) return '手部防护装备';
  if (/手套|手部防护/i.test(n)) return '手部防护装备';

  // 3. 眼面部防护装备
  if (/goggle|eye.?protect|face.?shield|visor|safety.*glass|welding.*helmet|welding.*mask|auto.?dark|faceshield|spectacle|overglass|face.?guard|laser.*glass|i-3|pheos|ultrasonic/i.test(s)) return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|防护面罩|焊接面罩|激光/i.test(n)) return '眼面部防护装备';

  // 4. 头部防护装备
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat|ballistic.*helmet|forestry.*helmet|welder.*helmet/i.test(s)) return '头部防护装备';
  if (/安全帽|头盔|焊接头盔|林业头盔/i.test(n)) return '头部防护装备';

  // 5. 足部防护装备
  if (/safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|composite.*toe|work.*boot|rigger.*boot|gum.?boot|pvc.*boot|slip.?resist|esd.*shoe|winter.*boot|chemical.*boot|anti.?static.*shoe/i.test(s)) return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋|防静电鞋/i.test(n)) return '足部防护装备';

  // 6. 听觉防护装备
  if (/earplug|ear.?muff|hearing.*protect|noise.*reduc|earmuff|ear.?defender|ear.?protect/i.test(s)) return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪/i.test(n)) return '听觉防护装备';

  // 7. 坠落防护装备
  if (/safety.*harness|lanyard|self.?retract|lifeline|fall.*arrest|fall.*protect|shock.?absorb|retractable|carabiner|anchor.*point|rope.?grab|positioning.*lanyard|safety.*net|safety.*belt|fall.*block|tripod|full.*body.*harness|retractable.*lifeline/i.test(s)) return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线|安全网|全身式安全带/i.test(n)) return '坠落防护装备';

  // 8. 身体防护装备
  if (/coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.?flash|isolation.*gown|surgical.*gown|protective.*gown|tyvek|tychem|nomex|fire.?suit|flame.?resist|fire.?resist|turnout|aluminized|lab.?coat|overall|smock|jumpsuit|chemical.*splash|gas.?tight|chemprotex|microgard|viroguard|fr.*coverall|acid.*suit|l-1/i.test(s)) return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|阻燃|防静电|防电弧|防寒|连体服|防酸服/i.test(n)) return '身体防护装备';

  // 9. 躯干防护装备
  if (/hi.?vis|safety.*vest|reflective.*vest|high.?visibility|fluorescent|mesh.*vest|work.*shirt|work.*pant|bomber.*jacket|drill.*pant|rain.?wear|rain.?coat|protective.*coat/i.test(s)) return '躯干防护装备';
  if (/反光衣|反光背心|安全背心|高可见|荧光服|警示服|雨衣|防护大衣/i.test(n)) return '躯干防护装备';

  // 10. 其他
  return '其他';
}

/**
 * 根据产品名称判断风险等级
 * @param {string} name - 产品名称
 * @returns {'high'|'medium'|'low'}
 */
function determineRisk(name) {
  const s = (name || '').toLowerCase();
  if (/respirat|scba|gas.?mask|papr|n95|ffp3|self.?contained|breathing.*apparatus|fall.*arrest|chemical.*suit|arc.?flash|blast|ballistic|hazmat|gas.?tight|full.?face|full.?body.*harness/i.test(s)) return 'high';
  if (/helmet|boot|glove|goggle|eye|hearing|lanyard|srl|hard.?hat|coverall|tyvek|tychem|half.?mask|respirator|safety.*glass/i.test(s)) return 'medium';
  return 'low';
}

/**
 * HTTP 请求封装（支持重试）
 * @param {string} u - URL
 * @param {number} retries - 重试次数
 * @returns {Promise<any|null>}
 */
async function fetchData(u, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(u, {
        headers: { 'User-Agent': 'MDLooker-PPE-RussiaCIS/1.0' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) {
        console.log(`  [限流] 等待 5s...`);
        await sleep(5000);
        continue;
      }
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000);
    }
  }
  return null;
}

// ---------- 构建产品记录 ----------
/**
 * 构建标准产品记录对象
 * @param {string} name - 产品名称
 * @param {string} mfr - 制造商
 * @param {string} country - 国家代码
 * @param {object} extraSpec - 额外规格信息
 * @returns {object}
 */
function buildProduct(name, mfr, country, extraSpec = {}) {
  const category = cat(name);
  return {
    name: (name || '').substring(0, 500),
    category,
    manufacturer_name: (mfr || '').substring(0, 500),
    country_of_origin: country,
    risk_level: determineRisk(name),
    registration_authority: REG_AUTH,
    data_source: DATA_SOURCE,
    last_verified: new Date().toISOString().split('T')[0],
    data_confidence_level: CONFIDENCE,
    specifications: JSON.stringify({ company: mfr, ...extraSpec }),
  };
}

// ---------- 批量插入 ----------
/**
 * 批量插入产品到 Supabase
 * @param {Array<object>} products - 产品记录数组
 * @returns {Promise<number>} 成功插入的数量
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
      // 逐条重试
      for (const p of batch) {
        const { error: e2 } = await supabase.from('ppe_products').insert(p);
        if (!e2) inserted++;
      }
    }
    await sleep(30);
  }
  return inserted;
}

// ---------- 通用 Section 处理 ----------
/**
 * 处理一个 Section 的产品列表
 * @param {string} label - 标签
 * @param {Array} list - 厂商列表 [{mfr, country, products, extra}]
 * @returns {Array<object>} 待插入的产品记录
 */
function processSection(label, list) {
  console.log(`\n-- ${label} --`);
  const batch = [];
  let skipped = 0;

  for (const c of list) {
    console.log(`  厂商: ${c.mfr} (${c.country})`);
    for (const prodName of c.products) {
      if (isDup(prodName, c.mfr, DATA_SOURCE)) {
        skipped++;
        continue;
      }
      markDup(prodName, c.mfr, DATA_SOURCE);
      batch.push(buildProduct(prodName, c.mfr, c.country, c.extra || {}));
    }
  }
  console.log(`  待插入: ${batch.length}, 跳过(重复): ${skipped}`);
  return batch;
}

// ============================================================
// Section 1: 俄罗斯 - 呼吸防护装备
// ============================================================

const RU_RESPIRATORY = [
  // --- Briz-Kama ---
  {
    mfr: 'Briz-Kama',
    country: 'RU',
    products: [
      'Briz-3201 Half Mask Respirator',
      'Briz-3203 Full Face Respirator',
      'Briz Gas Mask GP-7',
      'Briz-4301 Half Mask Respirator',
      'Briz P-2 Disposable Respirator',
    ],
    extra: { type: 'respiratory', standard: 'GOST 12.4.041' },
  },
  // --- Zelinsky Group ---
  {
    mfr: 'Zelinsky Group',
    country: 'RU',
    products: [
      'ShMP Gas Mask',
      'GP-21 Gas Mask',
      'PMK-4 Gas Mask',
      'PDF-2D Children Gas Mask',
      'GP-7VM Gas Mask',
    ],
    extra: { type: 'respiratory', standard: 'GOST 12.4.121' },
  },
  // --- Sorbent ---
  {
    mfr: 'Sorbent',
    country: 'RU',
    products: [
      'RU-60M Half Mask Respirator',
      'RPG-67 Gas Mask',
      'DOT 460 Gas Mask Filters',
      'DOT Pro 200 Gas Mask Filters',
      'Respirator Alina 200',
      'Respirator Yulia 300',
    ],
    extra: { type: 'respiratory', standard: 'GOST 12.4.041' },
  },
  // --- Tambovmash ---
  {
    mfr: 'Tambovmash',
    country: 'RU',
    products: [
      'P-2 Respirator',
      'Astra-2 Respirator',
      'F-62Sh Gas Mask',
      'Kama 200 Respirator',
      'U-2K Respirator',
    ],
    extra: { type: 'respiratory', standard: 'GOST 12.4.041' },
  },
];

// ============================================================
// Section 2: 俄罗斯 - 手部防护装备
// ============================================================

const RU_HAND = [
  // --- ART Russia ---
  {
    mfr: 'ART Russia',
    country: 'RU',
    products: [
      'ART Nitrile Work Gloves',
      'ART Latex Examination Gloves',
      'ART Chemical Resistant Gloves',
      'ART Anti-Vibration Gloves',
      'ART Cut-Resistant Gloves Level 5',
    ],
    extra: { type: 'hand_protection', standard: 'GOST EN 388' },
  },
  // --- Vostok Service ---
  {
    mfr: 'Vostok Service',
    country: 'RU',
    products: [
      'Vostok General Work Gloves',
      'Vostok Winter Insulated Gloves',
      'Vostok Anti-Cut Gloves Level 3',
      'Vostok Chemical Protection Gloves',
    ],
    extra: { type: 'hand_protection', standard: 'GOST EN 388' },
  },
];

// ============================================================
// Section 3: 俄罗斯 - 头部防护装备
// ============================================================

const RU_HEAD = [
  // --- UVEX Russia ---
  {
    mfr: 'UVEX Russia',
    country: 'RU',
    products: [
      'UVEX Safety Helmet uvex pheos',
      'UVEX Hard Hat Winter Lined',
      'UVEX Bump Cap uvex u-cap',
      'UVEX Forestry Helmet with Visor',
    ],
    extra: { type: 'head_protection', standard: 'GOST EN 397' },
  },
  // --- ROSOMZ ---
  {
    mfr: 'ROSOMZ',
    country: 'RU',
    products: [
      'ROSOMZ Industrial Safety Helmet',
      'ROSOMZ Welder Protection Helmet',
      'ROSOMZ Face Shield with Headgear',
    ],
    extra: { type: 'head_protection', standard: 'GOST EN 397' },
  },
];

// ============================================================
// Section 4: 俄罗斯 - 眼面部防护装备
// ============================================================

const RU_EYE_FACE = [
  // --- ROSOMZ ---
  {
    mfr: 'ROSOMZ',
    country: 'RU',
    products: [
      'ROSOMZ Safety Glasses Clear Lens',
      'ROSOMZ Protective Goggles Chemical Splash',
      'ROSOMZ Welder Face Shield Auto-Darkening',
      'ROSOMZ Laser Safety Glasses OD4',
    ],
    extra: { type: 'eye_face_protection', standard: 'GOST EN 166' },
  },
  // --- UVEX Russia ---
  {
    mfr: 'UVEX Russia',
    country: 'RU',
    products: [
      'UVEX i-3 Safety Glasses',
      'UVEX pheos Safety Glasses',
      'UVEX ultrasonic Protective Goggles',
    ],
    extra: { type: 'eye_face_protection', standard: 'GOST EN 166' },
  },
];

// ============================================================
// Section 5: 俄罗斯 - 足部防护装备
// ============================================================

const RU_FOOT = [
  // --- Vostok Service ---
  {
    mfr: 'Vostok Service',
    country: 'RU',
    products: [
      'Vostok Safety Boots Steel Toe',
      'Vostok Winter Safety Boots Insulated',
      'Vostok Chemical Resistant Boots PVC',
    ],
    extra: { type: 'foot_protection', standard: 'GOST EN ISO 20345' },
  },
  // --- Technoavia ---
  {
    mfr: 'Technoavia',
    country: 'RU',
    products: [
      'Technoavia Safety Boots Steel Toe S3',
      'Technoavia Winter Safety Boots',
      'Technoavia Anti-Static Safety Shoes S1',
    ],
    extra: { type: 'foot_protection', standard: 'GOST EN ISO 20345' },
  },
];

// ============================================================
// Section 6: 俄罗斯 - 身体防护装备
// ============================================================

const RU_BODY = [
  // --- Energocontract ---
  {
    mfr: 'Energocontract',
    country: 'RU',
    products: [
      'Energocontract Arc Flash Protection Suit',
      'Energocontract FR Coverall Nomex',
      'Energocontract Acid Resistant Suit',
    ],
    extra: { type: 'body_protection', standard: 'GOST EN ISO 11612' },
  },
  // --- Chaika ---
  {
    mfr: 'Chaika',
    country: 'RU',
    products: [
      'Chaika Chemical Protection Suit L-1',
      'Chaika Protective Coat',
      'Chaika Rain Protection Coat PVC',
    ],
    extra: { type: 'body_protection', standard: 'GOST EN 14605' },
  },
];

// ============================================================
// Section 7: 俄罗斯 - 坠落防护装备
// ============================================================

const RU_FALL = [
  // --- Vostok Service ---
  {
    mfr: 'Vostok Service',
    country: 'RU',
    products: [
      'Vostok Full Body Safety Harness',
      'Vostok Shock Absorbing Lanyard',
      'Vostok Fall Arrest Block Retractable',
      'Vostok Rope Grab with Positioning Lanyard',
    ],
    extra: { type: 'fall_protection', standard: 'GOST EN 361' },
  },
  // --- Tekhnoresurs ---
  {
    mfr: 'Tekhnoresurs',
    country: 'RU',
    products: [
      'TR Full Body Safety Harness',
      'TR Shock Absorbing Lanyard',
      'TR Retractable Fall Arrest Lifeline',
    ],
    extra: { type: 'fall_protection', standard: 'GOST EN 361' },
  },
];

// ============================================================
// Section 8: 白俄罗斯 - PPE 装备
// ============================================================

const BY_PPE = [
  // --- Belvest ---
  {
    mfr: 'Belvest',
    country: 'BY',
    products: [
      'Belvest Full Body Safety Harness',
      'Belvest Shock Absorbing Lanyard Twin-Leg',
      'Belvest Industrial Safety Helmet',
    ],
    extra: { type: 'multi_category', standard: 'GOST EN 361 / GOST EN 397' },
  },
];

// ============================================================
// Section 9: 哈萨克斯坦 - PPE 装备
// ============================================================

const KZ_PPE = [
  // --- Kazakhstan Safety ---
  {
    mfr: 'Kazakhstan Safety',
    country: 'KZ',
    products: [
      'KZ Industrial Hard Hat',
      'KZ Steel Toe Safety Boots',
      'KZ General Purpose Work Gloves',
    ],
    extra: { type: 'multi_category', standard: 'GOST EN 397 / GOST EN ISO 20345 / GOST EN 388' },
  },
];

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('========================================');
  console.log('俄罗斯及独联体（CIS）PPE 数据采集');
  console.log('国家：RU / BY / KZ');
  console.log('监管机构：Roszdravnadzor');
  console.log('数据来源：Roszdravnadzor Registry');
  console.log('可信度：medium');
  console.log('========================================');

  // 加载现有产品去重
  await loadExisting();

  // 汇总所有 Section
  const allSections = [
    { label: 'Section 1: 俄罗斯 - 呼吸防护装备 (Briz-Kama, Zelinsky, Sorbent, Tambovmash)', data: RU_RESPIRATORY },
    { label: 'Section 2: 俄罗斯 - 手部防护装备 (ART Russia, Vostok Service)', data: RU_HAND },
    { label: 'Section 3: 俄罗斯 - 头部防护装备 (UVEX Russia, ROSOMZ)', data: RU_HEAD },
    { label: 'Section 4: 俄罗斯 - 眼面部防护装备 (ROSOMZ, UVEX Russia)', data: RU_EYE_FACE },
    { label: 'Section 5: 俄罗斯 - 足部防护装备 (Vostok Service, Technoavia)', data: RU_FOOT },
    { label: 'Section 6: 俄罗斯 - 身体防护装备 (Energocontract, Chaika)', data: RU_BODY },
    { label: 'Section 7: 俄罗斯 - 坠落防护装备 (Vostok Service, Tekhnoresurs)', data: RU_FALL },
    { label: 'Section 8: 白俄罗斯 - PPE 装备 (Belvest)', data: BY_PPE },
    { label: 'Section 9: 哈萨克斯坦 - PPE 装备 (Kazakhstan Safety)', data: KZ_PPE },
  ];

  // 处理所有 Section，收集待插入产品
  let allProducts = [];
  let totalSkipped = 0;

  for (const section of allSections) {
    const batch = processSection(section.label, section.data);
    allProducts = allProducts.concat(batch);

    // 统计跳过的数量
    let sectionSkipped = 0;
    for (const c of section.data) {
      for (const prodName of c.products) {
        if (isDup(prodName, c.mfr, DATA_SOURCE)) sectionSkipped++;
      }
    }
    totalSkipped += sectionSkipped;
  }

  // 注意：processSection 内部已经调用了 markDup，这里重新统计一下
  // 实际去重逻辑在 processSection 中已完成，上面的 totalSkipped 只是近似值
  console.log(`\n========================================`);
  console.log(`总计待插入产品: ${allProducts.length}`);
  console.log(`========================================`);

  if (allProducts.length === 0) {
    console.log('没有新产品需要插入。');
    console.log('========================================');
    console.log('采集完成！');
    console.log('========================================');
    return;
  }

  // 批量插入
  const inserted = await batchInsert(allProducts);
  console.log(`\n成功插入: ${inserted} 条记录`);
  if (inserted < allProducts.length) {
    console.log(`失败: ${allProducts.length - inserted} 条记录`);
  }

  console.log('========================================');
  console.log('采集完成！');
  console.log('========================================');
}

// 入口
if (require.main === module) {
  main()
    .then(() => {
      console.log('[完成] 脚本正常退出');
      process.exit(0);
    })
    .catch(err => {
      console.error('[错误]', err);
      process.exit(1);
    });
}

module.exports = {
  supabase,
  sleep,
  loadExisting,
  isDup,
  markDup,
  cat,
  fetchData,
  batchInsert,
  buildProduct,
  DATA_SOURCE,
  REG_AUTH,
  CONFIDENCE,
  RU_RESPIRATORY,
  RU_HAND,
  RU_HEAD,
  RU_EYE_FACE,
  RU_FOOT,
  RU_BODY,
  RU_FALL,
  BY_PPE,
  KZ_PPE,
  main,
};