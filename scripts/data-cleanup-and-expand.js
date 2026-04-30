#!/usr/bin/env node
/**
 * PPE 数据库综合数据清洗与去重脚本
 *
 * 执行5个阶段的数据清洗操作：
 * Phase 1: 删除无效数据（非PPE产品、可疑数据、Unknown记录）
 * Phase 2: 去重处理（精确重复、制造商重复、近似重复）
 * Phase 3: 修复虚假数据（Zhang Wei法定代表人、伪造数据标记）
 * Phase 4: 数据扩展（补充类别、风险等级、国家、置信度）
 * Phase 5: 生成报告
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  global: { fetchOptions: { timeout: 30000 } }
});

const BATCH_SIZE = 500;
const READ_BATCH = 5000;

// ============================================================
// 审计日志
// ============================================================
const auditLog = [];

function log(phase, action, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    phase,
    action,
    details,
  };
  auditLog.push(entry);
  console.log(`[${entry.timestamp}] [Phase ${phase}] [${action}] ${details}`);
}

// ============================================================
// 统计报告
// ============================================================
const report = {
  initialCounts: { products: 0, manufacturers: 0, regulations: 0 },
  phase1: {
    nonPPEDeleted: 0,
    suspiciousDeleted: 0,
    unknownDeleted: 0,
    totalDeleted: 0,
  },
  phase2: {
    exactDuplicateDeleted: 0,
    manufacturerDuplicateDeleted: 0,
    nearDuplicateDeleted: 0,
    totalDeleted: 0,
  },
  phase3: {
    legalRepCleared: 0,
    confidenceSetLow: 0,
    totalModified: 0,
  },
  phase4: {
    categoryFilled: 0,
    riskLevelFilled: 0,
    countryFilled: 0,
    confidenceSetHigh: 0,
    confidenceSetMedium: 0,
    totalModified: 0,
  },
  finalCounts: { products: 0, manufacturers: 0, regulations: 0 },
};

// ============================================================
// 非 PPE 产品关键词
// ============================================================
const NON_PPE_KEYWORDS = [
  'dental', 'orthodontic', 'orthodontic bracket', 'orthodontic wire',
  'dental implant', 'dental cement', 'dental composite', 'dental resin',
  'dental filling', 'tooth', 'endodontic', 'periodontal',
  'dental crown', 'dental bridge', 'dental prosthesis', 'denture',
  'dental handpiece', 'dental drill', 'dental bur', 'dental mirror',
  'fuji ortho', 'glass ionomer', 'dental bonding', 'dental etchant',
  'dental sealant', 'dental whitening', 'dental bleaching',
  'pharmaceutical', 'drug', 'medication', 'tablet', 'capsule package',
  'injection', 'vaccine', 'antibiotic', 'analgesic', 'anesthetic',
  'insulin', 'heparin', 'saline', 'iv solution', 'infusion',
  'suture', 'scalpel', 'forceps', 'retractor', 'clamp',
  'scissors surgical', 'curettage', 'cautery', 'electrosurgical',
  'ligature', 'hemostat', 'dilator', 'speculum',
  'endoscope', 'catheter', 'bronchoscope', 'colonoscope',
  'gastroscope', 'laparoscope', 'arthroscope', 'cystoscope',
  'stent', 'pacemaker', 'defibrillator',
  'prosthesis', 'artificial joint', 'hip replacement',
  'knee replacement', 'spinal implant', 'bone plate', 'bone screw',
  'hearing aid', 'contact lens', 'intraocular lens',
  'wheelchair', 'hospital bed', 'patient monitor', 'ventilator',
  'infusion pump', 'syringe pump', 'ecg', 'eeg', 'ultrasound',
  'x-ray', 'ct scan', 'mri',
  'syringe', 'needle', 'hypodermic', 'biopsy needle',
  'diagnostic kit', 'test kit', 'reagent', 'assay',
  'ivd', 'in vitro diagnostic', 'rapid test',
  'software', 'mobile application', 'algorithm',
  'tongue depressor', 'thermometer', 'blood pressure',
  'oximeter', 'glucose monitor',
];

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
// 可疑数据关键词
// ============================================================
const SUSPICIOUS_KEYWORDS = [
  'test', 'sample', 'demo', 'placeholder', 'fake', 'dummy',
  'example', 'todo', 'fixme', 'xxx', 'yyy', 'zzz',
  'abc', '123456', 'test product', 'sample product',
  'unknown product', 'unnamed', 'n/a', 'tbd',
];

// ============================================================
// 权威数据来源
// ============================================================
const AUTHORITATIVE_SOURCES = ['fda', '510k', '510(k)', 'eudamed', 'nmpa', 'health canada', 'tga'];

// ============================================================
// 类别关键词映射
// ============================================================
const CATEGORY_KEYWORD_MAP = [
  { keywords: ['glove'], category: '\u624b\u90e8\u9632\u62a4\u88c5\u5907' },
  { keywords: ['mask', 'respirator', 'n95', 'kn95', 'ffp2', 'ffp3', 'filtering facepiece'], category: '\u547c\u5438\u9632\u62a4\u88c5\u5907' },
  { keywords: ['gown', 'coverall', 'apron', 'isolation', 'protective clothing', 'hazmat', 'tyvek', 'scrub'], category: '\u8eab\u4f53\u9632\u62a4\u88c5\u5907' },
  { keywords: ['goggle', 'face shield', 'eyewear', 'eye protection'], category: '\u773c\u9762\u90e8\u9632\u62a4\u88c5\u5907' },
  { keywords: ['boot', 'shoe cover', 'shoe', 'foot protection', 'overshoe'], category: '\u8db3\u90e8\u9632\u62a4\u88c5\u5907' },
  { keywords: ['cap', 'hair cover', 'bouffant', 'head cover', 'hood', 'helmet', 'head protection'], category: '\u5934\u90e8\u9632\u62a4\u88c5\u5907' },
];

// ============================================================
// 风险等级映射
// ============================================================
const RISK_LEVEL_MAP = {
  '\u547c\u5438\u9632\u62a4\u88c5\u5907': 'high',
  '\u8eab\u4f53\u9632\u62a4\u88c5\u5907': 'medium',
  '\u624b\u90e8\u9632\u62a4\u88c5\u5907': 'medium',
  '\u773c\u9762\u90e8\u9632\u62a4\u88c5\u5907': 'medium',
  '\u5934\u90e8\u9632\u62a4\u88c5\u5907': 'low',
  '\u8db3\u90e8\u9632\u62a4\u88c5\u5907': 'low',
};

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

  if (name.length > 0 && name.length <= 2) {
    return { flag: true, keyword: 'name_too_short' };
  }
  if (/^\d+$/.test(name)) {
    return { flag: true, keyword: 'numeric_name' };
  }
  if (/(.)\1{4,}/.test(name)) {
    return { flag: true, keyword: 'repeated_chars' };
  }

  return { flag: false, keyword: null };
}

function countNonEmptyFields(record, excludeFields = ['id', 'created_at', 'updated_at']) {
  let count = 0;
  for (const [key, val] of Object.entries(record)) {
    if (excludeFields.includes(key)) continue;
    if (val !== null && val !== undefined && val !== '' && val !== 'Unknown' && val !== 'unknown') {
      count++;
    }
  }
  return count;
}

function isAuthoritativeSource(dataSource) {
  if (!dataSource) return false;
  const src = dataSource.toLowerCase();
  return AUTHORITATIVE_SOURCES.some(kw => src.includes(kw));
}

function inferCategory(name) {
  if (!name) return null;
  const text = name.toLowerCase();
  for (const mapping of CATEGORY_KEYWORD_MAP) {
    if (mapping.keywords.some(kw => text.includes(kw))) {
      return mapping.category;
    }
  }
  return null;
}

function inferRiskLevel(category, name) {
  if (!category) return null;
  if (category === '\u8eab\u4f53\u9632\u62a4\u88c5\u5907' && name) {
    const text = name.toLowerCase();
    if (text.includes('surgical') || text.includes('isolation')) {
      return 'high';
    }
  }
  return RISK_LEVEL_MAP[category] || null;
}

// ============================================================
// 批量操作函数（优化版）
// ============================================================

async function batchDelete(table, ids) {
  let deleted = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from(table)
      .delete()
      .in('id', batch);

    if (error) {
      log('DEL', 'ERROR', `${table} delete error: ${error.message}, batch ${i}-${i + batch.length}`);
    } else {
      deleted += batch.length;
    }

    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= ids.length) {
      log('DEL', 'PROGRESS', `${table}: deleted ${deleted}/${ids.length}`);
    }
  }
  return deleted;
}

/**
 * 批量更新 - 使用 in() 过滤器进行批量更新（同一更新数据的场景）
 * 比逐条更新快得多
 */
async function batchUpdateByIds(table, ids, updateData) {
  let updated = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from(table)
      .update(updateData, { count: 'exact' })
      .in('id', batch);

    if (error) {
      log('UPD', 'ERROR', `${table} batch update error: ${error.message}, batch ${i}-${i + batch.length}`);
    } else {
      updated += batch.length;
    }

    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= ids.length) {
      log('UPD', 'PROGRESS', `${table}: updated ${updated}/${ids.length}`);
    }
  }
  return updated;
}

/**
 * 使用过滤条件直接批量更新（最高效，一条SQL更新所有匹配行）
 */
async function bulkUpdateByFilter(table, updateData, filterFn) {
  // 先获取匹配的ID
  let query = supabase.from(table).select('id');
  query = filterFn(query);

  const { data, error } = await query;
  if (error) {
    log('UPD', 'ERROR', `${table} bulk query error: ${error.message}`);
    return 0;
  }

  if (!data || data.length === 0) return 0;

  const ids = data.map(r => r.id);
  log('UPD', 'BULK', `${table}: found ${ids.length} records to update`);

  return await batchUpdateByIds(table, ids, updateData);
}

/**
 * 逐条更新（用于每条记录更新数据不同的场景）
 */
async function batchUpdateIndividual(table, updates) {
  let updated = 0;
  const concurrency = 5; // 并发数

  for (let i = 0; i < updates.length; i += concurrency) {
    const batch = updates.slice(i, i + concurrency);
    const promises = batch.map(item =>
      supabase.from(table).update(item.data).eq('id', item.id)
    );

    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === 'fulfilled' && !result.value.error) {
        updated++;
      } else if (result.status === 'fulfilled') {
        log('UPD', 'ERROR', `${table} update error: ${result.value.error?.message}`);
      } else {
        log('UPD', 'ERROR', `${table} update rejected: ${result.reason}`);
      }
    }

    if ((i + concurrency) % 500 === 0 || i + concurrency >= updates.length) {
      log('UPD', 'PROGRESS', `${table}: updated ${updated}/${updates.length}`);
    }
  }
  return updated;
}

async function fetchAllRecords(table, selectFields, orderBy = 'id') {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  const total = count || 0;
  const allRecords = [];
  let offset = 0;

  while (offset < total) {
    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .range(offset, offset + READ_BATCH - 1)
      .order(orderBy);

    if (error) {
      log('READ', 'ERROR', `${table} read error: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;

    allRecords.push(...data);
    offset += READ_BATCH;

    if (offset % 20000 === 0) {
      log('READ', 'PROGRESS', `${table}: read ${Math.min(offset, total)}/${total}`);
    }
  }

  return allRecords;
}

// ============================================================
// Phase 1: 删除无效数据
// ============================================================
async function phase1_removeInvalidData() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 1: 删除无效数据');
  console.log('='.repeat(70));

  const products = await fetchAllRecords('ppe_products',
    'id, name, category, subcategory, manufacturer_name, description, model, product_code, data_source');

  log('1', 'START', `扫描产品总数: ${products.length}`);

  // 1.1 删除非PPE产品
  const nonPPEIds = [];
  const nonPPEByKeyword = {};
  for (const p of products) {
    const result = isNonPPE(p);
    if (result.flag) {
      nonPPEIds.push(p.id);
      nonPPEByKeyword[result.keyword] = (nonPPEByKeyword[result.keyword] || 0) + 1;
    }
  }

  log('1', 'NON_PPE', `检测到非PPE产品: ${nonPPEIds.length} 条`);
  for (const [kw, cnt] of Object.entries(nonPPEByKeyword).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    log('1', 'NON_PPE_DETAIL', `  关键词 "${kw}": ${cnt} 条`);
  }

  const nonPPEDeleted = await batchDelete('ppe_products', nonPPEIds);
  report.phase1.nonPPEDeleted = nonPPEDeleted;
  log('1', 'NON_PPE_DONE', `已删除非PPE产品: ${nonPPEDeleted} 条`);

  // 1.2 删除可疑产品（短名称、测试数据、xxx模式）
  const remainingProducts = await fetchAllRecords('ppe_products',
    'id, name, category, manufacturer_name, description, model, product_code, data_source');

  const suspiciousIds = [];
  const suspiciousByReason = {};
  for (const p of remainingProducts) {
    const result = isSuspicious(p);
    if (result.flag) {
      suspiciousIds.push(p.id);
      suspiciousByReason[result.keyword] = (suspiciousByReason[result.keyword] || 0) + 1;
    }
  }

  log('1', 'SUSPICIOUS', `检测到可疑产品: ${suspiciousIds.length} 条`);
  for (const [reason, cnt] of Object.entries(suspiciousByReason).sort((a, b) => b[1] - a[1])) {
    log('1', 'SUSPICIOUS_DETAIL', `  原因 "${reason}": ${cnt} 条`);
  }

  const suspiciousDeleted = await batchDelete('ppe_products', suspiciousIds);
  report.phase1.suspiciousDeleted = suspiciousDeleted;
  log('1', 'SUSPICIOUS_DONE', `已删除可疑产品: ${suspiciousDeleted} 条`);

  // 1.3 删除名称为 "Unknown" 的产品
  const { data: unknownProducts, error: unkErr } = await supabase
    .from('ppe_products')
    .select('id')
    .or('name.eq.Unknown,name.eq.unknown,name.is.null');

  if (unkErr) {
    log('1', 'ERROR', `查询Unknown产品失败: ${unkErr.message}`);
  } else if (unknownProducts && unknownProducts.length > 0) {
    const unknownIds = unknownProducts.map(p => p.id);
    log('1', 'UNKNOWN', `检测到Unknown/空名称产品: ${unknownIds.length} 条`);
    const unknownDeleted = await batchDelete('ppe_products', unknownIds);
    report.phase1.unknownDeleted = unknownDeleted;
    log('1', 'UNKNOWN_DONE', `已删除Unknown/空名称产品: ${unknownDeleted} 条`);
  }

  report.phase1.totalDeleted = report.phase1.nonPPEDeleted + report.phase1.suspiciousDeleted + report.phase1.unknownDeleted;
  log('1', 'COMPLETE', `Phase 1 完成, 共删除: ${report.phase1.totalDeleted} 条`);
}

// ============================================================
// Phase 2: 去重处理
// ============================================================
async function phase2_deduplication() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 2: 去重处理');
  console.log('='.repeat(70));

  // 2.1 精确重复去重 (name + model)
  log('2', 'START', '开始精确重复去重 (name + model)');
  const products = await fetchAllRecords('ppe_products', '*');

  const exactKeyMap = new Map();
  for (const p of products) {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.model || '').toLowerCase().trim()}`;
    if (!exactKeyMap.has(key)) {
      exactKeyMap.set(key, []);
    }
    exactKeyMap.get(key).push(p);
  }

  const exactDeleteIds = [];
  let exactGroups = 0;
  for (const [key, items] of exactKeyMap) {
    if (items.length > 1) {
      exactGroups++;
      items.sort((a, b) => countNonEmptyFields(b) - countNonEmptyFields(a));
      const toDelete = items.slice(1);
      for (const item of toDelete) {
        exactDeleteIds.push(item.id);
      }
    }
  }

  log('2', 'EXACT_DUP', `精确重复组: ${exactGroups}, 需删除: ${exactDeleteIds.length} 条`);
  const exactDeleted = await batchDelete('ppe_products', exactDeleteIds);
  report.phase2.exactDuplicateDeleted = exactDeleted;
  log('2', 'EXACT_DUP_DONE', `已删除精确重复: ${exactDeleted} 条`);

  // 2.2 制造商重复去重 (name + country)
  log('2', 'START', '开始制造商重复去重 (name + country)');
  const manufacturers = await fetchAllRecords('ppe_manufacturers', '*');

  const mfrKeyMap = new Map();
  for (const m of manufacturers) {
    const key = `${(m.name || '').toLowerCase().trim()}|${(m.country || '').toLowerCase().trim()}`;
    if (!mfrKeyMap.has(key)) {
      mfrKeyMap.set(key, []);
    }
    mfrKeyMap.get(key).push(m);
  }

  // 对于制造商去重，需要处理外键约束
  // 策略：先更新产品表中的 manufacturer_id 指向保留的制造商，再删除重复的
  const mfrDeleteIds = [];
  const mfrRemap = new Map(); // oldId -> keepId
  let mfrGroups = 0;

  for (const [key, items] of mfrKeyMap) {
    if (items.length > 1) {
      mfrGroups++;
      items.sort((a, b) => countNonEmptyFields(b) - countNonEmptyFields(a));
      const toKeep = items[0];
      const toDelete = items.slice(1);
      for (const item of toDelete) {
        mfrDeleteIds.push(item.id);
        mfrRemap.set(item.id, toKeep.id);
      }
    }
  }

  log('2', 'MFR_DUP', `制造商重复组: ${mfrGroups}, 需删除: ${mfrDeleteIds.length} 条`);

  // 先更新产品表中的 manufacturer_id 引用
  let remapped = 0;
  for (const [oldId, keepId] of mfrRemap) {
    const { error: remapError } = await supabase
      .from('ppe_products')
      .update({ manufacturer_id: keepId })
      .eq('manufacturer_id', oldId);

    if (remapError) {
      // 静默处理，可能没有引用
    } else {
      remapped++;
    }
  }
  log('2', 'MFR_REMAP', `已重映射产品引用: ${remapped} 条`);

  const mfrDeleted = await batchDelete('ppe_manufacturers', mfrDeleteIds);
  report.phase2.manufacturerDuplicateDeleted = mfrDeleted;
  log('2', 'MFR_DUP_DONE', `已删除制造商重复: ${mfrDeleted} 条`);

  // 2.3 近似重复去重 (similarity >= 0.95)
  log('2', 'START', '开始近似重复去重 (similarity >= 0.95)');

  const currentProducts = await fetchAllRecords('ppe_products',
    'id, name, model, manufacturer_name, category, description, data_source, country_of_origin, risk_level, product_code, subcategory, registration_number, certifications, specifications, related_standards');

  const groups = {};
  for (const p of currentProducts) {
    const name = (p.name || '').trim();
    if (name.length < 3) continue;
    const firstChar = name.charAt(0).toLowerCase();
    if (!groups[firstChar]) groups[firstChar] = [];
    groups[firstChar].push(p);
  }

  const nearDuplicateIds = new Set();
  let nearPairs = 0;

  for (const [char, items] of Object.entries(groups)) {
    const sample = items.slice(0, 2000);
    for (let i = 0; i < sample.length; i++) {
      if (nearDuplicateIds.has(sample[i].id)) continue;
      for (let j = i + 1; j < sample.length; j++) {
        if (nearDuplicateIds.has(sample[j].id)) continue;

        const lenA = (sample[i].name || '').length;
        const lenB = (sample[j].name || '').length;
        if (Math.abs(lenA - lenB) / Math.max(lenA, lenB) > 0.3) continue;

        const sim = nameSimilarity(sample[i].name, sample[j].name);
        if (sim >= 0.95 && sim < 1.0) {
          nearPairs++;
          const scoreA = countNonEmptyFields(sample[i]);
          const scoreB = countNonEmptyFields(sample[j]);
          const toRemove = scoreA >= scoreB ? sample[j] : sample[i];
          nearDuplicateIds.add(toRemove.id);
        }
      }
    }
  }

  log('2', 'NEAR_DUP', `近似重复对: ${nearPairs}, 需删除: ${nearDuplicateIds.size} 条`);
  const nearDeleted = await batchDelete('ppe_products', Array.from(nearDuplicateIds));
  report.phase2.nearDuplicateDeleted = nearDeleted;
  log('2', 'NEAR_DUP_DONE', `已删除近似重复: ${nearDeleted} 条`);

  report.phase2.totalDeleted = report.phase2.exactDuplicateDeleted + report.phase2.manufacturerDuplicateDeleted + report.phase2.nearDuplicateDeleted;
  log('2', 'COMPLETE', `Phase 2 完成, 共删除: ${report.phase2.totalDeleted} 条`);
}

// ============================================================
// Phase 3: 修复虚假数据
// ============================================================
async function phase3_fixFabricatedData() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 3: 修复虚假数据');
  console.log('='.repeat(70));

  // 3.1 清除 "Zhang Wei" 法定代表人 - 使用高效批量更新
  log('3', 'START', '开始清除可疑法定代表人 (Zhang Wei等)');

  // 获取所有 Zhang Wei 记录的ID
  const { count: zhangWeiCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
    .ilike('legal_representative', 'Zhang Wei');

  log('3', 'ZHANG_WEI', `Zhang Wei 法定代表人记录: ${zhangWeiCount || 0} 条`);

  // 使用批量ID更新（比逐条快很多）
  let zhangWeiIds = [];
  let offset = 0;
  while (offset < (zhangWeiCount || 0)) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select('id')
      .ilike('legal_representative', 'Zhang Wei')
      .range(offset, offset + READ_BATCH - 1);

    if (error || !data || data.length === 0) break;
    zhangWeiIds.push(...data.map(r => r.id));
    offset += READ_BATCH;
  }

  const zhangWeiUpdated = await batchUpdateByIds('ppe_manufacturers', zhangWeiIds, {
    legal_representative: null,
    data_confidence_level: 'low',
  });
  report.phase3.legalRepCleared = zhangWeiUpdated;
  log('3', 'ZHANG_WEI_DONE', `已清除 Zhang Wei 法定代表人: ${zhangWeiUpdated} 条`);

  // 3.2 检测其他可疑法定代表人
  const suspiciousLegalReps = ['Wang Wei', 'Li Wei', 'Liu Wei', 'Zhang Ming', 'Wang Ming'];
  let otherCleared = 0;

  for (const rep of suspiciousLegalReps) {
    const { count: repCount } = await supabase
      .from('ppe_manufacturers')
      .select('*', { count: 'exact', head: true })
      .ilike('legal_representative', rep);

    if (repCount && repCount > 0) {
      log('3', 'SUSPICIOUS_REP', `可疑法定代表人 "${rep}": ${repCount} 条`);

      let repIds = [];
      let repOffset = 0;
      while (repOffset < repCount) {
        const { data, error } = await supabase
          .from('ppe_manufacturers')
          .select('id')
          .ilike('legal_representative', rep)
          .range(repOffset, repOffset + READ_BATCH - 1);

        if (error || !data || data.length === 0) break;
        repIds.push(...data.map(r => r.id));
        repOffset += READ_BATCH;
      }

      const updated = await batchUpdateByIds('ppe_manufacturers', repIds, {
        legal_representative: null,
        data_confidence_level: 'low',
      });
      otherCleared += updated;
    }
  }

  log('3', 'OTHER_REP_DONE', `已清除其他可疑法定代表人: ${otherCleared} 条`);

  // 3.3 标记伪造数据模式
  log('3', 'START', '检测伪造数据模式');

  const manufacturers = await fetchAllRecords('ppe_manufacturers', '*');
  const fabricatedIds = [];

  for (const m of manufacturers) {
    if (m.data_confidence_level === 'low') continue; // 已标记

    const enhancedFields = ['address', 'website', 'phone', 'email', 'certification'];
    const filledValues = enhancedFields
      .map(f => m[f])
      .filter(v => v !== null && v !== undefined && v !== '' && v !== 'Unknown');

    if (filledValues.length >= 3) {
      const uniqueValues = new Set(filledValues.map(v => String(v).toLowerCase().trim()));
      if (uniqueValues.size <= 2) {
        fabricatedIds.push(m.id);
      }
    }

    if (m.phone) {
      const phone = String(m.phone).replace(/[\s\-()]/g, '');
      if (/^(\d)\1+$/.test(phone)) {
        if (!fabricatedIds.includes(m.id)) {
          fabricatedIds.push(m.id);
        }
      }
    }
  }

  log('3', 'FABRICATED', `检测到伪造模式制造商: ${fabricatedIds.length} 条`);
  const fabricatedUpdated = await batchUpdateByIds('ppe_manufacturers', fabricatedIds, {
    data_confidence_level: 'low',
  });
  report.phase3.confidenceSetLow = fabricatedUpdated;
  log('3', 'FABRICATED_DONE', `已标记低置信度: ${fabricatedUpdated} 条`);

  report.phase3.totalModified = zhangWeiUpdated + otherCleared + fabricatedUpdated;
  log('3', 'COMPLETE', `Phase 3 完成, 共修改: ${report.phase3.totalModified} 条`);
}

// ============================================================
// Phase 4: 数据扩展
// ============================================================
async function phase4_dataExpansion() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 4: 数据扩展');
  console.log('='.repeat(70));

  const products = await fetchAllRecords('ppe_products',
    'id, name, category, subcategory, manufacturer_name, country_of_origin, risk_level, data_source, data_confidence_level, model, description, product_code, manufacturer_country, manufacturer_id');

  log('4', 'START', `产品总数: ${products.length}`);

  const authoritativeProducts = products.filter(p => isAuthoritativeSource(p.data_source));
  log('4', 'AUTHORITATIVE', `权威来源产品: ${authoritativeProducts.length} 条`);

  // 4.1 补充类别
  const categoryIds = [];
  for (const p of authoritativeProducts) {
    if (!p.category || p.category === 'Unknown' || p.category === 'unknown' || p.category === '\u5176\u4ed6') {
      const inferred = inferCategory(p.name);
      if (inferred) {
        categoryIds.push({ id: p.id, category: inferred });
      }
    }
  }

  // 按类别分组批量更新
  const categoryGroups = {};
  for (const item of categoryIds) {
    if (!categoryGroups[item.category]) categoryGroups[item.category] = [];
    categoryGroups[item.category].push(item.id);
  }

  let categoryUpdated = 0;
  for (const [category, ids] of Object.entries(categoryGroups)) {
    const updated = await batchUpdateByIds('ppe_products', ids, { category });
    categoryUpdated += updated;
    log('4', 'CATEGORY_BATCH', `类别 "${category}": 更新 ${updated} 条`);
  }

  report.phase4.categoryFilled = categoryUpdated;
  log('4', 'CATEGORY_DONE', `已补充类别: ${categoryUpdated} 条`);

  // 4.2 补充风险等级
  const updatedProducts = await fetchAllRecords('ppe_products',
    'id, name, category, risk_level, data_source, data_confidence_level, country_of_origin, manufacturer_country, manufacturer_name');

  const riskGroups = {};
  for (const p of updatedProducts) {
    if (!p.risk_level || p.risk_level === 'Unknown' || p.risk_level === 'unknown') {
      const inferred = inferRiskLevel(p.category, p.name);
      if (inferred) {
        if (!riskGroups[inferred]) riskGroups[inferred] = [];
        riskGroups[inferred].push(p.id);
      }
    }
  }

  let riskUpdated = 0;
  for (const [risk, ids] of Object.entries(riskGroups)) {
    const updated = await batchUpdateByIds('ppe_products', ids, { risk_level: risk });
    riskUpdated += updated;
    log('4', 'RISK_BATCH', `风险等级 "${risk}": 更新 ${updated} 条`);
  }

  report.phase4.riskLevelFilled = riskUpdated;
  log('4', 'RISK_LEVEL_DONE', `已补充风险等级: ${riskUpdated} 条`);

  // 4.3 补充 country_of_origin
  const allManufacturers = await fetchAllRecords('ppe_manufacturers', 'id, name, country');
  const mfrCountryMap = new Map();
  for (const m of allManufacturers) {
    if (m.name && m.country) {
      mfrCountryMap.set(m.name.toLowerCase().trim(), m.country);
    }
  }

  const countryGroups = {};
  for (const p of updatedProducts) {
    if (!p.country_of_origin || p.country_of_origin === 'Unknown' || p.country_of_origin === 'unknown') {
      let country = null;

      if (p.manufacturer_country && p.manufacturer_country !== 'Unknown') {
        country = p.manufacturer_country;
      } else if (p.manufacturer_name) {
        const mfrCountry = mfrCountryMap.get(p.manufacturer_name.toLowerCase().trim());
        if (mfrCountry) {
          country = mfrCountry;
        }
      }

      if (country) {
        if (!countryGroups[country]) countryGroups[country] = [];
        countryGroups[country].push(p.id);
      }
    }
  }

  let countryUpdated = 0;
  for (const [country, ids] of Object.entries(countryGroups)) {
    const updated = await batchUpdateByIds('ppe_products', ids, { country_of_origin: country });
    countryUpdated += updated;
  }

  report.phase4.countryFilled = countryUpdated;
  log('4', 'COUNTRY_DONE', `已补充国家: ${countryUpdated} 条`);

  // 4.4 设置 data_confidence_level
  log('4', 'START', '设置数据置信度');

  const finalProducts = await fetchAllRecords('ppe_products',
    'id, data_source, data_confidence_level');

  const highConfIds = [];
  const mediumConfIds = [];

  for (const p of finalProducts) {
    if (isAuthoritativeSource(p.data_source)) {
      if (p.data_confidence_level !== 'high') {
        highConfIds.push(p.id);
      }
    } else if (p.data_source && p.data_source.trim() !== '' &&
               p.data_source.toLowerCase() !== 'unknown' && p.data_source.toLowerCase() !== 'n/a') {
      if (!p.data_confidence_level || p.data_confidence_level === 'unknown') {
        mediumConfIds.push(p.id);
      }
    }
  }

  log('4', 'CONFIDENCE_HIGH', `设为高置信度: ${highConfIds.length} 条`);
  const highUpdated = await batchUpdateByIds('ppe_products', highConfIds, { data_confidence_level: 'high' });
  report.phase4.confidenceSetHigh = highUpdated;
  log('4', 'CONFIDENCE_HIGH_DONE', `已设为高置信度: ${highUpdated} 条`);

  log('4', 'CONFIDENCE_MEDIUM', `设为中置信度: ${mediumConfIds.length} 条`);
  const mediumUpdated = await batchUpdateByIds('ppe_products', mediumConfIds, { data_confidence_level: 'medium' });
  report.phase4.confidenceSetMedium = mediumUpdated;
  log('4', 'CONFIDENCE_MEDIUM_DONE', `已设为中置信度: ${mediumUpdated} 条`);

  report.phase4.totalModified = categoryUpdated + riskUpdated + countryUpdated + highUpdated + mediumUpdated;
  log('4', 'COMPLETE', `Phase 4 完成, 共修改: ${report.phase4.totalModified} 条`);
}

// ============================================================
// Phase 5: 生成报告
// ============================================================
async function phase5_generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 5: 生成报告');
  console.log('='.repeat(70));

  const { count: finalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: finalRegulations } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  report.finalCounts = {
    products: finalProducts || 0,
    manufacturers: finalManufacturers || 0,
    regulations: finalRegulations || 0,
  };

  // 类别分布
  const categoryDist = {};
  const catProducts = await fetchAllRecords('ppe_products', 'category, risk_level, data_confidence_level, data_source');
  for (const p of catProducts) {
    const cat = p.category || '(空)';
    categoryDist[cat] = (categoryDist[cat] || 0) + 1;
  }

  // 风险等级分布
  const riskDist = {};
  for (const p of catProducts) {
    const risk = p.risk_level || '(空)';
    riskDist[risk] = (riskDist[risk] || 0) + 1;
  }

  // 置信度分布
  const confDist = {};
  for (const p of catProducts) {
    const conf = p.data_confidence_level || '(空)';
    confDist[conf] = (confDist[conf] || 0) + 1;
  }

  // 数据来源分布
  const sourceDist = {};
  for (const p of catProducts) {
    const src = p.data_source || '(空)';
    sourceDist[src] = (sourceDist[src] || 0) + 1;
  }

  // 制造商置信度分布
  const mfrConfDist = {};
  const mfrConfProducts = await fetchAllRecords('ppe_manufacturers', 'data_confidence_level');
  for (const m of mfrConfProducts) {
    const conf = m.data_confidence_level || '(空)';
    mfrConfDist[conf] = (mfrConfDist[conf] || 0) + 1;
  }

  // 打印综合报告
  console.log('\n' + '#'.repeat(70));
  console.log('  PPE 数据库清洗与去重 - 综合报告');
  console.log('  生成时间: ' + new Date().toISOString());
  console.log('#'.repeat(70));

  console.log('\n--- 数据量变化 ---');
  console.log(`  ppe_products:        ${report.initialCounts.products.toLocaleString()} -> ${report.finalCounts.products.toLocaleString()} (减少 ${(report.initialCounts.products - report.finalCounts.products).toLocaleString()})`);
  console.log(`  ppe_manufacturers:   ${report.initialCounts.manufacturers.toLocaleString()} -> ${report.finalCounts.manufacturers.toLocaleString()} (减少 ${(report.initialCounts.manufacturers - report.finalCounts.manufacturers).toLocaleString()})`);
  console.log(`  ppe_regulations:     ${report.initialCounts.regulations.toLocaleString()} -> ${report.finalCounts.regulations.toLocaleString()}`);

  console.log('\n--- Phase 1: 删除无效数据 ---');
  console.log(`  非PPE产品删除:       ${report.phase1.nonPPEDeleted.toLocaleString()} 条`);
  console.log(`  可疑产品删除:        ${report.phase1.suspiciousDeleted.toLocaleString()} 条`);
  console.log(`  Unknown产品删除:     ${report.phase1.unknownDeleted.toLocaleString()} 条`);
  console.log(`  Phase 1 总删除:      ${report.phase1.totalDeleted.toLocaleString()} 条`);

  console.log('\n--- Phase 2: 去重处理 ---');
  console.log(`  精确重复删除:        ${report.phase2.exactDuplicateDeleted.toLocaleString()} 条`);
  console.log(`  制造商重复删除:      ${report.phase2.manufacturerDuplicateDeleted.toLocaleString()} 条`);
  console.log(`  近似重复删除:        ${report.phase2.nearDuplicateDeleted.toLocaleString()} 条`);
  console.log(`  Phase 2 总删除:      ${report.phase2.totalDeleted.toLocaleString()} 条`);

  console.log('\n--- Phase 3: 修复虚假数据 ---');
  console.log(`  法定代表人清除:      ${report.phase3.legalRepCleared.toLocaleString()} 条`);
  console.log(`  低置信度标记:        ${report.phase3.confidenceSetLow.toLocaleString()} 条`);
  console.log(`  Phase 3 总修改:      ${report.phase3.totalModified.toLocaleString()} 条`);

  console.log('\n--- Phase 4: 数据扩展 ---');
  console.log(`  类别补充:            ${report.phase4.categoryFilled.toLocaleString()} 条`);
  console.log(`  风险等级补充:        ${report.phase4.riskLevelFilled.toLocaleString()} 条`);
  console.log(`  国家补充:            ${report.phase4.countryFilled.toLocaleString()} 条`);
  console.log(`  高置信度设置:        ${report.phase4.confidenceSetHigh.toLocaleString()} 条`);
  console.log(`  中置信度设置:        ${report.phase4.confidenceSetMedium.toLocaleString()} 条`);
  console.log(`  Phase 4 总修改:      ${report.phase4.totalModified.toLocaleString()} 条`);

  console.log('\n--- 最终数据分布 ---');
  console.log('\n  产品类别分布:');
  for (const [cat, count] of Object.entries(categoryDist).sort((a, b) => b[1] - a[1])) {
    const pct = (count / report.finalCounts.products * 100).toFixed(1);
    console.log(`    ${cat}: ${count.toLocaleString()} (${pct}%)`);
  }

  console.log('\n  风险等级分布:');
  for (const [risk, count] of Object.entries(riskDist).sort((a, b) => b[1] - a[1])) {
    const pct = (count / report.finalCounts.products * 100).toFixed(1);
    console.log(`    ${risk}: ${count.toLocaleString()} (${pct}%)`);
  }

  console.log('\n  数据置信度分布:');
  for (const [conf, count] of Object.entries(confDist).sort((a, b) => b[1] - a[1])) {
    const pct = (count / report.finalCounts.products * 100).toFixed(1);
    console.log(`    ${conf}: ${count.toLocaleString()} (${pct}%)`);
  }

  console.log('\n  数据来源分布 (前10):');
  const sortedSources = Object.entries(sourceDist).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [src, count] of sortedSources) {
    const pct = (count / report.finalCounts.products * 100).toFixed(1);
    console.log(`    ${src}: ${count.toLocaleString()} (${pct}%)`);
  }

  console.log('\n  制造商置信度分布:');
  for (const [conf, count] of Object.entries(mfrConfDist).sort((a, b) => b[1] - a[1])) {
    const pct = (count / report.finalCounts.manufacturers * 100).toFixed(1);
    console.log(`    ${conf}: ${count.toLocaleString()} (${pct}%)`);
  }

  console.log('\n--- 数据质量改善指标 ---');
  const productsReduction = report.initialCounts.products - report.finalCounts.products;
  const improvementPct = report.initialCounts.products > 0
    ? (productsReduction / report.initialCounts.products * 100).toFixed(1)
    : '0.0';

  console.log(`  产品数据精简率:      ${improvementPct}% (${report.initialCounts.products.toLocaleString()} -> ${report.finalCounts.products.toLocaleString()})`);
  console.log(`  无效数据清除:        ${(report.phase1.totalDeleted + report.phase2.totalDeleted).toLocaleString()} 条`);
  console.log(`  数据质量提升:        ${(report.phase3.totalModified + report.phase4.totalModified).toLocaleString()} 条记录被修正或增强`);

  const highConfCount = confDist['high'] || 0;
  const highConfPct = report.finalCounts.products > 0
    ? (highConfCount / report.finalCounts.products * 100).toFixed(1)
    : '0.0';
  console.log(`  高置信度数据占比:    ${highConfPct}%`);

  console.log('\n' + '#'.repeat(70));
  console.log('  清洗完成');
  console.log('#'.repeat(70) + '\n');
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  const startTime = Date.now();

  console.log('\n' + '#'.repeat(70));
  console.log('  PPE 数据库综合数据清洗与去重');
  console.log('  开始时间: ' + new Date().toISOString());
  console.log('  数据库: ' + SUPABASE_URL);
  console.log('#'.repeat(70));

  const { count: initProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: initManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: initRegulations } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  report.initialCounts = {
    products: initProducts || 0,
    manufacturers: initManufacturers || 0,
    regulations: initRegulations || 0,
  };

  console.log(`\n初始数据量:`);
  console.log(`  ppe_products:      ${report.initialCounts.products.toLocaleString()}`);
  console.log(`  ppe_manufacturers: ${report.initialCounts.manufacturers.toLocaleString()}`);
  console.log(`  ppe_regulations:   ${report.initialCounts.regulations.toLocaleString()}`);

  try {
    await phase1_removeInvalidData();
    await phase2_deduplication();
    await phase3_fixFabricatedData();
    await phase4_dataExpansion();
    await phase5_generateReport();
  } catch (e) {
    console.error('\n!!! 脚本执行错误 !!!');
    console.error(e);
    log('MAIN', 'ERROR', e.message);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n总耗时: ${elapsed} 秒`);
  console.log(`审计日志条目: ${auditLog.length}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
