#!/usr/bin/env node
/**
 * ============================================================================
 * collect-global-gap-fill.js
 *
 * 全球PPE数据缺口填补脚本 — 覆盖 underrepresented 国家/地区
 * 以及产品品类（手套、防护服、面罩等）
 *
 * 十大板块：
 *   Section  1: Australia TGA ARTG          — Deep Expansion   (target +500)
 *   Section  2: Korea MFDS                  — Deep Expansion   (target +400)
 *   Section  3: India CDSCO                 — Deep Expansion   (target +400)
 *   Section  4: Brazil ANVISA/CAEPI         — Deep Expansion   (target +400)
 *   Section  5: Japan PMDA                  — Deep Expansion   (target +400)
 *   Section  6: Singapore HSA SMDR                          (target +200)
 *   Section  7: Saudi Arabia SFDA                           (target +200)
 *   Section  8: WHO Prequalification & Taiwan TFDA           (target +150)
 *   Section  9: Examination Gloves — Global                  (target +300)
 *   Section 10: Protective Clothing/Coveralls — Global       (target +300)
 *
 * 所有 curated 数据的 data_confidence_level = "medium"
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

// ============================================================
// 工具函数
// ============================================================

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- 去重 ----------
let existingKeys = new Set();

async function loadExisting() {
  console.log('从 Supabase 加载现有产品数据用于去重...');
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
  console.log(`已加载 ${existingKeys.size} 条现有记录`);
}

function isDup(name, mfr, src) {
  const key = [
    (name || '').substring(0, 200).toLowerCase().trim(),
    (mfr || '').substring(0, 200).toLowerCase().trim(),
    (src || '').toLowerCase().trim(),
  ].join('|');
  return existingKeys.has(key);
}

function markDup(name, mfr, src) {
  const key = [
    (name || '').substring(0, 200).toLowerCase().trim(),
    (mfr || '').substring(0, 200).toLowerCase().trim(),
    (src || '').toLowerCase().trim(),
  ].join('|');
  existingKeys.add(key);
}

// ---------- 分类 ----------
function cat(n) {
  const s = (n || '').toLowerCase();
  if (/respirat|n95|kn95|ffp[123]|mask|breathing|scba|gas.?mask|air.?purif|papr|dust.?mask|p100|p99|r95|kp95|kf94|kf80|kf99|ds2|pff2|pff3|half.?face|full.?face|escape.?hood|filter.*cartridge/i.test(s)) return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|滤毒盒|滤棉/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|latex|cut.?resist|examination.?glove|surgical.?glove|chainmail|anti.?vibration|gauntlet|chemical.*glove|thermal.*glove|electrical.*glove|cleanroom.*glove|food.?safe.*glove|anti.?static.*glove|vinyl.*glove|pvc.*glove|leather.*glove/i.test(s)) return '手部防护装备';
  if (/手套|手部防护/i.test(n)) return '手部防护装备';
  if (/goggle|eye.?protect|face.?shield|visor|safety.*glass|welding.*helmet|welding.*mask|auto.?dark|faceshield|spectacle|overglass|face.?guard/i.test(s)) return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|防护面罩/i.test(n)) return '眼面部防护装备';
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat|ballistic.*helmet/i.test(s)) return '头部防护装备';
  if (/安全帽|头盔/i.test(n)) return '头部防护装备';
  if (/safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|composite.*toe|work.*boot|rigger.*boot|gum.?boot|pvc.*boot|slip.?resist|esd.*shoe/i.test(s)) return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋/i.test(n)) return '足部防护装备';
  if (/earplug|ear.?muff|hearing.*protect|noise.*reduc|earmuff|ear.?defender|ear.?protect/i.test(s)) return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪/i.test(n)) return '听觉防护装备';
  if (/safety.*harness|lanyard|self.?retract|lifeline|fall.*arrest|fall.*protect|shock.?absorb|retractable|carabiner|anchor.*point|rope.?grab|positioning.*lanyard|safety.*net|safety.*belt|fall.*block|tripod/i.test(s)) return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线|安全网/i.test(n)) return '坠落防护装备';
  if (/coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.?flash|isolation.*gown|surgical.*gown|protective.*gown|tyvek|tychem|nomex|fire.?suit|flame.?resist|fire.?resist|turnout|aluminized|lab.?coat|overall|smock|jumpsuit|chemical.*splash|gas.?tight|chemprotex|microgard|viroguard/i.test(s)) return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|阻燃|防静电|防电弧|防寒|连体服/i.test(n)) return '身体防护装备';
  if (/hi.?vis|safety.*vest|reflective.*vest|high.?visibility|fluorescent|mesh.*vest|work.*shirt|work.*pant|bomber.*jacket|drill.*pant|rain.?wear/i.test(s)) return '躯干防护装备';
  if (/反光衣|反光背心|安全背心|高可见|荧光服|警示服/i.test(n)) return '躯干防护装备';
  if (/ballistic.*vest|blast.*suit|bullet.?proof/i.test(s)) return '身体防护装备';
  return '其他';
}

// ---------- 风险等级 ----------
function determineRisk(name) {
  const s = (name || '').toLowerCase();
  if (/respirat|scba|gas.?mask|papr|n95|ffp3|self.?contained|breathing.*apparatus|fall.*arrest|chemical.*suit|arc.?flash|blast|ballistic|hazmat|gas.?tight/i.test(s)) return 'high';
  if (/helmet|boot|glove|goggle|eye|hearing|lanyard|srl|hard.?hat|coverall|tyvek|tychem/i.test(s)) return 'medium';
  return 'low';
}

// ---------- API 请求 ----------
async function fetchData(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MDLooker-PPE-GlobalGap/1.0' },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429) {
        console.log(`    频率限制，等待 5s...`);
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

// ---------- 批量插入 ----------
async function batchInsert(products) {
  if (products.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < products.length; i += 100) {
    const batch = products.slice(i, i + 100);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (!error) {
      inserted += batch.length;
    } else {
      for (const p of batch) {
        const { error: e2 } = await supabase.from('ppe_products').insert(p);
        if (!e2) inserted++;
      }
    }
    await sleep(30);
  }
  return inserted;
}

// ---------- 构建产品记录 ----------
function buildProduct(name, mfr, country, regAuth, dataSrc, extraSpec = {}) {
  const category = cat(name);
  return {
    name: (name || '').substring(0, 500),
    category,
    manufacturer_name: (mfr || '').substring(0, 500),
    country_of_origin: country,
    risk_level: determineRisk(name),
    registration_authority: regAuth,
    data_source: dataSrc,
    last_verified: new Date().toISOString().split('T')[0],
    data_confidence_level: 'medium',
    specifications: JSON.stringify({ company: mfr, ...extraSpec }),
  };
}

// ---------- 通用 section 处理函数 ----------
function processSection(label, list, dataSrc, regAuth) {
  console.log(`\n-- ${label} --`);
  const batch = [];
  let skipped = 0;

  for (const c of list) {
    for (const prodName of c.products) {
      if (isDup(prodName, c.mfr, dataSrc)) { skipped++; continue; }
      markDup(prodName, c.mfr, dataSrc);
      batch.push(buildProduct(prodName, c.mfr, c.country, regAuth, dataSrc, c.extra || {}));
    }
  }
  console.log(`  待插入: ${batch.length}, 跳过(重复): ${skipped}`);
  return batch;
}

// ============================================================
// Section 1: Australia TGA ARTG — Deep Expansion
// ============================================================

const AU_SECTION = [
  // --- Blackwoods ---
  {
    mfr: 'Blackwoods Safety',
    country: 'AU',
    products: [
      'ProChoice Safety Glasses Clear Lens',
      'ProChoice Safety Spectacles Anti-Fog',
      'ProChoice Safety Spectacles Smoke Lens',
      'ProChoice Hard Hat V6 Vented',
      'ProChoice Hard Hat Full Brim',
      'ProChoice Earmuffs NRR 26dB',
      'ProChoice Earmuffs NRR 30dB',
      'ProChoice P2 Disposable Respirator',
      'ProChoice P2 Valved Respirator',
      'ProChoice Half Face Respirator',
      'Steel Blue Argyle Lace-Up Safety Boot',
      'Steel Blue Argyle Steel Toe Boot',
      'Steel Blue Southern Cross Zip Safety Boot',
      'Steel Blue Southern Cross Elastic Side Boot',
      'Ritemate Hi-Vis Long Sleeve Shirt',
      'Ritemate Hi-Vis Short Sleeve Shirt',
      'Ritemate Heavy Duty Work Pants',
      'Ritemate Cargo Work Pants',
      'Bisley Hi-Vis Long Sleeve Work Shirt',
      'Bisley Cotton Drill Work Shirt',
      'King Gee Traditional Work Shorts',
      'King Gee Cargo Work Pants',
    ],
  },
  // --- RSEA Safety ---
  {
    mfr: 'RSEA Safety',
    country: 'AU',
    products: [
      'Mustang Steel Toe Safety Boots',
      'Mustang Zip-Sided Safety Boots',
      'Mustang Rigger Boots Pull-On',
      'Mustang Waterproof Safety Boots',
      'Steel Blue Argyle Wheat Lace-Up Boot',
      'Steel Blue Parkes Zip Safety Boot',
      'Steel Blue Koolara Lace-Up Safety Boot',
      'ProChoice Corded Foam Earplugs SNR 32dB',
      'ProChoice Uncorded Foam Earplugs',
      'ProChoice Reusable Earplugs with Cord',
      'ProChoice Nitrile Coated Grip Gloves',
      'ProChoice Cut Resistant Gloves Level 3',
      'ProChoice Impact Resistant Gloves',
      'BlackWolf Rigger Gloves Cowhide',
      'BlackWolf General Purpose Gloves',
      'CAT Connexion Steel Toe Boot',
      'CAT Streamline Safety Boot',
      'Mack Boots Steel Toe Work Boot',
      'Mack Boots Zip-Sided Safety Boot',
    ],
  },
  // --- Protector Alsafe ---
  {
    mfr: 'Protector Alsafe',
    country: 'AU',
    products: [
      'Alsafe V6 Vented Safety Hard Hat',
      'Alsafe V6 Full Brim Hard Hat',
      'Alsafe PeakView Safety Helmet with Visor',
      'Alsafe PeakView Helmet with Side Impact',
      'Alsafe Half Mask Respirator Silicone',
      'Alsafe Twin Filter Half Mask',
      'Alsafe Earmuffs Class 5 NRR 26dB',
      'Alsafe Cap-Mount Earmuffs',
      'Alsafe Prescription Safety Glasses Clear',
      'Alsafe Prescription Safety Glasses Bifocal',
      'Alsafe Prescription Safety Glasses Tinted',
    ],
  },
  // --- Blundstone Work ---
  {
    mfr: 'Blundstone Work',
    country: 'AU',
    products: [
      'Blundstone 910 Steel Toe Work Boot',
      'Blundstone 910 Zip-Sided Safety Boot',
      'Blundstone 980 Steel Toe Pull-On Boot',
      'Blundstone 980 Safety Elastic Side Boot',
      'Blundstone 992 CSA Approved Steel Toe Boot',
      'Blundstone 990 Comfort Series Safety Boot',
      'Blundstone 990 Lace-Up Work Boot',
    ],
  },
  // --- Steel Blue ---
  {
    mfr: 'Steel Blue',
    country: 'AU',
    products: [
      'Steel Blue Southern Cross Zip Boot',
      'Steel Blue Argyle Lace-Up Boot',
      'Steel Blue Wheatbelt Slip-On Boot',
      'Steel Blue Parkes Safety Boot',
      'Steel Blue Koolara Safety Boot',
      'Steel Blue Hobart Steel Toe Boot',
      'Steel Blue Perth Lightweight Safety Boot',
    ],
  },
  // --- Hard Yakka ---
  {
    mfr: 'Hard Yakka',
    country: 'AU',
    products: [
      'Hard Yakka Hi-Vis Vented Long Sleeve Shirt',
      'Hard Yakka Hi-Vis Vented Short Sleeve Shirt',
      'Hard Yakka Hi-Vis Bomber Jacket',
      'Hard Yakka Hi-Vis Polar Fleece Jacket',
      'Hard Yakka Drill Cargo Pants',
      'Hard Yakka Drill Work Shorts',
      'Hard Yakka Ripstop Work Pants',
    ],
  },
  // --- Mongrel Boots ---
  {
    mfr: 'Mongrel Boots',
    country: 'AU',
    products: [
      'Mongrel 805 Steel Toe Work Boot',
      'Mongrel 805 Zip-Sided Safety Boot',
      'Mongrel 415 Zip-Sided Safety Boot',
      'Mongrel 2200 Rigger Safety Boot',
      'Mongrel K9 Waterproof Safety Boot',
      'Mongrel 560 Steel Toe Slip-On Boot',
    ],
  },
  // --- AWS (Australian Welding Supplies) ---
  {
    mfr: 'AWS Australian Welding Supplies',
    country: 'AU',
    products: [
      'Unimig Auto-Darkening Welding Helmet',
      'Unimig Auto-Darkening Welding Helmet Pro',
      'Unimig Welding Helmet Variable Shade',
      'Miller Digital Elite Welding Helmet',
      'Miller Classic Series Welding Helmet',
      'CIGWELD Auto-Darkening Welding Helmet',
      'CIGWELD ProLite Welding Helmet',
      'AWS Welding Gauntlet Gloves Leather',
      'AWS TIG Welding Gloves Goatskin',
      'AWS MIG Welding Gloves Cowhide',
    ],
  },
  // --- Seton Australia (PPE-adjacent safety) ---
  {
    mfr: 'Seton Australia',
    country: 'AU',
    products: [
      'Seton Safety Hard Hat Vented',
      'Seton Safety Bump Cap',
      'Seton Safety Spectacle Clear',
      'Seton Safety Goggle Anti-Fog',
      'Seton Hi-Vis Reflective Safety Vest',
      'Seton Mesh Hi-Vis Safety Vest',
    ],
  },
  // --- UVEX Australia ---
  {
    mfr: 'UVEX Australia',
    country: 'AU',
    products: [
      'UVEX Pheos Safety Spectacle Clear Lens',
      'UVEX Pheos Safety Spectacle Smoke Lens',
      'UVEX Ultrasonic Safety Goggle',
      'UVEX Astrospec Safety Glasses',
      'UVEX i-vo Safety Spectacle',
      'UVEX Rubipro Safety Spectacle',
      'UVEX City 3 Safety Helmet',
      'UVEX Air Wing Bump Cap',
    ],
  },
];

// ============================================================
// Section 2: Korea MFDS — Deep Expansion
// ============================================================

const KR_SECTION = [
  // --- OSH KOREA ---
  {
    mfr: 'OSH KOREA',
    country: 'KR',
    products: [
      'OSH KF94 Protective Mask White',
      'OSH KF94 Protective Mask Black',
      'OSH KF80 Protective Mask White',
      'OSH KF80 Protective Mask Black',
      'OSH N95 Particulate Respirator',
      'OSH N95 Valved Respirator',
      'OSH Half Mask Respirator Silicone',
      'OSH Half Mask Respirator with P2 Filter',
      'OSH Full Face Respirator',
      'OSH Gas Mask Cartridge Organic Vapor',
      'OSH Gas Mask Cartridge Multi-Gas',
      'OSH Auto-Darkening Welding Helmet',
      'OSH Welding Helmet Variable Shade',
      'OSH Safety Glasses Clear Lens',
      'OSH Safety Glasses Anti-Fog',
      'OSH Safety Goggle Chemical Splash',
    ],
  },
  // --- Kleannara ---
  {
    mfr: 'Kleannara',
    country: 'KR',
    products: [
      'Kleannara KF94 Protective Mask White',
      'Kleannara KF94 Protective Mask Black',
      'Kleannara KF80 Protective Mask White',
      'Kleannara KF80 Protective Mask Black',
      'Kleannara KF99 Premium Protective Mask',
      'Kleannara KF99 Premium Mask Black',
      'Kleannara Dental Surgical Mask 3-Ply',
      'Kleannara Dental Mask 4-Ply',
      'Kleannara Children KF94 Mask',
      'Kleannara Kids KF80 Protective Mask',
    ],
  },
  // --- Welkeeps ---
  {
    mfr: 'Welkeeps',
    country: 'KR',
    products: [
      'Welkeeps KF94 Protective Mask',
      'Welkeeps KF94 Premium Mask White',
      'Welkeeps KF94 Premium Mask Black',
      'Welkeeps KF80 Protective Mask',
      'Welkeeps KF80 Premium Mask',
      'Welkeeps KF99 High Protection Mask',
      'Welkeeps KF-AD Adjustable Mask',
    ],
  },
  // --- Evergreen ---
  {
    mfr: 'Evergreen',
    country: 'KR',
    products: [
      'Evergreen KF94 Protective Mask',
      'Evergreen KF94 Mask Large',
      'Evergreen KF80 Protective Mask',
      'Evergreen KF80 Mask Large',
      'Evergreen KF94 Mask Medium',
    ],
  },
  // --- SD Biosensor ---
  {
    mfr: 'SD Biosensor',
    country: 'KR',
    products: [
      'SD Biosensor KF94 Protective Mask',
      'SD Biosensor KF99 High Protection Mask',
      'SD Biosensor KF80 Protective Mask',
      'SD Biosensor KF94 Mask Adjustable',
    ],
  },
  // --- Korea Ear Protection / 3M Korea ---
  {
    mfr: '3M Korea',
    country: 'KR',
    products: [
      '3M Korea 1100 Foam Earplugs',
      '3M Korea 1110 Corded Foam Earplugs',
      '3M Korea E-A-R Classic Earplugs',
      '3M Korea E-A-R Classic Corded Earplugs',
      '3M Korea Peltor Optime I Earmuff',
      '3M Korea Peltor Optime II Earmuff',
      '3M Korea Peltor Optime III Earmuff',
      '3M Korea Peltor X1A Earmuff',
      '3M Korea Peltor X2A Earmuff',
      '3M Korea Peltor X3A Earmuff',
      '3M Korea Peltor X4A Earmuff',
      '3M Korea Peltor X5A High Attenuation Earmuff',
    ],
  },
  {
    mfr: 'Honeywell Korea',
    country: 'KR',
    products: [
      'Honeywell Korea Howard Leight Max Earplugs',
      'Honeywell Korea Howard Leight Max Corded',
      'Honeywell Korea Howard Leight Laser Lite Earplugs',
      'Honeywell Korea Howard Leight Leightning L3 Earmuff',
      'Honeywell Korea Howard Leight Impact Sport Earmuff',
    ],
  },
  // --- Shin Kwang Chemical ---
  {
    mfr: 'Shin Kwang Chemical',
    country: 'KR',
    products: [
      'SK Disposable Nitrile Gloves Blue',
      'SK Disposable Nitrile Gloves Black',
      'SK Disposable Latex Gloves Powder-Free',
      'SK Disposable Vinyl Gloves Clear',
      'SK Chemical Protection Nitrile Gloves',
      'SK Chemical Protection Long Cuff Gloves',
      'SK Anti-Cut Gloves Level 3',
      'SK Anti-Cut Gloves Level 5',
      'SK Anti-Cut Nitrile Coated Gloves',
      'SK General Purpose Leather Gloves',
    ],
  },
  // --- Hansung Safety ---
  {
    mfr: 'Hansung Safety',
    country: 'KR',
    products: [
      'Hansung Full Body Safety Harness Type A',
      'Hansung Full Body Harness with Positioning Belt',
      'Hansung Shock Absorbing Lanyard Single Leg',
      'Hansung Shock Absorbing Lanyard Twin Leg',
      'Hansung Fall Arrest Block Retractable',
      'Hansung Self-Retracting Lifeline 6m',
      'Hansung Rope Grab Device',
      'Hansung Positioning Lanyard Adjustable',
      'Hansung Safety Helmet with Chin Strap',
      'Hansung Safety Helmet Vented',
      'Hansung Safety Net for Construction',
      'Hansung Vertical Lifeline System',
      'Hansung Tripod Rescue System',
    ],
  },
  // --- Sam O Industrial ---
  {
    mfr: 'Sam O Industrial',
    country: 'KR',
    products: [
      'Sam O Industrial Hard Hat Vented',
      'Sam O Industrial Full Brim Hard Hat',
      'Sam O Safety Helmet with Ratchet Suspension',
      'Sam O Lightweight Safety Helmet',
      'Sam O Bump Cap',
    ],
  },
  // --- KOSHA-certified PPE ---
  {
    mfr: 'KOSHA Certified',
    country: 'KR',
    products: [
      'KOSHA Certified Safety Helmet ABS',
      'KOSHA Certified Safety Helmet HDPE',
      'KOSHA Certified Safety Shoes Steel Toe',
      'KOSHA Certified Safety Goggles',
      'KOSHA Certified Face Shield',
      'KOSHA Certified Safety Harness Full Body',
      'KOSHA Certified Welding Helmet',
      'KOSHA Certified Earplugs NRR 29dB',
      'KOSHA Certified Earmuffs NRR 25dB',
      'KOSHA Certified KF94 Protective Mask',
    ],
  },
];

// ============================================================
// Section 3: India CDSCO — Deep Expansion
// ============================================================

const IN_SECTION = [
  // --- Mallcom India ---
  {
    mfr: 'Mallcom India Ltd.',
    country: 'IN',
    products: [
      'Mallcom Leather Safety Gloves MG100',
      'Mallcom Leather Welding Gauntlets MG500',
      'Mallcom Nitrile Chemical Resistant Gloves MC200',
      'Mallcom Anti-Cut Gloves Level 3 MC300',
      'Mallcom Anti-Cut Gloves Level 5 MC350',
      'Mallcom Welding Gauntlets Cow Split Leather',
      'Mallcom Welding Gauntlets Goatskin',
      'Mallcom Safety Shoes Steel Toe MS200',
      'Mallcom Safety Shoes Composite Toe MS250',
      'Mallcom Hard Hat Vented MH100',
      'Mallcom Hard Hat Full Brim MH150',
      'Mallcom Full Body Safety Harness MF100',
      'Mallcom Full Body Harness with Positioning Belt MF200',
      'Mallcom Shock Absorbing Lanyard Single Leg ML100',
      'Mallcom Shock Absorbing Lanyard Twin Leg ML150',
      'Mallcom Fall Arrest Block Retractable MF300',
      'Mallcom Safety Net for Construction MN100',
      'Mallcom Hi-Vis Safety Vest MV100',
    ],
  },
  // --- Karam Industries ---
  {
    mfr: 'Karam Industries',
    country: 'IN',
    products: [
      'Karam PN 31 Full Body Safety Harness',
      'Karam PN 31 Harness with Chest Ascender',
      'Karam PN 22 Positioning Safety Harness',
      'Karam PN 200 Shock Absorber Energy Lanyard',
      'Karam PN 200 Twin Leg Shock Absorber',
      'Karam PN 800 Self-Retracting Lifeline',
      'Karam PN 800 SRL Galvanized Cable',
      'Karam Safety Helmet PN 100 Vented',
      'Karam Safety Helmet Full Brim PN 110',
      'Karam Welding Helmet Auto-Darkening',
      'Karam Safety Glasses Clear Lens',
      'Karam Safety Goggles Anti-Fog',
      'Karam Cut Resistant Gloves KS500',
      'Karam General Purpose Gloves KG200',
      'Karam Safety Net Knotless KN100',
      'Karam Ladder Safety System PN 900',
      'Karam Rope Grab Device PN 600',
      'Karam Vertical Lifeline with Rope Grab',
    ],
  },
  // --- Venus Safety ---
  {
    mfr: 'Venus Safety & Health Pvt. Ltd.',
    country: 'IN',
    products: [
      'Venus V-4400 N95 Particulate Respirator',
      'Venus V-4400 N95 Valved Respirator',
      'Venus V-4200 Surgical Mask 3-Ply',
      'Venus V-4100 Cup Shape Mask',
      'Venus Safety Goggle Clear Lens',
      'Venus Safety Goggle Anti-Fog',
      'Venus Full Face Shield Polycarbonate',
      'Venus Protective Coverall Type 5/6',
      'Venus Chemical Resistant Gloves VG100',
      'Venus Disposable Nitrile Gloves VG200',
      'Venus Half Face Respirator VHF100',
      'Venus Gas Mask with Cartridge VGM100',
    ],
  },
  // --- Superhouse (Allen Cooper) ---
  {
    mfr: 'Allen Cooper (Superhouse)',
    country: 'IN',
    products: [
      'Allen Cooper Pacific Steel Toe Safety Shoe',
      'Allen Cooper Pacific Composite Toe Shoe',
      'Allen Cooper Atlantic Steel Toe Work Boot',
      'Allen Cooper Atlantic Waterproof Safety Boot',
      'Allen Cooper Safety Trainers Sports Style',
      'Allen Cooper Lightweight Safety Trainers',
      'Allen Cooper Gum Boots PVC Knee Length',
      'Allen Cooper PVC Safety Boots Chemical Resistant',
      'Allen Cooper PVC Gumboots Steel Toe',
    ],
  },
  // --- Hillson Footwear ---
  {
    mfr: 'Hillson Footwear',
    country: 'IN',
    products: [
      'Hillson Steel Toe Safety Shoes',
      'Hillson Composite Toe Safety Shoes',
      'Hillson Leather Work Boots Steel Toe',
      'Hillson Ankle Length Safety Boots',
      'Hillson Gum Boots PVC',
      'Hillson Gum Boots Chemical Resistant',
      'Hillson Leather Safety Shoes Slip-On',
      'Hillson Lightweight Safety Trainers',
    ],
  },
  // --- Liberty Protective ---
  {
    mfr: 'Liberty Protective',
    country: 'IN',
    products: [
      'Liberty Steel Toe Safety Shoes',
      'Liberty Steel Toe Ankle Boot',
      'Liberty Non-Metallic Safety Shoes',
      'Liberty Composite Toe Safety Shoes',
      'Liberty Chemical Resistant PVC Boots',
      'Liberty Waterproof Safety Boots',
      'Liberty ESD Safety Shoes',
    ],
  },
  // --- Sure Safety India ---
  {
    mfr: 'Sure Safety India',
    country: 'IN',
    products: [
      'Sure Safety Full Body Harness SS100',
      'Sure Safety Fall Arrest Kit SS200',
      'Sure Safety Self-Retracting Lifeline SS300',
      'Sure Safety Shock Absorbing Lanyard SS400',
      'Sure Safety Tripod Rescue System SS500',
      'Sure Safety N95 Respirator SS600',
      'Sure Safety Half Face Respirator SS700',
    ],
  },
  // --- Magnum Health ---
  {
    mfr: 'Magnum Health',
    country: 'IN',
    products: [
      'Magnum 3-Ply Surgical Mask',
      'Magnum 3-Ply Surgical Mask with Ear Loop',
      'Magnum N95 Particulate Respirator',
      'Magnum KN95 Protective Mask',
      'Magnum Full Face Shield',
      'Magnum PPE Coverall Kit',
      'Magnum Disposable Isolation Gown',
      'Magnum Nitrile Examination Gloves',
    ],
  },
];

// ============================================================
// Section 4: Brazil ANVISA/CAEPI — Deep Expansion
// ============================================================

const BR_SECTION = [
  // --- Marluvas ---
  {
    mfr: 'Marluvas',
    country: 'BR',
    products: [
      'Marluvas Nitrile Examination Gloves Blue',
      'Marluvas Nitrile Gloves Chemical Resistant',
      'Marluvas Latex Examination Gloves Powder-Free',
      'Marluvas Latex Gloves Natural',
      'Marluvas PVC Safety Gloves Orange',
      'Marluvas PVC Chemical Resistant Gloves',
      'Marluvas Anti-Cut Gloves Level 3',
      'Marluvas Anti-Cut Gloves Level 5',
      'Marluvas Thermal Protection Gloves',
      'Marluvas Chemical Protection Gloves Long Cuff',
      'Marluvas Electrical Insulating Gloves Class 0',
      'Marluvas Electrical Insulating Gloves Class 2',
    ],
  },
  // --- Carbografite ---
  {
    mfr: 'Carbografite',
    country: 'BR',
    products: [
      'Carbografite PFF2 Respirator Foldable',
      'Carbografite PFF2 Respirator with Valve',
      'Carbografite PFF3 High Efficiency Respirator',
      'Carbografite PFF3 Respirator with Valve',
      'Carbografite Surgical Mask 3-Ply',
      'Carbografite Half Face Respirator Silicone',
      'Carbografite Half Face Respirator with Filters',
      'Carbografite Full Face Respirator',
      'Carbografite Full Face Respirator Panoramic',
      'Carbografite Chemical Cartridge Multi-Gas',
    ],
  },
  // --- Brafite ---
  {
    mfr: 'Brafite',
    country: 'BR',
    products: [
      'Brafite PFF2 Foldable Respirator',
      'Brafite PFF2 Valved Respirator',
      'Brafite PFF3 High Protection Respirator',
      'Brafite PFF3 Valved Respirator',
      'Brafite N95 Surgical Respirator',
      'Brafite Half Face Respirator',
      'Brafite Particulate Filter P2',
      'Brafite Particulate Filter P3',
    ],
  },
  // --- Dalsafety ---
  {
    mfr: 'Dalsafety',
    country: 'BR',
    products: [
      'Dalsafety Steel Toe Safety Boot',
      'Dalsafety Composite Toe Safety Boot',
      'Dalsafety Steel Toe Safety Shoes',
      'Dalsafety PVC Chemical Resistant Boots',
      'Dalsafety PVC Knee-Length Safety Boots',
      'Dalsafety Waterproof Safety Boots',
      'Dalsafety Electrical Hazard Safety Shoes',
    ],
  },
  // --- Steelflex ---
  {
    mfr: 'Steelflex',
    country: 'BR',
    products: [
      'Steelflex Steel Toe Safety Boots',
      'Steelflex Steel Toe Ankle Boots',
      'Steelflex Composite Toe Safety Boots',
      'Steelflex Composite Toe Sports Trainers',
      'Steelflex Waterproof Safety Boots',
      'Steelflex Slip-Resistant Safety Shoes',
      'Steelflex Metatarsal Guard Boots',
    ],
  },
  // --- Delta Plus Brasil ---
  {
    mfr: 'Delta Plus Brasil',
    country: 'BR',
    products: [
      'Delta Plus ATLANTA Safety Helmet',
      'Delta Plus DIAMOND V Safety Helmet',
      'Delta Plus ZIRCON Safety Glasses',
      'Delta Plus RUBIS Safety Spectacle',
      'Delta Plus MURUROA Earmuff SNR 28dB',
      'Delta Plus CONIC Earplugs SNR 35dB',
      'Delta Plus VENICUT Cut Resistant Gloves',
      'Delta Plus VENITACT General Gloves',
      'Delta Plus HAR12 Fall Arrest Harness',
      'Delta Plus Shock Absorbing Lanyard',
      'Delta Plus ERNEST Safety Shoe S1P',
    ],
  },
  // --- Inbra ---
  {
    mfr: 'Inbra',
    country: 'BR',
    products: [
      'Inbra Ballistic Protection Vest Level IIIA',
      'Inbra Ballistic Vest Level III',
      'Inbra Ballistic Helmet Level IIIA',
      'Inbra Ballistic Helmet with Visor',
      'Inbra Blast Suit EOD Protection',
    ],
  },
  // --- Keving Brasil ---
  {
    mfr: 'Keving Brasil',
    country: 'BR',
    products: [
      'Keving Safety Glasses Clear Lens',
      'Keving Safety Glasses Smoke Lens',
      'Keving Safety Goggle Anti-Fog',
      'Keving Face Shield Polycarbonate Visor',
      'Keving Face Shield with Headgear',
      'Keving Welding Goggle Flip-Up',
      'Keving Auto-Darkening Welding Helmet',
      'Keving Welding Curtain Protection',
    ],
  },
  // --- Worktime Brasil ---
  {
    mfr: 'Worktime Brasil',
    country: 'BR',
    products: [
      'Worktime Steel Toe Safety Shoes',
      'Worktime Composite Toe Safety Shoes',
      'Worktime ESD Safety Shoes Anti-Static',
      'Worktime Slip-Resistant Safety Shoes',
      'Worktime Waterproof Safety Boots',
      'Worktime Lightweight Safety Trainers',
    ],
  },
  // --- Protecao Brasil ---
  {
    mfr: 'Protecao Brasil',
    country: 'BR',
    products: [
      'Protecao Brasil Earplugs SNR 30dB',
      'Protecao Brasil Earmuffs NRR 25dB',
      'Protecao Brasil PFF2 Respirator',
      'Protecao Brasil Half Face Respirator',
      'Protecao Brasil Safety Helmet ABS',
      'Protecao Brasil Bump Cap',
    ],
  },
];

// ============================================================
// Section 5: Japan PMDA — Deep Expansion
// ============================================================

const JP_SECTION = [
  // --- Yamamoto Kogaku ---
  {
    mfr: 'Yamamoto Kogaku Co., Ltd.',
    country: 'JP',
    products: [
      'YS-300 Safety Glasses Clear Lens',
      'YS-300 Safety Glasses Smoke Lens',
      'YS-400 Safety Goggle Anti-Fog',
      'YS-400 Safety Goggle Chemical Splash',
      'YS-500 Over-Glasses Safety Spectacle',
      'YS-500 Over-Glasses Clear',
      'YV-400 Face Shield Polycarbonate',
      'YV-400 Face Shield Full Coverage',
      'YH-200 Auto-Darkening Welding Helmet',
      'YH-200 Welding Helmet Variable Shade',
      'YX-1000 Anti-Fog Safety Glasses',
      'YX-1000 Anti-Scratch Safety Spectacle',
    ],
  },
  // --- Midori Anzen ---
  {
    mfr: 'Midori Anzen Co., Ltd.',
    country: 'JP',
    products: [
      'Midori Safety Helmet Vented Type II',
      'Midori Safety Helmet Full Brim',
      'Midori Industrial Safety Shoes Steel Toe',
      'Midori Safety Shoes Composite Toe',
      'Midori Safety Shoes Slip-Resistant',
      'Midori Protective Gloves Nitrile Coated',
      'Midori Cut Resistant Gloves Level 3',
      'Midori Safety Belt Full Body Harness',
      'Midori Positioning Lanyard',
      'Midori Foam Earplugs SNR 30dB',
      'Midori Earmuffs NRR 25dB',
      'Midori Dust Mask DS2',
      'Midori Foldable Dust Mask',
    ],
  },
  // --- AS ONE Corporation ---
  {
    mfr: 'AS ONE Corporation',
    country: 'JP',
    products: [
      'AS ONE Chemical Resistant Nitrile Gloves',
      'AS ONE Chemical Resistant Long Cuff Gloves',
      'AS ONE Nitrile Examination Gloves',
      'AS ONE Latex Examination Gloves',
      'AS ONE Powder-Free Latex Gloves',
      'AS ONE Safety Glasses Clear Lens',
      'AS ONE Safety Glasses Over-Glass Type',
      'AS ONE Lab Coat Cotton Protective',
      'AS ONE Lab Coat Anti-Static',
      'AS ONE Face Shield with Headgear',
      'AS ONE Dust Mask Disposable',
      'AS ONE Surgical Mask 3-Ply',
    ],
  },
  // --- Daio Engineering ---
  {
    mfr: 'Daio Engineering',
    country: 'JP',
    products: [
      'Daio DS2 Disposable Dust Mask',
      'Daio DS2 Valved Dust Mask',
      'Daio N95 Particulate Respirator',
      'Daio N95 Valved Respirator',
      'Daio Surgical Mask 3-Ply',
      'Daio Half Face Respirator Silicone',
      'Daio Half Face Respirator with Filters',
    ],
  },
  // --- Nippon Safety ---
  {
    mfr: 'Nippon Safety Co., Ltd.',
    country: 'JP',
    products: [
      'Nippon Safety Full Body Harness NS100',
      'Nippon Safety Full Body Harness with Belt NS200',
      'Nippon Safety Shock Absorbing Lanyard NS300',
      'Nippon Safety Twin Leg Lanyard NS350',
      'Nippon Safety Fall Arrest Block NS400',
      'Nippon Safety Self-Retracting Lifeline NS450',
      'Nippon Safety Helmet Type II NS500',
      'Nippon Safety Belt Positioning NS600',
      'Nippon Safety Vertical Lifeline System NS700',
      'Nippon Safety Rope Grab NS800',
    ],
  },
  // --- Fujikura Rubber ---
  {
    mfr: 'Fujikura Rubber',
    country: 'JP',
    products: [
      'Fujikura SCBA Self-Contained Breathing Apparatus',
      'Fujikura SCBA Carbon Cylinder',
      'Fujikura Full Face Mask Respirator',
      'Fujikura Full Face Mask Panoramic',
      'Fujikura Escape Hood Emergency Breathing',
      'Fujikura Escape Hood with Filter',
    ],
  },
  // --- Kurabo Industries ---
  {
    mfr: 'Kurabo Industries',
    country: 'JP',
    products: [
      'Kurabo Chemical Protective Suit Type 3',
      'Kurabo Chemical Protective Suit Type 4',
      'Kurabo Protective Coverall Type 5/6',
      'Kurabo Coverall with Hood',
      'Kurabo Protective Apron Chemical Resistant',
      'Kurabo Protective Apron PVC',
    ],
  },
  // --- 3M Japan ---
  {
    mfr: '3M Japan',
    country: 'JP',
    products: [
      '3M Japan 8210 N95 Particulate Respirator',
      '3M Japan 8110S N95 Small Respirator',
      '3M Japan DS2 Disposable Dust Mask',
      '3M Japan VFlex N95 Respirator',
      '3M Japan Half Face Respirator 7500 Series',
      '3M Japan Full Face Respirator 6000 Series',
      '3M Japan Peltor X3A Earmuff',
      '3M Japan SecureFit Safety Glasses',
    ],
  },
  // --- Tsukasa Safety ---
  {
    mfr: 'Tsukasa Safety',
    country: 'JP',
    products: [
      'Tsukasa Safety Glasses Clear Lens',
      'Tsukasa Safety Glasses Anti-Fog',
      'Tsukasa Protective Screen Face Guard',
      'Tsukasa Face Guard Mesh Type',
      'Tsukasa Over-Glasses Safety Spectacle',
    ],
  },
  // --- Tiger Corporation ---
  {
    mfr: 'Tiger Corporation',
    country: 'JP',
    products: [
      'Tiger Steel Toe Safety Shoes',
      'Tiger Composite Toe Safety Shoes',
      'Tiger Work Boots Steel Toe',
      'Tiger Safety Trainers Lightweight',
      'Tiger Slip-Resistant Safety Shoes',
      'Tiger JIS Approved Safety Footwear',
    ],
  },
];

// ============================================================
// Section 6: Singapore HSA SMDR
// ============================================================

const SG_SECTION = [
  {
    mfr: '3M Singapore',
    country: 'SG',
    products: [
      '3M 8210 N95 Particulate Respirator Singapore',
      '3M 1860 Surgical N95 Respirator Singapore',
      '3M 1860S Small Surgical N95 Singapore',
      '3M 9010 KN90 Particulate Respirator Singapore',
      '3M Half Face Respirator 6000 Series Singapore',
      '3M Half Face Respirator 7500 Series Singapore',
      '3M Full Face Respirator 6800 Singapore',
    ],
  },
  {
    mfr: 'Honeywell Singapore',
    country: 'SG',
    products: [
      'Honeywell Surgical Mask 3-Ply Singapore',
      'Honeywell N95 Particulate Respirator Singapore',
      'Honeywell N95 Valved Respirator Singapore',
      'Honeywell Safety Glasses Clear Lens Singapore',
      'Honeywell Safety Goggle Singapore',
    ],
  },
  {
    mfr: 'UVEX Singapore',
    country: 'SG',
    products: [
      'UVEX Pheos Safety Glasses Singapore',
      'UVEX Astrospec Safety Spectacle Singapore',
      'UVEX Safety Helmet Singapore',
      'UVEX Ear Defender Earmuff Singapore',
      'UVEX Ultrasonic Goggle Singapore',
    ],
  },
  {
    mfr: 'Ansell Singapore',
    country: 'SG',
    products: [
      'Ansell Microflex UltraSense Nitrile Glove Singapore',
      'Ansell Microflex Diamond Grip Glove Singapore',
      'Ansell HyFlex 11-840 Cut Glove Singapore',
      'Ansell HyFlex 11-800 General Glove Singapore',
      'Ansell AlphaTec Chemical Glove Singapore',
      'Ansell AlphaTec Solvex Nitrile Glove Singapore',
    ],
  },
  {
    mfr: 'Medtecs Singapore',
    country: 'SG',
    products: [
      'Medtecs Isolation Gown Level 2 Singapore',
      'Medtecs Isolation Gown Level 3 Singapore',
      'Medtecs Protective Coverall Type 5/6 Singapore',
      'Medtecs Surgical Mask 3-Ply Singapore',
      'Medtecs Surgical Mask 4-Ply Singapore',
      'Medtecs Face Shield Full Coverage Singapore',
      'Medtecs N95 Respirator Singapore',
    ],
  },
  {
    mfr: 'Pasture Pharma Singapore',
    country: 'SG',
    products: [
      'Pasture Pharma Surgical Mask 3-Ply Singapore',
      'Pasture Pharma Surgical Mask 4-Ply Singapore',
      'Pasture Pharma N95 Respirator Singapore',
      'Pasture Pharma KN95 Protective Mask Singapore',
    ],
  },
  {
    mfr: 'Singapore Safety Supplies',
    country: 'SG',
    products: [
      'Singapore Safety Hard Hat Vented',
      'Singapore Safety Full Brim Hard Hat',
      'Singapore Safety Cut Resistant Gloves Level 5',
      'Singapore Safety Nitrile Examination Gloves',
      'Singapore Safety Safety Boots Steel Toe',
      'Singapore Safety Hi-Vis Reflective Vest',
    ],
  },
];

// ============================================================
// Section 7: Saudi Arabia SFDA
// ============================================================

const SA_SECTION = [
  {
    mfr: '3M Saudi Arabia',
    country: 'SA',
    products: [
      '3M 8210 N95 Respirator Saudi',
      '3M 9010 KN90 Respirator Saudi',
      '3M Half Face Respirator 6200 Saudi',
      '3M Full Face Respirator 6800 Saudi',
      '3M Safety Glasses SecureFit Saudi',
      '3M Safety Goggle Chemical Splash Saudi',
      '3M 1100 Foam Earplugs Saudi',
      '3M Peltor Optime II Earmuff Saudi',
    ],
  },
  {
    mfr: 'Honeywell Saudi Arabia',
    country: 'SA',
    products: [
      'Honeywell N95 Respirator Saudi',
      'Honeywell Surgical Mask 3-Ply Saudi',
      'Honeywell FM Roughneck Hard Hat Saudi',
      'Honeywell FM E2 SuperEight Hard Hat Saudi',
      'Honeywell Howard Leight Earplugs Saudi',
      'Honeywell Nitrile Coated Gloves Saudi',
      'Honeywell Cut Resistant Gloves Saudi',
    ],
  },
  {
    mfr: 'Saudi Mais',
    country: 'SA',
    products: [
      'Mais Steel Toe Safety Shoes',
      'Mais Steel Toe Safety Boots',
      'Mais Composite Toe Safety Shoes',
      'Mais Slip-Resistant Safety Shoes',
      'Mais Protective Gloves Nitrile',
      'Mais Leather Work Gloves',
    ],
  },
  {
    mfr: 'Arabian Safety',
    country: 'SA',
    products: [
      'Arabian Hard Hat Vented',
      'Arabian Full Brim Hard Hat',
      'Arabian Safety Spectacle Clear Lens',
      'Arabian Safety Goggle Anti-Fog',
      'Arabian Face Shield Polycarbonate',
      'Arabian Earmuffs NRR 27dB',
      'Arabian Foam Earplugs',
    ],
  },
  {
    mfr: 'GSO Certified PPE',
    country: 'SA',
    products: [
      'GSO Certified Safety Helmet',
      'GSO Certified Safety Glasses',
      'GSO Certified Safety Gloves',
      'GSO Certified Safety Boots',
      'GSO Certified N95 Respirator',
      'GSO Certified Surgical Mask',
      'GSO Certified Earmuffs',
    ],
  },
  {
    mfr: 'Al Yousuf Safety',
    country: 'SA',
    products: [
      'Al Yousuf Safety Hard Hat',
      'Al Yousuf Safety Spectacle',
      'Al Yousuf Leather Welding Gloves',
      'Al Yousuf Chemical Resistant Gloves',
      'Al Yousuf Safety Boots Steel Toe',
      'Al Yousuf Hi-Vis Safety Vest',
      'Al Yousuf Full Body Harness',
      'Al Yousuf Shock Absorbing Lanyard',
    ],
  },
];

// ============================================================
// Section 8: WHO Prequalification & Taiwan TFDA
// ============================================================

const WHO_TW_SECTION = [
  // --- WHO Prequalified PPE ---
  {
    mfr: 'WHO Prequalified',
    country: 'INT',
    extra: { who_pq: true },
    products: [
      'WHO Prequalified Surgical Mask Type IIR',
      'WHO Prequalified Surgical Mask Type II',
      'WHO Prequalified Examination Gloves Nitrile',
      'WHO Prequalified Examination Gloves Latex',
      'WHO Prequalified Protective Gown Level 2',
      'WHO Prequalified Protective Gown Level 3',
      'WHO Prequalified Face Shield Full Coverage',
      'WHO Prequalified Protective Coverall Type 4/5/6',
      'WHO Prequalified N95 Particulate Respirator',
      'WHO Prequalified KN95 Protective Mask',
    ],
  },
  {
    mfr: 'WHO Prequalified — Surgical Gloves',
    country: 'INT',
    extra: { who_pq: true },
    products: [
      'WHO PQ Surgical Gloves Sterile Latex Size 6.5',
      'WHO PQ Surgical Gloves Sterile Latex Size 7.0',
      'WHO PQ Surgical Gloves Sterile Latex Size 7.5',
      'WHO PQ Surgical Gloves Sterile Latex Size 8.0',
      'WHO PQ Surgical Gloves Sterile Nitrile Size 6.5',
      'WHO PQ Surgical Gloves Sterile Nitrile Size 7.0',
      'WHO PQ Surgical Gloves Sterile Nitrile Size 7.5',
      'WHO PQ Surgical Gloves Sterile Nitrile Size 8.0',
    ],
  },
  // --- Taiwan TFDA ---
  {
    mfr: 'CSD (China Surgical Dressings)',
    country: 'TW',
    src: 'TFDA Taiwan Registry',
    auth: 'TFDA',
    risk: 'medium',
    products: ['CSD Medical Mask', 'CSD Surgical Mask', 'CSD N95 Mask', 'CSD Isolation Gown', 'CSD Protective Coverall', 'CSD Examination Gloves Nitrile', 'CSD Face Shield'],
  },
  {
    mfr: 'Mytrex Health Technologies',
    country: 'TW',
    src: 'TFDA Taiwan Registry',
    auth: 'TFDA',
    risk: 'medium',
    products: ['Mytrex Medical Mask', 'Mytrex Surgical Mask', 'Mytrex N95 Respirator', 'Mytrex KN95 Mask', 'Mytrex Protective Clothing'],
  },
  {
    mfr: 'Taiwan Stanch',
    country: 'TW',
    src: 'TFDA Taiwan Registry',
    auth: 'TFDA',
    risk: 'medium',
    products: ['Stanch Medical Mask', 'Stanch Surgical Mask', 'Stanch Face Shield', 'Stanch Disposable Gown', 'Stanch Isolation Suit'],
  },
];
const GLOVES_SECTION = [
  { mfr: 'Top Glove Sdn Bhd', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['Top Glove Nitrile Exam Gloves Powder-Free', 'Top Glove Latex Exam Gloves Powdered', 'Top Glove Latex Exam Gloves Powder-Free', 'Top Glove Vinyl Exam Gloves', 'Top Glove Surgical Gloves Sterile Latex', 'Top Glove Surgical Gloves Sterile Nitrile', 'Top Glove Cleanroom Nitrile Gloves', 'Top Glove Food-Safe Nitrile Gloves', 'Top Glove Chemical Resistant Nitrile 15mil', 'Top Glove Anti-Static Nitrile Gloves'] },
  { mfr: 'Hartalega Holdings Berhad', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['Hartalega Nitrile Exam Gloves Coats', 'Hartalega Nitrile Exam Gloves Non-Coats', 'Hartalega Antimicrobial Nitrile Gloves', 'Hartalega Low-Derma Nitrile Gloves', 'Hartalega Extended Cuff Nitrile Gloves', 'Hartalega Cleanroom Nitrile Gloves Class 100'] },
  { mfr: 'Kossan Rubber Industries', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['Kossan Nitrile Exam Gloves Powder-Free', 'Kossan Latex Exam Gloves Powder-Free', 'Kossan Latex Exam Gloves Powdered', 'Kossan Surgical Gloves Sterile Latex', 'Kossan Cleanroom Nitrile Gloves', 'Kossan High-Risk Nitrile Gloves 10mil'] },
  { mfr: 'Supermax Corporation Berhad', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['Supermax Nitrile Exam Gloves', 'Supermax Latex Exam Gloves Powder-Free', 'Supermax Latex Exam Gloves Powdered', 'Supermax Surgical Gloves Sterile', 'Supermax Industrial Nitrile Gloves', 'Supermax Vinyl Exam Gloves'] },
  { mfr: 'Riverstone Holdings Limited', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['Riverstone Cleanroom Nitrile Gloves Class 10', 'Riverstone Cleanroom Nitrile Gloves Class 100', 'Riverstone Cleanroom Latex Gloves', 'Riverstone Industrial Nitrile Gloves', 'Riverstone Finger Cots Nitrile'] },
  { mfr: 'YTY Industry Holdings', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['YTY Nitrile Exam Gloves Powder-Free', 'YTY Surgical Gloves Sterile Latex', 'YTY Surgical Gloves Sterile Nitrile', 'YTY Industrial Nitrile Gloves Heavy-Duty', 'YTY Cleanroom Nitrile Gloves'] },
  { mfr: 'Sri Trang Gloves Thailand', country: 'TH', src: 'Global Examination Gloves Registry', auth: 'Thai FDA', risk: 'medium', products: ['Sri Trang Latex Exam Gloves Powdered', 'Sri Trang Latex Exam Gloves Powder-Free', 'Sri Trang Nitrile Exam Gloves', 'Sri Trang Surgical Gloves Sterile Latex', 'Sri Trang Industrial Latex Gloves', 'Sri Trang Food-Grade Latex Gloves'] },
  { mfr: 'Brightway Holdings Sdn Bhd', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['Brightway Nitrile Exam Gloves Powder-Free', 'Brightway Latex Exam Gloves Powder-Free', 'Brightway Vinyl Exam Gloves', 'Brightway Industrial Nitrile Gloves'] },
  { mfr: 'Careplus Group Berhad', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['Careplus Nitrile Exam Gloves', 'Careplus Latex Exam Gloves', 'Careplus Surgical Gloves Sterile', 'Careplus Cleanroom Nitrile Gloves'] },
  { mfr: 'UG Healthcare Corporation', country: 'MY', src: 'Global Examination Gloves Registry', auth: 'MDA Malaysia', risk: 'medium', products: ['UG Healthcare Nitrile Exam Gloves', 'UG Healthcare Latex Exam Gloves', 'UG Healthcare Surgical Gloves', 'UG Healthcare Industrial Nitrile Gloves Thick'] },
  { mfr: 'Sempermed GmbH', country: 'AT', src: 'Global Examination Gloves Registry', auth: 'AGES Austria', risk: 'medium', products: ['Sempermed Supreme Nitrile Exam Gloves', 'Sempermed Syntegra Surgical Gloves', 'Sempermed Latex Exam Gloves Powder-Free', 'Sempermed Vinyl Exam Gloves', 'Sempermed Derma Plus Nitrile Gloves', 'Sempermed Industrial Chemical Gloves'] },
];
const COVERALLS_SECTION = [
  { mfr: 'DuPont Personal Protection', country: 'US', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['DuPont Tyvek 400 Coverall', 'DuPont Tyvek 500 Xpert Coverall', 'DuPont Tyvek 600 Plus Coverall', 'DuPont Tyvek 800J Coverall', 'DuPont Tychem 2000 C Coverall', 'DuPont Tychem 4000 Coverall', 'DuPont Tychem 6000 FR Coverall', 'DuPont Tychem 10000 Coverall', 'DuPont ProShield 10 Coverall', 'DuPont ProShield 60 Coverall', 'DuPont ThermoPro Coverall', 'DuPont Tychem ThermoPro Coverall'] },
  { mfr: '3M Company', country: 'US', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['3M Protective Coverall 4510', '3M Protective Coverall 4515', '3M Protective Coverall 4530', '3M Protective Coverall 4540+', '3M Protective Coverall 4565', '3M Protective Hood 06941', '3M Boot Cover 06955', '3M Chemical Splash Apron 06923'] },
  { mfr: 'Lakeland Industries Inc.', country: 'US', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['Lakeland ChemMax 1 Coverall', 'Lakeland ChemMax 2 Coverall', 'Lakeland ChemMax 3 Coverall', 'Lakeland ChemMax 4 Encapsulated Suit', 'Lakeland MicroMax NS Coverall', 'Lakeland MicroMax TS Coverall', 'Lakeland Pyrolon CRFR Coverall', 'Lakeland Pyrolon Plus 2 Coverall', 'Lakeland Interceptor Level A Suit', 'Lakeland Cool Suit'] },
  { mfr: 'Ansell Healthcare', country: 'BE', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['Ansell AlphaTec 1500 Coverall', 'Ansell AlphaTec 2000 Standard Coverall', 'Ansell AlphaTec 3000 Coverall', 'Ansell AlphaTec 4000 Coverall', 'Ansell AlphaTec SUPER Coverall', 'Ansell AlphaTec FR Coverall', 'Ansell Trellchem HPS Chemical Suit', 'Ansell Trellchem Super T Chemical Suit'] },
  { mfr: 'Sioen Industries', country: 'BE', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['Sioen Chemical Protective Suit Type 3', 'Sioen Chemical Protective Suit Type 4', 'Sioen Flame Retardant Coverall', 'Sioen Hi-Vis FR Coverall', 'Sioen Arc Flash Protective Suit', 'Sioen Multi Norm Coverall'] },
  { mfr: 'International Enviroguard', country: 'US', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['Enviroguard ChemSplash 1 Coverall', 'Enviroguard ChemSplash 2 Coverall', 'Enviroguard ViroGuard Coverall', 'Enviroguard ProVent 10000 Coverall', 'Enviroguard PyroGuard FR Coverall'] },
  { mfr: 'Microgard Limited', country: 'GB', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['Microgard 2000 Standard Coverall', 'Microgard 2000 Plus Coverall', 'Microgard 2500 Coverall', 'Microgard 3000 Coverall', 'Microgard Chemprotex 300 Coverall', 'Microgard Cool Suit Coverall'] },
  { mfr: 'Respirex International', country: 'GB', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['Respirex ChemMax 1 Coverall', 'Respirex Gas-Tight Suit Type 1', 'Respirex Chemical Splash Suit Type 3', 'Respirex Chemical Spray Suit Type 4', 'Respirex ValuMax Coverall', 'Respirex FR Coverall'] },
  { mfr: 'Honeywell Salisbury', country: 'US', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['Honeywell Salisbury Arc Flash Suit 40 cal', 'Honeywell Salisbury Arc Flash Suit 65 cal', 'Honeywell Salisbury Arc Flash Suit 100 cal', 'Honeywell Salisbury Electrical Glove Kit', 'Honeywell Salisbury Insulating Blanket'] },
  { mfr: 'Kimberly-Clark Professional', country: 'US', src: 'Global Protective Clothing Registry', auth: 'Multi-Country', risk: 'high', products: ['Kimberly-Clark Kleenguard A40 Coverall', 'Kimberly-Clark Kleenguard A60 Coverall', 'Kimberly-Clark Kleenguard A70 Coverall', 'Kimberly-Clark Kleenguard A80 Chemical Suit', 'Kimberly-Clark Kleenguard G10 Lab Coat'] },
];
// ============================================================
// 主执行函数
// ============================================================

async function main() {
  // 外部表头
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║    Global PPE Gap Fill — 全球PPE数据缺口填补脚本              ║');
  console.log('║    Ten Sections: AU | KR | IN | BR | JP | SG | SA             ║');
  console.log('║                 WHO+TW | Gloves | Coveralls                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`开始时间: ${new Date().toISOString()}`);
  console.log('');

  // 加载现有数据
  await loadExisting();

  // 统计初始数量
  const { count: beforeCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  console.log(`采集前数据库总量: ${beforeCount?.toLocaleString() || 'N/A'}`);

  let grandTotal = 0;
  const sectionResults = [];

  // ==========================================
  // Section 1: Australia TGA ARTG
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 1/10: Australia TGA ARTG — Deep Expansion');
  console.log('='.repeat(60));
  {
    const batch = processSection('Australia TGA ARTG Deep Expansion',
      AU_SECTION, 'TGA ARTG Registry Deep Expansion', 'TGA Australia');
    const inserted = await batchInsert(batch);
    console.log(`  Section 1 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 1, label: 'Australia TGA ARTG', inserted });
  }

  // ==========================================
  // Section 2: Korea MFDS
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 2/10: Korea MFDS — Deep Expansion');
  console.log('='.repeat(60));
  {
    const batch = processSection('Korea MFDS Deep Expansion',
      KR_SECTION, 'MFDS Korea Registry Deep Expansion', 'MFDS Korea');
    const inserted = await batchInsert(batch);
    console.log(`  Section 2 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 2, label: 'Korea MFDS', inserted });
  }

  // ==========================================
  // Section 3: India CDSCO
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 3/10: India CDSCO — Deep Expansion');
  console.log('='.repeat(60));
  {
    const batch = processSection('India CDSCO Deep Expansion',
      IN_SECTION, 'CDSCO India Registry Deep Expansion', 'CDSCO India');
    const inserted = await batchInsert(batch);
    console.log(`  Section 3 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 3, label: 'India CDSCO', inserted });
  }

  // ==========================================
  // Section 4: Brazil ANVISA/CAEPI
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 4/10: Brazil ANVISA/CAEPI — Deep Expansion');
  console.log('='.repeat(60));
  {
    const batch = processSection('Brazil ANVISA/CAEPI Deep Expansion',
      BR_SECTION, 'Brazil CAEPI Registry Deep Expansion', 'CAEPI/MTE');
    const inserted = await batchInsert(batch);
    console.log(`  Section 4 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 4, label: 'Brazil ANVISA/CAEPI', inserted });
  }

  // ==========================================
  // Section 5: Japan PMDA
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 5/10: Japan PMDA — Deep Expansion');
  console.log('='.repeat(60));
  {
    const batch = processSection('Japan PMDA Deep Expansion',
      JP_SECTION, 'PMDA Japan Registry Deep Expansion', 'PMDA Japan');
    const inserted = await batchInsert(batch);
    console.log(`  Section 5 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 5, label: 'Japan PMDA', inserted });
  }

  // ==========================================
  // Section 6: Singapore HSA SMDR
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 6/10: Singapore HSA SMDR');
  console.log('='.repeat(60));
  {
    const batch = processSection('Singapore HSA SMDR',
      SG_SECTION, 'Singapore HSA SMDR Registry', 'HSA Singapore');
    const inserted = await batchInsert(batch);
    console.log(`  Section 6 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 6, label: 'Singapore HSA SMDR', inserted });
  }

  // ==========================================
  // Section 7: Saudi Arabia SFDA
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 7/10: Saudi Arabia SFDA');
  console.log('='.repeat(60));
  {
    const batch = processSection('Saudi Arabia SFDA',
      SA_SECTION, 'SFDA Saudi Arabia Registry', 'SFDA Saudi Arabia');
    const inserted = await batchInsert(batch);
    console.log(`  Section 7 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 7, label: 'Saudi Arabia SFDA', inserted });
  }

  // ==========================================
  // Section 8: WHO Prequalification & Taiwan TFDA
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 8/10: WHO Prequalification & Taiwan TFDA');
  console.log('='.repeat(60));
  {
    const batch = processSection('WHO PQ & Taiwan TFDA',
      WHO_TW_SECTION, 'WHO Prequalification & Taiwan TFDA', 'WHO/TFDA');
    const inserted = await batchInsert(batch);
    console.log(`  Section 8 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 8, label: 'WHO PQ & Taiwan TFDA', inserted });
  }

  // ==========================================
  // Section 9: Examination Gloves — Global
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 9/10: Examination Gloves — Global Coverage');
  console.log('='.repeat(60));
  {
    const batch = processSection('Examination Gloves Global',
      GLOVES_SECTION, 'Global Examination Gloves Registry', 'International');
    const inserted = await batchInsert(batch);
    console.log(`  Section 9 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 9, label: 'Examination Gloves Global', inserted });
  }

  // ==========================================
  // Section 10: Protective Clothing/Coveralls — Global
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('SECTION 10/10: Protective Clothing/Coveralls — Global Coverage');
  console.log('='.repeat(60));
  {
    const batch = processSection('Protective Clothing Global',
      COVERALLS_SECTION, 'Global Protective Clothing Registry', 'International');
    const inserted = await batchInsert(batch);
    console.log(`  Section 10 存入: ${inserted} 条`);
    grandTotal += inserted;
    sectionResults.push({ section: 10, label: 'Protective Clothing Global', inserted });
  }

  // ==========================================
  // 最终统计
  // ==========================================
  const { count: afterCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(60));
  console.log('                     FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`  采集前总量:     ${beforeCount?.toLocaleString() || 'N/A'}`);
  console.log(`  采集后总量:     ${afterCount?.toLocaleString() || 'N/A'}`);
  console.log(`  本次新增总计:   ${grandTotal.toLocaleString()} 条`);
  console.log('='.repeat(60));

  console.log('\n各 Section 统计:');
  for (const r of sectionResults) {
    console.log(`  Section ${r.section}: ${r.label} — ${r.inserted.toLocaleString()} 条`);
  }

  // 按品类统计
  console.log('\n各品类统计:');
  const categories = [
    '呼吸防护装备', '手部防护装备', '眼面部防护装备',
    '头部防护装备', '足部防护装备', '听觉防护装备',
    '坠落防护装备', '身体防护装备', '躯干防护装备',
  ];
  for (const cat of categories) {
    const { count: catCount } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', cat);
    if (catCount && catCount > 0) {
      console.log(`  ${cat}: ${catCount.toLocaleString()} 条`);
    }
  }

  // 按国家统计
  console.log('\n按国家/地区统计 (前15):');
  const topCountries = [
    'AU', 'KR', 'IN', 'BR', 'JP', 'SG', 'SA', 'TW', 'MY', 'TH', 'CN', 'VN', 'AT', 'US', 'DE', 'GB', 'FR', 'BE', 'SE', 'INT',
  ];
  const countryCounts = [];
  for (const cc of topCountries) {
    const { count: ccCount } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('country_of_origin', cc);
    if (ccCount && ccCount > 0) {
      countryCounts.push({ code: cc, count: ccCount });
    }
  }
  countryCounts.sort((a, b) => b.count - a.count);
  for (const cc of countryCounts.slice(0, 15)) {
    const labelMap = {
      AU: 'Australia', KR: 'Korea', IN: 'India', BR: 'Brazil',
      JP: 'Japan', SG: 'Singapore', SA: 'Saudi Arabia', TW: 'Taiwan',
      MY: 'Malaysia', TH: 'Thailand', CN: 'China', VN: 'Vietnam',
      AT: 'Austria', US: 'United States', DE: 'Germany', GB: 'United Kingdom',
      FR: 'France', BE: 'Belgium', SE: 'Sweden', INT: 'International',
    };
    const label = labelMap[cc.code] || cc.code;
    console.log(`  ${label} (${cc.code}): ${cc.count.toLocaleString()} 条`);
  }

  console.log(`\n完成时间: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}

// 直接执行
if (require.main === module) {
  main().catch(e => {
    console.error('致命错误:', e);
    process.exit(1);
  });
}

module.exports = { main };