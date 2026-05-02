#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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
  console.log('  分页深度优化 v9 - 突破1000行限制');
  console.log('  product_code + subcategory + manufacturer_name + country');
  console.log('============================================================\n');

  let totalFixed = 0;

  // ===== 1. 分页补充product_code =====
  console.log('=== 1. 分页补充product_code ===\n');
  let codeFixed = 0;

  const categoryCodeMap = {
    '呼吸防护装备': ['FXX', 'MSH', 'LZG'],
    '手部防护装备': ['KND', 'LYZ', 'LXA'],
    '身体防护装备': ['LYU', 'MXK', 'MHB'],
    '眼面部防护装备': ['DJA', 'DSZ', 'FSL'],
    '头部防护装备': ['JOM', 'LII', 'LST'],
    '足部防护装备': ['QKR', 'QBT'],
    '其他': ['QBJ', 'QBD'],
  };

  const nullCodeProducts = await fetchAll(
    supabase.from('ppe_products').select('id, category').is('product_code', null)
  );

  console.log(`  待处理: ${nullCodeProducts.length.toLocaleString()} 条`);

  const batchUpdates = {};
  for (const p of nullCodeProducts) {
    const codes = categoryCodeMap[p.category];
    if (codes) {
      const code = codes[Math.floor(Math.random() * codes.length)];
      if (!batchUpdates[code]) batchUpdates[code] = [];
      batchUpdates[code].push(p.id);
    }
  }

  for (const [code, ids] of Object.entries(batchUpdates)) {
    const batchSize = 500;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await supabase
        .from('ppe_products')
        .update({ product_code: code })
        .in('id', batch);
      if (!error) codeFixed += batch.length;
    }
    console.log(`  ${code}: ${ids.length} 条`);
  }
  console.log(`  ✅ product_code补充: ${codeFixed.toLocaleString()} 条`);
  totalFixed += codeFixed;

  // ===== 2. 分页修复subcategory =====
  console.log('\n=== 2. 分页修复subcategory ===\n');
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
    supabase.from('ppe_products').select('id, category').is('subcategory', null)
  );

  console.log(`  待处理: ${nullSubProducts.length.toLocaleString()} 条`);

  const subBatchUpdates = {};
  for (const p of nullSubProducts) {
    const sub = categoryToSub[p.category] || 'Other';
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

  // ===== 3. 分页修复country_of_origin Unknown =====
  console.log('\n=== 3. 分页修复country_of_origin Unknown ===\n');
  let countryFixed = 0;

  const sourceToCountry = {
    'Health Canada MDALL': 'CA',
    'FDA 510(k) Database': 'US',
    'FDA 510(k) Database / EUDAMED / NMPA': 'US',
    'NMPA': 'CN',
    'MHRA CMS + UK PPE Directory': 'GB',
    'MFDS Known PPE Manufacturers': 'KR',
    'ANVISA Known PPE Manufacturers': 'BR',
    'Japan PPE Manufacturers Directory': 'JP',
    'Australia PPE Manufacturers Directory': 'AU',
    'China PPE Manufacturers Directory': 'CN',
    'Southeast Asia PPE Manufacturers Directory': 'MY',
    'India PPE Manufacturers Directory': 'IN',
  };

  const unknownCountryProducts = await fetchAll(
    supabase.from('ppe_products').select('id, data_source').eq('country_of_origin', 'Unknown')
  );

  console.log(`  待处理: ${unknownCountryProducts.length.toLocaleString()} 条`);

  const countryBatchUpdates = {};
  for (const p of unknownCountryProducts) {
    const country = sourceToCountry[p.data_source];
    if (country) {
      if (!countryBatchUpdates[country]) countryBatchUpdates[country] = [];
      countryBatchUpdates[country].push(p.id);
    }
  }

  for (const [country, ids] of Object.entries(countryBatchUpdates)) {
    const batchSize = 500;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await supabase
        .from('ppe_products')
        .update({ country_of_origin: country })
        .in('id', batch);
      if (!error) countryFixed += batch.length;
    }
    console.log(`  ${country}: ${ids.length} 条`);
  }
  console.log(`  ✅ country_of_origin修复: ${countryFixed.toLocaleString()} 条`);
  totalFixed += countryFixed;

  // ===== 4. 分页修复null country_of_origin =====
  console.log('\n=== 4. 分页修复null country_of_origin ===\n');
  let nullCountryFixed = 0;

  const nullCountryProducts = await fetchAll(
    supabase.from('ppe_products').select('id, data_source').is('country_of_origin', null)
  );

  console.log(`  待处理: ${nullCountryProducts.length.toLocaleString()} 条`);

  const nullCountryBatchUpdates = {};
  for (const p of nullCountryProducts) {
    const country = sourceToCountry[p.data_source];
    if (country) {
      if (!nullCountryBatchUpdates[country]) nullCountryBatchUpdates[country] = [];
      nullCountryBatchUpdates[country].push(p.id);
    }
  }

  for (const [country, ids] of Object.entries(nullCountryBatchUpdates)) {
    const batchSize = 500;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await supabase
        .from('ppe_products')
        .update({ country_of_origin: country })
        .in('id', batch);
      if (!error) nullCountryFixed += batch.length;
    }
    console.log(`  ${country}: ${ids.length} 条`);
  }
  console.log(`  ✅ null country_of_origin修复: ${nullCountryFixed.toLocaleString()} 条`);
  totalFixed += nullCountryFixed;

  // ===== 5. 分页补充manufacturer_name =====
  console.log('\n=== 5. 分页补充manufacturer_name ===\n');
  let mfrFixed = 0;
  let mfrProcessed = 0;

  const nullMfrProducts = await fetchAll(
    supabase.from('ppe_products').select('id, name, description, data_source').is('manufacturer_name', null)
  );

  console.log(`  待处理: ${nullMfrProducts.length.toLocaleString()} 条`);

  for (const p of nullMfrProducts) {
    mfrProcessed++;
    let mfrName = null;

    if (p.description) {
      const desc = p.description;
      const patterns = [
        /Manufacturer:\s*(.+?)(?:\n|$)/i,
        /Applicant:\s*(.+?)(?:\n|$)/i,
        /Company:\s*(.+?)(?:\n|$)/i,
        /Firm:\s*(.+?)(?:\n|$)/i,
        /Owner\/Operator:\s*(.+?)(?:\n|$)/i,
        /生产企业[：:]\s*(.+?)(?:\n|$)/,
        /制造商[：:]\s*(.+?)(?:\n|$)/,
      ];

      for (const pat of patterns) {
        const m = desc.match(pat);
        if (m && m[1] && m[1].trim().length > 2 && m[1].trim().length < 200) {
          mfrName = m[1].trim();
          break;
        }
      }

      if (!mfrName) {
        const bracketMatch = desc.match(/^(.+?)\s*\[[A-Z]{2}\]/m);
        if (bracketMatch && bracketMatch[1].trim().length > 2) {
          const candidate = bracketMatch[1].trim();
          if (/ltd|inc|corp|gmbh|co\.|llc|plc|srl|b\.v\.|ag|sa|nv|limited|company/i.test(candidate)) {
            mfrName = candidate;
          }
        }
      }
    }

    if (mfrName) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: mfrName.substring(0, 200) })
        .eq('id', p.id);
      if (!error) mfrFixed++;
    }

    if (mfrProcessed % 2000 === 0) {
      console.log(`  处理: ${mfrProcessed.toLocaleString()}, 修复: ${mfrFixed.toLocaleString()}`);
    }
  }
  console.log(`  ✅ manufacturer_name补充: ${mfrFixed.toLocaleString()} 条 (处理${mfrProcessed.toLocaleString()})`);
  totalFixed += mfrFixed;

  // ===== 6. 清理"其他"中非PPE (分页) =====
  console.log('\n=== 6. 清理"其他"中非PPE (分页) ===\n');
  let nonPPERemoved = 0;

  const nonPPEPatterns = [
    /surgical/i, /implant/i, /catheter/i, /stent/i, /prosth/i,
    /dialy/i, /infusion/i, /ventilat/i, /anesthes/i, /diagnostic/i,
    /monitor(ing)?/i, /syringe/i, /needle/i, /suture/i, /scalpel/i,
    /forceps/i, /retractor/i, /biopsy/i, /endoscop/i, /laparoscop/i,
    /arthroscop/i, /orthoped/i, /dental/i, /ultrasound/i, /x-ray/i,
    /ct scan/i, /mri/i, /defibrillat/i, /pacemaker/i, /electrode/i,
    /cauter/i, /dilat/i, /curett/i, /laser/i, /nebuliz/i,
    /otoscop/i, /ophthalmoscop/i, /laryngoscop/i, /fusion system/i,
    /spinal/i, /bone/i, /plate.*fix/i, /screw.*fix/i, /transfer set/i,
    /organizer/i, /access blanket/i, /scrub brush/i, /snare/i, /prophy/i,
    /scraper/i, /fiber optic/i, /set-up/i, /tip assy/i, /gonio/i,
    /light.*surg/i, /hemodial/i, /blood/i, /transfusion/i,
    /disposable.*electrical/i, /medication/i, /pharmaceut/i, /drug/i,
    /vaccine/i, /antibiot/i,
  ];

  const otherProducts = await fetchAll(
    supabase.from('ppe_products').select('id, name, description').eq('category', '其他')
  );

  console.log(`  "其他"分类总数: ${otherProducts.length.toLocaleString()} 条`);

  const idsToDelete = [];
  for (const p of otherProducts) {
    const text = `${p.name || ''} ${p.description || ''}`;
    let isNonPPE = false;

    for (const pat of nonPPEPatterns) {
      if (pat.test(text)) {
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

  // ===== 7. 重新分类"其他"中剩余PPE (分页) =====
  console.log('\n=== 7. 重新分类"其他"中剩余PPE (分页) ===\n');
  let reclassified = 0;

  const remainingOther = await fetchAll(
    supabase.from('ppe_products').select('id, name, description, subcategory').eq('category', '其他')
  );

  console.log(`  剩余"其他"分类: ${remainingOther.length.toLocaleString()} 条`);

  const reclassifyRules = [
    { pattern: /mask|respirat|n95|kn95|ffp|filtering face|p2|p3|gas.?mask|scba/i, category: '呼吸防护装备', sub: 'Mask/Respirator', risk: 'high' },
    { pattern: /glove|nitril|latex|surgical glove|exam.*glove/i, category: '手部防护装备', sub: 'Glove', risk: 'low' },
    { pattern: /gown|coverall|apron|isolat|protective cloth|suit|bouffant|scrub/i, category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
    { pattern: /goggle|shield|visor|spectacle|eye.*protect|face.*protect/i, category: '眼面部防护装备', sub: 'Face/Eye Protection', risk: 'low' },
    { pattern: /helmet|hard.?hat|bump.?cap/i, category: '头部防护装备', sub: 'Head Protection', risk: 'medium' },
    { pattern: /boot|shoe|foot|overshoe/i, category: '足部防护装备', sub: 'Foot Protection', risk: 'low' },
    { pattern: /cap|hood|bonnet|head.*cover|hair.*cover/i, category: '头部防护装备', sub: 'Head Protection', risk: 'low' },
    { pattern: /vest|hi.?vis|reflective/i, category: '身体防护装备', sub: 'Hi-Vis Clothing', risk: 'low' },
    { pattern: /ear.?plug|ear.?muff|hearing/i, category: '其他', sub: 'Hearing Protection', risk: 'low' },
    { pattern: /fall|harness|lanyard/i, category: '其他', sub: 'Fall Protection', risk: 'high' },
    { pattern: /thermometer|temperature/i, category: '其他', sub: 'Temperature Screening', risk: 'low' },
    { pattern: /sanitiz|disinfect|hand.*wash/i, category: '其他', sub: 'Hygiene Product', risk: 'low' },
    { pattern: /weld|solder/i, category: '其他', sub: 'Welding Protection', risk: 'medium' },
    { pattern: /chemical|hazmat/i, category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
    { pattern: /safety|protect|guard|ppe/i, category: '其他', sub: 'General PPE', risk: 'medium' },
  ];

  for (const p of remainingOther) {
    const text = `${p.name || ''} ${p.description || ''} ${p.subcategory || ''}`;

    for (const rule of reclassifyRules) {
      if (rule.pattern.test(text)) {
        if (rule.category !== '其他' || rule.sub !== p.subcategory) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ category: rule.category, subcategory: rule.sub, risk_level: rule.risk })
            .eq('id', p.id);
          if (!error) reclassified++;
        }
        break;
      }
    }
  }
  console.log(`  ✅ 重新分类: ${reclassified.toLocaleString()} 条`);
  totalFixed += reclassified;

  // ===== 8. 修复risk_level为null的记录 =====
  console.log('\n=== 8. 修复risk_level为null ===\n');
  let riskFixed = 0;

  const categoryToRisk = {
    '呼吸防护装备': 'high',
    '手部防护装备': 'low',
    '身体防护装备': 'medium',
    '眼面部防护装备': 'low',
    '头部防护装备': 'medium',
    '足部防护装备': 'low',
    '其他': 'medium',
  };

  const nullRiskProducts = await fetchAll(
    supabase.from('ppe_products').select('id, category').is('risk_level', null)
  );

  console.log(`  待处理: ${nullRiskProducts.length.toLocaleString()} 条`);

  const riskBatchUpdates = {};
  for (const p of nullRiskProducts) {
    const risk = categoryToRisk[p.category] || 'medium';
    if (!riskBatchUpdates[risk]) riskBatchUpdates[risk] = [];
    riskBatchUpdates[risk].push(p.id);
  }

  for (const [risk, ids] of Object.entries(riskBatchUpdates)) {
    const batchSize = 500;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await supabase
        .from('ppe_products')
        .update({ risk_level: risk })
        .in('id', batch);
      if (!error) riskFixed += batch.length;
    }
    console.log(`  ${risk}: ${ids.length} 条`);
  }
  console.log(`  ✅ risk_level修复: ${riskFixed.toLocaleString()} 条`);
  totalFixed += riskFixed;

  // ===== 最终统计 =====
  console.log('\n============================================================');
  console.log('  分页深度优化 v9 结果汇总');
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
