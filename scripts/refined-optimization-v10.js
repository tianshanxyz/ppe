#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

async function fetchAll(query, pageSize = 1000) {
  let allData = [];
  let offset = 0;
  while (true) {
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error || !data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return allData;
}

async function main() {
  console.log('============================================================');
  console.log('  精细化优化 v10 - subcategory + manufacturer_name');
  console.log('============================================================\n');

  let totalFixed = 0;

  // ===== 1. 修复subcategory为null (分页) =====
  console.log('=== 1. 修复subcategory为null ===\n');
  let subFixed = 0;

  const categoryToSub = {
    '呼吸防护装备': 'Mask/Respirator',
    '手部防护装备': 'Glove',
    '身体防护装备': 'Protective Garment',
    '眼面部防护装备': 'Face/Eye Protection',
    '头部防护装备': 'Head Protection',
    '足部防护装备': 'Foot Protection',
    '其他': 'General PPE',
  };

  const nullSubProducts = await fetchAll(
    supabase.from('ppe_products').select('id, name, category, description').is('subcategory', null)
  );

  console.log(`  待处理: ${nullSubProducts.length.toLocaleString()} 条`);

  const nameToSub = [
    { pattern: /mask|respirat|n95|kn95|ffp|filtering/i, sub: 'Mask/Respirator' },
    { pattern: /glove|nitril|latex/i, sub: 'Glove' },
    { pattern: /gown|coverall|apron|suit|isolat/i, sub: 'Protective Garment' },
    { pattern: /goggle|shield|visor|eye/i, sub: 'Face/Eye Protection' },
    { pattern: /helmet|hard.?hat|cap|hood/i, sub: 'Head Protection' },
    { pattern: /boot|shoe|foot/i, sub: 'Foot Protection' },
    { pattern: /hearing|ear.?plug|ear.?muff/i, sub: 'Hearing Protection' },
    { pattern: /fall|harness/i, sub: 'Fall Protection' },
    { pattern: /weld/i, sub: 'Welding Protection' },
    { pattern: /sanitiz|disinfect/i, sub: 'Hygiene Product' },
  ];

  const subBatchUpdates = {};
  for (const p of nullSubProducts) {
    let sub = categoryToSub[p.category] || 'Other';

    const text = `${p.name || ''} ${p.description || ''}`;
    for (const rule of nameToSub) {
      if (rule.pattern.test(text)) {
        sub = rule.sub;
        break;
      }
    }

    if (!subBatchUpdates[sub]) subBatchUpdates[sub] = [];
    subBatchUpdates[sub].push(p.id);
  }

  for (const [sub, ids] of Object.entries(subBatchUpdates)) {
    const batchSize = 500;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await supabase
        .from('ppe_products')
        .update({ subcategory: sub })
        .in('id', batch);
      if (!error) subFixed += batch.length;
    }
    console.log(`  ${sub}: ${ids.length} 条`);
  }
  console.log(`  ✅ subcategory修复: ${subFixed.toLocaleString()} 条`);
  totalFixed += subFixed;

  // ===== 2. FDA 510k API补充manufacturer_name (分页) =====
  console.log('\n=== 2. FDA 510k API补充manufacturer_name ===\n');
  let mfrFromFDA = 0;
  let fdaProcessed = 0;

  const nullMfrFDA = await fetchAll(
    supabase.from('ppe_products')
      .select('id, name, product_code')
      .is('manufacturer_name', null)
      .in('data_source', ['FDA 510(k) Database', 'FDA 510(k) Database / EUDAMED / NMPA'])
  );

  console.log(`  FDA来源待处理: ${nullMfrFDA.length.toLocaleString()} 条`);

  const nameCache = {};
  for (const p of nullMfrFDA) {
    fdaProcessed++;
    let mfrName = null;

    if (nameCache[p.name]) {
      mfrName = nameCache[p.name];
    } else if (p.name && p.name !== 'Unknown' && p.name.length > 3) {
      try {
        const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=device_name:${encodeURIComponent(`"${p.name.substring(0, 50)}"`)}&limit=1`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (resp.ok) {
          const data = await resp.json();
          if (data.results && data.results[0]) {
            mfrName = data.results[0].applicant || data.results[0].contact || null;
            if (mfrName) nameCache[p.name] = mfrName;
          }
        }
      } catch (e) {}
    }

    if (!mfrName && p.product_code) {
      try {
        const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(p.product_code)}&limit=1`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (resp.ok) {
          const data = await resp.json();
          if (data.results && data.results[0]) {
            mfrName = data.results[0].applicant || data.results[0].contact || null;
          }
        }
      } catch (e) {}
    }

    if (mfrName) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: mfrName.substring(0, 200) })
        .eq('id', p.id);
      if (!error) mfrFromFDA++;
    }

    if (fdaProcessed % 100 === 0) {
      console.log(`  FDA处理: ${fdaProcessed}, 修复: ${mfrFromFDA}, 缓存: ${Object.keys(nameCache).length}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`  ✅ FDA API补充: ${mfrFromFDA.toLocaleString()} 条 (处理${fdaProcessed})`);
  totalFixed += mfrFromFDA;

  // ===== 3. Health Canada API补充manufacturer_name (分页) =====
  console.log('\n=== 3. Health Canada API补充manufacturer_name ===\n');
  let mfrFromHC = 0;
  let hcProcessed = 0;

  const nullMfrHC = await fetchAll(
    supabase.from('ppe_products')
      .select('id, name, product_code')
      .is('manufacturer_name', null)
      .eq('data_source', 'Health Canada MDALL')
  );

  console.log(`  HC来源待处理: ${nullMfrHC.length.toLocaleString()} 条`);

  for (const p of nullMfrHC) {
    hcProcessed++;
    let mfrName = null;

    const searchTerm = p.product_code || (p.name && p.name !== 'Unknown' ? p.name.substring(0, 60) : null);
    if (!searchTerm) continue;

    try {
      const url = `https://health-products.canada.ca/api/medical-devices/company/?lang=en&type=json&search=${encodeURIComponent(searchTerm)}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0 && data[0].company_name) {
          mfrName = data[0].company_name;
        }
      }
    } catch (e) {}

    if (!mfrName) {
      try {
        const url = `https://health-products.canada.ca/api/medical-devices/licence/?lang=en&type=json&search=${encodeURIComponent(searchTerm)}`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0 && data[0].company_name) {
            mfrName = data[0].company_name;
          }
        }
      } catch (e) {}
    }

    if (mfrName) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: mfrName.substring(0, 200) })
        .eq('id', p.id);
      if (!error) mfrFromHC++;
    }

    if (hcProcessed % 50 === 0) {
      console.log(`  HC处理: ${hcProcessed}, 修复: ${mfrFromHC}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`  ✅ Health Canada API补充: ${mfrFromHC.toLocaleString()} 条 (处理${hcProcessed})`);
  totalFixed += mfrFromHC;

  // ===== 4. NMPA来源补充manufacturer_name =====
  console.log('\n=== 4. NMPA来源补充manufacturer_name ===\n');
  let mfrFromNMPA = 0;

  const nullMfrNMPA = await fetchAll(
    supabase.from('ppe_products')
      .select('id, name, description')
      .is('manufacturer_name', null)
      .eq('data_source', 'NMPA')
  );

  console.log(`  NMPA来源待处理: ${nullMfrNMPA.length.toLocaleString()} 条`);

  for (const p of nullMfrNMPA) {
    let mfrName = null;
    const desc = p.description || '';

    const cnPatterns = [
      /生产企业[：:]\s*(.+?)(?:\n|$)/,
      /制造商[：:]\s*(.+?)(?:\n|$)/,
      /Manufacturer:\s*(.+?)(?:\n|$)/i,
      /公司名称[：:]\s*(.+?)(?:\n|$)/,
      /注册人[：:]\s*(.+?)(?:\n|$)/,
    ];

    for (const pat of cnPatterns) {
      const m = desc.match(pat);
      if (m && m[1] && m[1].trim().length > 2) {
        mfrName = m[1].trim().substring(0, 200);
        break;
      }
    }

    if (mfrName) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: mfrName })
        .eq('id', p.id);
      if (!error) mfrFromNMPA++;
    }
  }
  console.log(`  ✅ NMPA补充: ${mfrFromNMPA.toLocaleString()} 条`);
  totalFixed += mfrFromNMPA;

  // ===== 5. 清理"其他"中更多非PPE =====
  console.log('\n=== 5. 清理"其他"中更多非PPE ===\n');
  let nonPPERemoved = 0;

  const nonPPEKeywords = [
    'surgical', 'implant', 'catheter', 'stent', 'prosth', 'dialy',
    'infusion', 'ventilat', 'anesthes', 'diagnostic', 'monitor',
    'syringe', 'needle', 'suture', 'scalpel', 'forceps', 'retractor',
    'biopsy', 'endoscop', 'laparoscop', 'arthroscop', 'orthoped',
    'dental', 'ultrasound', 'x-ray', 'ct scan', 'mri', 'defibrillat',
    'pacemaker', 'electrode', 'cauter', 'dilat', 'curett', 'laser',
    'nebuliz', 'otoscop', 'ophthalmoscop', 'laryngoscop', 'fusion',
    'spinal', 'bone', 'plate', 'screw', 'transfer', 'organizer',
    'blanket', 'brush', 'snare', 'prophy', 'scraper', 'fiber optic',
    'gonio', 'hemodial', 'blood', 'transfusion', 'electrical',
    'medication', 'pharmaceut', 'drug', 'vaccine', 'antibiot',
    'tubing', 'cannula', 'intubat', 'trachea', 'stoma', 'wound',
    'drain', 'suction', 'irrigat', 'dilator', 'speculum',
  ];

  const otherProducts = await fetchAll(
    supabase.from('ppe_products').select('id, name, description').eq('category', '其他')
  );

  console.log(`  "其他"分类总数: ${otherProducts.length.toLocaleString()} 条`);

  const idsToDelete = [];
  for (const p of otherProducts) {
    const text = `${(p.name || '').toLowerCase()} ${(p.description || '').toLowerCase()}`;
    let isNonPPE = false;

    for (const kw of nonPPEKeywords) {
      if (text.includes(kw)) {
        isNonPPE = true;
        break;
      }
    }

    if (isNonPPE) {
      idsToDelete.push(p.id);
    }
  }

  console.log(`  识别非PPE: ${idsToDelete.length.toLocaleString()} 条`);

  if (idsToDelete.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      const { error } = await supabase.from('ppe_products').delete().in('id', batch);
      if (!error) nonPPERemoved += batch.length;
    }
  }
  console.log(`  ✅ 非PPE产品删除: ${nonPPERemoved.toLocaleString()} 条`);
  totalFixed += nonPPERemoved;

  // ===== 6. 重新分类"其他"中剩余PPE =====
  console.log('\n=== 6. 重新分类"其他"中剩余PPE ===\n');
  let reclassified = 0;

  const remainingOther = await fetchAll(
    supabase.from('ppe_products').select('id, name, description, subcategory').eq('category', '其他')
  );

  console.log(`  剩余"其他"分类: ${remainingOther.length.toLocaleString()} 条`);

  const reclassifyRules = [
    { pattern: /mask|respirat|n95|kn95|ffp|filtering face|p2|p3|gas.?mask|scba|breathing/i, category: '呼吸防护装备', sub: 'Mask/Respirator', risk: 'high' },
    { pattern: /glove|nitril|latex|surgical glove|exam.*glove|hand.*protect/i, category: '手部防护装备', sub: 'Glove', risk: 'low' },
    { pattern: /gown|coverall|apron|isolat|protective cloth|suit|bouffant|scrub|garment/i, category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
    { pattern: /goggle|shield|visor|spectacle|eye.*protect|face.*protect/i, category: '眼面部防护装备', sub: 'Face/Eye Protection', risk: 'low' },
    { pattern: /helmet|hard.?hat|bump.?cap/i, category: '头部防护装备', sub: 'Head Protection', risk: 'medium' },
    { pattern: /boot|shoe|foot|overshoe/i, category: '足部防护装备', sub: 'Foot Protection', risk: 'low' },
    { pattern: /cap|hood|bonnet|head.*cover|hair.*cover/i, category: '头部防护装备', sub: 'Head Protection', risk: 'low' },
    { pattern: /vest|hi.?vis|reflective/i, category: '身体防护装备', sub: 'Hi-Vis Clothing', risk: 'low' },
  ];

  for (const p of remainingOther) {
    const text = `${p.name || ''} ${p.description || ''} ${p.subcategory || ''}`;

    for (const rule of reclassifyRules) {
      if (rule.pattern.test(text)) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ category: rule.category, subcategory: rule.sub, risk_level: rule.risk })
          .eq('id', p.id);
        if (!error) reclassified++;
        break;
      }
    }
  }
  console.log(`  ✅ 重新分类: ${reclassified.toLocaleString()} 条`);
  totalFixed += reclassified;

  // ===== 最终统计 =====
  console.log('\n============================================================');
  console.log('  精细化优化 v10 结果汇总');
  console.log('============================================================\n');

  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: unknownCountryCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', 'Unknown');
  const { count: nullCountryCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('country_of_origin', null);
  const { count: otherCat } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  const { count: nullCode } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: nullSubCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('subcategory', null);
  const { count: nullRiskCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('risk_level', null);

  const t = totalProducts || 1;
  console.log(`  总修复: ${totalFixed.toLocaleString()} 条`);
  console.log(`  产品总数: ${totalProducts?.toLocaleString()}`);
  console.log(`  制造商总数: ${totalManufacturers?.toLocaleString()}`);
  console.log(`  manufacturer_name缺失: ${nullMfr?.toLocaleString()} (${((nullMfr || 0) / t * 100).toFixed(1)}%)`);
  console.log(`  country_of_origin问题: ${((unknownCountryCount || 0) + (nullCountryCount || 0)).toLocaleString()} (${(((unknownCountryCount || 0) + (nullCountryCount || 0)) / t * 100).toFixed(1)}%)`);
  console.log(`  "其他"分类: ${otherCat?.toLocaleString()} (${((otherCat || 0) / t * 100).toFixed(1)}%)`);
  console.log(`  product_code缺失: ${nullCode?.toLocaleString()} (${((nullCode || 0) / t * 100).toFixed(1)}%)`);
  console.log(`  subcategory缺失: ${nullSubCount?.toLocaleString()} (${((nullSubCount || 0) / t * 100).toFixed(1)}%)`);
  console.log(`  risk_level缺失: ${nullRiskCount?.toLocaleString()} (${((nullRiskCount || 0) / t * 100).toFixed(1)}%)`);
}

main().catch(console.error);
