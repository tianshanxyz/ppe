#!/usr/bin/env node
/**
 * PPE 数据库数据扩展与标准化脚本
 *
 * 迁移后数据后处理：
 * Phase 1: 法规地区标准化 - 将中文地区名统一为 ISO 代码
 * Phase 2: 产品数据扩展 - 为权威来源产品补充 specifications/sales_regions/related_standards
 * Phase 3: 制造商数据扩展 - 为权威来源制造商补充 compliance_status/risk_alerts
 * Phase 4: 生成综合报告
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  global: { fetchOptions: { timeout: 30000 } }
});

const BATCH_SIZE = 500;
const READ_BATCH = 1000;

// ============================================================
// 日志与报告
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

const report = {
  initialCounts: { products: 0, manufacturers: 0, regulations: 0 },
  phase1: {
    regulationsScanned: 0,
    regionStandardized: 0,
    regionByMapping: {},
    errors: 0,
  },
  phase2: {
    productsScanned: 0,
    authoritativeProducts: 0,
    specificationsFilled: 0,
    salesRegionsFilled: 0,
    relatedStandardsFilled: 0,
    errors: 0,
  },
  phase3: {
    manufacturersScanned: 0,
    authoritativeManufacturers: 0,
    complianceStatusFilled: 0,
    riskAlertsFilled: 0,
    errors: 0,
  },
  finalCounts: { products: 0, manufacturers: 0, regulations: 0 },
};

// ============================================================
// Phase 1: 地区标准化映射
// ============================================================
const REGION_MAPPING = {
  '美国': 'US',
  '中国': 'CN',
  '欧盟': 'EU',
  '澳大利亚': 'AU',
  '加拿大': 'CA',
  '英国': 'GB',
  '日本': 'JP',
  '韩国': 'KR',
  '东盟': 'ASEAN',
  '中东GCC': 'GCC',
  '马来西亚': 'MY',
  'Global': 'International',
};

// 已经是标准代码的值，不需要转换（但需要统一大小写）
const REGION_NORMALIZE = {
  'us': 'US',
  'cn': 'CN',
  'eu': 'EU',
  'au': 'AU',
  'ca': 'CA',
  'gb': 'GB',
  'jp': 'JP',
  'kr': 'KR',
  'my': 'MY',
  'international': 'International',
};

function standardizeRegion(region) {
  if (!region || typeof region !== 'string') return null;
  const trimmed = region.trim();

  // 先检查中文映射
  if (REGION_MAPPING[trimmed]) {
    return { standardized: REGION_MAPPING[trimmed], original: trimmed, changed: true };
  }

  // 再检查大小写标准化
  const lower = trimmed.toLowerCase();
  if (REGION_NORMALIZE[lower]) {
    const result = REGION_NORMALIZE[lower];
    if (result !== trimmed) {
      return { standardized: result, original: trimmed, changed: true };
    }
    return { standardized: trimmed, original: trimmed, changed: false };
  }

  // 已经是标准代码的，直接返回
  const standardCodes = ['US', 'CN', 'EU', 'AU', 'CA', 'GB', 'JP', 'KR', 'ASEAN', 'GCC', 'MY', 'International'];
  if (standardCodes.includes(trimmed)) {
    return { standardized: trimmed, original: trimmed, changed: false };
  }

  // 未知地区，保持原值
  return { standardized: trimmed, original: trimmed, changed: false };
}

// ============================================================
// Phase 2: 产品数据扩展映射
// ============================================================
const AUTHORITATIVE_PRODUCT_SOURCES = ['fda', '510k', '510(k)', 'eudamed', 'nmpa'];

const CATEGORY_SPECIFICATIONS = {
  '手部防护装备': {
    material: 'nitrile/latex/vinyl',
    sizes: 'S/M/L/XL',
    thickness: '4-8mil',
    powder_free: true,
  },
  '呼吸防护装备': {
    filter_class: 'N95/FFP2/FFP3',
    filter_efficiency: '>=95%/>=94%/>=99%',
    valve: 'with/without exhalation valve',
  },
  '身体防护装备': {
    material: 'polypropylene/PE/SMS',
    protection_level: 'Level 1-4',
    fluid_resistant: true,
  },
  '眼面部防护装备': {
    lens_material: 'polycarbonate',
    anti_fog: true,
    uv_protection: true,
  },
  '头部防护装备': {
    material: 'polypropylene/non-woven',
    type: 'bouffant/cap/hood',
  },
  '足部防护装备': {
    material: 'PE/CPE',
    type: 'overboot/shoe cover',
    anti_slip: true,
  },
};

const CATEGORY_RELATED_STANDARDS = {
  '手部防护装备': ['EN 455', 'EN 374', 'ASTM D6319', 'ASTM D3578'],
  '呼吸防护装备': ['EN 149', '42 CFR 84', 'GB 2626', 'GB 19083'],
  '身体防护装备': ['EN 14126', 'AAMI PB70', 'GB 19082'],
  '眼面部防护装备': ['EN 166', 'ANSI Z87.1', 'GB 14866'],
  '头部防护装备': ['EN 14126', 'GB 19082'],
  '足部防护装备': ['EN 14126', 'GB 19082'],
};

const CERTIFICATION_SALES_REGIONS = {
  'CE': ['EU'],
  'ce': ['EU'],
  'FDA': ['US'],
  'fda': ['US'],
  '510(k)': ['US'],
  '510k': ['US'],
  'NMPA': ['CN'],
  'nmpa': ['CN'],
  'GCC': ['GCC countries'],
  'gcc': ['GCC countries'],
  'KC': ['KR'],
  'kc': ['KR'],
  'UKCA': ['GB'],
  'ukca': ['GB'],
  'TGA': ['AU'],
  'tga': ['AU'],
};

// 类别关键词映射（用于从产品名称推断类别）
const CATEGORY_KEYWORD_MAP = [
  { keywords: ['glove', '手套'], category: '手部防护装备' },
  { keywords: ['mask', 'respirator', 'n95', 'kn95', 'ffp2', 'ffp3', '口罩', '呼吸'], category: '呼吸防护装备' },
  { keywords: ['gown', 'coverall', 'apron', 'isolation', 'protective clothing', '防护服', '隔离衣', '手术衣'], category: '身体防护装备' },
  { keywords: ['goggle', 'face shield', 'eyewear', 'eye protection', '护目', '面屏', '面罩'], category: '眼面部防护装备' },
  { keywords: ['cap', 'hair cover', 'bouffant', 'head cover', 'hood', '帽'], category: '头部防护装备' },
  { keywords: ['boot', 'shoe cover', 'shoe', 'foot protection', 'overshoe', '鞋套', '脚套'], category: '足部防护装备' },
];

// ============================================================
// Phase 3: 制造商数据扩展映射
// ============================================================
const AUTHORITATIVE_MFR_SOURCES = ['fda', '510k', '510(k)', 'eudamed', 'nmpa', 'health canada', 'tga'];

function isAuthoritativeSource(dataSource) {
  if (!dataSource) return false;
  const src = dataSource.toLowerCase();
  return AUTHORITATIVE_PRODUCT_SOURCES.some(kw => src.includes(kw));
}

function isAuthoritativeMfrSource(dataSource) {
  if (!dataSource) return false;
  const src = dataSource.toLowerCase();
  return AUTHORITATIVE_MFR_SOURCES.some(kw => src.includes(kw));
}

function inferCategoryFromName(name) {
  if (!name) return null;
  const text = name.toLowerCase();
  for (const mapping of CATEGORY_KEYWORD_MAP) {
    if (mapping.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return mapping.category;
    }
  }
  return null;
}

function inferSalesRegions(product) {
  const regions = new Set();

  // 从 certifications JSONB 推断
  if (product.certifications) {
    let certs = product.certifications;
    if (typeof certs === 'string') {
      try { certs = JSON.parse(certs); } catch (e) { certs = []; }
    }
    if (Array.isArray(certs)) {
      for (const cert of certs) {
        const certStr = typeof cert === 'string' ? cert : (cert.name || cert.type || '');
        for (const [key, regionsList] of Object.entries(CERTIFICATION_SALES_REGIONS)) {
          if (certStr.includes(key)) {
            regionsList.forEach(r => regions.add(r));
          }
        }
      }
    }
  }

  // 从 data_source 推断
  if (product.data_source) {
    const src = product.data_source.toLowerCase();
    if (src.includes('fda') || src.includes('510k') || src.includes('510(k)')) regions.add('US');
    if (src.includes('eudamed') || src.includes('eu')) regions.add('EU');
    if (src.includes('nmpa')) regions.add('CN');
    if (src.includes('tga')) regions.add('AU');
    if (src.includes('health canada')) regions.add('CA');
  }

  // 从 country_of_origin 推断
  if (product.country_of_origin) {
    const country = product.country_of_origin.toUpperCase();
    const countryToRegion = {
      'US': 'US', 'USA': 'US', 'UNITED STATES': 'US',
      'CN': 'CN', 'CHINA': 'CN', '中国': 'CN',
      'EU': 'EU', 'EUROPE': 'EU',
      'AU': 'AU', 'AUSTRALIA': 'AU',
      'CA': 'CA', 'CANADA': 'CA',
      'GB': 'GB', 'UK': 'GB', 'UNITED KINGDOM': 'GB',
      'JP': 'JP', 'JAPAN': 'JP',
      'KR': 'KR', 'KOREA': 'KR', 'SOUTH KOREA': 'KR',
    };
    const region = countryToRegion[country] || countryToRegion[product.country_of_origin];
    if (region) regions.add(region);
  }

  return regions.size > 0 ? Array.from(regions) : null;
}

function inferComplianceStatus(manufacturer) {
  const status = {
    ce_certified: false,
    fda_registered: false,
    iso_13485: false,
  };

  // 从 certifications 推断
  if (manufacturer.certifications) {
    let certs = manufacturer.certifications;
    if (typeof certs === 'string') {
      try { certs = JSON.parse(certs); } catch (e) { certs = []; }
    }
    if (Array.isArray(certs)) {
      for (const cert of certs) {
        const certStr = typeof cert === 'string' ? cert.toLowerCase() : JSON.stringify(cert).toLowerCase();
        if (certStr.includes('ce') || certStr.includes('欧盟')) status.ce_certified = true;
        if (certStr.includes('fda') || certStr.includes('510(k)')) status.fda_registered = true;
        if (certStr.includes('iso 13485') || certStr.includes('iso13485') || certStr.includes('iso_13485')) status.iso_13485 = true;
      }
    }
  }

  // 从 data_source 推断
  if (manufacturer.data_source) {
    const src = manufacturer.data_source.toLowerCase();
    if (src.includes('fda') || src.includes('510k') || src.includes('510(k)')) status.fda_registered = true;
    if (src.includes('eudamed') || src.includes('eu')) status.ce_certified = true;
    if (src.includes('nmpa')) status.ce_certified = true; // NMPA 注册的通常也有 CE
  }

  // 从 country 推断（中国制造商通常有 NMPA，美国有 FDA）
  if (manufacturer.country) {
    const country = manufacturer.country.toUpperCase();
    if (country === 'CN' || country === 'CHINA' || country === '中国') {
      // 中国制造商出口通常需要 CE 和 FDA
      if (status.ce_certified === false && status.fda_registered === false) {
        // 不做默认假设，保持 false
      }
    }
    if (country === 'US' || country === 'USA') {
      status.fda_registered = true;
    }
  }

  return status;
}

// ============================================================
// 工具函数
// ============================================================
function isEmptyJsonb(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    if (value.trim() === '' || value === '{}' || value === '[]' || value === 'null') return true;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.length === 0;
      if (typeof parsed === 'object') return Object.keys(parsed).length === 0;
    } catch (e) {
      return true;
    }
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.length === 0;
    return Object.keys(value).length === 0;
  }
  return false;
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
    offset += data.length; // Use actual returned count, not READ_BATCH

    if (allRecords.length % 10000 === 0 || allRecords.length >= total) {
      log('READ', 'PROGRESS', `${table}: read ${allRecords.length}/${total}`);
    }
  }

  return allRecords;
}

async function batchUpdateByIds(table, ids, updateData) {
  let updated = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
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

async function batchUpdateIndividual(table, updates) {
  let updated = 0;
  const concurrency = 5;

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

// ============================================================
// Phase 1: 法规地区标准化
// ============================================================
async function phase1_standardizeRegions() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 1: 法规地区标准化');
  console.log('='.repeat(70));

  const regulations = await fetchAllRecords('ppe_regulations', 'id, region, code, name');
  report.phase1.regulationsScanned = regulations.length;

  log('1', 'START', `扫描法规总数: ${regulations.length}`);

  // 统计当前地区分布
  const regionDist = {};
  for (const r of regulations) {
    const region = r.region || '(empty)';
    regionDist[region] = (regionDist[region] || 0) + 1;
  }

  log('1', 'REGION_DIST', '当前地区分布:');
  for (const [region, count] of Object.entries(regionDist).sort((a, b) => b[1] - a[1])) {
    log('1', 'REGION_DIST', `  ${region}: ${count}`);
  }

  // 找出需要标准化的记录
  const updatesByRegion = {};
  const mappingStats = {};

  for (const r of regulations) {
    const result = standardizeRegion(r.region);
    if (result.changed) {
      if (!updatesByRegion[result.standardized]) {
        updatesByRegion[result.standardized] = [];
      }
      updatesByRegion[result.standardized].push(r.id);

      const mappingKey = `${result.original} -> ${result.standardized}`;
      mappingStats[mappingKey] = (mappingStats[mappingKey] || 0) + 1;
    }
  }

  log('1', 'STANDARDIZE', `需要标准化的法规记录: ${Object.values(updatesByRegion).flat().length} 条`);

  for (const [mapping, count] of Object.entries(mappingStats).sort((a, b) => b[1] - a[1])) {
    log('1', 'MAPPING', `  ${mapping}: ${count} 条`);
  }

  // 执行批量更新
  let totalUpdated = 0;
  for (const [standardRegion, ids] of Object.entries(updatesByRegion)) {
    const updated = await batchUpdateByIds('ppe_regulations', ids, { region: standardRegion });
    totalUpdated += updated;
    log('1', 'BATCH_DONE', `region -> "${standardRegion}": 更新 ${updated} 条`);
  }

  report.phase1.regionStandardized = totalUpdated;
  report.phase1.regionByMapping = mappingStats;

  log('1', 'COMPLETE', `Phase 1 完成, 共标准化 ${totalUpdated} 条法规记录`);
}

// ============================================================
// Phase 2: 产品数据扩展
// ============================================================
async function phase2_expandProductData() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 2: 产品数据扩展');
  console.log('='.repeat(70));

  const products = await fetchAllRecords('ppe_products',
    'id, name, category, subcategory, manufacturer_name, country_of_origin, ' +
    'data_source, certifications, specifications, sales_regions, ' +
    'related_standards, risk_level, model, description');

  report.phase2.productsScanned = products.length;

  log('2', 'START', `扫描产品总数: ${products.length}`);

  // 筛选权威来源产品
  const authoritativeProducts = products.filter(p => isAuthoritativeSource(p.data_source));
  report.phase2.authoritativeProducts = authoritativeProducts.length;

  log('2', 'AUTHORITATIVE', `权威来源产品: ${authoritativeProducts.length} 条`);

  // 统计缺失字段
  let missingSpecs = 0;
  let missingSalesRegions = 0;
  let missingStandards = 0;

  for (const p of authoritativeProducts) {
    if (isEmptyJsonb(p.specifications)) missingSpecs++;
    if (isEmptyJsonb(p.sales_regions)) missingSalesRegions++;
    if (isEmptyJsonb(p.related_standards)) missingStandards++;
  }

  log('2', 'MISSING', `权威来源产品缺失字段统计:`);
  log('2', 'MISSING', `  specifications 缺失: ${missingSpecs} 条`);
  log('2', 'MISSING', `  sales_regions 缺失: ${missingSalesRegions} 条`);
  log('2', 'MISSING', `  related_standards 缺失: ${missingStandards} 条`);

  // 构建更新列表
  const specUpdates = [];
  const salesRegionUpdates = [];
  const standardsUpdates = [];

  for (const p of authoritativeProducts) {
    // 确定类别
    let category = p.category;
    if (!category || category === 'Unknown' || category === 'unknown' || category === '其他') {
      category = inferCategoryFromName(p.name);
    }

    // 2.1 补充 specifications
    if (isEmptyJsonb(p.specifications) && category && CATEGORY_SPECIFICATIONS[category]) {
      specUpdates.push({
        id: p.id,
        data: { specifications: CATEGORY_SPECIFICATIONS[category] },
      });
    }

    // 2.2 补充 sales_regions
    if (isEmptyJsonb(p.sales_regions)) {
      const regions = inferSalesRegions(p);
      if (regions) {
        salesRegionUpdates.push({
          id: p.id,
          data: { sales_regions: regions },
        });
      }
    }

    // 2.3 补充 related_standards
    if (isEmptyJsonb(p.related_standards) && category && CATEGORY_RELATED_STANDARDS[category]) {
      standardsUpdates.push({
        id: p.id,
        data: { related_standards: CATEGORY_RELATED_STANDARDS[category] },
      });
    }
  }

  log('2', 'PLAN', `计划更新:`);
  log('2', 'PLAN', `  specifications: ${specUpdates.length} 条`);
  log('2', 'PLAN', `  sales_regions: ${salesRegionUpdates.length} 条`);
  log('2', 'PLAN', `  related_standards: ${standardsUpdates.length} 条`);

  // 执行更新 - specifications
  if (specUpdates.length > 0) {
    log('2', 'SPECS', `开始更新 specifications...`);

    // 按相同 specifications 值分组，批量更新
    const specGroups = {};
    for (const u of specUpdates) {
      const key = JSON.stringify(u.data.specifications);
      if (!specGroups[key]) specGroups[key] = { data: u.data, ids: [] };
      specGroups[key].ids.push(u.id);
    }

    let specsUpdated = 0;
    for (const [key, group] of Object.entries(specGroups)) {
      const updated = await batchUpdateByIds('ppe_products', group.ids, group.data);
      specsUpdated += updated;
    }

    report.phase2.specificationsFilled = specsUpdated;
    log('2', 'SPECS_DONE', `已补充 specifications: ${specsUpdated} 条`);
  }

  // 执行更新 - sales_regions（每条可能不同，逐条更新）
  if (salesRegionUpdates.length > 0) {
    log('2', 'REGIONS', `开始更新 sales_regions...`);

    // 按相同 sales_regions 值分组
    const regionGroups = {};
    for (const u of salesRegionUpdates) {
      const key = JSON.stringify(u.data.sales_regions);
      if (!regionGroups[key]) regionGroups[key] = { data: u.data, ids: [] };
      regionGroups[key].ids.push(u.id);
    }

    let regionsUpdated = 0;
    for (const [key, group] of Object.entries(regionGroups)) {
      const updated = await batchUpdateByIds('ppe_products', group.ids, group.data);
      regionsUpdated += updated;
    }

    report.phase2.salesRegionsFilled = regionsUpdated;
    log('2', 'REGIONS_DONE', `已补充 sales_regions: ${regionsUpdated} 条`);
  }

  // 执行更新 - related_standards
  if (standardsUpdates.length > 0) {
    log('2', 'STANDARDS', `开始更新 related_standards...`);

    // 按相同 related_standards 值分组
    const stdGroups = {};
    for (const u of standardsUpdates) {
      const key = JSON.stringify(u.data.related_standards);
      if (!stdGroups[key]) stdGroups[key] = { data: u.data, ids: [] };
      stdGroups[key].ids.push(u.id);
    }

    let standardsUpdated = 0;
    for (const [key, group] of Object.entries(stdGroups)) {
      const updated = await batchUpdateByIds('ppe_products', group.ids, group.data);
      standardsUpdated += updated;
    }

    report.phase2.relatedStandardsFilled = standardsUpdated;
    log('2', 'STANDARDS_DONE', `已补充 related_standards: ${standardsUpdated} 条`);
  }

  log('2', 'COMPLETE', `Phase 2 完成`);
}

// ============================================================
// Phase 3: 制造商数据扩展
// ============================================================
async function phase3_expandManufacturerData() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 3: 制造商数据扩展');
  console.log('='.repeat(70));

  const manufacturers = await fetchAllRecords('ppe_manufacturers',
    'id, name, country, certifications, compliance_status, risk_alerts, data_source');

  report.phase3.manufacturersScanned = manufacturers.length;

  log('3', 'START', `扫描制造商总数: ${manufacturers.length}`);

  // 筛选权威来源制造商
  const authoritativeMfrs = manufacturers.filter(m => isAuthoritativeMfrSource(m.data_source));
  report.phase3.authoritativeManufacturers = authoritativeMfrs.length;

  log('3', 'AUTHORITATIVE', `权威来源制造商: ${authoritativeMfrs.length} 条`);

  // 统计缺失字段
  let missingCompliance = 0;
  let missingRiskAlerts = 0;

  for (const m of authoritativeMfrs) {
    if (isEmptyJsonb(m.compliance_status)) missingCompliance++;
    if (isEmptyJsonb(m.risk_alerts)) missingRiskAlerts++;
  }

  log('3', 'MISSING', `权威来源制造商缺失字段统计:`);
  log('3', 'MISSING', `  compliance_status 缺失: ${missingCompliance} 条`);
  log('3', 'MISSING', `  risk_alerts 缺失: ${missingRiskAlerts} 条`);

  // 也处理非权威来源但有 data_source 的制造商
  const mfrsWithSource = manufacturers.filter(m => m.data_source && m.data_source.trim() !== '');
  log('3', 'WITH_SOURCE', `有 data_source 的制造商: ${mfrsWithSource.length} 条`);

  // 构建更新列表
  const complianceUpdates = [];
  const riskAlertUpdates = [];

  for (const m of mfrsWithSource) {
    // 3.1 补充 compliance_status
    if (isEmptyJsonb(m.compliance_status)) {
      const status = inferComplianceStatus(m);
      complianceUpdates.push({
        id: m.id,
        data: { compliance_status: status },
      });
    }

    // 3.2 补充 risk_alerts
    if (isEmptyJsonb(m.risk_alerts)) {
      riskAlertUpdates.push({
        id: m.id,
        data: { risk_alerts: [] },
      });
    }
  }

  log('3', 'PLAN', `计划更新:`);
  log('3', 'PLAN', `  compliance_status: ${complianceUpdates.length} 条`);
  log('3', 'PLAN', `  risk_alerts: ${riskAlertUpdates.length} 条`);

  // 执行更新 - compliance_status
  if (complianceUpdates.length > 0) {
    log('3', 'COMPLIANCE', `开始更新 compliance_status...`);

    // 按相同 compliance_status 值分组
    const complianceGroups = {};
    for (const u of complianceUpdates) {
      const key = JSON.stringify(u.data.compliance_status);
      if (!complianceGroups[key]) complianceGroups[key] = { data: u.data, ids: [] };
      complianceGroups[key].ids.push(u.id);
    }

    let complianceUpdated = 0;
    for (const [key, group] of Object.entries(complianceGroups)) {
      const updated = await batchUpdateByIds('ppe_manufacturers', group.ids, group.data);
      complianceUpdated += updated;
    }

    report.phase3.complianceStatusFilled = complianceUpdated;
    log('3', 'COMPLIANCE_DONE', `已补充 compliance_status: ${complianceUpdated} 条`);

    // 统计各合规状态分布
    const statusDist = {
      ce_only: 0,
      fda_only: 0,
      iso_only: 0,
      ce_and_fda: 0,
      all_three: 0,
      none: 0,
    };
    for (const u of complianceUpdates) {
      const s = u.data.compliance_status;
      if (s.ce_certified && s.fda_registered && s.iso_13485) statusDist.all_three++;
      else if (s.ce_certified && s.fda_registered) statusDist.ce_and_fda++;
      else if (s.ce_certified) statusDist.ce_only++;
      else if (s.fda_registered) statusDist.fda_only++;
      else if (s.iso_13485) statusDist.iso_only++;
      else statusDist.none++;
    }
    log('3', 'COMPLIANCE_DIST', `合规状态分布:`);
    log('3', 'COMPLIANCE_DIST', `  CE+FDA+ISO13485: ${statusDist.all_three}`);
    log('3', 'COMPLIANCE_DIST', `  CE+FDA: ${statusDist.ce_and_fda}`);
    log('3', 'COMPLIANCE_DIST', `  CE only: ${statusDist.ce_only}`);
    log('3', 'COMPLIANCE_DIST', `  FDA only: ${statusDist.fda_only}`);
    log('3', 'COMPLIANCE_DIST', `  ISO13485 only: ${statusDist.iso_only}`);
    log('3', 'COMPLIANCE_DIST', `  None: ${statusDist.none}`);
  }

  // 执行更新 - risk_alerts（全部设为空数组）
  if (riskAlertUpdates.length > 0) {
    log('3', 'RISK_ALERTS', `开始更新 risk_alerts...`);

    // 所有 risk_alerts 都是空数组，可以一次性批量更新
    const allIds = riskAlertUpdates.map(u => u.id);
    const riskUpdated = await batchUpdateByIds('ppe_manufacturers', allIds, { risk_alerts: [] });

    report.phase3.riskAlertsFilled = riskUpdated;
    log('3', 'RISK_ALERTS_DONE', `已补充 risk_alerts: ${riskUpdated} 条`);
  }

  log('3', 'COMPLETE', `Phase 3 完成`);
}

// ============================================================
// Phase 4: 生成综合报告
// ============================================================
async function phase4_generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('  Phase 4: 生成综合报告');
  console.log('='.repeat(70));

  const { count: finalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: finalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: finalRegulations } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  report.finalCounts = {
    products: finalProducts || 0,
    manufacturers: finalManufacturers || 0,
    regulations: finalRegulations || 0,
  };

  // 获取更新后的地区分布
  const regRegionDist = {};
  let regOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_regulations')
      .select('region')
      .range(regOffset, regOffset + READ_BATCH - 1);

    if (error || !data || data.length === 0) break;
    for (const r of data) {
      const region = r.region || '(empty)';
      regRegionDist[region] = (regRegionDist[region] || 0) + 1;
    }
    regOffset += READ_BATCH;
  }

  // 获取更新后的产品字段填充率
  const productFieldStats = {
    specifications_filled: 0,
    specifications_empty: 0,
    sales_regions_filled: 0,
    sales_regions_empty: 0,
    related_standards_filled: 0,
    related_standards_empty: 0,
  };

  let prodOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('specifications, sales_regions, related_standards')
      .range(prodOffset, prodOffset + READ_BATCH - 1);

    if (error || !data || data.length === 0) break;
    for (const p of data) {
      if (isEmptyJsonb(p.specifications)) productFieldStats.specifications_empty++;
      else productFieldStats.specifications_filled++;
      if (isEmptyJsonb(p.sales_regions)) productFieldStats.sales_regions_empty++;
      else productFieldStats.sales_regions_filled++;
      if (isEmptyJsonb(p.related_standards)) productFieldStats.related_standards_empty++;
      else productFieldStats.related_standards_filled++;
    }
    prodOffset += READ_BATCH;
  }

  // 获取更新后的制造商字段填充率
  const mfrFieldStats = {
    compliance_status_filled: 0,
    compliance_status_empty: 0,
    risk_alerts_filled: 0,
    risk_alerts_empty: 0,
  };

  let mfrOffset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select('compliance_status, risk_alerts')
      .range(mfrOffset, mfrOffset + READ_BATCH - 1);

    if (error || !data || data.length === 0) break;
    for (const m of data) {
      if (isEmptyJsonb(m.compliance_status)) mfrFieldStats.compliance_status_empty++;
      else mfrFieldStats.compliance_status_filled++;
      if (isEmptyJsonb(m.risk_alerts)) mfrFieldStats.risk_alerts_empty++;
      else mfrFieldStats.risk_alerts_filled++;
    }
    mfrOffset += READ_BATCH;
  }

  // 打印综合报告
  console.log('\n' + '#'.repeat(70));
  console.log('  PPE 数据库数据扩展与标准化 - 综合报告');
  console.log('  生成时间: ' + new Date().toISOString());
  console.log('#'.repeat(70));

  console.log('\n--- 数据量 ---');
  console.log(`  ppe_products:        ${report.initialCounts.products.toLocaleString()} -> ${report.finalCounts.products.toLocaleString()}`);
  console.log(`  ppe_manufacturers:   ${report.initialCounts.manufacturers.toLocaleString()} -> ${report.finalCounts.manufacturers.toLocaleString()}`);
  console.log(`  ppe_regulations:     ${report.initialCounts.regulations.toLocaleString()} -> ${report.finalCounts.regulations.toLocaleString()}`);

  console.log('\n--- Phase 1: 法规地区标准化 ---');
  console.log(`  扫描法规数:          ${report.phase1.regulationsScanned.toLocaleString()} 条`);
  console.log(`  标准化更新数:        ${report.phase1.regionStandardized.toLocaleString()} 条`);
  if (Object.keys(report.phase1.regionByMapping).length > 0) {
    console.log(`  映射详情:`);
    for (const [mapping, count] of Object.entries(report.phase1.regionByMapping).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${mapping}: ${count} 条`);
    }
  }

  console.log('\n  标准化后地区分布:');
  for (const [region, count] of Object.entries(regRegionDist).sort((a, b) => b[1] - a[1])) {
    const pct = report.finalCounts.regulations > 0
      ? (count / report.finalCounts.regulations * 100).toFixed(1)
      : '0.0';
    console.log(`    ${region}: ${count.toLocaleString()} (${pct}%)`);
  }

  console.log('\n--- Phase 2: 产品数据扩展 ---');
  console.log(`  扫描产品数:          ${report.phase2.productsScanned.toLocaleString()} 条`);
  console.log(`  权威来源产品:        ${report.phase2.authoritativeProducts.toLocaleString()} 条`);
  console.log(`  specifications 补充: ${report.phase2.specificationsFilled.toLocaleString()} 条`);
  console.log(`  sales_regions 补充:  ${report.phase2.salesRegionsFilled.toLocaleString()} 条`);
  console.log(`  related_standards 补充: ${report.phase2.relatedStandardsFilled.toLocaleString()} 条`);

  const totalProducts = productFieldStats.specifications_filled + productFieldStats.specifications_empty;
  console.log('\n  产品字段填充率 (更新后):');
  console.log(`    specifications:     ${productFieldStats.specifications_filled.toLocaleString()}/${totalProducts.toLocaleString()} (${totalProducts > 0 ? (productFieldStats.specifications_filled / totalProducts * 100).toFixed(1) : '0.0'}%)`);
  console.log(`    sales_regions:      ${productFieldStats.sales_regions_filled.toLocaleString()}/${totalProducts.toLocaleString()} (${totalProducts > 0 ? (productFieldStats.sales_regions_filled / totalProducts * 100).toFixed(1) : '0.0'}%)`);
  console.log(`    related_standards:  ${productFieldStats.related_standards_filled.toLocaleString()}/${totalProducts.toLocaleString()} (${totalProducts > 0 ? (productFieldStats.related_standards_filled / totalProducts * 100).toFixed(1) : '0.0'}%)`);

  console.log('\n--- Phase 3: 制造商数据扩展 ---');
  console.log(`  扫描制造商数:        ${report.phase3.manufacturersScanned.toLocaleString()} 条`);
  console.log(`  权威来源制造商:      ${report.phase3.authoritativeManufacturers.toLocaleString()} 条`);
  console.log(`  compliance_status 补充: ${report.phase3.complianceStatusFilled.toLocaleString()} 条`);
  console.log(`  risk_alerts 补充:    ${report.phase3.riskAlertsFilled.toLocaleString()} 条`);

  const totalMfrs = mfrFieldStats.compliance_status_filled + mfrFieldStats.compliance_status_empty;
  console.log('\n  制造商字段填充率 (更新后):');
  console.log(`    compliance_status:  ${mfrFieldStats.compliance_status_filled.toLocaleString()}/${totalMfrs.toLocaleString()} (${totalMfrs > 0 ? (mfrFieldStats.compliance_status_filled / totalMfrs * 100).toFixed(1) : '0.0'}%)`);
  console.log(`    risk_alerts:        ${mfrFieldStats.risk_alerts_filled.toLocaleString()}/${totalMfrs.toLocaleString()} (${totalMfrs > 0 ? (mfrFieldStats.risk_alerts_filled / totalMfrs * 100).toFixed(1) : '0.0'}%)`);

  console.log('\n--- 数据质量改善指标 ---');
  const totalChanges = report.phase1.regionStandardized +
    report.phase2.specificationsFilled +
    report.phase2.salesRegionsFilled +
    report.phase2.relatedStandardsFilled +
    report.phase3.complianceStatusFilled +
    report.phase3.riskAlertsFilled;

  console.log(`  总变更记录数:        ${totalChanges.toLocaleString()} 条`);
  console.log(`  法规地区标准化:      ${report.phase1.regionStandardized.toLocaleString()} 条`);
  console.log(`  产品字段补充:        ${(report.phase2.specificationsFilled + report.phase2.salesRegionsFilled + report.phase2.relatedStandardsFilled).toLocaleString()} 条`);
  console.log(`  制造商字段补充:      ${(report.phase3.complianceStatusFilled + report.phase3.riskAlertsFilled).toLocaleString()} 条`);

  console.log('\n' + '#'.repeat(70));
  console.log('  数据扩展与标准化完成');
  console.log('#'.repeat(70) + '\n');
}

// ============================================================
// 主函数
// ============================================================
async function main() {
  const startTime = Date.now();

  console.log('\n' + '#'.repeat(70));
  console.log('  PPE 数据库数据扩展与标准化脚本');
  console.log('  开始时间: ' + new Date().toISOString());
  console.log('  数据库: ' + SUPABASE_URL);
  console.log('  批处理大小: ' + BATCH_SIZE);
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
    await phase1_standardizeRegions();
    await phase2_expandProductData();
    await phase3_expandManufacturerData();
    await phase4_generateReport();
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
