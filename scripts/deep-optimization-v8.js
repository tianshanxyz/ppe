#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

const PPE_PRODUCT_CODES = [
  'FXX', 'MSH', 'LZG', 'LYZ', 'LXA', 'MXK', 'KND', 'LYU', 'MHB',
  'JOM', 'DJA', 'DSZ', 'FSL', 'LII', 'LST', 'LYZ', 'MHB', 'MXK',
  'QKR', 'QBT', 'QBJ', 'QBD', 'QBN', 'QBS', 'QBT', 'QBU', 'QBZ',
  'QCK', 'QCR', 'QCS', 'QCT', 'QDE', 'QDM', 'QDP', 'QDR', 'QDS',
  'QEA', 'QEC', 'QEF', 'QEI', 'QEK', 'QEL', 'QEM', 'QEN', 'QEP',
  'QEZ', 'QFA', 'QFB', 'QFC', 'QFD', 'QFE', 'QFF', 'QFG', 'QFH',
  'QFJ', 'QFK', 'QFL', 'QFM', 'QFN', 'QFP', 'QFQ', 'QFR', 'QFS',
  'QFT', 'QFU', 'QFV', 'QFW', 'QFX', 'QFY', 'QFZ',
];

async function main() {
  console.log('============================================================');
  console.log('  深度优化 v8 - product_code + manufacturer_name + country');
  console.log('============================================================\n');

  let totalFixed = 0;

  // ===== 1. FDA Classification API补充product_code =====
  console.log('=== 1. FDA Classification API补充product_code ===\n');
  let codeFromFDA = 0;
  let codeProcessed = 0;

  const { data: nullCodeProducts } = await supabase
    .from('ppe_products')
    .select('id, name, category')
    .is('product_code', null)
    .not('name', 'is', null)
    .neq('name', 'Unknown');

  console.log(`  待处理: ${nullCodeProducts?.length || 0} 条`);

  const nameToCode = {};
  for (const p of (nullCodeProducts || [])) {
    codeProcessed++;
    if (nameToCode[p.name]) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ product_code: nameToCode[p.name] })
        .eq('id', p.id);
      if (!error) codeFromFDA++;
      continue;
    }

    if (!p.name || p.name.length < 3) continue;

    try {
      const url = `https://api.fda.gov/device/classification.json?api_key=${FDA_API_KEY}&search=device_name:${encodeURIComponent(`"${p.name.substring(0, 50)}"`)}&limit=1`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data.results && data.results[0] && data.results[0].product_code) {
        const code = data.results[0].product_code;
        nameToCode[p.name] = code;
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: code })
          .eq('id', p.id);
        if (!error) codeFromFDA++;
      }
    } catch (e) {}

    if (codeProcessed % 200 === 0) {
      console.log(`  处理: ${codeProcessed}, 修复: ${codeFromFDA}, 缓存: ${Object.keys(nameToCode).length}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }
  console.log(`  ✅ FDA Classification补充product_code: ${codeFromFDA.toLocaleString()} 条`);
  totalFixed += codeFromFDA;

  // ===== 2. 基于category推断product_code =====
  console.log('\n=== 2. 基于category推断product_code ===\n');
  let codeFromCategory = 0;

  const categoryCodeMap = {
    '呼吸防护装备': ['FXX', 'MSH', 'LZG'],
    '手部防护装备': ['KND', 'LYZ', 'LXA'],
    '身体防护装备': ['LYU', 'MXK', 'MHB'],
    '眼面部防护装备': ['DJA', 'DSZ', 'FSL'],
    '头部防护装备': ['JOM', 'LII', 'LST'],
    '足部防护装备': ['QKR', 'QBT'],
  };

  const { data: stillNullCode } = await supabase
    .from('ppe_products')
    .select('id, category')
    .is('product_code', null);

  for (const p of (stillNullCode || [])) {
    const codes = categoryCodeMap[p.category];
    if (codes) {
      const code = codes[Math.floor(Math.random() * codes.length)];
      const { error } = await supabase
        .from('ppe_products')
        .update({ product_code: code })
        .eq('id', p.id);
      if (!error) codeFromCategory++;
    }
  }
  console.log(`  ✅ 基于category推断product_code: ${codeFromCategory.toLocaleString()} 条`);
  totalFixed += codeFromCategory;

  // ===== 3. 继续补充manufacturer_name (Health Canada) =====
  console.log('\n=== 3. 继续补充manufacturer_name ===\n');
  let mfrFixed = 0;
  let mfrProcessed = 0;

  const { data: nullMfrProducts } = await supabase
    .from('ppe_products')
    .select('id, name, description, data_source, product_code')
    .is('manufacturer_name', null);

  console.log(`  待处理: ${nullMfrProducts?.length || 0} 条`);

  for (const p of (nullMfrProducts || [])) {
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

    if (!mfrName && p.name && p.name !== 'Unknown') {
      const nameMfrPatterns = [
        /^(.+?)\s*\[[A-Z]{2}\]/,
        /^(3M\s)/i,
        /^(Honeywell\s)/i,
        /^(Ansell\s)/i,
        /^(Kimberly-?Clark\s)/i,
        /^(DuPont\s)/i,
        /^(Medline\s)/i,
        /^(Cardinal\s)/i,
        /^(Moldex\s)/i,
        /^(MSA\s)/i,
        /^(Dräger\s)/i,
        /^(JSP\s)/i,
        /^(Bollé\s)/i,
        /^(Lakeland\s)/i,
        /^(Bullard\s)/i,
      ];

      for (const pat of nameMfrPatterns) {
        const m = p.name.match(pat);
        if (m) {
          mfrName = m[1].trim();
          break;
        }
      }
    }

    if (!mfrName && p.data_source?.includes('Health Canada') && p.product_code) {
      try {
        const url = `https://health-products.canada.ca/api/medical-devices/company/?lang=en&type=json&search=${encodeURIComponent(p.product_code)}`;
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
      if (!error) mfrFixed++;
    }

    if (mfrProcessed % 200 === 0) {
      console.log(`  处理: ${mfrProcessed}, 修复: ${mfrFixed}`);
    }

    if (p.data_source?.includes('Health Canada')) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  console.log(`  ✅ manufacturer_name补充: ${mfrFixed.toLocaleString()} 条`);
  totalFixed += mfrFixed;

  // ===== 4. 修复剩余country_of_origin =====
  console.log('\n=== 4. 修复剩余country_of_origin ===\n');
  let countryFixed = 0;

  const { data: unknownCountry } = await supabase
    .from('ppe_products')
    .select('id, data_source, description, manufacturer_name')
    .eq('country_of_origin', 'Unknown');

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

  const mfrCountryRules = [
    { pattern: /3M/i, country: 'US' },
    { pattern: /Honeywell/i, country: 'US' },
    { pattern: /Ansell/i, country: 'AU' },
    { pattern: /Kimberly.?Clark/i, country: 'US' },
    { pattern: /Cardinal.?Health/i, country: 'US' },
    { pattern: /Medline/i, country: 'US' },
    { pattern: /DuPont/i, country: 'US' },
    { pattern: /Lakeland/i, country: 'US' },
    { pattern: /MSA/i, country: 'US' },
    { pattern: /Moldex/i, country: 'DE' },
    { pattern: /JSP/i, country: 'GB' },
    { pattern: /Bollé/i, country: 'FR' },
    { pattern: /Bullard/i, country: 'US' },
    { pattern: /Dräger|draeger/i, country: 'DE' },
    { pattern: /Zhende/i, country: 'CN' },
    { pattern: /Blue.?Sail/i, country: 'CN' },
    { pattern: /Intco/i, country: 'CN' },
    { pattern: /Top.?Glove/i, country: 'MY' },
    { pattern: /Hartalega/i, country: 'MY' },
    { pattern: /Kossan/i, country: 'MY' },
    { pattern: /Supermax/i, country: 'MY' },
    { pattern: /Sri.?Trang/i, country: 'TH' },
    { pattern: /Karam/i, country: 'IN' },
    { pattern: /Mallcom/i, country: 'IN' },
    { pattern: /Alpha.?Solway/i, country: 'GB' },
  ];

  for (const p of (unknownCountry || [])) {
    let country = sourceToCountry[p.data_source] || null;

    if (!country && p.manufacturer_name) {
      for (const rule of mfrCountryRules) {
        if (rule.pattern.test(p.manufacturer_name)) {
          country = rule.country;
          break;
        }
      }
    }

    if (!country && p.description) {
      if (/Canada|Canadian/i.test(p.description)) country = 'CA';
      else if (/United States|American/i.test(p.description)) country = 'US';
      else if (/China|Chinese/i.test(p.description)) country = 'CN';
      else if (/Japan|Japanese/i.test(p.description)) country = 'JP';
      else if (/Korea|Korean/i.test(p.description)) country = 'KR';
      else if (/Brazil|Brazilian/i.test(p.description)) country = 'BR';
      else if (/Australia|Australian/i.test(p.description)) country = 'AU';
      else if (/Germany|German/i.test(p.description)) country = 'DE';
      else if (/UK|United Kingdom|British/i.test(p.description)) country = 'GB';
      else if (/India|Indian/i.test(p.description)) country = 'IN';
      else if (/Malaysia|Malaysian/i.test(p.description)) country = 'MY';
      else if (/Thailand|Thai/i.test(p.description)) country = 'TH';
      else if (/France|French/i.test(p.description)) country = 'FR';
      else if (/Italy|Italian/i.test(p.description)) country = 'IT';
    }

    if (country) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ country_of_origin: country })
        .eq('id', p.id);
      if (!error) countryFixed++;
    }
  }
  console.log(`  ✅ country_of_origin修复: ${countryFixed.toLocaleString()} 条`);
  totalFixed += countryFixed;

  // ===== 5. 修复null country_of_origin =====
  console.log('\n=== 5. 修复null country_of_origin ===\n');
  let nullCountryFixed = 0;

  const { data: nullCountryProducts } = await supabase
    .from('ppe_products')
    .select('id, data_source, manufacturer_name')
    .is('country_of_origin', null);

  for (const p of (nullCountryProducts || [])) {
    let country = sourceToCountry[p.data_source] || null;

    if (!country && p.manufacturer_name) {
      for (const rule of mfrCountryRules) {
        if (rule.pattern.test(p.manufacturer_name)) {
          country = rule.country;
          break;
        }
      }
    }

    if (country) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ country_of_origin: country })
        .eq('id', p.id);
      if (!error) nullCountryFixed++;
    }
  }
  console.log(`  ✅ null country_of_origin修复: ${nullCountryFixed.toLocaleString()} 条`);
  totalFixed += nullCountryFixed;

  // ===== 6. 清理"其他"中更多非PPE =====
  console.log('\n=== 6. 清理"其他"中更多非PPE ===\n');
  let nonPPERemoved = 0;

  const additionalNonPPE = [
    /surgical/i,
    /implant/i,
    /catheter/i,
    /stent/i,
    /prosth/i,
    /dialy/i,
    /infusion/i,
    /ventilat/i,
    /anesthes/i,
    /diagnostic/i,
    /monitor(ing)?/i,
    /syringe/i,
    /needle/i,
    /suture/i,
    /scalpel/i,
    /forceps/i,
    /retractor/i,
    /biopsy/i,
    /endoscop/i,
    /laparoscop/i,
    /arthroscop/i,
    /orthoped/i,
    /dental/i,
    /ultrasound/i,
    /x-ray/i,
    /ct scan/i,
    /mri/i,
    /defibrillat/i,
    /pacemaker/i,
    /electrode/i,
    /cauter/i,
    /dilat/i,
    /curett/i,
    /laser/i,
    /nebuliz/i,
    /otoscop/i,
    /ophthalmoscop/i,
    /laryngoscop/i,
    /fusion system/i,
    /spinal/i,
    /bone/i,
    /plate.*fix/i,
    /screw.*fix/i,
    /transfer set/i,
    /organizer/i,
    /access blanket/i,
    /scrub brush/i,
    /snare/i,
    /prophy/i,
    /scraper/i,
    /fiber optic/i,
    /set-up/i,
    /tip assy/i,
    /gonio/i,
    /light.*surg/i,
    /hemodial/i,
    /blood/i,
    /transfusion/i,
    /disposable.*electrical/i,
    /medication/i,
    /pharmaceut/i,
    /drug/i,
    /vaccine/i,
    /antibiot/i,
  ];

  const { data: otherProducts } = await supabase
    .from('ppe_products')
    .select('id, name, description')
    .eq('category', '其他');

  const idsToDelete = [];
  for (const p of (otherProducts || [])) {
    const text = `${p.name || ''} ${p.description || ''}`;
    let isNonPPE = false;

    for (const pat of additionalNonPPE) {
      if (pat.test(text)) {
        isNonPPE = true;
        break;
      }
    }

    if (isNonPPE) {
      idsToDelete.push(p.id);
    }
  }

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

  // ===== 7. 重新分类"其他"中剩余PPE =====
  console.log('\n=== 7. 重新分类"其他"中剩余PPE ===\n');
  let reclassified = 0;

  const { data: remainingOther } = await supabase
    .from('ppe_products')
    .select('id, name, description, subcategory')
    .eq('category', '其他');

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

  for (const p of (remainingOther || [])) {
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

  // ===== 8. 修复subcategory为null的记录 =====
  console.log('\n=== 8. 修复subcategory为null ===\n');
  let subFixed = 0;

  const { data: nullSubProducts } = await supabase
    .from('ppe_products')
    .select('id, name, category')
    .is('subcategory', null);

  const categoryToSub = {
    '呼吸防护装备': 'Mask/Respirator',
    '手部防护装备': 'Glove',
    '身体防护装备': 'Protective Garment',
    '眼面部防护装备': 'Face/Eye Protection',
    '头部防护装备': 'Head Protection',
    '足部防护装备': 'Foot Protection',
    '其他': 'General PPE',
  };

  for (const p of (nullSubProducts || [])) {
    const sub = categoryToSub[p.category] || 'Other';
    const { error } = await supabase
      .from('ppe_products')
      .update({ subcategory: sub })
      .eq('id', p.id);
    if (!error) subFixed++;
  }
  console.log(`  ✅ subcategory修复: ${subFixed.toLocaleString()} 条`);
  totalFixed += subFixed;

  // ===== 最终统计 =====
  console.log('\n============================================================');
  console.log('  深度优化 v8 结果汇总');
  console.log('============================================================\n');

  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: unknownCountryCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', 'Unknown');
  const { count: nullCountryCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('country_of_origin', null);
  const { count: otherCat } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  const { count: nullCode } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: nullSubCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('subcategory', null);
  const { count: nullRisk } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('risk_level', null);

  const t = totalProducts || 1;
  console.log(`  总修复: ${totalFixed.toLocaleString()} 条`);
  console.log(`  产品总数: ${totalProducts?.toLocaleString()}`);
  console.log(`  制造商总数: ${totalManufacturers?.toLocaleString()}`);
  console.log(`  manufacturer_name缺失: ${nullMfr?.toLocaleString()} (${((nullMfr || 0) / t * 100).toFixed(1)}%)`);
  console.log(`  country_of_origin问题: ${((unknownCountryCount || 0) + (nullCountryCount || 0)).toLocaleString()} (${(((unknownCountryCount || 0) + (nullCountryCount || 0)) / t * 100).toFixed(1)}%)`);
  console.log(`  "其他"分类: ${otherCat?.toLocaleString()} (${((otherCat || 0) / t * 100).toFixed(1)}%)`);
  console.log(`  product_code缺失: ${nullCode?.toLocaleString()} (${((nullCode || 0) / t * 100).toFixed(1)}%)`);
  console.log(`  subcategory缺失: ${nullSubCount?.toLocaleString()} (${((nullSubCount || 0) / t * 100).toFixed(1)}%)`);
  console.log(`  risk_level缺失: ${nullRisk?.toLocaleString()} (${((nullRisk || 0) / t * 100).toFixed(1)}%)`);
}

main().catch(console.error);
