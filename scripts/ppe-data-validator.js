const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const REPORT_DIR = path.join(__dirname, '..', 'src', 'data', 'ppe');

const CRITICAL_PRODUCT_FIELDS = [
  'name', 'product_name', 'model', 'category', 'subcategory',
  'manufacturer_name', 'country_of_origin', 'product_code',
  'registration_number', 'registration_authority', 'registration_valid_until',
  'risk_level', 'certifications', 'related_standards',
  'data_source', 'data_source_url', 'last_verified', 'data_confidence_level'
];

const CRITICAL_MFR_FIELDS = [
  'name', 'country', 'website', 'certifications',
  'compliance_status', 'registered_capital', 'established_date',
  'employee_count', 'business_scope', 'legal_representative',
  'data_source', 'data_source_url', 'last_verified', 'data_confidence_level'
];

const MARKET_AUTHORITIES = {
  EU: { name: 'EUDAMED / NANDO', ce_required: true, regulation: '(EU) 2016/425' },
  US: { name: 'FDA / NIOSH', fda_required: true, regulation: '21 CFR / 42 CFR Part 84' },
  CN: { name: 'NMPA / SAMR', nmpa_required: true, regulation: 'GB 2626-2019 / GB 19083-2010' },
  UK: { name: 'MHRA / UKAS', ukca_required: true, regulation: 'UK PPE Regulations' },
  JP: { name: 'PMDA / MHLW', regulation: 'PMDA Ordinance' },
  KR: { name: 'MFDS / KOSHA', regulation: 'MFDS Notification' },
  CA: { name: 'Health Canada', regulation: 'MDALL' },
  BR: { name: 'ANVISA / INMETRO', regulation: 'ANVISA Resolution' },
  IN: { name: 'CDSCO / BIS', regulation: 'CDSCO Medical Device Rules' },
  AU: { name: 'TGA', regulation: 'ARTG' },
  GCC: { name: 'GSO', regulation: 'GCC Technical Regulations' }
};

const STANDARDS_REQUIREMENTS = {
  'respiratory-protection': {
    EU: ['EN 149:2001+A1:2009', 'EN 14683:2019+AC:2019', 'EU 2016/425'],
    US: ['42 CFR Part 84', 'ASTM F2100-21', 'FDA 510(k)'],
    CN: ['GB 2626-2019', 'GB 19083-2010', 'YY 0469-2011', 'YY/T 0969-2013'],
  },
  'protective-clothing': {
    EU: ['EN ISO 13688:2013+A1:2021', 'EN 14325:2018', 'EU 2016/425'],
    US: ['ASTM F1670-2017', 'ASTM F1671/F1671M-2013'],
    CN: ['GB 19082-2009', 'GB/T 39264-2020'],
  },
  'safety-footwear': {
    EU: ['EN ISO 20345:2022', 'EN ISO 20347:2022'],
    US: ['ASTM F2413-18', 'ASTM F2892-18'],
    CN: ['GB 21148-2020', 'GB 21147-2020'],
  },
  'protective-gloves': {
    EU: ['EN ISO 374-1:2016+A1:2018', 'EN 388:2016+A1:2018'],
    US: ['ASTM D3578-19', 'ANSI/ISEA 105-2016'],
    CN: ['GB 10213-2006', 'GB/T 17619-2022'],
  },
  'head-protection': {
    EU: ['EN 397:2012+A1:2012', 'EN 14052:2012+A1:2013'],
    US: ['ANSI/ISEA Z89.1-2014'],
    CN: ['GB 2811-2019'],
  },
  'eye-face-protection': {
    EU: ['EN 166:2001', 'EN 170:2002'],
    US: ['ANSI/ISEA Z87.1-2020'],
    CN: ['GB 14866-2023', 'GB 10810.1-2022'],
  },
  'hearing-protection': {
    EU: ['EN 352-1:2020', 'EN 352-2:2020'],
    US: ['ANSI S3.19-1974', 'OSHA 29 CFR 1910.95'],
    CN: ['GB/T 31401-2015', 'GB/T 23816-2021'],
  }
};

const STANDARD_EXPIRY_CHECK = {
  'EN ISO 20345:2022': { latest: 'EN ISO 20345:2022+A1:2024', status: 'amended' },
  'EN 397:2012+A1:2012': { latest: 'EN 397:2012+A1:2012', status: 'current', note: 'review pending 2025' },
  'EN 166:2001': { latest: 'EN 166:2001', status: 'current', note: 'under revision, prEN 166 expected' },
  'GB 2626-2019': { latest: 'GB 2626-2019', status: 'current' },
  'GB 19083-2010': { latest: 'GB 19083-2023', status: 'superseded' },
  'GB 14866-2006': { latest: 'GB 14866-2023', status: 'superseded' },
  'ANSI S3.19-1974': { latest: 'ANSI/ASA S12.6-2016', status: 'superseded' },
};

function classifyCategory(rawCat) {
  if (!rawCat) return 'other';
  const c = rawCat.toLowerCase();
  if (c.includes('呼吸') || c.includes('respiratory') || c.includes('mask') || c.includes('respirator')) return 'respiratory-protection';
  if (c.includes('手') || c.includes('手套') || c.includes('glove')) return 'protective-gloves';
  if (c.includes('身体') || c.includes('躯干') || c.includes('防护服') || c.includes('clothing') || c.includes('gown') || c.includes('suit')) return 'protective-clothing';
  if (c.includes('足') || c.includes('鞋') || c.includes('footwear') || c.includes('shoe') || c.includes('boot')) return 'safety-footwear';
  if (c.includes('头') || c.includes('帽') || c.includes('helmet') || c.includes('head')) return 'head-protection';
  if (c.includes('眼') || c.includes('面') || c.includes('eye') || c.includes('face') || c.includes('goggle') || c.includes('shield')) return 'eye-face-protection';
  if (c.includes('听觉') || c.includes('耳') || c.includes('hearing') || c.includes('ear')) return 'hearing-protection';
  return 'other';
}

async function fetchAll(table, batchSize = 1000) {
  const all = [];
  for (let p = 0; ; p++) {
    const { data, error } = await supabase.from(table).select('*').range(p * batchSize, (p + 1) * batchSize - 1);
    if (error) { console.error(`fetch error: ${error.message}`); break; }
    if (!data || !data.length) break;
    all.push(...data);
    process.stdout.write(`\r  正在读取 ${table}: ${all.length} 条...`);
    if (data.length < batchSize) break;
  }
  console.log('');
  return all;
}

async function runFullValidation() {
  console.log('=== 全球PPE数据系统性验证 ===\n');
  const timestamp = new Date().toISOString();
  
  const products = await fetchAll('ppe_products');
  const manufacturers = await fetchAll('ppe_manufacturers');
  
  const totalProducts = products.length;
  const totalManufacturers = manufacturers.length;
  
  console.log(`产品总数: ${totalProducts}`);
  console.log(`制造商总数: ${totalManufacturers}`);
  console.log(`验证时间戳: ${timestamp}\n`);

  // ========== 1. FIELD COMPLETENESS ==========
  console.log('--- 1. 字段完整性验证 ---\n');
  
  const productFields = CRITICAL_PRODUCT_FIELDS;
  const completeness = {};
  
  productFields.forEach(f => {
    const filled = products.filter(r => r[f] !== null && r[f] !== undefined && r[f] !== '' && r[f] !== '[]').length;
    const pct = (filled / totalProducts * 100).toFixed(1);
    completeness[f] = { filled, total: totalProducts, pct: parseFloat(pct) };
  });
  
  const criticalMissing = Object.entries(completeness)
    .filter(([_, v]) => v.pct < 60)
    .sort((a, b) => a[1].pct - b[1].pct);
  
  console.log('关键缺失字段（覆盖率<60%）：');
  criticalMissing.forEach(([f, v]) => {
    console.log(`  ✗ ${f}: ${v.filled}/${v.total} (${v.pct}%) - 缺失 ${v.total - v.filled} 条`);
  });
  
  console.log('\n字段完整性总览：');
  Object.entries(completeness).sort((a, b) => a[1].pct - b[1].pct).forEach(([f, v]) => {
    const icon = v.pct >= 90 ? '✓' : v.pct >= 60 ? '△' : '✗';
    console.log(`  ${icon} ${f}: ${v.pct}%`);
  });

  const overallCompleteness = Object.values(completeness).reduce((s, v) => s + v.pct, 0) / productFields.length;
  console.log(`\n产品数据整体完整率: ${overallCompleteness.toFixed(1)}%`);

  // ========== 2. DUPLICATE DETECTION ==========
  console.log('\n--- 2. 重复数据检测 ---\n');
  
  const seen = new Map();
  const duplicates = [];
  products.forEach(r => {
    const key = `${r.product_code || ''}|${r.name || ''}`.toLowerCase();
    if (seen.has(key)) {
      duplicates.push({ id: r.id, dupeOf: seen.get(key), name: r.name });
    } else {
      seen.set(key, r.id);
    }
  });
  console.log(`潜在重复记录: ${duplicates.length} 条 (${(duplicates.length/totalProducts*100).toFixed(1)}%)`);

  // ========== 3. STANDARD VALIDITY CHECK ==========
  console.log('\n--- 3. 标准时效性验证 ---\n');
  
  const standardIssues = [];
  const usedStandards = new Set();
  
  products.forEach(p => {
    if (p.related_standards && Array.isArray(p.related_standards)) {
      p.related_standards.forEach(s => { if (typeof s === 'string') usedStandards.add(s); });
    }
    if (p.certifications && Array.isArray(p.certifications)) {
      p.certifications.forEach(c => { if (typeof c === 'string') usedStandards.add(c); });
    }
  });
  
  Object.entries(STANDARD_EXPIRY_CHECK).forEach(([std, info]) => {
    const inUse = [...usedStandards].some(s => typeof s === 'string' && s.toLowerCase().includes(std.toLowerCase().split(':')[0].toLowerCase()));
    if (inUse || true) {
      const issue = {
        standard: std,
        latest_version: info.latest,
        status: info.status,
        note: info.note || '',
        in_database: inUse
      };
      if (info.status !== 'current') {
        standardIssues.push(issue);
        console.log(`  ⚠ ${std} → 最新版本: ${info.latest} (状态: ${info.status})`);
      }
    }
  });
  console.log(`\n时效性问题: ${standardIssues.length} 项`);

  // ========== 4. REGISTRATION EXPIRY CHECK ==========
  console.log('\n--- 4. 注册有效期检查 ---\n');
  
  const now = new Date();
  const expired = products.filter(p => {
    if (!p.registration_valid_until) return false;
    return new Date(p.registration_valid_until) < now;
  });
  
  const expiringSoon = products.filter(p => {
    if (!p.registration_valid_until) return false;
    const d = new Date(p.registration_valid_until);
    const months = (d - now) / (1000 * 60 * 60 * 24 * 30);
    return months > 0 && months < 6;
  });
  
  console.log(`已过期注册: ${expired.length} 条`);
  console.log(`6个月内将过期: ${expiringSoon.length} 条`);
  console.log(`无有效期数据: ${totalProducts - products.filter(p => p.registration_valid_until).length} 条`);

  // ========== 5. MARKET COVERAGE ANALYSIS ==========
  console.log('\n--- 5. 市场覆盖分析 ---\n');
  
  const countryStats = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
  });
  
  const coverageGaps = [];
  ['JP', 'KR', 'IN', 'BR', 'AU', 'DE', 'FR', 'IT', 'ES', 'SG', 'AE'].forEach(code => {
    if (!countryStats[code] || countryStats[code] < 100) {
      coverageGaps.push({ market: code, current: countryStats[code] || 0, target: 100 });
    }
  });
  
  console.log('市场覆盖不足（<100条）:');
  coverageGaps.sort((a, b) => a.current - b.current).forEach(g => {
    console.log(`  ⚠ ${g.market}: ${g.current} 条 (目标 ≥${g.target})`);
  });

  // ========== 6. DATA SOURCE VERIFICATION ==========
  console.log('\n--- 6. 数据来源验证 ---\n');
  
  const sourceStats = {};
  products.forEach(p => {
    const s = p.data_source || 'Unknown';
    sourceStats[s] = (sourceStats[s] || 0) + 1;
  });
  
  const sourcesWithURL = new Set();
  products.forEach(p => {
    if (p.data_source_url) sourcesWithURL.add(p.data_source);
  });
  
  Object.entries(sourceStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([s, c]) => {
    const hasUrl = sourcesWithURL.has(s);
    console.log(`  ${hasUrl ? '✓' : '✗'} ${s}: ${c} 条`);
  });

  // ========== 7. MISSING DATA CATEGORIES ==========
  console.log('\n--- 7. 缺失数据类别识别 ---\n');
  
  const missingCategories = [
    {
      category: '风险场景数据',
      description: '行业危害因素与PPE配备规范',
      required_standards: ['GB 39800.1-2020', 'GB 39800.2-2020', 'GB 39800.3-2020', 'GB 39800.4-2020'],
      current_status: '完全缺失',
      verification_sources: ['中国国家标准全文公开系统 https://openstd.samr.gov.cn/'],
      priority: 'high'
    },
    {
      category: '使用反馈/事故数据',
      description: 'PPE失效案例与事故调查报告',
      required_data: ['OSHA事故调查报告', 'NIOSH FACE报告', '中国应急管理部事故通报'],
      current_status: '完全缺失',
      verification_sources: [
        'OSHA Accident Database https://www.osha.gov/pls/imis/accidentsearch.html',
        'NIOSH FACE Reports https://www.cdc.gov/niosh/face/',
        '中国应急管理部 https://www.mem.gov.cn/'
      ],
      priority: 'high'
    },
    {
      category: 'WHO指南数据',
      description: '全球医用PPE使用指导原则',
      required_data: ['WHO Infection Prevention and Control Guidelines', 'WHO PPE Use Recommendations'],
      current_status: '完全缺失',
      verification_sources: ['WHO https://www.who.int/teams/integrated-health-services/infection-prevention-control'],
      priority: 'medium'
    },
    {
      category: '认证机构详细数据',
      description: 'CE公告机构(NB)资质、NANDO编号',
      required_data: ['NB编号', 'NB名称', 'NB认证范围', 'NB有效期'],
      current_status: '部分缺失（无结构化NB数据）',
      verification_sources: ['NANDO https://ec.europa.eu/growth/tools-databases/nando/'],
      priority: 'high'
    },
    {
      category: '化学危害阈值数据',
      description: 'NIOSH化学物质暴露限值与PPE防护等级对应',
      required_data: ['NIOSH Pocket Guide化学物质列表', 'OSHA PEL限值', 'ACGIH TLV限值'],
      current_status: '完全缺失',
      verification_sources: [
        'NIOSH Pocket Guide https://www.cdc.gov/niosh/npg/',
        'OSHA PEL https://www.osha.gov/chemicaldata/'
      ],
      priority: 'medium'
    }
  ];
  
  missingCategories.forEach(m => {
    console.log(`  ⚠ [${m.priority}] ${m.category}: ${m.description}`);
    console.log(`     当前状态: ${m.current_status}`);
  });

  // ========== GENERATE REPORT ==========
  const report = {
    validation_timestamp: timestamp,
    validator: 'mdlooker PPE Data Quality System',
    summary: {
      total_products: totalProducts,
      total_manufacturers: totalManufacturers,
      overall_completeness: `${overallCompleteness.toFixed(1)}%`,
      duplicate_count: duplicates.length,
      standard_issues: standardIssues.length,
      expired_registrations: expired.length,
      expiring_soon: expiringSoon.length,
      missing_categories: missingCategories.length,
      market_coverage_gaps: coverageGaps.length,
    },
    field_completeness: completeness,
    standard_validity_issues: standardIssues,
    registration_expiry: {
      expired: expired.length,
      expiring_soon: expiringSoon.length,
      no_validity_data: totalProducts - products.filter(p => p.registration_valid_until).length
    },
    market_coverage: countryStats,
    market_coverage_gaps: coverageGaps,
    data_source_distribution: sourceStats,
    missing_data_categories: missingCategories,
    duplicates: duplicates.slice(0, 100),
    recommendations: [
      {
        action: '补全model字段',
        detail: '从product_code或description中提取型号信息，目标覆盖率>80%',
        priority: 'high'
      },
      {
        action: '补全registration_valid_until字段',
        detail: '从FDA 510(k)数据库、EUDAMED、NMPA获取注册有效期',
        priority: 'high'
      },
      {
        action: '补全data_source_url字段',
        detail: '为每条记录添加原始来源URL，确保可追溯',
        priority: 'high'
      },
      {
        action: '更新过期标准引用',
        detail: 'GB 19083-2010→GB 19083-2023, GB 14866-2006→GB 14866-2023, ANSI S3.19-1974→ANSI/ASA S12.6-2016',
        priority: 'high'
      },
      {
        action: '新增风险场景数据模块',
        detail: '创建risk-scenarios.json，包含GB 39800系列、NIOSH化学危害等数据',
        priority: 'high'
      },
      {
        action: '新增使用反馈/事故数据模块',
        detail: '创建incident-data.json，整合OSHA/NIOSH/中国应急管理部事故记录',
        priority: 'high'
      },
      {
        action: '新增认证机构数据模块',
        detail: '创建certification-bodies.json，包含NANDO NB列表、FDA认可实验室等',
        priority: 'medium'
      },
      {
        action: '创建manufacturer_id关联',
        detail: '建立ppe_products.manufacturer_id与ppe_manufacturers.id的外键关联',
        priority: 'medium'
      },
      {
        action: '扩展市场覆盖',
        detail: '重点补充JP/KR/IN/BR/AU/DE/FR/IT/ES等市场数据',
        priority: 'medium'
      }
    ]
  };

  // Write report
  fs.writeFileSync(
    path.join(REPORT_DIR, 'validation-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  // ========== GENERATE CLEANED DATASET ==========
  console.log('\n--- 生成清洗后数据集 ---\n');
  
  const cleaned = products.map(p => {
    let validationStatus = 'verified';
    const issues = [];
    
    if (!p.model || p.model === '') {
      validationStatus = 'needs_review';
      issues.push('missing_model');
    }
    if (!p.registration_valid_until) {
      issues.push('missing_expiry');
    }
    if (!p.data_source_url) {
      issues.push('missing_source_url');
    }
    if (p.manufacturer_id === null || p.manufacturer_id === undefined) {
      issues.push('missing_manufacturer_link');
    }
    
    const relatedStandards = Array.isArray(p.related_standards) ? p.related_standards : [];
    relatedStandards.forEach(std => {
      Object.entries(STANDARD_EXPIRY_CHECK).forEach(([key, info]) => {
        if (std.includes(key.split(':')[0]) && info.status !== 'current') {
          validationStatus = 'needs_review';
          issues.push(`outdated_standard:${key}`);
        }
      });
    });
    
    return {
      ...p,
      validation_status: validationStatus,
      validation_issues: issues,
      validated_at: timestamp
    };
  });
  
  const statusCounts = {};
  cleaned.forEach(r => {
    statusCounts[r.validation_status] = (statusCounts[r.validation_status] || 0) + 1;
  });
  
  console.log('验证状态分布：');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} 条 (${(count/totalProducts*100).toFixed(1)}%)`);
  });
  
  // Write cleaned dataset
  const cleanedPath = path.join(REPORT_DIR, 'cleaned-products.json');
  fs.writeFileSync(cleanedPath, JSON.stringify(cleaned, null, 2));
  console.log(`\n清洗后数据集已保存: ${cleanedPath}`);
  
  // Generate summary CSV
  const csvHeaders = ['id', 'name', 'category', 'country_of_origin', 'registration_authority', 'validation_status', 'issues'];
  const csvRows = [csvHeaders.join(',')];
  cleaned.slice(0, 1000).forEach(r => {
    csvRows.push([
      r.id,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      r.category || '',
      r.country_of_origin || '',
      r.registration_authority || '',
      r.validation_status,
      `"${(r.validation_issues || []).join('; ')}"`
    ].join(','));
  });
  
  const csvPath = path.join(REPORT_DIR, 'validation-summary.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`验证摘要CSV已保存: ${csvPath}`);
  
  console.log('\n=== 验证完成 ===');
  console.log(`报告路径: ${path.join(REPORT_DIR, 'validation-report.json')}`);
  
  return report;
}

runFullValidation().catch(e => {
  console.error('验证失败:', e);
  process.exit(1);
});
