#!/usr/bin/env node
/**
 * ============================================================================
 * collect-us-manufacturers.js
 *
 * T1.1: 美国市场厂商数据补全
 *
 * 从 ppe_products 中提取所有 US 制造商 → 在 ppe_manufacturers 建立档案
 * 补全字段: name, country, data_source, certifications, compliance_status,
 *           business_scope, company_profile, product count
 *
 * 去重策略: name(规范化) + country 联合去重
 * 可信度: medium (从产品数据中提取)
 * ============================================================================
 */

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- 厂商名规范化 ----
function normalizeName(name) {
  return (name || '')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:]+\s*$/g, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\b(Inc|Corp|Corporation|LLC|Ltd|Limited|Co|Company|GmbH|S\.A\.|S\.R\.L\.|B\.V\.|PLC|AG|KG|LP|LLP|P\.C\.|PLLC)\b\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ---- 按品类推断 business_scope ----
function inferScope(categories) {
  const scopes = [];
  if (categories.includes('呼吸防护装备')) scopes.push('Respiratory Protection');
  if (categories.includes('手部防护装备')) scopes.push('Hand Protection / Gloves');
  if (categories.includes('身体防护装备')) scopes.push('Body Protection / Protective Clothing');
  if (categories.includes('眼面部防护装备')) scopes.push('Eye & Face Protection');
  if (categories.includes('头部防护装备')) scopes.push('Head Protection');
  if (categories.includes('足部防护装备')) scopes.push('Foot Protection');
  if (categories.includes('听觉防护装备')) scopes.push('Hearing Protection');
  if (categories.includes('坠落防护装备')) scopes.push('Fall Protection');
  if (categories.includes('躯干防护装备')) scopes.push('High-Visibility / Torso Protection');
  return scopes.join('; ') || 'Personal Protective Equipment';
}

// ---- 按行业推断 NAICS ----
function inferNAICS(categories) {
  if (categories.includes('呼吸防护装备')) return '339113 - Surgical Appliance and Supplies Manufacturing';
  if (categories.includes('手部防护装备')) return '339113 - Surgical Appliance and Supplies Manufacturing';
  if (categories.includes('身体防护装备')) return '315210 - Cut and Sew Apparel Contractors';
  if (categories.includes('眼面部防护装备')) return '339115 - Ophthalmic Goods Manufacturing';
  if (categories.includes('头部防护装备')) return '339113 - Surgical Appliance and Supplies Manufacturing';
  if (categories.includes('足部防护装备')) return '316210 - Footwear Manufacturing';
  if (categories.includes('听觉防护装备')) return '334310 - Audio and Video Equipment Manufacturing';
  return '339113 - Surgical Appliance and Supplies Manufacturing';
}

// ---- 知名厂商预置数据 ----
const KNOWN_MFR_DATA = {
  '3m company': { website: 'https://www.3m.com', compliance_status: { fda_registered: true, iso_certified: true } },
  'honeywell international': { website: 'https://www.honeywell.com', compliance_status: { fda_registered: true, iso_certified: true } },
  'dupont': { website: 'https://www.dupont.com', compliance_status: { fda_registered: true, iso_certified: true } },
  'ansell healthcare': { website: 'https://www.ansell.com', compliance_status: { fda_registered: true, iso_certified: true } },
  'moldex-metric': { website: 'https://www.moldex.com', compliance_status: { fda_registered: true } },
  'kimberly-clark': { website: 'https://www.kimberly-clark.com', compliance_status: { fda_registered: true, iso_certified: true } },
  'allegiance healthcare': { website: 'https://www.cardinalhealth.com', compliance_status: { fda_registered: true } },
  'aearo': { website: 'https://www.3m.com', compliance_status: { fda_registered: true } },
  'alpha protech': { website: 'https://www.alphaprotech.com', compliance_status: { fda_registered: true } },
  'medline industries': { website: 'https://www.medline.com', compliance_status: { fda_registered: true, iso_certified: true } },
  'owens & minor': { website: 'https://www.owens-minor.com', compliance_status: { fda_registered: true } },
  'prestige ameritech': { website: 'https://www.prestigeameritech.com', compliance_status: { fda_registered: true } },
  'mckesson': { website: 'https://www.mckesson.com', compliance_status: { fda_registered: true } },
  'louis m gerson': { website: 'https://www.gersonco.com', compliance_status: { fda_registered: true } },
  'msa safety': { website: 'https://www.msasafety.com', compliance_status: { fda_registered: true, iso_certified: true } },
};

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  T1.1: 美国市场厂商数据补全');
  console.log('═══════════════════════════════════════');

  // Step 1: 从 ppe_products 提取所有 US 厂商
  console.log('\n[1/5] 提取 US 产品数据...');
  let page = 0;
  const mfrMap = new Map(); // normalizedName → { displayName, categories, auths, srcs, products, riskLevels }

  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('manufacturer_name,country_of_origin,category,registration_authority,data_source,risk_level')
      .eq('country_of_origin', 'US')
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (error || !data || data.length === 0) break;

    for (const r of data) {
      if (!r.manufacturer_name) continue;
      const norm = normalizeName(r.manufacturer_name);
      if (!mfrMap.has(norm)) {
        mfrMap.set(norm, {
          displayName: r.manufacturer_name.trim(),
          categories: new Set(),
          auths: new Set(),
          srcs: new Set(),
          productCount: 0,
          riskLevels: new Set(),
        });
      }
      const entry = mfrMap.get(norm);
      if (r.category) entry.categories.add(r.category);
      if (r.registration_authority) entry.auths.add(r.registration_authority);
      if (r.data_source) entry.srcs.add(r.data_source);
      if (r.risk_level) entry.riskLevels.add(r.risk_level);
      entry.productCount++;
    }

    if (data.length < 1000) break;
    page++;
  }

  console.log(`  提取到 ${mfrMap.size} 家唯一 US 厂商`);

  // Step 2: 检查已有的 ppe_manufacturers 记录
  console.log('\n[2/5] 加载已有厂商记录作去重...');
  let mp = 0;
  const existingMfrs = new Set();
  while (true) {
    const { data: ed } = await supabase.from('ppe_manufacturers').select('name,country').range(mp * 1000, (mp + 1) * 1000 - 1);
    if (!ed || ed.length === 0) break;
    ed.forEach(r => { if (r.name && r.country === 'US') existingMfrs.add(normalizeName(r.name)); });
    if (ed.length < 1000) break;
    mp++;
  }
  console.log(`  已有 ${existingMfrs.size} 家 US 厂商`);

  // Step 3: 构建厂商记录
  console.log('\n[3/5] 构建厂商档案...');
  const batch = [];
  let skipped = 0;

  for (const [normName, info] of mfrMap) {
    if (existingMfrs.has(normName)) { skipped++; continue; }

    const catArr = [...info.categories];
    const known = KNOWN_MFR_DATA[normName] || {};

    const record = {
      name: info.displayName.substring(0, 500),
      country: 'US',
      business_scope: inferScope(catArr),
      certifications: [...info.auths].filter(Boolean).join(', '),
      compliance_status: known.compliance_status || { fda_registered: info.auths.has('FDA') },
      data_source: [...info.srcs].filter(Boolean).join(', '),
      data_confidence_level: 'medium',
      last_verified: new Date().toISOString().split('T')[0],
      company_profile: `US PPE Manufacturer - ${info.productCount} registered product(s) in database. NAICS: ${inferNAICS(catArr)}. Regulatory authorities: ${[...info.auths].join(', ')}.`,
    };

    if (known.website) record.website = known.website;

    batch.push(record);
  }

  console.log(`  待插入: ${batch.length}, 跳过(已有): ${skipped}`);

  // Step 4: 批量插入
  console.log('\n[4/5] 插入 ppe_manufacturers...');
  let inserted = 0;
  for (let i = 0; i < batch.length; i += 100) {
    const chunk = batch.slice(i, i + 100);
    const { error } = await supabase.from('ppe_manufacturers').insert(chunk);
    if (!error) {
      inserted += chunk.length;
    } else {
      console.log(`  批量插入错误: ${error.message}, 逐条重试...`);
      for (const r of chunk) {
        const { error: e2 } = await supabase.from('ppe_manufacturers').insert(r);
        if (!e2) inserted++;
      }
    }
    await sleep(50);
    if (i % 1000 === 0 && i > 0) console.log(`  已处理 ${i}/${batch.length}...`);
  }
  console.log(`  成功插入: ${inserted} 条`);

  // Step 5: 验证
  console.log('\n[5/5] 验证结果...');
  const { count: totalUS } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).eq('country', 'US');
  const { count: totalAll } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  美国厂商总数: ${totalUS}`);
  console.log(`  全球厂商总数: ${totalAll}`);

  console.log('\n═══════════════════════════════════════');
  console.log('  T1.1 完成');
  console.log('═══════════════════════════════════════');
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { main, normalizeName, inferScope };