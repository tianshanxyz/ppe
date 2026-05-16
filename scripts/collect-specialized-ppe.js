#!/usr/bin/env node
/**
 * ============================================================================
 * collect-specialized-ppe.js
 * 专门采集代表性不足的PPE品类数据：
 *   头部防护装备 (Head Protection)
 *   足部防护装备 (Foot Protection)
 *   听觉防护装备 (Hearing Protection)
 *   坠落防护装备 (Fall Protection)
 *
 * 数据来源：
 *   1. FDA openFDA 510(k) API - 产品代码 + 关键词检索
 *   2. 精选全球品牌手工整理数据
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
  // 头部防护
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat|safety.*hard.?hat/i.test(s)) return '头部防护装备';
  if (/安全帽|头盔/i.test(n)) return '头部防护装备';
  // 足部防护
  if (/safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|composite.*toe|safety.*footwear|work.*boot/i.test(s)) return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋/i.test(n)) return '足部防护装备';
  // 听觉防护
  if (/earplug|ear.?muff|hearing.*protect|noise.*reduc|earmuff|ear.?defender|ear.?protect/i.test(s)) return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪/i.test(n)) return '听觉防护装备';
  // 坠落防护
  if (/safety.*harness|lanyard|self.?retract|lifeline|fall.*arrest|fall.*protect|shock.?absorb|retractable|carabiner|anchor.*point|roof.?anchor|confined.*space.*tripod|rescue.*descender/i.test(s)) return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线/i.test(n)) return '坠落防护装备';
  // 其他PPE品类（避免误判）
  if (/respirat|n95|kn95|ffp[123]|mask|breathing|scba|gas.?mask|air.?purif|papr|dust.?mask|p100|p99|r95|kp95|kf94|kf95/i.test(s)) return '呼吸防护装备';
  if (/glove|nitrile|latex|cut.?resist|examination.?glove|surgical.?glove/i.test(s)) return '手部防护装备';
  if (/goggle|eye.?protect|face.?shield|visor|safety.*glass|welding.*helmet|welding.*mask|auto.?dark|faceshield/i.test(s)) return '眼面部防护装备';
  if (/coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.*flash|isolation.*gown|surgical.*gown|protective.*gown|tyvek|tychem|nomex/i.test(s)) return '身体防护装备';
  return '其他';
}

// ---------- API ----------
async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MDLooker-PPE-Specialized/1.0' },
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

// ============================================================
// 品类定义
// ============================================================

const SPECIALIZED_CATEGORIES = {
  fall: {
    label: '坠落防护装备',
    labelEn: 'Fall Protection',
    codes: [
      // 用户指定的特定产品代码
      'OSR', 'OSQ', 'OSS', 'OSU',
      // 补充现有项目中的 fall 相关代码
      'GCA', 'GCB', 'GCC', 'GCD', 'GCE', 'GCF', 'GCG', 'GCH', 'GCI', 'GCJ',
      'GCK', 'GCL', 'GCM', 'GCN', 'GCO', 'GCP', 'GCQ', 'GCR', 'GCS', 'GCT',
      'GCU', 'GCV', 'GCW', 'GCX', 'GCY', 'GCZ',
      'GDA', 'GDB', 'GDC', 'GDD', 'GDE', 'GDF', 'GDG', 'GDH', 'GDI', 'GDJ',
      'GDK', 'GDL', 'GDM', 'GDN', 'GDO', 'GDP', 'GDQ', 'GDR', 'GDS', 'GDT',
      'GDU', 'GDV', 'GDW', 'GDX', 'GDY', 'GDZ',
    ],
    keywords: [
      'fall+arrest', 'safety+harness', 'lanyard', 'self-retracting+lifeline',
      'fall+protection', 'shock+absorbing+lanyard', 'retractable+lifeline',
    ],
  },
  head: {
    label: '头部防护装备',
    labelEn: 'Head Protection',
    codes: [
      // 用户指定的特定产品代码
      'OTH', 'OTG',
      // 补充现有项目中的 head 相关代码
      'FZM', 'FZN', 'FZO', 'FZP', 'FZQ', 'FZR', 'FZS', 'FZT', 'FZU', 'FZV',
      'FZW', 'FZX', 'FZY', 'FZZ',
      'GAA', 'GAB', 'GAC', 'GAD', 'GAE', 'GAF', 'GAG', 'GAH', 'GAI', 'GAJ',
      'GAK', 'GAL', 'GAM', 'GAN', 'GAO',
    ],
    keywords: [
      'hard+hat', 'safety+helmet', 'industrial+helmet', 'bump+cap',
      'head+protector', 'hardhat',
    ],
  },
  foot: {
    label: '足部防护装备',
    labelEn: 'Foot Protection',
    codes: [
      'FZA', 'FZB', 'FZC', 'FZD', 'FZE', 'FZF', 'FZG', 'FZH', 'FZI', 'FZJ',
      'FZK', 'FZL',
    ],
    keywords: [
      'safety+boot', 'safety+shoe', 'protective+footwear', 'steel+toe',
      'composite+toe', 'metatarsal+guard', 'safety+footwear', 'work+boot',
    ],
  },
  hearing: {
    label: '听觉防护装备',
    labelEn: 'Hearing Protection',
    codes: [
      'GAX', 'GAY', 'GAZ', 'GBA', 'GBB', 'GBC', 'GBD', 'GBE', 'GBF', 'GBG',
      'GBH', 'GBI', 'GBJ', 'GBK', 'GBL', 'GBM', 'GBN', 'GBO', 'GBP', 'GBQ',
      'GBR', 'GBS', 'GBT', 'GBU', 'GBV', 'GBW', 'GBX', 'GBY', 'GBZ',
    ],
    keywords: [
      'earplug', 'ear+muff', 'hearing+protector', 'noise+reduction',
      'ear+protector', 'earmuff',
    ],
  },
};

// ============================================================
// 精选全球品牌数据
// ============================================================

const CURATED_BRANDS = {
  fall: [
    {
      mfr: '3M DBI-SALA',
      country: 'US',
      products: [
        '3M DBI-SALA ExoFit NEX Full Body Harness',
        '3M DBI-SALA Nano-Lok Self-Retracting Lifeline',
        '3M DBI-SALA Ultra-Lok SRL-R Self-Retracting Lifeline',
        '3M DBI-SALA EZ-Line Retractable Horizontal Lifeline',
        '3M DBI-SALA Delta Comfort Harness',
        '3M DBI-SALA Force2 Shock Absorbing Lanyard',
        '3M DBI-SALA RoofSafe Anchor System',
      ],
    },
    {
      mfr: 'MSA Safety Inc.',
      country: 'US',
      products: [
        'MSA V-FORM Full Body Safety Harness',
        'MSA V-TEC PFL Personal Fall Limiter',
        'MSA V-EDGE Self-Retracting Lifeline',
        'MSA V-Series Fall Protection Harness',
        'MSA Workman Confined Space Rescue System',
        'MSA V-Gard Fall Protection Kit',
      ],
    },
    {
      mfr: 'Petzl Professional',
      country: 'FR',
      products: [
        'Petzl AVAO BOD FAST Harness',
        'Petzl FALCON Ascent Fall Protection Harness',
        'Petzl ASAP LOCK Mobile Fall Arrester',
        'Petzl ABSORBICA-I Energy Absorber',
        'Petzl JANE Horizontal Lifeline System',
        'Petzl GRILLON Adjustable Lanyard',
        'Petzl PRO TRAXION Rescue Pulley',
      ],
    },
    {
      mfr: 'Guardian Fall Protection',
      country: 'US',
      products: [
        'Guardian Velocity Self-Retracting Lifeline',
        'Guardian Seraph Full Body Harness',
        'Guardian Halo Web SRL-R',
        'Guardian Bracket Anchor Point',
        'Guardian Tuxx Cross-Arm Strap',
        'Guardian Adjustable Positioning Lanyard',
      ],
    },
    {
      mfr: 'Miller Fall Protection (Honeywell)',
      country: 'US',
      products: [
        'Miller RevolutioN Full Body Harness',
        'Miller Falcon Self-Retracting Lifeline',
        'Miller TurboLite Personal Fall Limiter',
        'Miller StopFall SB Roof Anchor',
        'Miller Vi-Go Vertical Lifeline System',
        'Miller MightEvac Rescue System',
      ],
    },
    {
      mfr: 'Capital Safety',
      country: 'US',
      products: [
        'Capital Safety Force2 D-Ring Harness',
        'Capital Safety Lad-Saf Cable Climbing System',
        'Capital Safety EZ Stop Shock Absorbing Lanyard',
        'Capital Safety Sealed-Blok SRL',
        'Capital Safety FlexiGuard Modular Jib System',
      ],
    },
    {
      mfr: 'Protecta (3M)',
      country: 'US',
      products: [
        'Protecta PRO Full Body Harness',
        'Protecta Rebel Self-Retracting Lifeline',
        'Protecta First-Man-Up Rescue Kit',
        'Protecta Cable Sleeve Fall Arrester',
        'Protecta Fixed Beam Anchor',
      ],
    },
  ],
  head: [
    {
      mfr: '3M (Peltor)',
      country: 'US',
      products: [
        '3M Peltor G3000 Industrial Safety Helmet',
        '3M Peltor SecureFit X5000 Safety Helmet',
        '3M Peltor Uvicator Sensor Safety Helmet',
        '3M Peltor H700 Series Hard Hat',
        '3M Peltor Visor Carrier Helmet System',
      ],
    },
    {
      mfr: 'Bullard',
      country: 'US',
      products: [
        'Bullard C30 Standard Hard Hat',
        'Bullard S62 Full Brim Hard Hat',
        'Bullard S51 Ventilated Hard Hat',
        'Bullard 502 Series Bump Cap',
        'Bullard ADVENT Lightweight Helmet',
        'Bullard Centurion Fire Helmet',
      ],
    },
    {
      mfr: 'MSA Safety Inc.',
      country: 'US',
      products: [
        'MSA V-Gard Standard Hard Hat',
        'MSA V-Gard Full Brim Hard Hat',
        'MSA V-Gard 500 Cap Style Helmet',
        'MSA V-Gard H1 Safety Helmet',
        'MSA Skullgard Protective Helmet',
      ],
    },
    {
      mfr: 'Honeywell Fibre-Metal',
      country: 'US',
      products: [
        'Honeywell Fibre-Metal E2 SuperEight Hard Hat',
        'Honeywell Fibre-Metal Roughneck P2 Cap',
        'Honeywell Fibre-Metal Full Brim Hard Hat',
        'Honeywell Fusion Head Protection System',
        'Honeywell Fibre-Metal Tigerhood Welding Helmet',
      ],
    },
    {
      mfr: 'ERB Industries',
      country: 'US',
      products: [
        'ERB Omega II Safety Helmet',
        'ERB Americana Full Brim Hard Hat',
        'ERB 1910 Bump Cap',
        'ERB Safety Zone Vented Hard Hat',
        'ERB Cyclone Ratchet Suspension Hard Hat',
      ],
    },
    {
      mfr: 'JSP Ltd.',
      country: 'GB',
      products: [
        'JSP EVO8 Safety Helmet',
        'JSP EVO2 Industrial Safety Helmet',
        'JSP EVO610 Bump Cap',
        'JSP MK2 Hard Hat',
        'JSP HardCap Aerolite Bump Cap',
      ],
    },
    {
      mfr: 'Centurion Safety',
      country: 'GB',
      products: [
        'Centurion Nexus Safety Helmet',
        'Centurion Reflex Bump Cap',
        'Centurion Vulcan Full Brim Hard Hat',
        'Centurion Concept Helmet System',
        'Centurion Shield Pro Safety Helmet',
      ],
    },
    {
      mfr: 'Uvex Safety Group',
      country: 'DE',
      products: [
        'Uvex Pheos E-WR Safety Helmet',
        'Uvex Air Wing Bump Cap',
        'Uvex Pheos Forestry Helmet System',
        'Uvex City 3 Safety Helmet',
        'Uvex USB Ultra Safety Helmet',
      ],
    },
  ],
  foot: [
    {
      mfr: 'Timberland PRO',
      country: 'US',
      products: [
        'Timberland PRO Pit Boss Steel Toe Boot',
        'Timberland PRO Boondock Composite Toe Boot',
        'Timberland PRO Endurance 6-inch Work Boot',
        'Timberland PRO Helix Metatarsal Guard Boot',
        'Timberland PRO Powertrain Sport Alloy Toe',
      ],
    },
    {
      mfr: 'Red Wing Shoes',
      country: 'US',
      products: [
        'Red Wing King Toe 2244 Steel Toe Boot',
        'Red Wing Supersole 2.0 Work Boot',
        'Red Wing TruWelt 4416 Safety Boot',
        'Red Wing Worx 5330 Metatarsal Guard Boot',
        'Red Wing Pecos 1155 Pull-On Boot',
      ],
    },
    {
      mfr: 'Wolverine',
      country: 'US',
      products: [
        'Wolverine Raider Steel Toe Work Boot',
        'Wolverine Floorhand Waterproof Safety Boot',
        'Wolverine Overpass CarbonMax Composite Toe',
        'Wolverine Hellcat UltraSpring Boot',
        'Wolverine Harrison Steel Toe Boot',
      ],
    },
    {
      mfr: 'Caterpillar Footwear',
      country: 'US',
      products: [
        'CAT Second Shift Steel Toe Work Boot',
        'CAT Threshold Waterproof Safety Boot',
        'CAT Connexion Composite Toe Boot',
        'CAT Invader Steel Toe Hiker',
        'CAT Argon Composite Toe Work Shoe',
      ],
    },
    {
      mfr: 'Keen Utility',
      country: 'US',
      products: [
        'Keen Utility Pittsburgh Steel Toe Boot',
        'Keen Utility Davenport Metatarsal Guard Boot',
        'Keen Utility Troy Composite Toe Boot',
        'Keen Utility Detroit Steel Toe Shoe',
        'Keen Utility Flint Low Steel Toe Shoe',
      ],
    },
    {
      mfr: 'Dunlop Protective Footwear',
      country: 'NL',
      products: [
        'Dunlop Purofort Thermo+ Safety Boot',
        'Dunlop Acifort PVC Full Safety Boot',
        'Dunlop Full Safety Chemical Resistant Boot',
        'Dunlop Purofort Profi Safety Boot',
        'Dunlop EOD Safety Boot Heavy Duty',
      ],
    },
    {
      mfr: 'Bekina Boots',
      country: 'BE',
      products: [
        'Bekina Steplite X Solidgrip Safety Boot',
        'Bekina SafeBoot Neofood Safety Boot',
        'Bekina AgriLite Protective Boot',
        'Bekina Thermolite Insulated Safety Boot',
        'Bekina EasyBoot PVC Safety Boot',
      ],
    },
    {
      mfr: 'Rahman Group',
      country: 'IN',
      products: [
        'Rahman Super Star Steel Toe Safety Shoe',
        'Rahman Ace Composite Toe Safety Boot',
        'Rahman Grip Sole Anti-Slip Safety Shoe',
        'Rahman Guard Pro Metatarsal Safety Boot',
        'Rahman Legend Waterproof Safety Boot',
      ],
    },
  ],
  hearing: [
    {
      mfr: '3M Peltor',
      country: 'US',
      products: [
        '3M Peltor Optime 105 Over-the-Head Earmuff',
        '3M Peltor X5A High Attenuation Earmuff',
        '3M Peltor EEP-100 Electronic Earplug',
        '3M Peltor TacticalPro Hearing Protector',
        '3M Peltor WS Alert XPI Headset',
        '3M Peltor LiteCom Plus Communication Earmuff',
      ],
    },
    {
      mfr: 'Honeywell Howard Leight',
      country: 'US',
      products: [
        'Howard Leight Impact Sport Electronic Earmuff',
        'Howard Leight Max Corded Foam Earplugs',
        'Howard Leight Leightning L3 Folding Earmuff',
        'Howard Leight SmartFit Disposable Earplug',
        'Howard Leight Quiet Band Earplugs',
        'Howard Leight Laser Lite Earplug',
      ],
    },
    {
      mfr: 'Moldex-Metric',
      country: 'US',
      products: [
        'Moldex SparkPlugs Foam Earplugs',
        'Moldex M1 Folding Earmuff',
        'Moldex Contours Banded Earplug',
        'Moldex BattlePlugs Impulse Earplug',
        'Moldex Rockets Reusable Earplug',
        'Moldex M4 Cap-Mount Earmuff',
      ],
    },
    {
      mfr: 'MSA Sordin',
      country: 'SE',
      products: [
        'MSA Sordin Supreme Pro-X Electronic Earmuff',
        'MSA Sordin Sharp Passive Earmuff',
        'MSA Sordin Left/RIGHT Modular Earmuff',
        'MSA Sordin T2 Tactical Headset',
        'MSA Sordin Supreme Basic Earmuff',
      ],
    },
    {
      mfr: 'Sensear',
      country: 'AU',
      products: [
        'Sensear SM1R SmartMuff Hearing Protector',
        'Sensear SM1P IS Intrinsically Safe Headset',
        'Sensear SP1R Smart Earplug',
        'Sensear SM1B Bluetooth Earmuff',
        'Sensear SM1xSR Smart Headset',
      ],
    },
    {
      mfr: 'ISOtunes',
      country: 'US',
      products: [
        'ISOtunes PRO 2.0 Bluetooth Earmuff',
        'ISOtunes FREE Aware Wireless Earplug',
        'ISOtunes Link Aware Bluetooth Earmuff',
        'ISOtunes XTRA 2.0 Noise Isolating Earbud',
        'ISOtunes Sport ADVANCE Earplug',
      ],
    },
    {
      mfr: 'Pro Ears',
      country: 'US',
      products: [
        'Pro Ears Silver 22 Passive Earmuff',
        'Pro Ears Ultra Pro Electronic Earmuff',
        'Pro Ears Predator Gold Shooting Muff',
        'Pro Ears Pro Tac 300 Electronic Earmuff',
        'Pro Ears Stealth Compact Earmuff',
      ],
    },
    {
      mfr: 'Decibel Defense',
      country: 'US',
      products: [
        'Decibel Defense Professional Safety Earmuff',
        'Decibel Defense Supreme Foldable Earmuff',
        'Decibel Defense Ultra-Slim Hearing Protector',
        'Decibel Defense Kids Ear Protection Muff',
        'Decibel Defense Pro Earmuff NRR 37dB',
      ],
    },
  ],
};

// ============================================================
// 采集函数
// ============================================================

/**
 * 通过 FDA 510(k) 产品代码搜索采集
 */
async function collectByProductCodes(codes, category, label) {
  console.log(`\n-- [${label}] 按产品代码搜索 openFDA 510(k) --`);
  const uniqueCodes = [...new Set(codes)];
  let total = 0;
  const batch = [];

  for (const code of uniqueCodes) {
    let codeTotal = 0;
    for (let page = 0; page < 5; page++) {
      try {
        const url = `https://api.fda.gov/device/510k.json?search=product_code:${code}&limit=100&skip=${page * 100}`;
        const result = await fetchJSON(url);
        if (!result || !result.results || result.results.length === 0) break;

        for (const item of result.results) {
          const name = (item.device_name || '').trim();
          if (!name) continue;

          const productCategory = cat(name);
          // 只采集属于目标品类或相关的产品
          if (productCategory === '其他' && productCategory !== category) continue;

          const mfr = (item.applicant || '').trim();
          const src = 'FDA 510(k) Specialized';
          if (isDup(name, mfr, src)) continue;
          markDup(name, mfr, src);

          batch.push({
            name: name.substring(0, 500),
            category: productCategory,
            manufacturer_name: mfr.substring(0, 500),
            country_of_origin: 'US',
            risk_level: 'medium',
            registration_authority: 'FDA',
            data_source: src,
            last_verified: (item.decision_date || new Date().toISOString().split('T')[0]),
            data_confidence_level: 'high',
            registration_number: item.k_number || '',
            specifications: JSON.stringify({
              k_number: item.k_number || '',
              decision_date: item.decision_date || '',
              review_panel: item.review_panel || '',
              product_code: code,
              device_class: item.device_class || '',
              regulation_number: item.regulation_number || '',
            }),
          });
          codeTotal++;
        }

        if (result.results.length < 100) break;
        await sleep(400);
      } catch (e) {
        // 跳过失败的请求
        break;
      }
    }
    if (codeTotal > 0) console.log(`    代码 ${code}: ${codeTotal} 条`);
    total += codeTotal;
    await sleep(250);
  }

  const inserted = await batchInsert(batch);
  console.log(`  产品代码搜索总计: 存入 ${inserted} 条 (采集 ${total} 条)`);
  return inserted;
}

/**
 * 通过 FDA 510(k) 关键词搜索采集
 */
async function collectByKeywords(keywords, category, label) {
  console.log(`\n-- [${label}] 按关键词搜索 openFDA 510(k) --`);
  let total = 0;
  const batch = [];

  for (const kw of keywords) {
    let kwTotal = 0;
    for (let page = 0; page < 5; page++) {
      try {
        const url = `https://api.fda.gov/device/510k.json?search=device_name:${kw}&limit=100&skip=${page * 100}`;
        const result = await fetchJSON(url);
        if (!result || !result.results || result.results.length === 0) break;

        for (const item of result.results) {
          const name = (item.device_name || '').trim();
          if (!name) continue;

          const productCategory = cat(name);
          if (productCategory === '其他') continue;

          const mfr = (item.applicant || '').trim();
          const src = 'FDA 510(k) Specialized';
          if (isDup(name, mfr, src)) continue;
          markDup(name, mfr, src);

          batch.push({
            name: name.substring(0, 500),
            category: productCategory,
            manufacturer_name: mfr.substring(0, 500),
            country_of_origin: 'US',
            risk_level: 'medium',
            registration_authority: 'FDA',
            data_source: src,
            last_verified: (item.decision_date || new Date().toISOString().split('T')[0]),
            data_confidence_level: 'high',
            registration_number: item.k_number || '',
            specifications: JSON.stringify({
              k_number: item.k_number || '',
              decision_date: item.decision_date || '',
              review_panel: item.review_panel || '',
              product_code: item.product_code || '',
              device_class: item.device_class || '',
            }),
          });
          kwTotal++;
        }

        if (result.results.length < 100) break;
        await sleep(400);
      } catch (e) {
        break;
      }
    }
    if (kwTotal > 0) console.log(`    关键词 "${kw}": ${kwTotal} 条`);
    total += kwTotal;
    await sleep(250);
  }

  const inserted = await batchInsert(batch);
  console.log(`  关键词搜索总计: 存入 ${inserted} 条 (采集 ${total} 条)`);
  return inserted;
}

/**
 * 采集精选全球品牌数据
 */
async function collectCurated(brands, category, label, labelEn) {
  console.log(`\n-- [${label}] 精选全球品牌数据 --`);
  const batch = [];

  for (const brand of brands) {
    for (const prodName of brand.products) {
      const src = `Curated Global Brands - ${labelEn}`;
      if (isDup(prodName, brand.mfr, src)) continue;
      markDup(prodName, brand.mfr, src);

      batch.push({
        name: prodName.substring(0, 500),
        category: cat(prodName),
        manufacturer_name: brand.mfr.substring(0, 500),
        country_of_origin: brand.country,
        risk_level: 'medium',
        registration_authority: brand.country === 'US' ? 'FDA' : 'International',
        data_source: src,
        last_verified: new Date().toISOString().split('T')[0],
        data_confidence_level: 'medium',
        specifications: JSON.stringify({
          brand: brand.mfr,
          curated: true,
          product_line: labelEn,
        }),
      });
    }
  }

  const inserted = await batchInsert(batch);
  console.log(`  精选品牌总计: 存入 ${inserted} 条`);
  return inserted;
}

/**
 * 采集单个品类的所有数据
 */
async function collectCategory(catKey) {
  const config = SPECIALIZED_CATEGORIES[catKey];
  const curatedData = CURATED_BRANDS[catKey];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`品类: ${config.label} (${config.labelEn})`);
  console.log(`${'='.repeat(60)}`);

  let catTotal = 0;

  // 1. 产品代码搜索
  catTotal += await collectByProductCodes(config.codes, config.label, config.label);

  // 2. 关键词搜索
  catTotal += await collectByKeywords(config.keywords, config.label, config.label);

  // 3. 精选全球品牌
  catTotal += await collectCurated(curatedData, config.label, config.label, config.labelEn);

  console.log(`\n[${config.label}] 品类小计: ${catTotal} 条`);
  return catTotal;
}

// ============================================================
// 主函数
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    专业PPE品类数据采集脚本                        ║');
  console.log('║    头部防护 | 足部防护 | 听觉防护 | 坠落防护      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`开始时间: ${new Date().toISOString()}`);

  // 加载现有数据
  await loadExisting();

  // 统计初始数量
  const { count: beforeCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  console.log(`\n采集前数据库总量: ${beforeCount?.toLocaleString() || 'N/A'}`);

  const categoryKeys = ['fall', 'head', 'foot', 'hearing'];
  let grandTotal = 0;

  for (const catKey of categoryKeys) {
    grandTotal += await collectCategory(catKey);
  }

  // 统计最终数量
  const { count: afterCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  console.log(`\n${'='.repeat(60)}`);
  console.log(`采集后数据库总量: ${afterCount?.toLocaleString() || 'N/A'}`);
  console.log(`本次新增总计: ${grandTotal.toLocaleString()} 条`);
  console.log(`完成时间: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}`);

  // 按品类输出统计
  console.log('\n各品类统计:');
  for (const catKey of categoryKeys) {
    const config = SPECIALIZED_CATEGORIES[catKey];
    const { count: catCount } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', config.label);
    console.log(`  ${config.label} (${config.labelEn}): ${catCount?.toLocaleString() || 0} 条`);
  }
}

// 直接执行
if (require.main === module) {
  main().catch(e => {
    console.error('致命错误:', e);
    process.exit(1);
  });
}

module.exports = { main };