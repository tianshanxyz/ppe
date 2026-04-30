#!/usr/bin/env node
/**
 * PPE 数据库综合数据验证脚本
 * 仅分析和报告，不删除任何数据
 *
 * 功能：
 * 1. 数据来源验证 (Source Verification)
 * 2. PPE 类别验证 (Category Verification)
 * 3. 重复数据检测 (Duplicate Detection)
 * 4. 数据完整性检查 (Data Completeness Check)
 * 5. 虚假数据检测 (Fake Data Detection)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const BATCH_SIZE = 5000;

// ============================================================
// 已知权威数据来源
// ============================================================
const KNOWN_AUTHORITATIVE_SOURCES = [
  'FDA 510(k) Database',
  'FDA',
  'EUDAMED',
  'NMPA',
  'Health Canada',
  'TGA',
  'FDA 510(k) Database / EUDAMED / NMPA',
  'FDA 510(k) Database / EUDAMED',
  'FDA 510(k) Database / NMPA',
  'EUDAMED / NMPA',
  'Local Authority',
];

const AUTHORITATIVE_KEYWORDS = [
  'fda', '510k', '510(k)', 'eudamed', 'nmpa', 'health canada',
  'tga', 'mdall', 'ce', 'eu mdr', 'ppe regulation',
];

// ============================================================
// 非 PPE 产品关键词
// ============================================================
const NON_PPE_KEYWORDS = [
  // 牙科产品
  'dental', 'orthodontic', 'orthodontic bracket', 'orthodontic wire',
  'dental implant', 'dental cement', 'dental composite', 'dental resin',
  'dental filling', 'tooth', 'endodontic', 'periodontal',
  'dental crown', 'dental bridge', 'dental prosthesis', 'denture',
  'dental handpiece', 'dental drill', 'dental bur', 'dental mirror',
  'fuji ortho', 'glass ionomer', 'dental bonding', 'dental etchant',
  'dental sealant', 'dental whitening', 'dental bleaching',
  // 药品
  'pharmaceutical', 'drug', 'medication', 'tablet', 'capsule package',
  'injection', 'vaccine', 'antibiotic', 'analgesic', 'anesthetic',
  'insulin', 'heparin', 'saline', 'iv solution', 'infusion',
  // 手术器械（非防护类）
  'suture', 'scalpel', 'forceps', 'retractor', 'clamp',
  'scissors surgical', 'curettage', 'cautery', 'electrosurgical',
  'ligature', 'hemostat', 'dilator', 'speculum',
  // 内窥镜/导管类
  'endoscope', 'catheter', 'bronchoscope', 'colonoscope',
  'gastroscope', 'laparoscope', 'arthroscope', 'cystoscope',
  // 植入物/心脏类
  'stent', 'pacemaker', 'defibrillator', 'implant',
  'prosthesis', 'artificial joint', 'hip replacement',
  'knee replacement', 'spinal implant', 'bone plate', 'bone screw',
  // 视觉/听觉辅助
  'hearing aid', 'contact lens', 'intraocular lens',
  // 医院设备
  'wheelchair', 'hospital bed', 'patient monitor', 'ventilator',
  'infusion pump', 'syringe pump', 'ecg', 'eeg', 'ultrasound',
  'x-ray', 'ct scan', 'mri', 'defibrillator',
  // 注射器/针头
  'syringe', 'needle', 'hypodermic', 'biopsy needle',
  // 诊断试剂
  'diagnostic kit', 'test kit', 'reagent', 'assay',
  'ivd', 'in vitro diagnostic', 'rapid test',
  // 其他非PPE
  'software', 'app', 'mobile application', 'algorithm',
  'tongue depressor', 'thermometer', 'blood pressure',
  'oximeter', 'glucose monitor',
];

// PPE 关键词（用于确认产品确实是PPE）
const PPE_KEYWORDS = [
  'mask', 'respirator', 'n95', 'kn95', 'ffp2', 'ffp3',
  'glove', 'gown', 'shield', 'goggle', 'coverall', 'cap',
  'hood', 'apron', 'protective', 'isolation', 'surgical',
  'face shield', 'shoe cover', 'boot cover', 'head cover',
  'bouffant', 'scrub', 'barrier', 'tyvek', 'hazmat',
  'nitrile', 'latex', 'vinyl', 'examination',
  'ppe', 'personal protective', 'safety', 'helmet',
  'fall protection', 'harness', 'life jacket', 'vest',
  'earplug', 'earmuff', 'hearing protection',
  'welding', 'cut resistant', 'chemical resistant',
  'firefighter', 'flame resistant', 'arc flash',
];

// ============================================================
// 可疑/测试数据关键词
// ============================================================
const SUSPICIOUS_KEYWORDS = [
  'test', 'sample', 'demo', 'placeholder', 'fake', 'dummy',
  'example', 'todo', 'fixme', 'xxx', 'yyy', 'zzz',
  'abc', '123456', 'test product', 'sample product',
  'unknown product', 'unnamed', 'n/a', 'tbd',
];

// ============================================================
// 工具函数
// ============================================================
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function nameSimilarity(a, b) {
  if (!a || !b) return 0;
  const sa = a.toLowerCase().trim();
  const sb = b.toLowerCase().trim();
  if (sa === sb) return 1;
  const maxLen = Math.max(sa.length, sb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(sa, sb) / maxLen;
}

function isNonPPE(product) {
  const text = [
    product.name || '',
    product.description || '',
    product.subcategory || '',
    product.model || '',
  ].join(' ').toLowerCase();

  for (const keyword of NON_PPE_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      // 排除误判：如果同时包含PPE关键词，可能不是非PPE
      // 例如 "surgical mask" 不应被 "surgical" 误判
      const hasPPEOverride = PPE_KEYWORDS.some(ppeKw => text.includes(ppeKw.toLowerCase()));
      if (hasPPEOverride) continue;
      return { flag: true, keyword };
    }
  }
  return { flag: false, keyword: null };
}

function isSuspicious(product) {
  const name = (product.name || '').toLowerCase().trim();
  const mfr = (product.manufacturer_name || '').toLowerCase().trim();

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (name.includes(keyword) || mfr.includes(keyword)) {
      return { flag: true, keyword };
    }
  }

  // 检查过短的产品名称
  if (name.length > 0 && name.length < 5) {
    return { flag: true, keyword: 'name_too_short' };
  }

  // 检查纯数字名称
  if (/^\d+$/.test(name)) {
    return { flag: true, keyword: 'numeric_name' };
  }

  // 检查重复字符模式
  if (/(.)\1{4,}/.test(name)) {
    return { flag: true, keyword: 'repeated_chars' };
  }

  return { flag: false, keyword: null };
}

function formatPercent(count, total) {
  if (total === 0) return '0.0';
  return (count / total * 100).toFixed(1);
}

function formatNumber(n) {
  return n.toLocaleString();
}

// ============================================================
// 1. 数据来源验证
// ============================================================
async function verifyDataSources() {
  console.log('\n' + '='.repeat(70));
  console.log('  1. 数据来源验证 (Source Verification)');
  console.log('='.repeat(70));

  // 产品数据来源
  console.log('\n--- ppe_products 数据来源分布 ---');
  let productOffset = 0;
  const productSources = {};
  let productNoSource = 0;
  let productUnknownSource = 0;
  let productTotal = 0;

  const { count: pCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  productTotal = pCount || 0;
  console.log(`总记录数: ${formatNumber(productTotal)}`);

  while (productOffset < productTotal) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, data_source')
      .range(productOffset, productOffset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      const src = r.data_source;
      if (!src || src.trim() === '') {
        productNoSource++;
      } else if (src.toLowerCase() === 'unknown' || src.toLowerCase() === 'n/a' || src.toLowerCase() === 'none') {
        productUnknownSource++;
      } else {
        productSources[src] = (productSources[src] || 0) + 1;
      }
    }

    productOffset += BATCH_SIZE;
    if (productOffset % 20000 === 0) {
      console.log(`  已扫描 ${formatNumber(Math.min(productOffset, productTotal))}/${formatNumber(productTotal)} ...`);
    }
  }

  console.log('\n产品数据来源详细分布:');
  const sortedSources = Object.entries(productSources).sort((a, b) => b[1] - a[1]);
  for (const [src, count] of sortedSources) {
    const isAuthoritative = KNOWN_AUTHORITATIVE_SOURCES.some(
      auth => src.toLowerCase().includes(auth.toLowerCase()) || auth.toLowerCase().includes(src.toLowerCase())
    );
    const hasAuthKeyword = AUTHORITATIVE_KEYWORDS.some(kw => src.toLowerCase().includes(kw.toLowerCase()));
    const status = (isAuthoritative || hasAuthKeyword) ? '[权威来源]' : '[非权威来源-需审查]';
    console.log(`  ${src}: ${formatNumber(count)} (${formatPercent(count, productTotal)}%) ${status}`);
  }

  console.log(`\n  无数据来源 (data_source 为空): ${formatNumber(productNoSource)} (${formatPercent(productNoSource, productTotal)}%)`);
  console.log(`  数据来源为 unknown/n/a/none: ${formatNumber(productUnknownSource)} (${formatPercent(productUnknownSource, productTotal)}%)`);

  const verifiedCount = productTotal - productNoSource - productUnknownSource;
  console.log(`\n  有明确数据来源的记录: ${formatNumber(verifiedCount)} (${formatPercent(verifiedCount, productTotal)}%)`);
  console.log(`  缺少/无效数据来源的记录: ${formatNumber(productNoSource + productUnknownSource)} (${formatPercent(productNoSource + productUnknownSource, productTotal)}%)`);

  // 制造商数据来源
  console.log('\n--- ppe_manufacturers 数据来源分布 ---');
  let mfrOffset = 0;
  const mfrSources = {};
  let mfrNoSource = 0;
  let mfrTotal = 0;

  const { count: mCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  mfrTotal = mCount || 0;
  console.log(`总记录数: ${formatNumber(mfrTotal)}`);

  while (mfrOffset < mfrTotal) {
    const { data } = await supabase
      .from('ppe_manufacturers')
      .select('id, data_source')
      .range(mfrOffset, mfrOffset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      const src = r.data_source;
      if (!src || src.trim() === '') {
        mfrNoSource++;
      } else {
        mfrSources[src] = (mfrSources[src] || 0) + 1;
      }
    }

    mfrOffset += BATCH_SIZE;
  }

  const sortedMfrSources = Object.entries(mfrSources).sort((a, b) => b[1] - a[1]);
  for (const [src, count] of sortedMfrSources) {
    console.log(`  ${src}: ${formatNumber(count)} (${formatPercent(count, mfrTotal)}%)`);
  }
  console.log(`  无数据来源: ${formatNumber(mfrNoSource)} (${formatPercent(mfrNoSource, mfrTotal)}%)`);

  // 法规数据来源
  console.log('\n--- ppe_regulations 数据来源分布 ---');
  let regOffset = 0;
  const regSources = {};
  let regNoSource = 0;
  let regTotal = 0;

  const { count: rCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  regTotal = rCount || 0;
  console.log(`总记录数: ${formatNumber(regTotal)}`);

  while (regOffset < regTotal) {
    const { data } = await supabase
      .from('ppe_regulations')
      .select('id, data_source')
      .range(regOffset, regOffset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      const src = r.data_source;
      if (!src || src.trim() === '') {
        regNoSource++;
      } else {
        regSources[src] = (regSources[src] || 0) + 1;
      }
    }

    regOffset += BATCH_SIZE;
  }

  const sortedRegSources = Object.entries(regSources).sort((a, b) => b[1] - a[1]);
  for (const [src, count] of sortedRegSources) {
    console.log(`  ${src}: ${formatNumber(count)} (${formatPercent(count, regTotal)}%)`);
  }
  console.log(`  无数据来源: ${formatNumber(regNoSource)} (${formatPercent(regNoSource, regTotal)}%)`);

  return {
    productTotal, productNoSource, productUnknownSource,
    productSources: sortedSources,
    mfrTotal, mfrNoSource,
    regTotal, regNoSource,
  };
}

// ============================================================
// 2. PPE 类别验证
// ============================================================
async function verifyPPECategories() {
  console.log('\n' + '='.repeat(70));
  console.log('  2. PPE 类别验证 (Category Verification)');
  console.log('='.repeat(70));

  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品数: ${formatNumber(total)}`);

  // 类别分布
  console.log('\n--- 产品类别分布 ---');
  let catOffset = 0;
  const categoryDist = {};

  while (catOffset < total) {
    const { data } = await supabase
      .from('ppe_products')
      .select('category')
      .range(catOffset, catOffset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      const cat = r.category || '(空)';
      categoryDist[cat] = (categoryDist[cat] || 0) + 1;
    }

    catOffset += BATCH_SIZE;
  }

  const sortedCats = Object.entries(categoryDist).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    console.log(`  ${cat}: ${formatNumber(count)} (${formatPercent(count, total)}%)`);
  }

  // 检测非PPE产品
  console.log('\n--- 非 PPE 产品检测 ---');
  let offset = 0;
  const nonPPEProducts = [];
  const nonPPEByCategory = {};
  const nonPPEByKeyword = {};

  while (offset < total) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, category, subcategory, description, model, manufacturer_name, data_source')
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const result = isNonPPE(p);
      if (result.flag) {
        nonPPEProducts.push({
          id: p.id,
          name: p.name,
          category: p.category,
          subcategory: p.subcategory,
          manufacturer_name: p.manufacturer_name,
          data_source: p.data_source,
          flagged_keyword: result.keyword,
        });

        const cat = p.category || '(空)';
        nonPPEByCategory[cat] = (nonPPEByCategory[cat] || 0) + 1;
        nonPPEByKeyword[result.keyword] = (nonPPEByKeyword[result.keyword] || 0) + 1;
      }
    }

    offset += BATCH_SIZE;
    if (offset % 20000 === 0) {
      console.log(`  已扫描 ${formatNumber(Math.min(offset, total))}/${formatNumber(total)}, 发现非PPE: ${formatNumber(nonPPEProducts.length)}`);
    }
  }

  console.log(`\n  检测到的非PPE产品总数: ${formatNumber(nonPPEProducts.length)} (${formatPercent(nonPPEProducts.length, total)}%)`);

  console.log('\n  按当前类别分布:');
  for (const [cat, count] of Object.entries(nonPPEByCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat}: ${formatNumber(count)}`);
  }

  console.log('\n  按触发关键词分布 (前20):');
  const sortedKeywords = Object.entries(nonPPEByKeyword).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [kw, count] of sortedKeywords) {
    console.log(`    "${kw}": ${formatNumber(count)}`);
  }

  console.log('\n  非 PPE 产品示例 (前30条):');
  for (const p of nonPPEProducts.slice(0, 30)) {
    const nameDisplay = (p.name || '').substring(0, 60);
    console.log(`    [${p.id.substring(0, 8)}...] "${nameDisplay}" | 类别: ${p.category} | 触发词: "${p.flagged_keyword}" | 来源: ${p.data_source || '(无)'}`);
  }

  return { nonPPECount: nonPPEProducts.length, nonPPEByCategory, nonPPEByKeyword, nonPPEProducts };
}

// ============================================================
// 3. 重复数据检测
// ============================================================
async function detectDuplicates() {
  console.log('\n' + '='.repeat(70));
  console.log('  3. 重复数据检测 (Duplicate Detection)');
  console.log('='.repeat(70));

  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`总产品数: ${formatNumber(total)}`);

  // 精确重复检测 (name + model + manufacturer_name)
  console.log('\n--- 精确重复检测 (name + model + manufacturer_name) ---');
  let offset = 0;
  const exactKeyMap = new Map(); // key -> [{id, name}]
  let exactDuplicateCount = 0;
  const exactDuplicateGroups = [];

  while (offset < total) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, model, manufacturer_name')
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const key = `${(p.name || '').toLowerCase().trim()}|${(p.model || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}`;
      if (exactKeyMap.has(key)) {
        exactKeyMap.get(key).push({ id: p.id, name: p.name });
        exactDuplicateCount++;
      } else {
        exactKeyMap.set(key, [{ id: p.id, name: p.name }]);
      }
    }

    offset += BATCH_SIZE;
    if (offset % 20000 === 0) {
      console.log(`  已扫描 ${formatNumber(Math.min(offset, total))}/${formatNumber(total)} ...`);
    }
  }

  // 找出有重复的组
  for (const [key, items] of exactKeyMap) {
    if (items.length > 1) {
      exactDuplicateGroups.push({ key, count: items.length, items: items.slice(0, 3) });
    }
  }

  console.log(`\n  精确重复组数: ${formatNumber(exactDuplicateGroups.length)}`);
  console.log(`  精确重复记录数 (多出的): ${formatNumber(exactDuplicateCount)}`);

  console.log('\n  精确重复示例 (前15组):');
  for (const group of exactDuplicateGroups.slice(0, 15)) {
    const nameDisplay = (group.items[0].name || '').substring(0, 50);
    console.log(`    "${nameDisplay}" x${group.count} | IDs: ${group.items.map(i => i.id.substring(0, 8)).join(', ')}...`);
  }

  // 名称重复检测 (仅 name，忽略 model)
  console.log('\n--- 名称重复检测 (仅 name) ---');
  offset = 0;
  const nameKeyMap = new Map();
  let nameDuplicateCount = 0;
  const nameDuplicateGroups = [];

  while (offset < total) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, manufacturer_name')
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const nameKey = (p.name || '').toLowerCase().trim();
      if (!nameKey) continue;
      if (nameKeyMap.has(nameKey)) {
        nameKeyMap.get(nameKey).push({ id: p.id, name: p.name, mfr: p.manufacturer_name });
        nameDuplicateCount++;
      } else {
        nameKeyMap.set(nameKey, [{ id: p.id, name: p.name, mfr: p.manufacturer_name }]);
      }
    }

    offset += BATCH_SIZE;
  }

  for (const [key, items] of nameKeyMap) {
    if (items.length > 1) {
      nameDuplicateGroups.push({ key, count: items.length, items: items.slice(0, 3) });
    }
  }

  console.log(`  名称重复组数: ${formatNumber(nameDuplicateGroups.length)}`);
  console.log(`  名称重复记录数 (多出的): ${formatNumber(nameDuplicateCount)}`);

  console.log('\n  名称重复示例 (前15组):');
  const sortedNameGroups = nameDuplicateGroups.sort((a, b) => b.count - a.count);
  for (const group of sortedNameGroups.slice(0, 15)) {
    const nameDisplay = (group.items[0].name || '').substring(0, 50);
    console.log(`    "${nameDisplay}" x${group.count} | 制造商: ${group.items.map(i => (i.mfr || '(无)').substring(0, 20)).join(', ')}`);
  }

  // 近似重复检测 (对高重复名称进行相似度分析)
  console.log('\n--- 近似重复检测 (名称相似度 >= 0.85) ---');
  const nearDuplicatePairs = [];
  const allNames = [];

  offset = 0;
  while (offset < total) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, manufacturer_name')
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      if (p.name && p.name.trim().length > 5) {
        allNames.push({ id: p.id, name: p.name.trim(), mfr: p.manufacturer_name });
      }
    }

    offset += BATCH_SIZE;
  }

  // 采样检测：从每个类别中取样本进行相似度比较
  console.log(`  参与近似比较的产品数: ${formatNumber(allNames.length)}`);

  // 为避免 O(n^2) 的全量比较，采用分组策略：按名称首字母分组
  const groups = {};
  for (const item of allNames) {
    const firstChar = item.name.charAt(0).toLowerCase();
    if (!groups[firstChar]) groups[firstChar] = [];
    groups[firstChar].push(item);
  }

  let compared = 0;
  for (const [char, items] of Object.entries(groups)) {
    // 每组最多比较 2000 条
    const sample = items.slice(0, 2000);
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        // 快速预筛选：名称长度差不超过 30%
        const lenA = sample[i].name.length;
        const lenB = sample[j].name.length;
        if (Math.abs(lenA - lenB) / Math.max(lenA, lenB) > 0.3) continue;

        const sim = nameSimilarity(sample[i].name, sample[j].name);
        if (sim >= 0.85 && sim < 1.0) {
          nearDuplicatePairs.push({
            id1: sample[i].id,
            name1: sample[i].name,
            id2: sample[j].id,
            name2: sample[j].name,
            similarity: sim,
          });
        }
      }
      compared++;
    }
    if (compared % 5000 === 0) {
      console.log(`  已比较 ${formatNumber(compared)} 条记录, 发现近似重复对: ${formatNumber(nearDuplicatePairs.length)}`);
    }
  }

  console.log(`\n  近似重复对数: ${formatNumber(nearDuplicatePairs.length)}`);

  console.log('\n  近似重复示例 (前20对):');
  const sortedNearDupes = nearDuplicatePairs.sort((a, b) => b.similarity - a.similarity);
  for (const pair of sortedNearDupes.slice(0, 20)) {
    console.log(`    相似度: ${(pair.similarity * 100).toFixed(1)}%`);
    console.log(`      A: "${pair.name1.substring(0, 60)}" [${pair.id1.substring(0, 8)}...]`);
    console.log(`      B: "${pair.name2.substring(0, 60)}" [${pair.id2.substring(0, 8)}...]`);
  }

  // 制造商重复检测
  console.log('\n--- 制造商重复检测 (name + country) ---');
  const { count: mfrTotal } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { data: allMfrs } = await supabase
    .from('ppe_manufacturers')
    .select('id, name, country');

  const mfrKeyMap = new Map();
  let mfrDuplicateCount = 0;
  const mfrDuplicateGroups = [];

  if (allMfrs) {
    for (const m of allMfrs) {
      const key = `${(m.name || '').toLowerCase().trim()}|${(m.country || '').toLowerCase().trim()}`;
      if (mfrKeyMap.has(key)) {
        mfrKeyMap.get(key).push({ id: m.id, name: m.name });
        mfrDuplicateCount++;
      } else {
        mfrKeyMap.set(key, [{ id: m.id, name: m.name }]);
      }
    }

    for (const [key, items] of mfrKeyMap) {
      if (items.length > 1) {
        mfrDuplicateGroups.push({ key, count: items.length, items: items.slice(0, 3) });
      }
    }
  }

  console.log(`  制造商总数: ${formatNumber(mfrTotal)}`);
  console.log(`  制造商重复组数: ${formatNumber(mfrDuplicateGroups.length)}`);
  console.log(`  制造商重复记录数 (多出的): ${formatNumber(mfrDuplicateCount)}`);

  console.log('\n  制造商重复示例 (前15组):');
  const sortedMfrGroups = mfrDuplicateGroups.sort((a, b) => b.count - a.count);
  for (const group of sortedMfrGroups.slice(0, 15)) {
    const nameDisplay = (group.items[0].name || '').substring(0, 50);
    console.log(`    "${nameDisplay}" x${group.count}`);
  }

  return {
    exactDuplicateGroups: exactDuplicateGroups.length,
    exactDuplicateCount,
    nameDuplicateGroups: nameDuplicateGroups.length,
    nameDuplicateCount,
    nearDuplicatePairs: nearDuplicatePairs.length,
    mfrDuplicateGroups: mfrDuplicateGroups.length,
    mfrDuplicateCount,
  };
}

// ============================================================
// 4. 数据完整性检查
// ============================================================
async function checkDataCompleteness() {
  console.log('\n' + '='.repeat(70));
  console.log('  4. 数据完整性检查 (Data Completeness Check)');
  console.log('='.repeat(70));

  // 产品表完整性 - 使用实际数据库列名
  console.log('\n--- ppe_products 字段完整性 ---');
  const { count: pTotal } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  // 先获取样本确定实际存在的字段
  const { data: prodSample } = await supabase.from('ppe_products').select('*').limit(1);
  const allProductFields = prodSample && prodSample.length > 0
    ? Object.keys(prodSample[0]).filter(f => f !== 'id' && f !== 'created_at' && f !== 'updated_at')
    : ['name', 'category', 'subcategory', 'manufacturer_name', 'country_of_origin',
       'model', 'product_code', 'risk_level', 'description', 'data_source',
       'data_confidence_level', 'product_images', 'certifications',
       'specifications', 'related_standards', 'registration_number',
       'registration_authority', 'registration_valid_until', 'sales_regions',
       'international_names', 'technical_documents', 'ip_information',
       'product_name', 'product_category', 'manufacturer_country',
       'manufacturer_id', 'data_source_url', 'last_verified'];

  const productFields = allProductFields;

  const productCompleteness = {};
  let offset = 0;

  while (offset < pTotal) {
    const { data } = await supabase
      .from('ppe_products')
      .select(productFields.join(', '))
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      for (const field of productFields) {
        if (!productCompleteness[field]) productCompleteness[field] = { filled: 0, empty: 0 };
        const val = r[field];
        if (val !== null && val !== undefined && val !== '' && val !== 'Unknown' && val !== 'unknown') {
          productCompleteness[field].filled++;
        } else {
          productCompleteness[field].empty++;
        }
      }
    }

    offset += BATCH_SIZE;
    if (offset % 20000 === 0) {
      console.log(`  已扫描 ${formatNumber(Math.min(offset, pTotal))}/${formatNumber(pTotal)} ...`);
    }
  }

  console.log(`\n  总记录数: ${formatNumber(pTotal)}`);
  console.log('  字段完整性:');
  console.log('  ' + '-'.repeat(60));
  for (const field of productFields) {
    const stats = productCompleteness[field] || { filled: 0, empty: 0 };
    const pct = formatPercent(stats.filled, pTotal);
    const bar = '#'.repeat(Math.round(stats.filled / pTotal * 30)) + '.'.repeat(30 - Math.round(stats.filled / pTotal * 30));
    console.log(`  ${field.padEnd(25)} [${bar}] ${pct}% (${formatNumber(stats.filled)}/${formatNumber(pTotal)})`);
  }

  // 制造商表完整性
  console.log('\n--- ppe_manufacturers 字段完整性 ---');
  const { count: mTotal } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  // 先获取样本确定有哪些字段
  const { data: mfrSample } = await supabase.from('ppe_manufacturers').select('*').limit(1);
  const mfrFields = mfrSample && mfrSample.length > 0
    ? Object.keys(mfrSample[0]).filter(f => f !== 'id' && f !== 'created_at' && f !== 'updated_at')
    : ['name', 'country', 'data_source', 'legal_representative', 'address', 'website', 'phone', 'email', 'certification', 'product_count'];

  const mfrCompleteness = {};
  offset = 0;

  while (offset < mTotal) {
    const { data } = await supabase
      .from('ppe_manufacturers')
      .select(mfrFields.join(', '))
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      for (const field of mfrFields) {
        if (!mfrCompleteness[field]) mfrCompleteness[field] = { filled: 0, empty: 0 };
        const val = r[field];
        if (val !== null && val !== undefined && val !== '' && val !== 'Unknown' && val !== 'unknown') {
          mfrCompleteness[field].filled++;
        } else {
          mfrCompleteness[field].empty++;
        }
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`\n  总记录数: ${formatNumber(mTotal)}`);
  console.log('  字段完整性:');
  console.log('  ' + '-'.repeat(60));
  for (const field of mfrFields) {
    const stats = mfrCompleteness[field] || { filled: 0, empty: 0 };
    const pct = formatPercent(stats.filled, mTotal);
    const bar = '#'.repeat(Math.round(stats.filled / mTotal * 30)) + '.'.repeat(30 - Math.round(stats.filled / mTotal * 30));
    console.log(`  ${field.padEnd(25)} [${bar}] ${pct}% (${formatNumber(stats.filled)}/${formatNumber(mTotal)})`);
  }

  // 法规表完整性 - 动态获取字段
  console.log('\n--- ppe_regulations 字段完整性 ---');
  const { count: rTotal } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  const { data: regSample } = await supabase.from('ppe_regulations').select('*').limit(1);
  const regFields = regSample && regSample.length > 0
    ? Object.keys(regSample[0]).filter(f => f !== 'id' && f !== 'created_at' && f !== 'updated_at')
    : ['name', 'code', 'region', 'description', 'data_source'];

  const regCompleteness = {};
  offset = 0;

  while (offset < rTotal) {
    const { data } = await supabase
      .from('ppe_regulations')
      .select(regFields.join(', '))
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      for (const field of regFields) {
        if (!regCompleteness[field]) regCompleteness[field] = { filled: 0, empty: 0 };
        const val = r[field];
        if (val !== null && val !== undefined && val !== '' && val !== 'Unknown' && val !== 'unknown') {
          regCompleteness[field].filled++;
        } else {
          regCompleteness[field].empty++;
        }
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`\n  总记录数: ${formatNumber(rTotal)}`);
  console.log('  字段完整性:');
  console.log('  ' + '-'.repeat(60));
  for (const field of regFields) {
    const stats = regCompleteness[field] || { filled: 0, empty: 0 };
    const pct = formatPercent(stats.filled, rTotal);
    const bar = '#'.repeat(Math.round(stats.filled / rTotal * 30)) + '.'.repeat(30 - Math.round(stats.filled / rTotal * 30));
    console.log(`  ${field.padEnd(25)} [${bar}] ${pct}% (${formatNumber(stats.filled)}/${formatNumber(rTotal)})`);
  }

  return {
    productTotal: pTotal, productCompleteness,
    mfrTotal: mTotal, mfrCompleteness,
    regTotal: rTotal, regCompleteness,
  };
}

// ============================================================
// 5. 虚假数据检测
// ============================================================
async function detectFakeData() {
  console.log('\n' + '='.repeat(70));
  console.log('  5. 虚假数据检测 (Fake Data Detection)');
  console.log('='.repeat(70));

  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  let offset = 0;
  const suspiciousProducts = [];
  const suspiciousByKeyword = {};
  const genericNameCount = { count: 0, examples: [] };

  // 检测可疑产品
  console.log('\n--- 可疑产品检测 ---');

  while (offset < total) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, category, manufacturer_name, description, data_source, model, product_code')
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const result = isSuspicious(p);
      if (result.flag) {
        suspiciousProducts.push({
          id: p.id,
          name: p.name,
          category: p.category,
          manufacturer_name: p.manufacturer_name,
          data_source: p.data_source,
          reason: result.keyword,
        });
        suspiciousByKeyword[result.keyword] = (suspiciousByKeyword[result.keyword] || 0) + 1;
      }

      // 检测过于通用的名称
      const name = (p.name || '').toLowerCase().trim();
      const genericPatterns = [
        /^(ppe|mask|glove|gown|respirator|protective|safety|shield|cap|coverall)$/i,
        /^(product|item|device|equipment|supply)$/i,
        /^(new|used|refurbished)$/i,
      ];
      if (genericPatterns.some(pat => pat.test(name))) {
        genericNameCount.count++;
        if (genericNameCount.examples.length < 20) {
          genericNameCount.examples.push({ id: p.id, name: p.name, category: p.category });
        }
      }
    }

    offset += BATCH_SIZE;
    if (offset % 20000 === 0) {
      console.log(`  已扫描 ${formatNumber(Math.min(offset, total))}/${formatNumber(total)}, 可疑: ${formatNumber(suspiciousProducts.length)}`);
    }
  }

  console.log(`\n  可疑产品总数: ${formatNumber(suspiciousProducts.length)} (${formatPercent(suspiciousProducts.length, total)}%)`);

  console.log('\n  按可疑原因分布:');
  for (const [reason, count] of Object.entries(suspiciousByKeyword).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${reason}: ${formatNumber(count)}`);
  }

  console.log('\n  可疑产品示例 (前20条):');
  for (const p of suspiciousProducts.slice(0, 20)) {
    const nameDisplay = (p.name || '').substring(0, 50);
    console.log(`    [${p.id.substring(0, 8)}...] "${nameDisplay}" | 原因: ${p.reason} | 来源: ${p.data_source || '(无)'}`);
  }

  console.log(`\n  过于通用的产品名称: ${formatNumber(genericNameCount.count)}`);
  if (genericNameCount.examples.length > 0) {
    console.log('  示例:');
    for (const ex of genericNameCount.examples) {
      console.log(`    "${ex.name}" | 类别: ${ex.category}`);
    }
  }

  // 检测可疑制造商
  console.log('\n--- 可疑制造商检测 ---');
  const { count: mfrTotal } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  offset = 0;
  const suspiciousMfrs = [];
  const mfrNoName = { count: 0 };
  const mfrGenericName = { count: 0, examples: [] };

  while (offset < mfrTotal) {
    const { data } = await supabase
      .from('ppe_manufacturers')
      .select('id, name, country, data_source, legal_representative')
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const m of data) {
      const name = (m.name || '').trim();

      // 无名称
      if (!name || name === 'Unknown' || name === 'unknown') {
        mfrNoName.count++;
      }

      // 通用名称
      const genericMfrPatterns = [
        /^(company|manufacturer|factory|inc|ltd|corp|llc)$/i,
        /^(test|sample|demo|placeholder)/i,
        /^(abc|xyz|123)/i,
      ];
      if (genericMfrPatterns.some(pat => pat.test(name))) {
        mfrGenericName.count++;
        if (mfrGenericName.examples.length < 20) {
          mfrGenericName.examples.push({ id: m.id, name: m.name, country: m.country });
        }
      }

      // 检测可疑法定代表人
      if (m.legal_representative) {
        const lr = m.legal_representative.toLowerCase().trim();
        if (lr === 'zhang wei' || lr === 'wang wei' || lr === 'li wei' ||
            lr === 'test' || lr === 'unknown' || lr === 'n/a') {
          suspiciousMfrs.push({
            id: m.id,
            name: m.name,
            country: m.country,
            legal_representative: m.legal_representative,
            data_source: m.data_source,
            reason: 'suspicious_legal_rep',
          });
        }
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`  制造商总数: ${formatNumber(mfrTotal)}`);
  console.log(`  无名称/名称为Unknown: ${formatNumber(mfrNoName.count)}`);
  console.log(`  通用/可疑名称: ${formatNumber(mfrGenericName.count)}`);
  console.log(`  可疑法定代表人: ${formatNumber(suspiciousMfrs.length)}`);

  if (suspiciousMfrs.length > 0) {
    console.log('\n  可疑法定代表人示例 (前20条):');
    for (const m of suspiciousMfrs.slice(0, 20)) {
      console.log(`    "${m.name}" (${m.country}) | 法定代表人: "${m.legal_representative}" | 来源: ${m.data_source || '(无)'}`);
    }
  }

  if (mfrGenericName.examples.length > 0) {
    console.log('\n  通用名称制造商示例:');
    for (const ex of mfrGenericName.examples) {
      console.log(`    "${ex.name}" (${ex.country || '(无)'})`);
    }
  }

  // 检测无关联制造商的产品
  console.log('\n--- 孤立产品检测 (无对应制造商) ---');
  offset = 0;
  let orphanProducts = 0;
  const orphanExamples = [];

  // 获取所有制造商名称
  const { data: allMfrNames } = await supabase.from('ppe_manufacturers').select('name');
  const mfrNameSet = new Set();
  if (allMfrNames) {
    for (const m of allMfrNames) {
      if (m.name) mfrNameSet.add(m.name.toLowerCase().trim());
    }
  }

  while (offset < total) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, manufacturer_name')
      .range(offset, offset + BATCH_SIZE - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      if (p.manufacturer_name) {
        const mfrName = p.manufacturer_name.toLowerCase().trim();
        if (!mfrNameSet.has(mfrName)) {
          orphanProducts++;
          if (orphanExamples.length < 20) {
            orphanExamples.push({ id: p.id, name: p.name, manufacturer_name: p.manufacturer_name });
          }
        }
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`  产品引用了不存在的制造商: ${formatNumber(orphanProducts)}`);
  if (orphanExamples.length > 0) {
    console.log('  示例 (前10条):');
    for (const ex of orphanExamples.slice(0, 10)) {
      const nameDisplay = (ex.name || '').substring(0, 40);
      console.log(`    "${nameDisplay}" -> 制造商: "${ex.manufacturer_name}"`);
    }
  }

  return {
    suspiciousProductCount: suspiciousProducts.length,
    suspiciousByKeyword,
    genericNameCount: genericNameCount.count,
    mfrNoName: mfrNoName.count,
    mfrGenericName: mfrGenericName.count,
    suspiciousMfrCount: suspiciousMfrs.length,
    orphanProducts,
  };
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  const startTime = Date.now();

  console.log('\n' + '#'.repeat(70));
  console.log('  PPE 数据库综合数据验证报告');
  console.log('  生成时间: ' + new Date().toISOString());
  console.log('  数据库: ' + SUPABASE_URL);
  console.log('  注意: 本脚本仅分析和报告，不删除任何数据');
  console.log('#'.repeat(70));

  // 1. 数据来源验证
  const sourceResult = await verifyDataSources();

  // 2. PPE 类别验证
  const categoryResult = await verifyPPECategories();

  // 3. 重复数据检测
  const duplicateResult = await detectDuplicates();

  // 4. 数据完整性检查
  const completenessResult = await checkDataCompleteness();

  // 5. 虚假数据检测
  const fakeResult = await detectFakeData();

  // ============================================================
  // 总结报告
  // ============================================================
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '#'.repeat(70));
  console.log('  综合验证总结');
  console.log('#'.repeat(70));

  console.log('\n--- 数据量概览 ---');
  console.log(`  ppe_products:        ${formatNumber(sourceResult.productTotal)}`);
  console.log(`  ppe_manufacturers:   ${formatNumber(sourceResult.mfrTotal)}`);
  console.log(`  ppe_regulations:     ${formatNumber(sourceResult.regTotal)}`);

  console.log('\n--- 关键发现 ---');
  console.log(`  [严重] 缺少数据来源的产品: ${formatNumber(sourceResult.productNoSource + sourceResult.productUnknownSource)} (${formatPercent(sourceResult.productNoSource + sourceResult.productUnknownSource, sourceResult.productTotal)}%)`);
  console.log(`  [严重] 检测到的非PPE产品: ${formatNumber(categoryResult.nonPPECount)} (${formatPercent(categoryResult.nonPPECount, sourceResult.productTotal)}%)`);
  console.log(`  [中等] 精确重复产品组: ${formatNumber(duplicateResult.exactDuplicateGroups)} (多出 ${formatNumber(duplicateResult.exactDuplicateCount)} 条)`);
  console.log(`  [中等] 近似重复产品对: ${formatNumber(duplicateResult.nearDuplicatePairs)}`);
  console.log(`  [中等] 制造商重复组: ${formatNumber(duplicateResult.mfrDuplicateGroups)} (多出 ${formatNumber(duplicateResult.mfrDuplicateCount)} 条)`);
  console.log(`  [低]   可疑产品: ${formatNumber(fakeResult.suspiciousProductCount)} (${formatPercent(fakeResult.suspiciousProductCount, sourceResult.productTotal)}%)`);
  console.log(`  [低]   孤立产品(无对应制造商): ${formatNumber(fakeResult.orphanProducts)}`);
  console.log(`  [低]   可疑制造商: ${formatNumber(fakeResult.suspiciousMfrCount)}`);

  console.log('\n--- 清理建议 ---');
  console.log('  1. [高优先级] 为缺少 data_source 的记录补充数据来源信息');
  console.log(`     - 当前 ${formatNumber(sourceResult.productNoSource)} 条产品记录无数据来源`);
  console.log('     - 建议标记为"未验证"，优先从权威来源重新采集');
  console.log('');
  console.log('  2. [高优先级] 清除非PPE产品');
  console.log(`     - 当前 ${formatNumber(categoryResult.nonPPECount)} 条产品被标记为非PPE`);
  console.log('     - 特别是牙科产品(dental)、药品(pharmaceutical)、手术器械等');
  console.log('     - 建议先人工审核后再批量删除');
  console.log('');
  console.log('  3. [中优先级] 去重处理');
  console.log(`     - 精确重复: ${formatNumber(duplicateResult.exactDuplicateGroups)} 组, 可安全去重`);
  console.log(`     - 近似重复: ${formatNumber(duplicateResult.nearDuplicatePairs)} 对, 需人工审核`);
  console.log(`     - 制造商重复: ${formatNumber(duplicateResult.mfrDuplicateGroups)} 组, 可安全去重`);
  console.log('');
  console.log('  4. [中优先级] 补充关键字段');
  const criticalFields = ['category', 'manufacturer_name', 'country_of_origin', 'risk_level', 'description', 'product_code'];
  for (const field of criticalFields) {
    const stats = completenessResult.productCompleteness[field];
    if (stats) {
      const pct = formatPercent(stats.filled, sourceResult.productTotal);
      if (parseFloat(pct) < 90) {
        console.log(`     - ${field}: 仅 ${pct}% 填充率，需补充`);
      }
    }
  }
  console.log('');
  console.log('  5. [低优先级] 审查可疑数据');
  console.log(`     - 可疑法定代表人: ${formatNumber(fakeResult.suspiciousMfrCount)} 条`);
  console.log(`     - 孤立产品: ${formatNumber(fakeResult.orphanProducts)} 条`);
  console.log(`     - 通用名称产品: ${formatNumber(fakeResult.genericNameCount)} 条`);

  console.log(`\n  验证耗时: ${elapsed} 秒`);
  console.log('#'.repeat(70) + '\n');
}

main().catch(e => {
  console.error('脚本执行错误:', e);
  process.exit(1);
});
