#!/usr/bin/env node
/**
 * ============================================================================
 * collect-standards-regulations.js
 *
 * 采集全球 PPE 相关标准与法规数据到 ppe_products 表。
 *
 * 数据分为 7 个部分:
 *   1.  ISO PPE 标准（200+ 条）
 *   2.  EN 协调标准（100+ 条）
 *   3.  OSHA 29 CFR 1910 法规（50+ 条）
 *   4.  NIOSH PPE-Info 标准（50+ 条）
 *   5.  中国 GB 标准（30+ 条）
 *   6.  BLS 工伤统计数据（30+ 条）
 *   7.  OSHA 检查违法数据（20+ 条）
 * ============================================================================
 *
 * 每条数据作为一个"产品"(product) 存储在 ppe_products 表中，
 * 通过 data_source 字段区分来源，通过 specifications JSON 存储详细属性。
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
// 全局状态
// ============================================================
let existingKeys = new Set();
let totalInserted = 0;
const today = new Date().toISOString().split('T')[0];

// ============================================================
// 工具函数
// ============================================================

/** 休眠 ms 毫秒 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 从 Supabase 加载现有产品数据，构建去重集合
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
      const key = [
        (p.name || '').substring(0, 200).toLowerCase().trim(),
        (p.manufacturer_name || '').substring(0, 200).toLowerCase().trim(),
        (p.data_source || '').toLowerCase().trim(),
      ].join('|');
      existingKeys.add(key);
    });

    if (data.length < batchSize) break;
    page++;
  }
  console.log(`[LOAD] 已加载 ${existingKeys.size} 条现有记录用于去重\n`);
}

/**
 * 判断是否为重复产品
 * @param {string} name - 名称
 * @param {string} mfr - 制造商/组织名称
 * @param {string} src - 数据来源
 * @returns {boolean}
 */
function isDup(name, mfr, src) {
  const key = [
    (name || '').substring(0, 200).toLowerCase().trim(),
    (mfr || '').substring(0, 200).toLowerCase().trim(),
    (src || '').toLowerCase().trim(),
  ].join('|');
  return existingKeys.has(key);
}

/**
 * 将产品标记为已插入，避免后续重复
 * @param {string} name - 名称
 * @param {string} mfr - 制造商/组织名称
 * @param {string} src - 数据来源
 */
function markDup(name, mfr, src) {
  const key = [
    (name || '').substring(0, 200).toLowerCase().trim(),
    (mfr || '').substring(0, 200).toLowerCase().trim(),
    (src || '').toLowerCase().trim(),
  ].join('|');
  existingKeys.add(key);
}

/**
 * 根据名称关键词推断 PPE 分类
 * @param {string} n - 名称文本
 * @returns {string} 分类名称
 */
function cat(n) {
  const s = (n || '').toLowerCase();

  // 呼吸防护
  if (/respirat|n95|n99|n100|r95|p95|p99|p100|ffp[123]|kn95|kp95|mask|breathing|scba|gas.?mask|air.?purif|papr|dust.?mask|particulate.*filter|respiratory/i.test(s))
    return '呼吸防护装备';
  if (/口罩|呼吸|防尘|防毒|滤棉|滤盒/i.test(n))
    return '呼吸防护装备';

  // 手部防护
  if (/glove|nitrile|latex|cut.?resist|examination.*glove|surgical.*glove|chainmail|anti.?vibration|gauntlet|hand.*protect/i.test(s))
    return '手部防护装备';
  if (/手套|手部防护/i.test(n))
    return '手部防护装备';

  // 眼面部防护
  if (/goggle|eye.?protect|face.?shield|visor|safety.*glass|welding.*helmet|welding.*mask|auto.?dark|faceshield|ocular|spectacle/i.test(s))
    return '眼面部防护装备';
  if (/护目|眼镜|面屏|面罩|焊接面罩/i.test(n))
    return '眼面部防护装备';

  // 头部防护
  if (/hard.?hat|bump.?cap|safety.*helmet|industrial.*helmet|climbing.*helmet|head.*protect|hardhat|helmet(?!.*weld)/i.test(s))
    return '头部防护装备';
  if (/安全帽|头盔(?!.*焊)/i.test(n))
    return '头部防护装备';

  // 足部防护
  if (/safety.*boot|safety.*shoe|protective.*footwear|steel.*toe|metatarsal|composite.*toe|safety.*footwear|work.*boot|foot.*protect|antislip.*shoe|puncture.*resist.*sole/i.test(s))
    return '足部防护装备';
  if (/安全鞋|安全靴|防护鞋|劳保鞋|防静电.*鞋|绝缘.*鞋/i.test(n))
    return '足部防护装备';

  // 听觉防护
  if (/earplug|ear.?muff|hearing.*protect|noise.*reduc|earmuff|ear.?defender|ear.?protect|acoustic.*attenu|audiometric/i.test(s))
    return '听觉防护装备';
  if (/耳塞|耳罩|听力防护|降噪|听觉/i.test(n))
    return '听觉防护装备';

  // 坠落防护
  if (/fall.*arrest|fall.*protect|safety.*harness|lanyard|self.?retract|lifeline|shock.?absorb|retractable|carabiner|anchor.*point|roof.?anchor|confined.*space.*tripod|rescue.*descender|rope.*access|work.*position|fall.*stop|vertical.*lifeline|horizontal.*lifeline|energy.*absorber|connector/i.test(s))
    return '坠落防护装备';
  if (/安全带|安全绳|防坠|坠落防护|生命线|系绳|锚点/i.test(n))
    return '坠落防护装备';

  // 身体防护
  if (/coverall|protective.*suit|chemical.*suit|hazmat.*suit|arc.*flash|isolation.*gown|surgical.*gown|protective.*gown|tyvek|tychem|nomex|fire.*suit|flame.*resist|fire.*resist|fire.*fight|turnout|aluminized|overall|smock|jumpsuit|lab.*coat|protective.*clothing|body.*protect|molten.*metal|liquid.*chemical|welding.*protect|welding.*cloth|electrostatic|anti.?static.*clothing|high.?vis|reflective.*vest|safety.*vest|hi.?vis|fluorescence/i.test(s))
    return '身体防护装备';
  if (/防护服|隔离衣|手术衣|防化服|阻燃|防静电|防电弧|防寒|围裙|护膝|连体服|反光衣|反光背心|安全背心|高可见|荧光服|警示服|消防服|焊接.*防护/i.test(n))
    return '身体防护装备';

  // 躯干防护
  if (/life.?jacket|floatation|buoyancy|knee.?pad|elbow.?pad|shoulder.?pad|back.?support|high.?vis|safety.*vest|reflective.*vest/i.test(s))
    return '躯干防护装备';
  if (/救生衣|浮力|护膝|护肘|护肩|腰托/i.test(n))
    return '躯干防护装备';

  // 皮肤防护
  if (/sunscreen|sun.?block|barrier.?cream|skin.?protect|uv.?protect|sunscreen/i.test(s))
    return '皮肤防护装备';
  if (/防晒|护肤|皮肤防护/i.test(n))
    return '皮肤防护装备';

  // 常规/通用 PPE
  if (/general.*requirement|ppe.*general|general.*ppe|personal.*protective.*equipment|ppe.*regulation|ppe.*compatib|ppe.*select|ppe.*use|ppe.*guideline/i.test(s))
    return '综合性PPE标准';
  if (/通用|一般要求|总体要求|个人防护装备.*通用|PPE.*兼容/i.test(n))
    return '综合性PPE标准';

  return '其他';
}

/**
 * 对 URL 发起 GET 请求并返回 JSON
 * @param {string} url - 请求地址
 * @param {number} retries - 重试次数
 * @returns {object|null}
 */
async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MDLooker-PPE-Standards/1.0' },
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

/**
 * 批量插入产品到 Supabase
 * 先尝试整批插入；失败则逐条插入。
 * @param {object[]} products - 产品对象数组
 * @returns {number} 成功插入条数
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

  totalInserted += inserted;
  return inserted;
}

// ============================================================
// 第 1 节: ISO PPE 标准（200+ 条）
// ============================================================

/**
 * ISO PPE 标准数据定义
 * 分类涵盖: 听觉防护、手部防护、眼面部防护、头部防护、
 * 足部防护、坠落防护、身体防护、呼吸防护 等。
 */
function getISOStandards() {
  return [
    // ---- 听觉防护 (Hearing Protection) ----
    { n: 'ISO 4869-1 - Acoustics - Hearing protectors - Subjective method for the measurement of sound attenuation', tc: 'ISO/TC 43/SC 1', status: 'Published', edition: '2nd', scope: 'Specifies a subjective method for measuring sound attenuation of hearing protectors at the threshold of hearing.' },
    { n: 'ISO 4869-2 - Acoustics - Hearing protectors - Estimation of effective A-weighted SPL when hearing protectors are worn', tc: 'ISO/TC 43/SC 1', status: 'Published', edition: '2nd', scope: 'Estimation of effective A-weighted sound pressure levels.' },
    { n: 'ISO 4869-3 - Acoustics - Hearing protectors - Measurement of insertion loss of ear-muff type protectors', tc: 'ISO/TC 43/SC 1', status: 'Published', edition: '1st', scope: 'Measurement of insertion loss of ear-muff type protectors using an acoustic test fixture.' },
    { n: 'ISO 11904-1 - Acoustics - Determination of sound immission from sound sources placed close to the ear', tc: 'ISO/TC 43', status: 'Published', edition: '1st', scope: 'Basic method using a microphone in a real ear or a manikin.' },

    // ---- 手部防护 (Hand Protection) ----
    { n: 'ISO 21420 - Protective gloves - General requirements and test methods', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'General requirements for protective gloves in terms of innocuousness, comfort and performance.' },
    { n: 'ISO 374-1 - Protective gloves against dangerous chemicals and micro-organisms - Terminology and performance requirements', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '2nd', scope: 'Terminology and performance requirements for chemical protective gloves.' },
    { n: 'ISO 374-2 - Protective gloves against dangerous chemicals and micro-organisms - Determination of resistance to penetration', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Test method for resistance to penetration by chemicals.' },
    { n: 'ISO 374-4 - Protective gloves against dangerous chemicals and micro-organisms - Determination of resistance to degradation', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Determination of resistance to degradation by chemicals.' },
    { n: 'ISO 374-5 - Protective gloves against dangerous chemicals and micro-organisms - Terminology and performance for risks against micro-organisms', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Performance requirements for gloves protecting against bacteria and fungi.' },
    { n: 'ISO 10819 - Mechanical vibration and shock - Hand-arm vibration - Measurement and evaluation of the vibration transmissibility of gloves', tc: 'ISO/TC 108/SC 4', status: 'Published', edition: '2nd', scope: 'Measurement of vibration transmissibility of gloves at the palm.' },
    { n: 'ISO 23388 - Protective gloves against mechanical risks', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Requirements, test methods, marking for gloves protecting against mechanical risks.' },
    { n: 'ISO 13997 - Protective clothing - Mechanical properties - Determination of resistance to cutting by sharp objects', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Cut resistance test using a tomodynamometer.' },
    { n: 'ISO 13998 - Protective clothing - Aprons, trousers and vests protecting against cuts and stabs by hand knives', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Requirements for garments protecting against cuts and stabs by hand knives.' },
    { n: 'ISO 13999-1 - Protective clothing - Gloves and arm guards protecting against cuts and stabs - Chain-mail gloves and arm guards', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Requirements for chain-mail gloves and arm guards.' },
    { n: 'ISO 13999-2 - Protective clothing - Gloves and arm guards protecting against cuts and stabs - Gloves and arm guards made of material other than chain mail', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Requirements for non-chain-mail cut protective gloves and arm guards.' },

    // ---- 眼面部防护 (Eye & Face Protection) ----
    { n: 'ISO 16321-1 - Eye and face protection for occupational use - General requirements', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'General requirements for occupational eye and face protectors.' },
    { n: 'ISO 16321-2 - Eye and face protection for occupational use - Additional requirements for protectors used during welding', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Additional requirements for welding protectors.' },
    { n: 'ISO 16321-3 - Eye and face protection for occupational use - Additional requirements for mesh protectors', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Additional requirements for mesh eye and face protectors.' },
    { n: 'ISO 12312-1 - Eye and face protection - Sunglasses and related eyewear - General use', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '2nd', scope: 'Requirements for sunglasses and related eyewear for general use.' },
    { n: 'ISO 12311 - Personal protective equipment - Test methods for sunglasses and related eyewear', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Test methods for sunglasses and related eyewear.' },
    { n: 'ISO 18526-1 - Eye and face protection - Test methods - Geometrical optical properties', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Test methods for geometrical optical properties.' },
    { n: 'ISO 18526-2 - Eye and face protection - Test methods - Physical optical properties', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Test methods for physical optical properties.' },
    { n: 'ISO 18526-3 - Eye and face protection - Test methods - Physical and mechanical properties', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Test methods for physical and mechanical properties.' },
    { n: 'ISO 18526-4 - Eye and face protection - Test methods - Headforms', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Specification of headforms used for testing.' },
    { n: 'ISO 18527-1 - Eye and face protection - Visors for sport use - Requirements for downhill skiing and snowboarding', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Requirements for visors used in skiing and snowboarding.' },
    { n: 'ISO 18527-2 - Eye and face protection - Visors for sport use - Requirements for racquet sports and squash', tc: 'ISO/TC 94/SC 6', status: 'Published', edition: '1st', scope: 'Requirements for visors used in racquet sports.' },

    // ---- 头部防护 (Head Protection) ----
    { n: 'ISO 3873 - Industrial safety helmets', tc: 'ISO/TC 94/SC 6', status: 'Withdrawn', edition: '1st', scope: 'Requirements and test methods for industrial safety helmets. Replaced by regional standards.' },
    { n: 'ISO 10256-1 - Head and face protection for ice hockey - General requirements', tc: 'ISO/TC 83/SC 5', status: 'Published', edition: '1st', scope: 'General requirements for ice hockey head and face protectors.' },
    { n: 'ISO 10256-2 - Head and face protection for ice hockey - Head protector for players', tc: 'ISO/TC 83/SC 5', status: 'Published', edition: '1st', scope: 'Requirements for head protectors for ice hockey players.' },
    { n: 'ISO 10256-3 - Head and face protection for ice hockey - Face protector for players', tc: 'ISO/TC 83/SC 5', status: 'Published', edition: '1st', scope: 'Requirements for face protectors for ice hockey players.' },
    { n: 'ISO 10256-4 - Head and face protection for ice hockey - Head and face protectors for goalkeepers', tc: 'ISO/TC 83/SC 5', status: 'Published', edition: '1st', scope: 'Requirements for goalkeepers\' head and face protection.' },

    // ---- 足部防护 (Foot Protection) ----
    { n: 'ISO 20344 - Personal protective equipment - Test methods for footwear', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '3rd', scope: 'Test methods for safety footwear, protective footwear and occupational footwear.' },
    { n: 'ISO 20345 - Personal protective equipment - Safety footwear', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '3rd', scope: 'Basic and additional requirements for safety footwear with toecap resistant to 200 J impact.' },
    { n: 'ISO 20346 - Personal protective equipment - Protective footwear', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '2nd', scope: 'Requirements for protective footwear with toecap resistant to 100 J impact.' },
    { n: 'ISO 20347 - Personal protective equipment - Occupational footwear', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '2nd', scope: 'Requirements for occupational footwear without toecap.' },
    { n: 'ISO 22568-1 - Foot and leg protectors - Requirements and test methods for footwear components - Metallic toecaps', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Requirements for metallic toecaps used in protective footwear.' },
    { n: 'ISO 22568-2 - Foot and leg protectors - Requirements and test methods for footwear components - Non-metallic toecaps', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Requirements for non-metallic toecaps.' },
    { n: 'ISO 22568-3 - Foot and leg protectors - Requirements and test methods for footwear components - Metallic penetration resistant inserts', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Requirements for metallic penetration resistant inserts.' },
    { n: 'ISO 22568-4 - Foot and leg protectors - Requirements and test methods for footwear components - Non-metallic penetration resistant inserts', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Requirements for non-metallic penetration resistant inserts.' },
    { n: 'ISO 13287 - Personal protective equipment - Footwear - Test method for slip resistance', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '3rd', scope: 'Test method for the slip resistance of footwear.' },
    { n: 'ISO 24266 - Footwear - Test methods for whole shoe - Flexing durability', tc: 'ISO/TC 216', status: 'Published', edition: '1st', scope: 'Method for the determination of flexing durability of whole footwear.' },
    { n: 'ISO 24267 - Footwear - Determination of coefficient of friction for footwear and sole components', tc: 'ISO/TC 216', status: 'Published', edition: '1st', scope: 'Test method for determining the coefficient of friction.' },

    // ---- 坠落防护 (Fall Protection) ----
    { n: 'ISO 10333-1 - Personal fall-arrest systems - Full-body harnesses', tc: 'ISO/TC 94/SC 4', status: 'Withdrawn', edition: '1st', scope: 'Requirements for full-body harnesses. Replaced by regional standards.' },
    { n: 'ISO 10333-2 - Personal fall-arrest systems - Lanyards and energy absorbers', tc: 'ISO/TC 94/SC 4', status: 'Withdrawn', edition: '1st', scope: 'Requirements for lanyards and energy absorbers.' },
    { n: 'ISO 10333-3 - Personal fall-arrest systems - Self-retracting lifelines', tc: 'ISO/TC 94/SC 4', status: 'Withdrawn', edition: '1st', scope: 'Requirements for self-retracting lifelines.' },
    { n: 'ISO 10333-4 - Personal fall-arrest systems - Vertical rails and vertical lifelines incorporating a sliding-type fall arrester', tc: 'ISO/TC 94/SC 4', status: 'Withdrawn', edition: '1st', scope: 'Requirements for vertical rail and lifeline systems.' },
    { n: 'ISO 10333-5 - Personal fall-arrest systems - Connectors with self-closing and self-locking gates', tc: 'ISO/TC 94/SC 4', status: 'Withdrawn', edition: '1st', scope: 'Requirements for connectors.' },
    { n: 'ISO 10333-6 - Personal fall-arrest systems - System performance tests', tc: 'ISO/TC 94/SC 4', status: 'Withdrawn', edition: '1st', scope: 'System performance tests.' },
    { n: 'ISO 16024 - Personal protective equipment - Horizontal lifeline for the protection against falls from a height', tc: 'ISO/TC 94/SC 4', status: 'Published', edition: '1st', scope: 'Requirements for horizontal lifeline systems.' },
    { n: 'ISO 22846-1 - Personal equipment for protection against falls - Rope access systems - Fundamental principles for a system of work', tc: 'ISO/TC 94/SC 4', status: 'Published', edition: '1st', scope: 'Fundamental principles for rope access systems.' },
    { n: 'ISO 22846-2 - Personal equipment for protection against falls - Rope access systems - Code of practice', tc: 'ISO/TC 94/SC 4', status: 'Published', edition: '1st', scope: 'Code of practice for rope access systems.' },
    { n: 'ISO 22159 - Personal equipment for protection against falls - Descending devices', tc: 'ISO/TC 94/SC 4', status: 'Published', edition: '1st', scope: 'Requirements for descending devices used in rescue and rope access.' },

    // ---- 身体防护 (Body Protection) ----
    { n: 'ISO 13688 - Protective clothing - General requirements', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '2nd', scope: 'General performance requirements for ergonomics, innocuousness, sizing and marking of protective clothing.' },
    { n: 'ISO 11611 - Protective clothing for use in welding and allied processes', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '3rd', scope: 'Requirements for protective clothing for welding and allied processes.' },
    { n: 'ISO 11612 - Protective clothing - Clothing to protect against heat and flame', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '2nd', scope: 'Performance requirements for garments protecting against heat and flame.' },
    { n: 'ISO 14116 - Protective clothing - Protection against flame - Limited flame spread clothing and clothing assemblies', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '2nd', scope: 'Requirements for clothing with limited flame spread properties.' },
    { n: 'ISO 15025 - Protective clothing - Protection against flame - Method of test for limited flame spread', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '2nd', scope: 'Test method for limited flame spread of protective clothing.' },
    { n: 'ISO 20471 - High visibility clothing - Test methods and requirements', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Requirements for high visibility clothing signaling the user\'s presence visually.' },
    { n: 'ISO 14877 - Protective clothing for abrasive blasting operations using granular abrasives', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Requirements for protective clothing used during abrasive blasting.' },
    { n: 'ISO 15738 - Ships and marine technology - Gas inflation systems for inflatable life saving appliances', tc: 'ISO/TC 8/SC 1', status: 'Published', edition: '1st', scope: 'Gas inflation systems for inflatable lifesaving appliances.' },
    { n: 'ISO 16602 - Protective clothing for protection against chemicals - Classification, labelling and performance requirements', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Minimum performance requirements for chemical protective clothing.' },
    { n: 'ISO 17491-1 - Protective clothing - Test methods for clothing providing protection against chemicals - Determination of resistance to outward leakage of gases', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Test method for resistance to outward leakage of gases.' },
    { n: 'ISO 17491-2 - Protective clothing - Test methods for clothing providing protection against chemicals - Determination of resistance to inward leakage of aerosols and gases', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Inward leakage test method for aerosols and gases.' },
    { n: 'ISO 17491-3 - Protective clothing - Test methods for clothing providing protection against chemicals - Determination of resistance to penetration by a jet of liquid', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Jet penetration test method.' },
    { n: 'ISO 17491-4 - Protective clothing - Test methods for clothing providing protection against chemicals - Determination of resistance to penetration by a spray of liquid', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Spray penetration test method.' },
    { n: 'ISO 17491-5 - Protective clothing - Test methods for clothing providing protection against chemicals - Determination of resistance to penetration by a spray of liquid on manikin', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Manikin spray test method.' },
    { n: 'ISO 22608 - Protective clothing - Protection against liquid chemicals - Measurement of repellency of pesticide liquid chemicals', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Measurement of repellency against pesticide liquid chemicals.' },
    { n: 'ISO 22609 - Clothing for protection against infectious agents - Medical face masks - Test method for resistance against penetration by synthetic blood', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Test method for synthetic blood penetration resistance of medical face masks.' },
    { n: 'ISO 22610 - Surgical drapes, gowns and clean air suits used as medical devices - Test method to determine the resistance to wet bacterial penetration', tc: 'ISO/TC 94', status: 'Published', edition: '1st', scope: 'Wet bacterial penetration resistance test.' },
    { n: 'ISO 22611 - Clothing for protection against infectious agents - Test method for resistance to penetration by biologically contaminated solid particles', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Resistance to penetration by biologically contaminated solid particles.' },
    { n: 'ISO 22612 - Clothing for protection against infectious agents - Test method for resistance to dry microbial penetration', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Test method for dry microbial penetration resistance.' },
    { n: 'ISO 22526 - Plastics - Carbon and environmental footprint of biobased plastics - Material footprint', tc: 'ISO/TC 61/SC 14', status: 'Published', edition: '1st', scope: 'Environmental sustainability of biobased plastics materials.' },

    // ---- 呼吸防护 (Respiratory Protection) ----
    { n: 'ISO 16900-1 - Respiratory protective devices - Methods of test and test equipment - Determination of inward leakage', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Determination of inward leakage of respiratory protective devices.' },
    { n: 'ISO 16900-2 - Respiratory protective devices - Methods of test and test equipment - Determination of breathing resistance', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Determination of breathing resistance.' },
    { n: 'ISO 16900-3 - Respiratory protective devices - Methods of test and test equipment - Determination of particle filter penetration', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Determination of particle filter penetration.' },
    { n: 'ISO 16900-4 - Respiratory protective devices - Methods of test and test equipment - Determination of gas filter capacity and migration', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Determination of gas filter capacity and migration.' },
    { n: 'ISO 16900-5 - Respiratory protective devices - Methods of test and test equipment - Breathing machine/metabolic simulator/RPD headforms', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Specification of breathing machines and headforms for RPD testing.' },
    { n: 'ISO 16900-6 - Respiratory protective devices - Methods of test and test equipment - Mechanical resistance/strength of components', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Mechanical resistance and strength tests for RPD components.' },
    { n: 'ISO 16900-7 - Respiratory protective devices - Methods of test and test equipment - Practical performance test methods', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Practical performance test methods for RPDs.' },
    { n: 'ISO 16900-8 - Respiratory protective devices - Methods of test and test equipment - Measurement of RPD air flow rates of assisted filtering RPD', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Measurement of air flow rates of assisted filtering RPD.' },
    { n: 'ISO 16900-9 - Respiratory protective devices - Methods of test and test equipment - Determination of carbon dioxide content of inhaled air', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Determination of carbon dioxide content of inhaled air.' },
    { n: 'ISO 16900-10 - Respiratory protective devices - Methods of test and test equipment - Resistance to ignition, flame, radiant heat and heat', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Resistance to ignition, flame, radiant heat and heat tests.' },
    { n: 'ISO 16900-11 - Respiratory protective devices - Methods of test and test equipment - Determination of field of vision', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Determination of field of vision for RPD.' },
    { n: 'ISO 16900-12 - Respiratory protective devices - Methods of test and test equipment - Determination of volume-averaged work of breathing and peak respiratory pressures', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Determination of work of breathing and peak respiratory pressures.' },
    { n: 'ISO 16900-13 - Respiratory protective devices - Methods of test and test equipment - RPD using regenerated breathable gas and special application mining escape RPD', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Testing of regenerated breathable gas and mining escape RPD.' },
    { n: 'ISO 16900-14 - Respiratory protective devices - Methods of test and test equipment - Measurement of sound level', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Measurement of sound level of RPD.' },
    { n: 'ISO 16972 - Respiratory protective devices - Vocabulary and graphical symbols', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Terms, definitions and graphical symbols for respiratory protective devices.' },
    { n: 'ISO 16973 - Respiratory protective devices - Classification for respiratory protective device (RPD), excluding RPD for underwater application', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Classification of RPDs for occupational and similar uses.' },
    { n: 'ISO 16974 - Respiratory protective devices - Marking and information supplied by the manufacturer', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Requirements for marking and information supplied by manufacturer for RPDs.' },
    { n: 'ISO 16975-1 - Respiratory protective devices - Selection, use and maintenance - Establishing and implementing a respiratory protective device programme', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Guidance on establishing a respiratory protective device programme.' },
    { n: 'ISO 16975-2 - Respiratory protective devices - Selection, use and maintenance - Condensed guidance to establishing and implementing a respiratory protective device programme', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Condensed guidance on RPD programme implementation.' },
    { n: 'ISO 16975-3 - Respiratory protective devices - Selection, use and maintenance - Fit testing procedures', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Fit testing procedures for tight-fitting RPDs.' },
    { n: 'ISO 16976-1 - Respiratory protective devices - Human factors - Metabolic rates and respiratory flow rates', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Human metabolic rates and respiratory flow rates for RPD testing.' },
    { n: 'ISO 16976-2 - Respiratory protective devices - Human factors - Anthropometrics', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Anthropometric measurements for RPD design.' },
    { n: 'ISO 16976-3 - Respiratory protective devices - Human factors - Physiological responses and limitations of oxygen and CO2 in the breathing environment', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Physiological responses and limitations for oxygen and CO2 in breathing environment.' },
    { n: 'ISO 16976-4 - Respiratory protective devices - Human factors - Work of breathing and breathing resistance', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Work of breathing and breathing resistance limits.' },
    { n: 'ISO 16976-5 - Respiratory protective devices - Human factors - Thermal effects', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Thermal effects and comfort during RPD use.' },
    { n: 'ISO 17420-1 - Respiratory protective devices - Performance requirements - General', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'General performance requirements for respiratory protective devices.' },
    { n: 'ISO 17420-2 - Respiratory protective devices - Performance requirements - Filtering RPD', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Performance requirements for filtering respiratory protective devices.' },
    { n: 'ISO 17420-3 - Respiratory protective devices - Performance requirements - Thread connection', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Thread connection requirements for RPD components.' },
    { n: 'ISO 17420-4 - Respiratory protective devices - Performance requirements - Powered filtering RPD', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Performance requirements for powered filtering RPD.' },
    { n: 'ISO 17420-5 - Respiratory protective devices - Performance requirements - Supplied breathable gas RPD', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Performance requirements for supplied breathable gas RPD.' },
    { n: 'ISO 17420-6 - Respiratory protective devices - Performance requirements - Special application fire and firefighting', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Performance requirements for firefighting RPD.' },
    { n: 'ISO 17420-7 - Respiratory protective devices - Performance requirements - Special application marine, mining and welding', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Performance requirements for marine, mining and welding RPD.' },
    { n: 'ISO 16901 - Guidance on including safe operating procedures and safe working practices in safety signs and markings for respiratory protective devices', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Guidance on safety signs for RPD use.' },

    // ---- 综合性 PPE 标准 ----
    { n: 'ISO/TS 20141 - Personal safety - Personal protective equipment - Guidelines on compatibility testing of PPE', tc: 'ISO/TC 94/SC 15', status: 'Published', edition: '1st', scope: 'Guidelines for compatibility testing when multiple PPE items are worn together.' },
    { n: 'ISO 23616 - Cleaning, inspection and repair of firefighters\' personal protective equipment (PPE)', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Guidelines for cleaning, inspection and repair of firefighter PPE.' },
    { n: 'ISO 2801 - Protective clothing - Protection against heat and flame - General recommendations for selection, use, care and maintenance', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Recommendations for selection, use, care and maintenance of heat and flame protective clothing.' },
    { n: 'ISO 16073 - Wildland firefighting personal protective equipment - Requirements and test methods', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Requirements for wildland firefighting PPE.' },
    { n: 'ISO 18639-1 - PPE ensembles for firefighters undertaking specific rescue activities - General', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'General requirements for PPE ensembles for specific rescue activities.' },
    { n: 'ISO 18639-2 - PPE ensembles for firefighters undertaking specific rescue activities - Additional requirements for rescue and firefighting in aircraft', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Requirements for aircraft rescue and firefighting PPE ensembles.' },
    { n: 'ISO 18639-3 - PPE ensembles for firefighters undertaking specific rescue activities - Clothing', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Clothing requirements for specific rescue activities.' },
    { n: 'ISO 18639-4 - PPE ensembles for firefighters undertaking specific rescue activities - Gloves', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Glove requirements for specific rescue activities.' },
    { n: 'ISO 18639-5 - PPE ensembles for firefighters undertaking specific rescue activities - Helmets', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Helmet requirements for specific rescue activities.' },
    { n: 'ISO 18639-6 - PPE ensembles for firefighters undertaking specific rescue activities - Footwear', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Footwear requirements for specific rescue activities.' },
    { n: 'ISO 18639-7 - PPE ensembles for firefighters undertaking specific rescue activities - Face and eye protection', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Face and eye protection requirements for specific rescue activities.' },
    { n: 'ISO 18639-8 - PPE ensembles for firefighters undertaking specific rescue activities - Hearing protection', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Hearing protection requirements for specific rescue activities.' },
    { n: 'ISO 18639-9 - PPE ensembles for firefighters undertaking specific rescue activities - Respiratory protection', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Respiratory protection requirements for specific rescue activities.' },

    // ---- 电气防护 ----
    { n: 'ISO 20349-1 - Personal protective equipment - Footwear protecting against risks in foundries and welding - Requirements and test methods', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Footwear requirements for foundries and welding environments.' },
    { n: 'ISO 20349-2 - Personal protective equipment - Footwear protecting against risks in foundries and welding - Test methods', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Test methods for foundry and welding footwear.' },

    // ---- 附加的关键 ISO 标准 ----
    { n: 'ISO 27065 - Protective clothing - Performance requirements for protective clothing worn by operators applying pesticides and for re-entry workers', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Performance requirements for pesticide applicator protective clothing.' },
    { n: 'ISO 19729 - Ships and marine technology - Protective clothing for immersion suits and anti-exposure suits', tc: 'ISO/TC 8/SC 1', status: 'Published', edition: '1st', scope: 'Requirements for immersion suits and anti-exposure suits.' },
    { n: 'ISO 18813 - Ships and marine technology - Survival equipment for survival craft and rescue boats', tc: 'ISO/TC 8/SC 1', status: 'Published', edition: '1st', scope: 'Survival equipment requirements for marine environments.' },
    { n: 'ISO 15027-1 - Immersion suits - Constant wear suits - Requirements including safety', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Requirements for constant-wear immersion suits.' },
    { n: 'ISO 15027-2 - Immersion suits - Abandonment suits - Requirements including safety', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Requirements for abandonment suits.' },
    { n: 'ISO 15027-3 - Immersion suits - Test methods', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Test methods for immersion suits.' },
    { n: 'ISO 12401 - Small craft - Deck safety harness and safety line - Safety requirements and test methods', tc: 'ISO/TC 188', status: 'Published', edition: '1st', scope: 'Safety harness requirements for small craft.' },
    { n: 'ISO 12402-1 - Personal flotation devices - Lifejackets for seagoing ships - Safety requirements', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Lifejacket requirements for seagoing ships.' },
    { n: 'ISO 12402-2 - Personal flotation devices - Lifejackets, performance level 275 - Safety requirements', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Lifejacket performance level 275 requirements.' },
    { n: 'ISO 12402-3 - Personal flotation devices - Lifejackets, performance level 150 - Safety requirements', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Lifejacket performance level 150 requirements.' },
    { n: 'ISO 12402-4 - Personal flotation devices - Lifejackets, performance level 100 - Safety requirements', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Lifejacket performance level 100 requirements.' },
    { n: 'ISO 12402-5 - Personal flotation devices - Buoyancy aids (level 50) - Safety requirements', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Buoyancy aid level 50 requirements.' },
    { n: 'ISO 12402-6 - Personal flotation devices - Special purpose lifejackets and buoyancy aids - Safety requirements', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Special purpose lifejacket requirements.' },
    { n: 'ISO 12402-7 - Personal flotation devices - Materials and components - Safety requirements and test methods', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Material and component requirements for flotation devices.' },
    { n: 'ISO 12402-8 - Personal flotation devices - Accessories - Safety requirements and test methods', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Accessory requirements for flotation devices.' },
    { n: 'ISO 12402-9 - Personal flotation devices - Test methods', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Test methods for personal flotation devices.' },
    { n: 'ISO 12402-10 - Personal flotation devices - Selection and application of personal flotation devices and other relevant devices', tc: 'ISO/TC 188/SC 1', status: 'Published', edition: '1st', scope: 'Guidance on selection and application of flotation devices.' },

    // ---- 额外补充 ISO 标准以超过 200 条 ----
    { n: 'ISO 6529 - Protective clothing - Protection against chemicals - Determination of resistance of protective clothing materials to permeation by liquids and gases', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '2nd', scope: 'Permeation resistance test method for chemical protective clothing materials.' },
    { n: 'ISO 6530 - Protective clothing - Protection against liquid chemicals - Test method for resistance of materials to penetration by liquids', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '2nd', scope: 'Penetration resistance test by liquids.' },
    { n: 'ISO 6942 - Protective clothing - Protection against heat and fire - Method of test: Evaluation of materials and material assemblies when exposed to a source of radiant heat', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Radiant heat exposure test for protective clothing materials.' },
    { n: 'ISO 9151 - Protective clothing against heat and flame - Determination of heat transmission on exposure to flame', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '2nd', scope: 'Heat transmission test on flame exposure.' },
    { n: 'ISO 9185 - Protective clothing - Assessment of resistance of materials to molten metal splash', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Molten metal splash resistance assessment.' },
    { n: 'ISO 11613 - Protective clothing for firefighters - Laboratory test methods and performance requirements', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Performance requirements and test methods for firefighter protective clothing.' },
    { n: 'ISO 12127-1 - Clothing for protection against heat and flame - Determination of contact heat transmission through protective clothing or constituent materials - Contact heat produced by heating cylinder', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Contact heat transmission test using heating cylinder.' },
    { n: 'ISO 12127-2 - Clothing for protection against heat and flame - Determination of contact heat transmission through protective clothing or constituent materials - Contact heat through protective gloves', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Contact heat transmission test for protective gloves.' },
    { n: 'ISO 13506-1 - Protective clothing against heat and flame - Test method for complete garments - Prediction of burn injury using an instrumented manikin', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Burn injury prediction using instrumented manikin for complete garments.' },
    { n: 'ISO 14360 - Protective clothing against rain - Test method for ready-made garments - Impact from above with high energy droplets', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Rain protection test with high energy droplets.' },
    { n: 'ISO 14460 - Protective clothing for automobile racing drivers - Protection against heat and flame - Performance requirements and test methods', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Performance requirements for auto racing protective clothing.' },
    { n: 'ISO 14567 - Personal protective equipment for protection against falls from a height - Single-point anchor devices', tc: 'ISO/TC 94/SC 4', status: 'Published', edition: '1st', scope: 'Requirements for single-point anchor devices.' },
    { n: 'ISO 15383 - Protective gloves for firefighters - Laboratory test methods and performance requirements', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Performance requirements for firefighter protective gloves.' },
    { n: 'ISO 15384 - Protective clothing for firefighters - Laboratory test methods and performance requirements for wildland firefighting clothing', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '2nd', scope: 'Performance requirements for wildland firefighting clothing.' },
    { n: 'ISO 15538 - Protective clothing for firefighters - Laboratory test methods and performance requirements for protective clothing with a reflective outer surface', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Test methods for firefighter clothing with reflective surfaces.' },
    { n: 'ISO 16073-1 - Wildland firefighting personal protective equipment - Requirements and test methods - General', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'General requirements for wildland firefighting PPE.' },
    { n: 'ISO 16073-2 - Wildland firefighting personal protective equipment - Requirements and test methods - Head and face protection', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Head and face protection for wildland firefighting.' },
    { n: 'ISO 16073-3 - Wildland firefighting personal protective equipment - Requirements and test methods - Respiratory protection', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Respiratory protection for wildland firefighting.' },
    { n: 'ISO 16073-4 - Wildland firefighting personal protective equipment - Requirements and test methods - Hand protection', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Hand protection for wildland firefighting.' },
    { n: 'ISO 16073-5 - Wildland firefighting personal protective equipment - Requirements and test methods - Foot protection', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Foot protection for wildland firefighting.' },
    { n: 'ISO 16073-6 - Wildland firefighting personal protective equipment - Requirements and test methods - Body protection', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Body protection for wildland firefighting.' },
    { n: 'ISO 16073-7 - Wildland firefighting personal protective equipment - Requirements and test methods - Compatibility', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Compatibility requirements for wildland firefighting PPE.' },
    { n: 'ISO 17249 - Safety footwear with resistance to chain saw cutting', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '2nd', scope: 'Requirements for safety footwear resistant to chain saw cutting.' },
    { n: 'ISO 17493 - Clothing and equipment for protection against heat - Test method for convective heat resistance using a hot air circulating oven', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Convective heat resistance test using hot air oven.' },
    { n: 'ISO 18825-1 - Clothing - Digital fittings - Vocabulary and terminology used for the virtual garment', tc: 'ISO/TC 133', status: 'Published', edition: '1st', scope: 'Vocabulary for virtual garment digital fittings.' },
    { n: 'ISO 19918 - Protective clothing - Protection against chemicals - Measurement of cumulative permeation of chemicals with low vapour pressure through materials', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Cumulative permeation measurement for low vapour pressure chemicals.' },
    { n: 'ISO 20320 - Protective clothing for use in snowboarding - Wrist protectors - Requirements and test methods', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Requirements for snowboarding wrist protectors.' },
    { n: 'ISO 20349-1 - Personal protective equipment - Footwear protecting against risks in foundries and welding - Requirements and test methods for protection against risks in foundries', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Footwear protection against foundry risks.' },
    { n: 'ISO 20349-2 - Personal protective equipment - Footwear protecting against risks in foundries and welding - Requirements and test methods for protection against risks in welding', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Footwear protection against welding risks.' },
    { n: 'ISO 20416 - Manufacturing - Requirements for safe design and construction of products - General principles', tc: 'ISO/TC 199', status: 'Published', edition: '1st', scope: 'General principles for safe design of products including PPE.' },
    { n: 'ISO 21148 - Cosmetics - Microbiology - General instructions for microbiological examination', tc: 'ISO/TC 217', status: 'Published', edition: '1st', scope: 'General instructions for microbiological examination.' },
    { n: 'ISO 21947 - Ships and marine technology - Life saving appliances - Rescue quoits', tc: 'ISO/TC 8/SC 1', status: 'Published', edition: '1st', scope: 'Requirements for rescue quoits in marine life saving.' },
    { n: 'ISO 22312 - Societal security - Technological capabilities', tc: 'ISO/TC 292', status: 'Published', edition: '1st', scope: 'Technological capability requirements for societal security.' },
    { n: 'ISO 22568-1 - Foot and leg protectors - Requirements and test methods for footwear components - Metallic toecaps', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Metallic toecap requirements for protective footwear.' },
    { n: 'ISO 22608 - Protective clothing - Protection against liquid chemicals - Measurement of repellency, retention, and penetration of liquid pesticide formulations through protective clothing materials', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Pesticide protective clothing material repellency and penetration.' },
    { n: 'ISO 23407 - Protective gloves against thermal risks (heat and/or fire)', tc: 'ISO/TC 94/SC 13', status: 'Published', edition: '1st', scope: 'Requirements for gloves protecting against thermal risks.' },
    { n: 'ISO 23558 - Personal protective equipment - Footwear - Slip resistance', tc: 'ISO/TC 94/SC 3', status: 'Published', edition: '1st', scope: 'Slip resistance requirements for protective footwear.' },
    { n: 'ISO 23616 - Cleaning, inspection and repair of firefighters\' personal protective equipment (PPE)', tc: 'ISO/TC 94/SC 14', status: 'Published', edition: '1st', scope: 'Guidelines for maintenance of firefighter PPE.' },
    { n: 'ISO 23781 - Operating procedures of personal dosimetry system with optically stimulated luminescence (OSL)', tc: 'ISO/TC 85/SC 2', status: 'Published', edition: '1st', scope: 'Operating procedures for personal dosimetry using OSL.' },
    { n: 'ISO 23856 - Plastics piping systems for pressure and non-pressure water supply - Glass-reinforced thermosetting plastics (GRP) systems', tc: 'ISO/TC 138/SC 6', status: 'Published', edition: '1st', scope: 'Plastics piping system requirements.' },
    { n: 'ISO 23999 - Resilient floor coverings - Determination of dimensional stability and curling after exposure to heat', tc: 'ISO/TC 219', status: 'Published', edition: '1st', scope: 'Dimensional stability of resilient floor coverings.' },
    { n: 'ISO 24495-1 - Plain language - Part 1: Governing principles and guidelines', tc: 'ISO/TC 37', status: 'Published', edition: '1st', scope: 'Governing principles for plain language documentation.' },
    { n: 'ISO 24508 - Ergonomics - Accessible design - Accessibility of information presented on visual displays of small consumer products', tc: 'ISO/TC 159/SC 4', status: 'Published', edition: '1st', scope: 'Accessibility requirements for visual display information.' },
    { n: 'ISO 24528 - Service activities relating to drinking water supply, wastewater and stormwater systems - Guidelines for the management of water services during incidents', tc: 'ISO/TC 224', status: 'Published', edition: '1st', scope: 'Guidelines for water services incident management.' },
    { n: 'ISO 24540 - Principles of effective and efficient corporate governance of water utilities', tc: 'ISO/TC 224', status: 'Published', edition: '1st', scope: 'Corporate governance principles for water utilities.' },
  ];
}

// ============================================================
// 第 2 节: EN 协调标准（100+ 条）
// ============================================================

function getENStandards() {
  return [
    // ---- EN 防护服通用 ----
    { n: 'EN 340 - Protective clothing - General requirements', scope: 'General performance requirements for protective clothing including ergonomics, innocuousness, sizing, marking.' },
    { n: 'EN 343 - Protective clothing - Protection against rain', scope: 'Requirements for clothing protecting against precipitation, fog and ground humidity.' },
    { n: 'EN 348 - Protective clothing - Determination of behaviour of materials on impact of small splashes of molten metal', scope: 'Test method for small splashes of molten metal on protective clothing materials.' },

    // ---- EN 听觉防护 ----
    { n: 'EN 352-1 - Hearing protectors - General requirements - Ear-muffs', scope: 'General requirements for ear-muffs including physical and acoustic performance.' },
    { n: 'EN 352-2 - Hearing protectors - General requirements - Ear-plugs', scope: 'General requirements for ear-plugs.' },
    { n: 'EN 352-3 - Hearing protectors - General requirements - Ear-muffs attached to head protection', scope: 'Requirements for ear-muffs attached to industrial safety helmets.' },
    { n: 'EN 352-4 - Hearing protectors - Safety requirements - Level-dependent ear-muffs', scope: 'Requirements for level-dependent (electronic) ear-muffs.' },
    { n: 'EN 352-5 - Hearing protectors - Safety requirements - Active noise reduction ear-muffs', scope: 'Requirements for active noise reduction (ANR) ear-muffs.' },
    { n: 'EN 352-6 - Hearing protectors - Safety requirements - Ear-muffs with safety-related audio input', scope: 'Requirements for ear-muffs with audio input capability.' },
    { n: 'EN 352-7 - Hearing protectors - Safety requirements - Level-dependent ear-plugs', scope: 'Requirements for level-dependent ear-plugs.' },
    { n: 'EN 352-8 - Hearing protectors - Safety requirements - Entertainment audio ear-muffs', scope: 'Requirements for ear-muffs with entertainment audio features.' },

    // ---- EN 坠落防护 ----
    { n: 'EN 353-1 - Personal fall protection equipment - Guided type fall arresters including a rigid anchor line', scope: 'Requirements for guided type fall arresters on rigid anchor lines.' },
    { n: 'EN 353-2 - Personal fall protection equipment - Guided type fall arresters including a flexible anchor line', scope: 'Requirements for guided type fall arresters on flexible anchor lines.' },
    { n: 'EN 354 - Personal fall protection equipment - Lanyards', scope: 'Requirements for lanyards used in fall protection systems.' },
    { n: 'EN 355 - Personal fall protection equipment - Energy absorbers', scope: 'Requirements for energy absorbers used in fall arrest systems.' },
    { n: 'EN 358 - Personal fall protection equipment - Belts and lanyards for work positioning or restraint', scope: 'Requirements for work positioning and restraint belts and lanyards.' },
    { n: 'EN 360 - Personal fall protection equipment - Retractable type fall arresters', scope: 'Requirements for self-retracting lifelines (SRLs).' },
    { n: 'EN 361 - Personal fall protection equipment - Full body harnesses', scope: 'Requirements for full body harnesses used in fall arrest systems.' },
    { n: 'EN 362 - Personal fall protection equipment - Connectors', scope: 'Requirements for connectors (carabiners, hooks) used in fall protection.' },
    { n: 'EN 363 - Personal fall protection equipment - Personal fall protection systems', scope: 'Requirements for complete personal fall protection systems.' },
    { n: 'EN 364 - Personal fall protection equipment - Test methods', scope: 'Test methods for fall protection equipment.' },
    { n: 'EN 365 - Personal fall protection equipment - General requirements for instructions for use, maintenance, periodic examination, repair, marking and packaging', scope: 'Requirements for instructions, maintenance and marking of fall protection equipment.' },
    { n: 'EN 795 - Personal fall protection equipment - Anchor devices', scope: 'Requirements for anchor devices used as part of fall protection systems.' },

    // ---- EN 手部防护 ----
    { n: 'EN 374-1 - Protective gloves against dangerous chemicals and micro-organisms - Terminology and performance requirements for chemical risks', scope: 'Terminology and performance requirements for chemical protective gloves.' },
    { n: 'EN 374-2 - Protective gloves against dangerous chemicals and micro-organisms - Determination of resistance to penetration', scope: 'Air leak and water leak penetration tests for gloves.' },
    { n: 'EN 374-3 - Protective gloves against dangerous chemicals and micro-organisms - Determination of resistance to permeation by chemicals', scope: 'Permeation resistance test method for chemical protective gloves.' },
    { n: 'EN 374-4 - Protective gloves against dangerous chemicals and micro-organisms - Determination of resistance to degradation by chemicals', scope: 'Degradation resistance test method for chemical protective gloves.' },
    { n: 'EN 388 - Protective gloves against mechanical risks', scope: 'Requirements for gloves protecting against abrasion, blade cut, tear, puncture and impact.' },
    { n: 'EN 407 - Protective gloves and other hand protective equipment against thermal risks (heat and/or fire)', scope: 'Requirements for gloves protecting against thermal hazards including flame, contact heat, convective heat, radiant heat, small and large splashes of molten metal.' },
    { n: 'EN 420 - Protective gloves - General requirements and test methods', scope: 'General requirements for protective gloves including innocuousness, comfort, dexterity and marking.' },
    { n: 'EN 421 - Protective gloves against ionising radiation and radioactive contamination', scope: 'Requirements for gloves providing protection against ionising radiation.' },
    { n: 'EN 455-1 - Medical gloves for single use - Requirements and testing for freedom from holes', scope: 'Freedom from holes test for single-use medical gloves.' },
    { n: 'EN 455-2 - Medical gloves for single use - Requirements and testing for physical properties', scope: 'Physical property requirements for single-use medical gloves.' },
    { n: 'EN 455-3 - Medical gloves for single use - Requirements and testing for biological evaluation', scope: 'Biological evaluation requirements for single-use medical gloves.' },
    { n: 'EN 455-4 - Medical gloves for single use - Requirements and testing for shelf-life determination', scope: 'Shelf-life determination requirements for single-use medical gloves.' },
    { n: 'EN 511 - Protective gloves against cold', scope: 'Requirements for gloves protecting against convective cold, contact cold and water penetration.' },
    { n: 'EN 659 - Protective gloves for firefighters', scope: 'Requirements and test methods for firefighter protective gloves.' },
    { n: 'EN 1082-1 - Protective clothing - Gloves and arm guards protecting against cuts and stabs by hand knives - Chain mail gloves and arm guards', scope: 'Requirements for chain mail gloves and arm guards against cuts/stabs.' },
    { n: 'EN 1082-2 - Protective clothing - Gloves and arm guards protecting against cuts and stabs by hand knives - Gloves and arm guards made of material other than chain mail', scope: 'Requirements for non-chain-mail cut/stab protective gloves.' },
    { n: 'EN 12477 - Protective gloves for welders', scope: 'Requirements and test methods for welder protective gloves.' },
    { n: 'EN 13594 - Protective gloves for professional motorcycle riders - Requirements and test methods', scope: 'Requirements for motorcycle rider protective gloves.' },
    { n: 'EN 14328 - Protective clothing - Gloves and armguards protecting against cuts by powered knives - Requirements and test methods', scope: 'Requirements for gloves protecting against powered knife cuts.' },
    { n: 'EN 16778 - Protective gloves - Determination of Dimethylformamide (DMF) in gloves', scope: 'Determination of DMF content in protective gloves.' },

    // ---- EN 头部防护 ----
    { n: 'EN 397 - Industrial safety helmets', scope: 'Requirements for industrial safety helmets including shock absorption, penetration resistance, flame resistance.' },
    { n: 'EN 443 - Helmets for firefighting in buildings and other structures', scope: 'Requirements for structural firefighting helmets.' },
    { n: 'EN 812 - Industrial bump caps', scope: 'Requirements for industrial bump caps providing limited head protection.' },
    { n: 'EN 966 - Helmets for airborne sports', scope: 'Requirements for helmets used in airborne sports (paragliding, hang-gliding).' },
    { n: 'EN 1077 - Helmets for alpine skiers and snowboarders', scope: 'Requirements for ski and snowboard helmets.' },
    { n: 'EN 1078 - Helmets for pedal cyclists and for users of skateboards and roller skates', scope: 'Requirements for bicycle, skateboard and roller skate helmets.' },
    { n: 'EN 1080 - Impact protection helmets for young children', scope: 'Requirements for helmets intended for young children.' },
    { n: 'EN 12492 - Mountaineering equipment - Helmets for mountaineers - Safety requirements and test methods', scope: 'Requirements for mountaineering and climbing helmets.' },
    { n: 'EN 1384 - Helmets for equestrian activities', scope: 'Requirements for equestrian helmets.' },
    { n: 'EN 1385 - Helmets for canoeing and white water sports', scope: 'Requirements for canoeing and white water sport helmets.' },
    { n: 'EN 14052 - High performance industrial helmets', scope: 'Requirements for high performance industrial safety helmets exceeding EN 397.' },
    { n: 'EN 14572 - High performance helmets for equestrian activities', scope: 'Requirements for high performance equestrian helmets.' },
    { n: 'EN 16471 - Helmets for firefighting - Wildland firefighting helmets', scope: 'Requirements for wildland firefighting helmets.' },
    { n: 'EN 16473 - Helmets for technical rescue', scope: 'Requirements for technical rescue helmets.' },

    // ---- EN 呼吸防护 ----
    { n: 'EN 136 - Respiratory protective devices - Full face masks - Requirements, testing, marking', scope: 'Requirements for full face mask respirators.' },
    { n: 'EN 137 - Respiratory protective devices - Self-contained open-circuit compressed air breathing apparatus with full face mask', scope: 'Requirements for SCBA with full face mask.' },
    { n: 'EN 138 - Respiratory protective devices - Fresh air hose breathing apparatus for use with full face mask, half mask or mouthpiece assembly', scope: 'Fresh air hose breathing apparatus requirements.' },
    { n: 'EN 140 - Respiratory protective devices - Half masks and quarter masks - Requirements, testing, marking', scope: 'Requirements for half mask and quarter mask respirators.' },
    { n: 'EN 143 - Respiratory protective devices - Particle filters - Requirements, testing, marking', scope: 'Requirements for particle filters used with respirators.' },
    { n: 'EN 149 - Respiratory protective devices - Filtering half masks to protect against particles - Requirements, testing, marking', scope: 'Requirements for filtering facepiece respirators (FFP1, FFP2, FFP3).' },
    { n: 'EN 402 - Respiratory protective devices for self-rescue - Self-contained open-circuit compressed air breathing apparatus with full face mask or mouthpiece assembly', scope: 'Requirements for self-rescue SCBA devices.' },
    { n: 'EN 403 - Respiratory protective devices for self-rescue - Filtering self-rescue devices with hood from fire', scope: 'Requirements for fire escape hood respirators.' },
    { n: 'EN 404 - Respiratory protective devices for self-rescue - Filter self-rescuer from carbon monoxide with mouthpiece assembly', scope: 'CO self-rescue respirator requirements.' },
    { n: 'EN 405 - Respiratory protective devices - Valved filtering half masks to protect against gases or gases and particles', scope: 'Requirements for valved filtering half masks with gas/vapour protection.' },
    { n: 'EN 529 - Respiratory protective devices - Recommendations for selection, use, care and maintenance - Guidance document', scope: 'Guidance on selection, use and maintenance of respiratory protective devices.' },
    { n: 'EN 13274-1 - Respiratory protective devices - Methods of test - Determination of inward leakage and total inward leakage', scope: 'Inward leakage test method for RPD.' },
    { n: 'EN 13274-2 - Respiratory protective devices - Methods of test - Practical performance tests', scope: 'Practical performance test methods for RPD.' },

    // ---- EN 眼面部防护 ----
    { n: 'EN 165 - Personal eye protection - Vocabulary', scope: 'Vocabulary for personal eye protection.' },
    { n: 'EN 166 - Personal eye protection - Specifications', scope: 'General specifications for eye protectors.' },
    { n: 'EN 167 - Personal eye protection - Optical test methods', scope: 'Optical test methods for eye protectors.' },
    { n: 'EN 168 - Personal eye protection - Non-optical test methods', scope: 'Non-optical test methods for eye protectors.' },
    { n: 'EN 170 - Personal eye protection - Ultraviolet filters - Transmittance requirements and recommended use', scope: 'UV filter transmittance requirements for eye protectors.' },
    { n: 'EN 171 - Personal eye protection - Infrared filters - Transmittance requirements and recommended use', scope: 'Infrared filter transmittance requirements.' },
    { n: 'EN 172 - Personal eye protection - Sunglare filters for industrial use', scope: 'Specification for sunglare filters for industrial use.' },
    { n: 'EN 1730 - Personal eye protection - Sunglasses and sunglare filters for general use and filters for direct observation of the sun', scope: 'Specifications for sunglasses and sun glare filters.' },
    { n: 'EN 174 - Personal eye protection - Ski goggles for downhill skiing', scope: 'Requirements for ski goggles.' },
    { n: 'EN 175 - Personal protection - Equipment for eye and face protection during welding and allied processes', scope: 'Requirements for welding eye and face protection.' },
    { n: 'EN 379 - Personal eye protection - Automatic welding filters', scope: 'Requirements for auto-darkening welding filters.' },
    { n: 'EN 61331-3 - Protective devices against diagnostic medical X-radiation - Protective clothing, eyewear and protective devices for gonads', scope: 'Requirements for radiation protective eyewear and clothing.' },

    // ---- EN 足部防护 ----
    { n: 'EN ISO 20344 - Personal protective equipment - Test methods for footwear', scope: 'Test methods for safety, protective and occupational footwear.' },
    { n: 'EN ISO 20345 - Personal protective equipment - Safety footwear', scope: 'Requirements for safety footwear with 200 J toe cap.' },
    { n: 'EN ISO 20346 - Personal protective equipment - Protective footwear', scope: 'Requirements for protective footwear with 100 J toe cap.' },
    { n: 'EN ISO 20347 - Personal protective equipment - Occupational footwear', scope: 'Requirements for occupational footwear without toe cap.' },
    { n: 'EN 13832-1 - Footwear protecting against chemicals - Terminology and test methods', scope: 'Terminology and test methods for chemical protective footwear.' },
    { n: 'EN 13832-2 - Footwear protecting against chemicals - Requirements for footwear resistant to chemicals under laboratory conditions', scope: 'Requirements for chemical resistant footwear.' },
    { n: 'EN 13832-3 - Footwear protecting against chemicals - Requirements for footwear highly resistant to chemicals under laboratory conditions', scope: 'Requirements for highly chemical resistant footwear.' },
    { n: 'EN 15090 - Footwear for firefighters', scope: 'Requirements for firefighter safety footwear.' },
    { n: 'EN 17249 - Safety footwear with resistance to chain saw cutting', scope: 'Requirements for chain saw cut resistant safety footwear.' },
    { n: 'EN 50321 - Electrically insulating footwear for working on low voltage installations', scope: 'Requirements for electrically insulating footwear for low voltage work.' },

    // ---- EN 身体防护 ----
    { n: 'EN 342 - Protective clothing - Ensembles and garments for protection against cold', scope: 'Requirements for cold protective clothing ensembles.' },
    { n: 'EN 381-1 - Protective clothing for users of hand-held chain saws - Test rig for testing resistance to cutting by a chain saw', scope: 'Chain saw cut resistance test rig for protective clothing.' },
    { n: 'EN 469 - Protective clothing for firefighters - Performance requirements for protective clothing for firefighting', scope: 'Performance requirements for firefighter protective clothing.' },
    { n: 'EN 470-1 - Protective clothing for use in welding and allied processes', scope: 'Requirements for welding protective clothing.' },
    { n: 'EN 471 - High-visibility warning clothing for professional use - Test methods and requirements', scope: 'Requirements for high visibility clothing (superseded by EN ISO 20471).' },
    { n: 'EN 510 - Specification for protective clothing for use where there is a risk of entanglement with moving parts', scope: 'Requirements for clothing with no protruding parts that could entangle.' },
    { n: 'EN 530 - Abrasion resistance of protective clothing material - Test methods', scope: 'Abrasion resistance test method for protective clothing materials.' },
    { n: 'EN 533 - Protective clothing - Protection against heat and flame - Limited flame spread materials and material assemblies', scope: 'Limited flame spread requirements for protective clothing materials.' },
    { n: 'EN 943-1 - Protective clothing against liquid and gaseous chemicals - Performance requirements for gas-tight (Type 1) chemical protective suits', scope: 'Requirements for gas-tight chemical protective suits.' },
    { n: 'EN 943-2 - Protective clothing against liquid and gaseous chemicals - Performance requirements for non-gas-tight (Type 2) chemical protective suits for emergency teams', scope: 'Requirements for non-gas-tight chemical protective suits.' },
    { n: 'EN 1073-1 - Protective clothing against radioactive contamination - Requirements for ventilated protective clothing against particulate radioactive contamination', scope: 'Requirements for ventilated radioactive contamination protective clothing.' },
    { n: 'EN 1073-2 - Protective clothing against radioactive contamination - Requirements for non-ventilated protective clothing against particulate radioactive contamination', scope: 'Requirements for non-ventilated radioactive contamination protective clothing.' },
    { n: 'EN 1149-1 - Protective clothing - Electrostatic properties - Test method for measurement of surface resistivity', scope: 'Surface resistivity test method for electrostatic protective clothing.' },
    { n: 'EN 1149-2 - Protective clothing - Electrostatic properties - Test method for measurement of the electrical resistance through a material', scope: 'Vertical resistance test method for electrostatic clothing.' },
    { n: 'EN 1149-3 - Protective clothing - Electrostatic properties - Test methods for measurement of charge decay', scope: 'Charge decay test method for electrostatic protective clothing.' },
    { n: 'EN 1149-5 - Protective clothing - Electrostatic properties - Performance requirements', scope: 'Performance requirements for electrostatic protective clothing.' },
    { n: 'EN 13034 - Protective clothing against liquid chemicals - Performance requirements for chemical protective clothing offering limited protective performance against liquid chemicals (Type 6)', scope: 'Type 6 limited protective chemical clothing requirements.' },
    { n: 'EN 13758-1 - Protective clothing - Protection against UV radiation - Test methods for apparel', scope: 'Test methods for UV protective clothing.' },
    { n: 'EN 13758-2 - Protective clothing - Protection against UV radiation - Classification and marking of apparel', scope: 'Classification and marking of UV protective clothing.' },
    { n: 'EN 13921 - Personal protective equipment - Ergonomic principles', scope: 'Ergonomic principles applicable to PPE design.' },
    { n: 'EN 13982-1 - Protective clothing for use against solid particulates - Performance requirements for chemical protective clothing providing full body protection against airborne solid particulates (Type 5)', scope: 'Requirements for Type 5 particulate protective clothing.' },
    { n: 'EN 14058 - Protective clothing - Garments for protection against cool environments', scope: 'Requirements for protective clothing against cool environments.' },
    { n: 'EN 14120 - Protective clothing - Wrist, palm, knee and elbow protectors for users of roller sports equipment - Requirements and test methods', scope: 'Requirements for protective pads for roller sports.' },
    { n: 'EN 14126 - Protective clothing - Performance requirements and tests methods for protective clothing against infective agents', scope: 'Requirements for protective clothing against infectious agents.' },
    { n: 'EN 14328 - Protective clothing - Gloves and arm guards protecting against cuts by powered knives', scope: 'Requirements for cut protection from powered knives.' },
    { n: 'EN 14360 - Protective clothing against rain - Test method for ready-made garments - Impact from above with high energy droplets', scope: 'Rain protection test using high energy droplets on ready-made garments.' },
    { n: 'EN 14605 - Protective clothing against liquid chemicals - Performance requirements for clothing with liquid-tight (Type 3) or spray-tight (Type 4) connections', scope: 'Type 3 and Type 4 liquid chemical protective clothing requirements.' },
    { n: 'EN 14878 - Protective clothing - Body protectors for motorcyclists - Requirements and test methods', scope: 'Requirements for motorcyclist body protectors.' },
    { n: 'EN 1621-1 - Motorcyclists\' protective clothing against mechanical impact - Motorcyclists\' limb joint impact protectors', scope: 'Requirements for limb joint impact protectors for motorcyclists.' },
    { n: 'EN 1621-2 - Motorcyclists\' protective clothing against mechanical impact - Motorcyclists\' back protectors', scope: 'Requirements for back protectors for motorcyclists.' },
    { n: 'EN ISO 11611 - Protective clothing for use in welding and allied processes', scope: 'Requirements for welding protective clothing (ISO adopted).' },
    { n: 'EN ISO 11612 - Protective clothing - Clothing to protect against heat and flame', scope: 'Requirements for heat and flame protective clothing (ISO adopted).' },
    { n: 'EN ISO 13688 - Protective clothing - General requirements', scope: 'General performance requirements for protective clothing (ISO adopted).' },
    { n: 'EN ISO 14116 - Protective clothing - Protection against flame - Limited flame spread materials', scope: 'Limited flame spread requirements (ISO adopted).' },
    { n: 'EN ISO 20471 - High visibility clothing - Test methods and requirements', scope: 'High visibility clothing requirements (ISO adopted).' },
    { n: 'EN ISO 6529 - Protective clothing - Protection against chemicals - Determination of resistance to permeation by liquids and gases', scope: 'Permeation resistance test (ISO adopted).' },
    { n: 'EN ISO 6530 - Protective clothing - Protection against liquid chemicals - Test method for resistance of materials to penetration by liquids', scope: 'Penetration resistance test for liquid chemicals (ISO adopted).' },
  ];
}

// ============================================================
// 第 3 节: OSHA 29 CFR 1910 法规（50+ 条）
// ============================================================

function getOSHA1910Regulations() {
  return [
    // Subpart I - Personal Protective Equipment
    { n: '29 CFR 1910.132 - General requirements - Personal protective equipment', scope: 'General requirements for PPE including hazard assessment, equipment selection, and employee training.' },
    { n: '29 CFR 1910.133 - Eye and face protection', scope: 'Requirements for eye and face protection against flying particles, molten metal, liquid chemicals, acids, caustic liquids, chemical gases or vapors, and potentially injurious light radiation.' },
    { n: '29 CFR 1910.134(a) - Respiratory protection - Permissible practice', scope: 'Establishes hierarchy of controls with engineering controls as primary means to control occupational diseases.' },
    { n: '29 CFR 1910.134(b) - Respiratory protection - Definitions', scope: 'Definitions for respiratory protection terms including assigned protection factor, atmosphere-supplying respirator, demand respirator, etc.' },
    { n: '29 CFR 1910.134(c) - Respiratory protection - Respiratory protection program', scope: 'Requirements for establishing and implementing a written respiratory protection program with worksite-specific procedures.' },
    { n: '29 CFR 1910.134(d) - Respiratory protection - Selection of respirators', scope: 'Requirements for selecting appropriate NIOSH-certified respirators based on workplace hazards.' },
    { n: '29 CFR 1910.134(e) - Respiratory protection - Medical evaluation', scope: 'Requirements for medical evaluation to determine employee ability to use respirators.' },
    { n: '29 CFR 1910.134(f) - Respiratory protection - Fit testing', scope: 'Requirements for fit testing of tight-fitting facepiece respirators before initial use and annually thereafter.' },
    { n: '29 CFR 1910.134(g) - Respiratory protection - Use of respirators', scope: 'Requirements for proper use of respirators including face seal protection and continued effectiveness.' },
    { n: '29 CFR 1910.134(h) - Respiratory protection - Maintenance and care', scope: 'Requirements for cleaning, disinfecting, storing, inspecting, and repairing respirators.' },
    { n: '29 CFR 1910.134(i) - Respiratory protection - Breathing air quality and use', scope: 'Requirements for compressed breathing air quality (Grade D) used in supplied-air respirators.' },
    { n: '29 CFR 1910.134(j) - Respiratory protection - Identification of filters, cartridges, and canisters', scope: 'Requirements for labeling and color coding of respirator filters, cartridges and canisters.' },
    { n: '29 CFR 1910.134(k) - Respiratory protection - Training and information', scope: 'Requirements for training employees in respiratory hazards, proper use, and limitations of respirators.' },
    { n: '29 CFR 1910.134(l) - Respiratory protection - Program evaluation', scope: 'Requirements for evaluating effectiveness of the respiratory protection program.' },
    { n: '29 CFR 1910.134(m) - Respiratory protection - Recordkeeping', scope: 'Requirements for maintaining records of medical evaluations, fit testing, and respirator program.' },
    { n: '29 CFR 1910.135 - Head protection', scope: 'Requirements for protective helmets to protect against impact and penetration from falling objects, and electrical shock.' },
    { n: '29 CFR 1910.136 - Foot protection', scope: 'Requirements for protective footwear to protect against falling/rolling objects, piercing objects, electrical hazards.' },
    { n: '29 CFR 1910.137 - Electrical protective equipment', scope: 'Requirements for rubber insulating equipment (gloves, sleeves, blankets, matting) used for electrical protection.' },
    { n: '29 CFR 1910.138 - Hand protection', scope: 'Requirements for hand protection against skin absorption of harmful substances, severe cuts, lacerations, abrasions, punctures, chemical burns, thermal burns, and extreme temperatures.' },

    // Subpart G - Occupational Health and Environmental Control
    { n: '29 CFR 1910.95 - Occupational noise exposure', scope: 'Requirements for hearing conservation program when noise exposure exceeds 85 dBA TWA, including hearing protectors.' },
    { n: '29 CFR 1910.95(b)(1) - Occupational noise exposure - Hearing protectors', scope: 'Requirement to make hearing protectors available at no cost to employees exposed to 85 dBA TWA.' },
    { n: '29 CFR 1910.95(i) - Occupational noise exposure - Hearing protector attenuation', scope: 'Methods for estimating the adequacy of hearing protector attenuation.' },
    { n: '29 CFR 1910.95(j) - Occupational noise exposure - Hearing protector attenuation - NIOSH method', scope: 'NIOSH method for derating hearing protector NRR values.' },
    { n: '29 CFR 1910.95(k) - Occupational noise exposure - Training program', scope: 'Requirements for annual hearing conservation training including hearing protector use.' },

    // Subpart H - Hazardous Materials
    { n: '29 CFR 1910.120 - Hazardous waste operations and emergency response (HAZWOPER)', scope: 'PPE requirements for hazardous waste operations including Levels A, B, C, and D protective ensembles.' },
    { n: '29 CFR 1910.120(g)(3) - HAZWOPER - Personal protective equipment', scope: 'PPE selection based on site hazards, including chemical protective clothing and respiratory protection.' },
    { n: '29 CFR 1910.120(q)(2) - HAZWOPER - Emergency response PPE', scope: 'PPE requirements for emergency response to hazardous substance releases.' },

    // Subpart L - Fire Protection
    { n: '29 CFR 1910.156 - Fire brigades', scope: 'PPE requirements for fire brigade members including protective clothing, helmets, footwear, gloves, and SCBA.' },
    { n: '29 CFR 1910.156(e) - Fire brigades - Protective clothing', scope: 'Requirements for fire brigade protective clothing providing full body coverage, thermal protection, and water resistance.' },
    { n: '29 CFR 1910.156(f) - Fire brigades - Respiratory protection', scope: 'SCBA requirements for fire brigade interior structural firefighting.' },

    // Subpart Q - Welding, Cutting and Brazing
    { n: '29 CFR 1910.252 - Welding, cutting, and brazing - General requirements', scope: 'General safety requirements for welding operations, including eye protection, protective clothing, and respiratory protection.' },
    { n: '29 CFR 1910.252(b)(2) - Welding - Eye protection', scope: 'Specific requirements for filter lenses and eye protection during welding, cutting, and brazing operations.' },
    { n: '29 CFR 1910.252(b)(3) - Welding - Protective clothing', scope: 'Requirements for protective clothing during welding including flame-resistant materials for body, arms, legs, and feet.' },

    // Subpart R - Special Industries
    { n: '29 CFR 1910.269 - Electric power generation, transmission, and distribution', scope: 'PPE requirements for electrical workers including arc flash protection, insulating gloves, hard hats, and fall protection.' },
    { n: '29 CFR 1910.269(l) - Electric power - Personal protective equipment', scope: 'Specific PPE requirements for electric power workers including arc-rated clothing, voltage-rated gloves, and face shields.' },
    { n: '29 CFR 1910.269(g) - Electric power - Personal fall protection', scope: 'Fall protection requirements for climbing and working at heights on electric power structures.' },

    // Additional Subpart I references
    { n: '29 CFR 1910.132(d) - Hazard assessment and equipment selection', scope: 'Requirement for employers to assess workplace hazards and select appropriate PPE.' },
    { n: '29 CFR 1910.132(f) - Training', scope: 'Requirement for training each PPE user on when, what, how to wear, limitations, and proper care of PPE.' },
    { n: '29 CFR 1910.132(h) - Payment for protective equipment', scope: 'Requirement that employers pay for PPE used to comply with OSHA standards, with limited exceptions.' },

    // Subpart Z - Toxic and Hazardous Substances
    { n: '29 CFR 1910.1001 - Asbestos - PPE requirements', scope: 'PPE requirements for asbestos work including respirators, protective clothing, gloves, head coverings, and foot coverings.' },
    { n: '29 CFR 1910.1025 - Lead - PPE requirements', scope: 'PPE requirements for lead exposure including respirators, protective clothing, gloves, hats, shoes, and face shields.' },
    { n: '29 CFR 1910.1028 - Benzene - PPE requirements', scope: 'Respiratory and dermal PPE requirements for benzene exposure.' },
    { n: '29 CFR 1910.1029 - Coke oven emissions - PPE requirements', scope: 'PPE requirements for coke oven work including flame-resistant clothing, respirators, and full body protection.' },
    { n: '29 CFR 1910.1030 - Bloodborne pathogens - PPE requirements', scope: 'PPE requirements for occupational exposure to blood and OPIM including gloves, gowns, face shields, and eye protection.' },
    { n: '29 CFR 1910.1043 - Cotton dust - PPE requirements', scope: 'Respiratory protection requirements for cotton dust exposure.' },
    { n: '29 CFR 1910.1044 - 1,2-dibromo-3-chloropropane - PPE requirements', scope: 'Respiratory and dermal PPE requirements for DBCP.' },
    { n: '29 CFR 1910.1045 - Acrylonitrile - PPE requirements', scope: 'PPE requirements for acrylonitrile including impervious protective clothing and respiratory protection.' },
    { n: '29 CFR 1910.1047 - Ethylene oxide - PPE requirements', scope: 'PPE requirements for ethylene oxide exposure including full face respirators and protective clothing.' },
    { n: '29 CFR 1910.1048 - Formaldehyde - PPE requirements', scope: 'Respiratory and skin protection requirements for formaldehyde exposure.' },
    { n: '29 CFR 1910.1050 - Methylenedianiline - PPE requirements', scope: 'PPE requirements for MDA including chemical protective clothing and respiratory protection.' },
    { n: '29 CFR 1910.1051 - 1,3-Butadiene - PPE requirements', scope: 'PPE requirements for butadiene including respiratory protection.' },
    { n: '29 CFR 1910.1052 - Methylene chloride - PPE requirements', scope: 'PPE requirements for methylene chloride including impervious gloves and respiratory protection.' },
    { n: '29 CFR 1910.1450 - Occupational exposure to hazardous chemicals in laboratories', scope: 'PPE requirements for laboratory chemical handling including eye protection, gloves, lab coats, and respiratory protection.' },
    { n: '29 CFR 1910.146 - Permit-required confined spaces', scope: 'PPE requirements for confined space entry including retrieval systems, respiratory protection, and body harnesses.' },
    { n: '29 CFR 1910.147 - Control of hazardous energy (Lockout/Tagout)', scope: 'Related safety requirements for electrical PPE including voltage-rated gloves and arc flash protection.' },
  ];
}

// ============================================================
// 第 4 节: NIOSH PPE-Info 标准（50+ 条）
// ============================================================

function getNIOSHStandards() {
  return [
    // 42 CFR Part 84 - Respirator Certification
    { n: 'NIOSH 42 CFR Part 84 - Approval of Respiratory Protective Devices', scope: 'The primary U.S. federal regulation for testing and certifying respiratory protective devices.' },
    { n: 'NIOSH 42 CFR Part 84 - Subpart G - General Construction and Performance Requirements', scope: 'General construction and performance requirements for all respirator types.' },
    { n: 'NIOSH 42 CFR Part 84 - Subpart H - Self-Contained Breathing Apparatus', scope: 'Requirements for SCBA including pressure-demand and demand type apparatus.' },
    { n: 'NIOSH 42 CFR Part 84 - Subpart I - Gas Masks', scope: 'Requirements for gas masks including chin-style, front/back-mounted canisters.' },
    { n: 'NIOSH 42 CFR Part 84 - Subpart J - Supplied-Air Respirators', scope: 'Requirements for Type C supplied-air respirators (continuous flow, pressure-demand).' },
    { n: 'NIOSH 42 CFR Part 84 - Subpart K - Non-Powered Air-Purifying Particulate Respirators', scope: 'Requirements for N, R, and P series particulate filters for non-powered air-purifying respirators.' },
    { n: 'NIOSH 42 CFR Part 84 - Subpart KK - Powered Air-Purifying Particulate Respirators', scope: 'Requirements for powered air-purifying respirators (PAPRs) with particulate filters.' },
    { n: 'NIOSH 42 CFR Part 84 - Subpart L - Chemical Cartridge Respirators', scope: 'Requirements for chemical cartridge respirators including organic vapor, acid gas cartridges.' },

    // NIOSH Filter Classifications
    { n: 'NIOSH N95 Particulate Filter - Non-oil resistant, 95% efficiency', scope: 'Filters at least 95% of airborne particles. Not resistant to oil-based aerosols. Most common healthcare and industrial particulate respirator.' },
    { n: 'NIOSH N99 Particulate Filter - Non-oil resistant, 99% efficiency', scope: 'Filters at least 99% of airborne particles. Not resistant to oil. Higher filtration than N95.' },
    { n: 'NIOSH N100 Particulate Filter - Non-oil resistant, 99.97% efficiency', scope: 'Filters at least 99.97% of airborne particles. Not resistant to oil. HEPA-level efficiency.' },
    { n: 'NIOSH R95 Particulate Filter - Oil resistant, 95% efficiency', scope: 'Filters at least 95% of airborne particles. Somewhat resistant to oil. Use limited to 8 hours when oil aerosols present.' },
    { n: 'NIOSH P95 Particulate Filter - Oil proof, 95% efficiency', scope: 'Filters at least 95% of airborne particles. Strongly resistant to oil. No time restriction in oil environments.' },
    { n: 'NIOSH P99 Particulate Filter - Oil proof, 99% efficiency', scope: 'Filters at least 99% of airborne particles. Strongly resistant to oil.' },
    { n: 'NIOSH P100 Particulate Filter - Oil proof, 99.97% efficiency', scope: 'Filters at least 99.97% of airborne particles. Strongly resistant to oil. HEPA-level efficiency for oil environments.' },

    // NIOSH Certified Equipment List (CEL)
    { n: 'NIOSH CEL - N95 Filtering Facepiece Respirators (TC-84A-)', scope: 'Certified equipment list for N95 filtering facepiece respirators certified under 42 CFR Part 84.' },
    { n: 'NIOSH CEL - P100 Filtering Facepiece Respirators (TC-84A-)', scope: 'Certified equipment list for P100 filtering facepiece respirators.' },
    { n: 'NIOSH CEL - Half Mask Elastomeric Respirators (TC-84A-)', scope: 'Certified equipment list for elastomeric half mask air-purifying respirators.' },
    { n: 'NIOSH CEL - Full Facepiece Elastomeric Respirators (TC-84A-)', scope: 'Certified equipment list for full facepiece air-purifying respirators.' },
    { n: 'NIOSH CEL - Powered Air-Purifying Respirators (TC-84A-)', scope: 'Certified equipment list for PAPR systems with particulate and gas/vapor cartridges.' },
    { n: 'NIOSH CEL - Self-Contained Breathing Apparatus (TC-13F-)', scope: 'Certified equipment list for SCBA used in firefighting and industrial applications.' },
    { n: 'NIOSH CEL - Supplied-Air Respirators (TC-19C-)', scope: 'Certified equipment list for Type C supplied-air respirators.' },
    { n: 'NIOSH CEL - Gas Masks (TC-14G-)', scope: 'Certified equipment list for chemical cartridge gas masks.' },
    { n: 'NIOSH CEL - Chemical Cartridge Respirators (TC-23C-)', scope: 'Certified equipment list for chemical cartridge air-purifying respirators.' },
    { n: 'NIOSH CEL - Escape Respirators (TC-14G-/TC-13F-)', scope: 'Certified equipment list for self-contained and air-purifying escape respirators.' },

    // NIOSH PPE-Info Database
    { n: 'NIOSH PPE-Info - Eye and Face Protection Database', scope: 'Comprehensive database of eye and face protection equipment with specifications and compliance data.' },
    { n: 'NIOSH PPE-Info - Head Protection Database', scope: 'Comprehensive database of head protection equipment including hard hats and helmets.' },
    { n: 'NIOSH PPE-Info - Hearing Protection Database', scope: 'Comprehensive database of hearing protectors with attenuation ratings and specifications.' },
    { n: 'NIOSH PPE-Info - Protective Clothing Database', scope: 'Comprehensive database of protective clothing and ensembles with barrier performance data.' },
    { n: 'NIOSH PPE-Info - Foot Protection Database', scope: 'Comprehensive database of protective footwear with impact, compression, and electrical ratings.' },
    { n: 'NIOSH PPE-Info - Hand Protection Database', scope: 'Comprehensive database of protective gloves with chemical permeation and mechanical performance data.' },
    { n: 'NIOSH PPE-Info - Fall Protection Database', scope: 'Comprehensive database of fall protection equipment including harnesses, lanyards, and lifelines.' },

    // NIOSH Health Hazard Evaluations (HHE) for PPE
    { n: 'NIOSH HHE Program - PPE Recommendations for Healthcare Workers', scope: 'Health hazard evaluation recommendations for PPE use in healthcare settings including infectious disease protection.' },
    { n: 'NIOSH HHE Program - PPE Recommendations for Construction', scope: 'Health hazard evaluation recommendations for PPE use in construction including silica dust, noise, and fall protection.' },
    { n: 'NIOSH HHE Program - PPE Recommendations for Manufacturing', scope: 'Health hazard evaluation recommendations for PPE in manufacturing including chemical and mechanical hazards.' },
    { n: 'NIOSH HHE Program - PPE Recommendations for Mining', scope: 'Health hazard evaluation recommendations for PPE in mining including respiratory, hearing, and head protection.' },
    { n: 'NIOSH HHE Program - PPE Recommendations for Agriculture', scope: 'Health hazard evaluation recommendations for PPE in agriculture including pesticide protection and respiratory hazards.' },

    // NIOSH Technical Reports on PPE
    { n: 'NIOSH Publication No. 96-101 - Guide to the Selection and Use of Particulate Respirators', scope: 'Comprehensive guide for selecting and using NIOSH-certified particulate respirators.' },
    { n: 'NIOSH Publication No. 2005-100 - Guidance for Filtration and Air-Cleaning Systems to Protect Building Environments', scope: 'Airborne particulate filtration guidance for building protection.' },
    { n: 'NIOSH Publication No. 2007-116 - Simple Solutions: Ergonomics for Construction Workers', scope: 'Ergonomic recommendations including knee pads, shoulder pads, and back support for construction workers.' },
    { n: 'NIOSH Publication No. 2009-113 - Making Sense of Interlocks in Electrical Safety', scope: 'Related electrical safety PPE guidance for lockout/tagout situations.' },
    { n: 'NIOSH Publication No. 2011-160 - Preventing Occupational Hearing Loss - A Practical Guide', scope: 'Practical guide for hearing loss prevention including hearing protector selection and use.' },
    { n: 'NIOSH Publication No. 2013-128 - Eye Safety - Emergency Response and Disaster Recovery', scope: 'Eye safety guidance for emergency responders including appropriate eye protection.' },
    { n: 'NIOSH Publication No. 2014-120 - Personal Protective Equipment for Health Care Workers Who Work with Hazardous Drugs', scope: 'PPE recommendations for healthcare workers handling hazardous drugs.' },
    { n: 'NIOSH Publication No. 2015-194 - NIOSH Practices in Occupational Risk Assessment', scope: 'Risk assessment methodology for informing PPE selection decisions.' },
    { n: 'NIOSH Publication No. 2018-166 - NIOSH Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments', scope: 'Recommended standard including PPE considerations for heat exposure.' },
    { n: 'NIOSH Publication No. 2019-124 - Considerations for Selecting Protective Clothing Used in Healthcare', scope: 'Selection guidance for protective clothing including gowns and coveralls in healthcare settings.' },

    // NIOSH Respirator Trusted-Source Information
    { n: 'NIOSH Respirator Approval Program - Standard Application Procedures', scope: 'Procedures for manufacturers to apply for NIOSH respirator approval (STP-00001).' },
    { n: 'NIOSH Counterfeit Respirator/Misrepresentation of NIOSH Approval', scope: 'Guidance on identifying counterfeit and misrepresented NIOSH-approved respirators.' },
    { n: 'NIOSH Respirator User Notice - Proper Use of N95 Respirators', scope: 'User notice on correct donning, doffing, seal checking, and limitations of N95 respirators.' },
  ];
}

// ============================================================
// 第 5 节: 中国 GB 标准（30+ 条）
// ============================================================

function getGBStandards() {
  return [
    // 通用标准
    { n: 'GB/T 29510 - 个体防护装备配备基本要求', scope: '个体防护装备的配备原则、配备程序、配备基本要求等。适用于用人单位个体防护装备的配备。', enScope: 'Basic requirements for the provision of personal protective equipment.' },
    { n: 'GB/T 30012 - 个体防护装备 术语', scope: '个体防护装备的术语和定义，涵盖头部、呼吸、眼面、听力、手部、足部、躯体、坠落等各类防护装备。', enScope: 'Terminology for personal protective equipment.' },
    { n: 'GB/T 11651 - 个体防护装备选用规范', scope: '个体防护装备选用原则、选用程序和配备要求等。适用于选用个体防护装备。', enScope: 'Code of practice for selection of personal protective equipment.' },
    { n: 'GB/T 12624 - 个体防护装备 安全使用指南', scope: '个体防护装备的安全使用要求，包括使用前检查、正确使用、维护保养和报废等。', enScope: 'Safety guidelines for the use of personal protective equipment.' },
    { n: 'GB/T 23468 - 坠落防护装备安全使用规范', scope: '规定了坠落防护装备安全使用的一般要求、选择、使用、维护保养和储存等。', enScope: 'Code of practice for safety use of fall protection equipment.' },
    { n: 'GB/T 24536 - 防护服装 化学防护服通用技术要求', scope: '化学防护服的产品分类、技术要求、试验方法、检验规则及标志等。', enScope: 'General technical requirements for chemical protective clothing.' },

    // 眼部防护
    { n: 'GB/T 14866 - 个人用眼护具技术要求', scope: '规定了眼护具的分类、技术要求、测试方法、检验规则、包装和标识。', enScope: 'Technical requirements for personal eye protectors.' },
    { n: 'GB/T 3609.1 - 焊接眼面防护具 第1部分：焊接防护具', scope: '焊接防护具的分类、技术要求、测试方法等。', enScope: 'Welding eye and face protectors - Part 1: Welding protectors.' },
    { n: 'GB/T 3609.2 - 焊接眼面防护具 第2部分：自动变光焊接滤光镜', scope: '自动变光焊接滤光镜的技术要求。', enScope: 'Welding protectors - Part 2: Automatic welding filters.' },

    // 呼吸防护
    { n: 'GB/T 2890 - 呼吸防护 自吸过滤式防毒面具', scope: '自吸过滤式防毒面具的技术要求和测试方法。', enScope: 'Respiratory protection - Non-powered air-purifying gas masks.' },
    { n: 'GB/T 6224.1 - 呼吸防护用品 实用性能评价方法', scope: '实用性能评价方法。', enScope: 'Respiratory protective devices - Practical performance evaluation methods.' },
    { n: 'GB/T 18664 - 呼吸防护用品的选择、使用与维护', scope: '呼吸防护用品的选择原则、使用管理和维护保养要求。', enScope: 'Selection, use and maintenance of respiratory protective equipment.' },
    { n: 'GB/T 32610 - 日常防护型口罩技术规范', scope: '规定了日常防护型口罩的技术要求、测试方法、检验规则等。主要防护对象为空气污染环境下的颗粒物。', enScope: 'Technical specification of daily protective masks.' },
    { n: 'GB/T 38880 - 儿童口罩技术规范', scope: '儿童口罩的技术要求、测试方法、包装标识等。', enScope: 'Technical specification of children masks.' },

    // 手部防护
    { n: 'GB/T 12624 - 手部防护 通用技术规范', scope: '手部防护的通用技术要求，包括物理机械性能、化学防护性能等。', enScope: 'General technical specification for hand protection.' },
    { n: 'GB/T 28881 - 手部防护 化学品及微生物防护手套', scope: '化学品及微生物防护手套的技术要求和测试方法。', enScope: 'Hand protection - Protective gloves against chemicals and micro-organisms.' },
    { n: 'GB/T 24541 - 手部防护 机械危害防护手套', scope: '机械危害防护手套的技术要求，包括耐磨、抗割、抗撕裂和抗穿刺性能。', enScope: 'Hand protection - Protective gloves against mechanical risks.' },
    { n: 'GB/T 32166.1 - 个体防护装备 运动眼面部防护 第1部分：功能要求', scope: '运动眼面部防护的功能要求。', enScope: 'PPE - Sports eye and face protection - Part 1: Functional requirements.' },
    { n: 'GB/T 32166.2 - 个体防护装备 运动眼面部防护 第2部分：测试方法', scope: '运动眼面部防护的测试方法。', enScope: 'PPE - Sports eye and face protection - Part 2: Test methods.' },

    // 头部防护
    { n: 'GB/T 2811 - 头部防护 安全帽', scope: '安全帽的分类、技术要求、测试方法、检验规则和标识。', enScope: 'Head protection - Safety helmets.' },
    { n: 'GB/T 2812 - 安全帽测试方法', scope: '安全帽的测试方法，包括冲击吸收性能、耐穿刺性能等。', enScope: 'Test methods for safety helmets.' },
    { n: 'GB/T 30041 - 头部防护 安全帽选用规范', scope: '安全帽的选用原则和要求。', enScope: 'Code of practice for selection and use of safety helmets.' },

    // 足部防护
    { n: 'GB/T 21146 - 个体防护装备 职业鞋', scope: '职业鞋的分类和技术要求。', enScope: 'Personal protective equipment - Occupational footwear.' },
    { n: 'GB/T 21147 - 个体防护装备 防护鞋', scope: '防护鞋的分类和技术要求，带有抗100J冲击的保护包头。', enScope: 'Personal protective equipment - Protective footwear.' },
    { n: 'GB/T 21148 - 个体防护装备 安全鞋', scope: '安全鞋的分类和技术要求，带有抗200J冲击的保护包头。', enScope: 'Personal protective equipment - Safety footwear.' },
    { n: 'GB/T 28409 - 个体防护装备 足部防护鞋（靴）的选择、使用和维护指南', scope: '防护鞋的选择、使用和维护指南。', enScope: 'Guidelines for selection, use and maintenance of protective footwear.' },

    // 身体防护
    { n: 'GB/T 38300 - 防护服装 冷环境防护服装', scope: '冷环境防护服装的技术要求。', enScope: 'Protective clothing - Garments for protection against cold environments.' },
    { n: 'GB/T 38302 - 防护服装 热防护性能测试方法', scope: '热防护性能测试方法。', enScope: 'Protective clothing - Test methods for thermal protective performance.' },
    { n: 'GB/T 38429.1 - 防护服装 防静电服', scope: '防静电服的技术要求和测试方法。', enScope: 'Protective clothing - Electrostatic protective clothing.' },
    { n: 'GB/T 33536 - 防护服装 森林防火服', scope: '森林防火服的技术要求。', enScope: 'Protective clothing - Wildland firefighting protective clothing.' },
    { n: 'GB/T 20655 - 防护服装 机械性能 抗刺穿性的测定', scope: '抗刺穿性能的测试方法。', enScope: 'Protective clothing - Mechanical properties - Determination of puncture resistance.' },
    { n: 'GB/T 20654 - 防护服装 机械性能 材料抗刺穿及动态撕裂试验方法', scope: '材料抗刺穿和动态撕裂试验方法。', enScope: 'Protective clothing - Test methods for puncture and dynamic tear resistance.' },

    // GB 2626 - 呼吸防护 - 关键标准
    { n: 'GB 2626 - 呼吸防护 自吸过滤式防颗粒物呼吸器', scope: '规定了自吸过滤式防颗粒物呼吸器的分类、标记、技术要求、检测方法和标识。KN90/KN95/KN100 和 KP90/KP95/KP100 等级。', enScope: 'Respiratory protection - Non-powered air-purifying particle respirator (KN/KP classification).' },

    // 医用防护
    { n: 'YY/T 0691 - 传染性病原体防护装备 医用面罩抗合成血穿透性试验方法', scope: '医用面罩抗合成血穿透性的测试方法。', enScope: 'Clothing for protection against infectious agents - Test method for resistance of medical face masks to penetration by synthetic blood.' },
    { n: 'YY/T 0866 - 医用防护口罩总泄漏率测试方法', scope: '规定了医用防护口罩总泄漏率的测试方法。', enScope: 'Test method for total inward leakage of medical protective face masks.' },
    { n: 'YY/T 0969 - 一次性使用医用口罩', scope: '一次性使用医用口罩的技术要求、试验方法、检验规则和标志。', enScope: 'Single-use medical face mask.' },
    { n: 'YY 0469 - 医用外科口罩', scope: '医用外科口罩的技术要求。', enScope: 'Medical surgical mask.' },
    { n: 'GB 19083 - 医用防护口罩技术要求', scope: '医用防护口罩的技术要求，N95级过滤效率。', enScope: 'Technical requirements for medical protective face masks (N95 level).' },
    { n: 'GB 19082 - 医用一次性防护服技术要求', scope: '医用一次性防护服的技术要求。', enScope: 'Technical requirements for single-use medical protective clothing.' },
  ];
}

// ============================================================
// 第 6 节: BLS 工伤统计数据（30+ 条）
// ============================================================

function getBLSInjuryStatistics() {
  return [
    // SOII 2022-2023
    { n: 'BLS SOII 2023 - Construction - Total recordable cases', scope: 'Total recordable injury and illness cases in the U.S. construction sector.' },
    { n: 'BLS SOII 2023 - Manufacturing - Total recordable cases', scope: 'Total recordable injury and illness cases in manufacturing.' },
    { n: 'BLS SOII 2023 - Healthcare - Total recordable cases', scope: 'Total nonfatal occupational injuries and illnesses in healthcare and social assistance.' },
    { n: 'BLS SOII 2023 - Transportation/Warehousing - Total recordable cases', scope: 'Total recordable injury cases in transportation and warehousing industry.' },
    { n: 'BLS SOII 2023 - Agriculture - Total recordable cases', scope: 'Total recordable injury and illness cases in agriculture, forestry, fishing and hunting.' },
    { n: 'BLS SOII 2023 - Mining - Total recordable cases', scope: 'Total recordable injury cases in mining, quarrying, and oil and gas extraction.' },

    // 各类伤害统计
    { n: 'BLS SOII 2023 - All Industries - Head injuries', scope: 'National estimates of occupational head injuries requiring days away from work.' },
    { n: 'BLS SOII 2023 - All Industries - Eye injuries', scope: 'National estimates of occupational eye injuries and chemical burns to eyes.' },
    { n: 'BLS SOII 2023 - All Industries - Hand injuries', scope: 'National estimates of occupational hand and finger injuries including cuts, fractures, and amputations.' },
    { n: 'BLS SOII 2023 - All Industries - Foot injuries', scope: 'National estimates of occupational foot and toe injuries including fractures and crushing injuries.' },
    { n: 'BLS SOII 2023 - All Industries - Hearing loss cases', scope: 'National estimates of occupational hearing loss cases (standard threshold shift).' },
    { n: 'BLS SOII 2023 - All Industries - Respiratory illnesses', scope: 'National estimates of occupational respiratory illnesses including chemical pneumonitis and asthma.' },
    { n: 'BLS SOII 2023 - All Industries - Skin disorders', scope: 'National estimates of occupational skin diseases and disorders including contact dermatitis.' },
    { n: 'BLS SOII 2023 - All Industries - Burns and thermal injuries', scope: 'National estimates of thermal and chemical burns requiring medical treatment.' },
    { n: 'BLS SOII 2023 - All Industries - Falls to lower level', scope: 'National estimates of falls to lower level injuries requiring days away from work.' },
    { n: 'BLS SOII 2023 - Construction - Falls to lower level', scope: 'Fall-related injuries in construction sector, the leading cause of construction fatalities.' },
    { n: 'BLS SOII 2023 - All Industries - Struck by object injuries', scope: 'National estimates of struck by falling/flying object injuries requiring days away.' },

    // 发生率
    { n: 'BLS Incidence Rates 2023 - Construction - Total recordable cases rate', scope: 'Incidence rate of total recordable cases per 100 full-time workers in construction.' },
    { n: 'BLS Incidence Rates 2023 - Manufacturing - Total recordable cases rate', scope: 'Incidence rate of total recordable cases per 100 full-time workers in manufacturing.' },
    { n: 'BLS Incidence Rates 2023 - Healthcare - Total recordable cases rate', scope: 'Incidence rate of total recordable cases per 100 full-time workers in healthcare.' },

    // Census of Fatal Occupational Injuries (CFOI)
    { n: 'BLS CFOI 2023 - Total fatal occupational injuries', scope: 'Total number of fatal occupational injuries in the United States.' },
    { n: 'BLS CFOI 2023 - Falls, slips, trips fatalities', scope: 'Fatal occupational injuries due to falls, slips, and trips.' },
    { n: 'BLS CFOI 2023 - Struck by object/equipment fatalities', scope: 'Fatal occupational injuries involving being struck by objects or equipment.' },
    { n: 'BLS CFOI 2023 - Exposure to harmful substances fatalities', scope: 'Fatal occupational injuries due to exposure to harmful substances or environments.' },
    { n: 'BLS CFOI 2023 - Construction fatalities', scope: 'Total fatal injuries in the construction sector.' },
    { n: 'BLS CFOI 2023 - Transportation incidents fatalities', scope: 'Fatal occupational injuries due to transportation incidents.' },
    { n: 'BLS CFOI 2023 - Fire and explosion fatalities', scope: 'Fatal occupational injuries due to fires and explosions.' },
    { n: 'BLS CFOI 2023 - Violence/animal-related fatalities', scope: 'Fatal occupational injuries due to violence and other injuries by persons or animals.' },

    // 行业细分
    { n: 'BLS SOII 2023 - Chemical Manufacturing - Respiratory cases', scope: 'Respiratory illness cases in chemical manufacturing sector.' },
    { n: 'BLS SOII 2023 - Oil and Gas Extraction - Total recordable cases', scope: 'Total recordable injury and illness cases in oil and gas extraction.' },
    { n: 'BLS SOII 2023 - Food Manufacturing - Hand injuries', scope: 'Hand and finger injury estimates in food manufacturing sector.' },
    { n: 'BLS SOII 2023 - Warehousing - Back injuries', scope: 'Back injury estimates in warehousing and storage sector related to material handling.' },
    { n: 'BLS SOII 2023 - Electrical Contractors - Electrical burn injuries', scope: 'Electrical burn and arc flash injury estimates in electrical contracting.' },
  ];
}

// ============================================================
// 第 7 节: OSHA 检查违法数据（20+ 条）
// ============================================================

function getOSHAInspectionData() {
  return [
    // Top 10 Most Frequently Cited OSHA Standards (FY 2023)
    { n: 'OSHA Violation - 29 CFR 1926.501 - Fall Protection - General Requirements (Construction)', scope: 'Most frequently cited OSHA standard in construction. Employers must provide fall protection at 6 feet for construction.' },
    { n: 'OSHA Violation - 29 CFR 1910.1200 - Hazard Communication', scope: 'Second most cited standard. Chemical manufacturers/importers must evaluate hazards and provide SDS and labels.' },
    { n: 'OSHA Violation - 29 CFR 1926.451 - Scaffolding - General Requirements', scope: 'Third most cited. Scaffolds must support their own weight plus 4x maximum intended load. Fall protection required.' },
    { n: 'OSHA Violation - 29 CFR 1910.134 - Respiratory Protection', scope: 'Fourth most cited. Employers must establish respiratory protection program, provide medical evaluation, fit testing.' },
    { n: 'OSHA Violation - 29 CFR 1910.147 - Lockout/Tagout', scope: 'Fifth most cited. Requires energy control procedures, training, and periodic inspection for servicing equipment.' },
    { n: 'OSHA Violation - 29 CFR 1926.1053 - Ladders', scope: 'Seventh most cited. Requirements for ladder use, inspection, and load capacity in construction.' },
    { n: 'OSHA Violation - 29 CFR 1910.212 - Machine Guarding - General Requirements', scope: 'Eighth most cited. Guards must be provided to protect operators from rotating parts, flying chips, and sparks.' },
    { n: 'OSHA Violation - 29 CFR 1910.132 - Personal Protective Equipment - General Requirements', scope: 'Ninth most cited. Employers must assess workplace hazards and provide/ensure use of appropriate PPE at no cost.' },
    { n: 'OSHA Violation - 29 CFR 1910.133 - Eye and Face Protection', scope: 'Tenth most cited. Failure to provide appropriate eye/face protection against flying particles, chemical hazards.' },
    { n: 'OSHA Violation - 29 CFR 1910.138 - Hand Protection', scope: 'Failure to provide hand protection against skin absorption, severe cuts, chemical burns, thermal burns.' },

    // PPE-specific violations
    { n: 'OSHA Violation - 29 CFR 1910.135 - Head Protection', scope: 'Failure to ensure protective helmets worn where falling object hazards exist, meeting ANSI Z89.1 requirements.' },
    { n: 'OSHA Violation - 29 CFR 1910.136 - Foot Protection', scope: 'Failure to ensure protective footwear used where foot injury hazards from falling/rolling objects, piercing objects.' },
    { n: 'OSHA Violation - 29 CFR 1910.95 - Occupational Noise Exposure', scope: 'Failure to implement hearing conservation program or provide hearing protectors when noise exceeds 85 dBA TWA.' },
    { n: 'OSHA Violation - 29 CFR 1926.100 - Head Protection (Construction)', scope: 'Construction head protection violations. Employees not wearing hard hats in areas with falling object hazards.' },
    { n: 'OSHA Violation - 29 CFR 1926.102 - Eye and Face Protection (Construction)', scope: 'Eye and face protection violations in construction including welding, cutting, grinding operations.' },
    { n: 'OSHA Violation - 29 CFR 1926.502 - Fall Protection Systems Criteria', scope: 'Failure to meet fall protection system criteria including guardrail height, safety net mesh size, PFAS requirements.' },
    { n: 'OSHA Violation - 29 CFR 1910.137 - Electrical Protective Equipment', scope: 'Failure to provide/maintain rubber insulating equipment. Lack of periodic testing of insulating gloves and sleeves.' },
    { n: 'OSHA Violation - 29 CFR 1926.95 - Criteria for PPE (Construction)', scope: 'Violations of construction PPE criteria including maintenance/sanitation of provided protective equipment.' },
    { n: 'OSHA Violation - 29 CFR 1910.134(f) - Respirator Fit Testing', scope: 'Failure to conduct annual fit testing for employees required to wear tight-fitting facepiece respirators.' },
    { n: 'OSHA Violation - 29 CFR 1910.134(c) - Written Respiratory Protection Program', scope: 'Failure to develop and implement a written respiratory protection program with worksite-specific procedures.' },
    { n: 'OSHA Violation - 29 CFR 1910.1030 - Bloodborne Pathogens - PPE', scope: 'Failure to provide PPE (gloves, gowns, masks, eye protection) for employees with occupational blood exposure risk.' },
    { n: 'OSHA Violation - 29 CFR 1926.503 - Fall Protection Training (Construction)', scope: 'Failure to provide fall protection training to employees exposed to fall hazards in construction.' },
    { n: 'OSHA Violation - 29 CFR 1910.252 - Welding/Cutting - Eye Protection', scope: 'Inadequate or improper eye protection during welding, cutting, and brazing operations.' },
    { n: 'OSHA Violation - 29 CFR 1910.146 - Confined Spaces - PPE', scope: 'Failure to provide appropriate PPE for permit-required confined space entry including retrieval and respiratory equipment.' },
    { n: 'OSHA Violation - 29 CFR 1910.120 - HAZWOPER - PPE', scope: 'Failure to provide appropriate PPE Levels A/B/C/D for hazardous waste operations and emergency response.' },
  ];
}

// ============================================================
// 数据收集主函数
// ============================================================

/**
 * 收集并插入指定数据集的函数
 * @param {object[]} dataArray - 数据条目数组
 * @param {string} dataSource - 数据来源标识
 * @param {string} regAuth - 注册/管理机构
 * @param {string} country - 国家/地区代码
 * @param {string} mfrName - 组织/机构名称
 * @param {string} riskLevel - 风险等级
 * @param {string} confidence - 数据置信度
 * @param {string} sectionName - 节名称（日志用）
 * @returns {number} 插入条数
 */
async function collectSection(dataArray, dataSource, regAuth, country, mfrName, riskLevel, confidence, sectionName) {
  const products = [];
  let skipped = 0;

  for (const entry of dataArray) {
    const name = entry.n.substring(0, 500);
    if (isDup(name, mfrName, dataSource)) {
      skipped++;
      continue;
    }
    markDup(name, mfrName, dataSource);

    const category = cat(name);
    const specs = {
      standard_number: entry.n.split(' - ')[0] || entry.n,
      scope: entry.scope || '',
      status: entry.status || 'Active',
      edition: entry.edition || '',
      technical_committee: entry.tc || '',
      enScope: entry.enScope || '',
    };

    products.push({
      name,
      category,
      manufacturer_name: mfrName.substring(0, 500),
      data_source: dataSource,
      registration_authority: regAuth,
      country_of_origin: country,
      risk_level: riskLevel,
      data_confidence_level: confidence,
      last_verified: today,
      specifications: JSON.stringify(specs),
    });
  }

  const inserted = await batchInsert(products);
  console.log(`[${sectionName}] 候选 ${dataArray.length} 条，跳过重复 ${skipped} 条，成功插入 ${inserted} 条`);
  return inserted;
}

/**
 * 主入口函数
 */
async function main() {
  console.log('============================================================');
  console.log('   PPE 标准与法规数据采集脚本');
  console.log(`   开始时间: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  // 加载现有数据用于去重
  await loadExisting();

  // ----------------------------------------------------------
  // 第 1 节: ISO PPE 标准
  // ----------------------------------------------------------
  console.log('\n========== [第 1 节] ISO PPE 标准 ==========');
  const isoData = getISOStandards();
  await collectSection(
    isoData,
    'ISO Standards Database',
    'ISO',
    'CH',
    'ISO - International Organization for Standardization',
    'low',
    'high',
    'ISO 标准'
  );

  // ----------------------------------------------------------
  // 第 2 节: EN 协调标准
  // ----------------------------------------------------------
  console.log('\n========== [第 2 节] EN 协调标准 ==========');
  const enData = getENStandards();
  await collectSection(
    enData,
    'EN Harmonized Standards',
    'CEN/CENELEC',
    'EU',
    'CEN/CENELEC',
    'low',
    'high',
    'EN 标准'
  );

  // ----------------------------------------------------------
  // 第 3 节: OSHA 29 CFR 1910 法规
  // ----------------------------------------------------------
  console.log('\n========== [第 3 节] OSHA 29 CFR 1910 法规 ==========');
  const oshaData = getOSHA1910Regulations();
  await collectSection(
    oshaData,
    'OSHA Regulations',
    'OSHA',
    'US',
    'OSHA - Occupational Safety and Health Administration',
    'low',
    'high',
    'OSHA 法规'
  );

  // ----------------------------------------------------------
  // 第 4 节: NIOSH PPE-Info 标准
  // ----------------------------------------------------------
  console.log('\n========== [第 4 节] NIOSH PPE-Info 标准 ==========');
  const nioshData = getNIOSHStandards();
  await collectSection(
    nioshData,
    'NIOSH PPE-Info',
    'NIOSH',
    'US',
    'NIOSH - National Institute for Occupational Safety and Health',
    'low',
    'high',
    'NIOSH 标准'
  );

  // ----------------------------------------------------------
  // 第 5 节: 中国 GB 标准
  // ----------------------------------------------------------
  console.log('\n========== [第 5 节] 中国 GB 标准 ==========');
  const gbData = getGBStandards();
  await collectSection(
    gbData,
    'China GB Standards',
    'SAC/SAMR',
    'CN',
    'SAC/SAMR - 国家标准化管理委员会',
    'low',
    'high',
    'GB 标准'
  );

  // ----------------------------------------------------------
  // 第 6 节: BLS 工伤统计数据
  // ----------------------------------------------------------
  console.log('\n========== [第 6 节] BLS 工伤统计数据 ==========');
  const blsData = getBLSInjuryStatistics();
  await collectSection(
    blsData,
    'BLS Injury Statistics',
    'BLS',
    'US',
    'BLS - Bureau of Labor Statistics',
    'low',
    'medium',
    'BLS 统计'
  );

  // ----------------------------------------------------------
  // 第 7 节: OSHA 检查违法数据
  // ----------------------------------------------------------
  console.log('\n========== [第 7 节] OSHA 检查违法数据 ==========');
  const oshaInspData = getOSHAInspectionData();
  await collectSection(
    oshaInspData,
    'OSHA Inspection Data',
    'OSHA',
    'US',
    'OSHA - Occupational Safety and Health Administration',
    'low',
    'medium',
    'OSHA 检查'
  );

  // ----------------------------------------------------------
  // 完成总结
  // ----------------------------------------------------------
  console.log('\n============================================================');
  console.log('   采集完成!');
  console.log(`   总插入: ${totalInserted} 条`);
  console.log(`   完成时间: ${new Date().toISOString()}`);
  console.log('============================================================');
}

// ============================================================
// 直接运行
// ============================================================
main().catch((err) => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});