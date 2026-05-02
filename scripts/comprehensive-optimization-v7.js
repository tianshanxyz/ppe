#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

async function main() {
  console.log('============================================================');
  console.log('  综合数据质量优化 v7');
  console.log('  manufacturer_name + country_of_origin + 分类清理');
  console.log('============================================================\n');

  let totalFixed = 0;

  // ===== 1. 从description提取manufacturer_name =====
  console.log('=== 1. 从description提取manufacturer_name ===\n');
  let mfrFromDesc = 0;

  const { data: nullMfrProducts } = await supabase
    .from('ppe_products')
    .select('id, description, name')
    .is('manufacturer_name', null);

  for (const p of (nullMfrProducts || [])) {
    const desc = p.description || '';
    let mfrName = null;

    const patterns = [
      /Manufacturer:\s*(.+?)(?:\n|$)/i,
      /Applicant:\s*(.+?)(?:\n|$)/i,
      /Company:\s*(.+?)(?:\n|$)/i,
      /Firm:\s*(.+?)(?:\n|$)/i,
      /Owner\/Operator:\s*(.+?)(?:\n|$)/i,
      /contact:\s*(.+?)(?:\n|$)/i,
      /mfr_name:\s*(.+?)(?:\n|$)/i,
      /firm_name:\s*(.+?)(?:\n|$)/i,
    ];

    for (const pat of patterns) {
      const m = desc.match(pat);
      if (m && m[1] && m[1].trim().length > 2 && m[1].trim().length < 200) {
        mfrName = m[1].trim();
        break;
      }
    }

    if (!mfrName) {
      const bracketMatch = desc.match(/\[([A-Z]{2})\]/);
      if (bracketMatch) {
        const beforeBracket = desc.substring(0, desc.indexOf('[')).trim();
        if (beforeBracket.length > 2 && beforeBracket.length < 200) {
          const nameParts = beforeBracket.split('\n').filter(s => s.trim().length > 2);
          if (nameParts.length > 0) {
            const candidate = nameParts[nameParts.length - 1].trim();
            if (/ltd|inc|corp|gmbh|co\.|llc|plc|srl|b\.v\.|ag|sa|nv/i.test(candidate)) {
              mfrName = candidate;
            }
          }
        }
      }
    }

    if (mfrName) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: mfrName.substring(0, 200) })
        .eq('id', p.id);
      if (!error) mfrFromDesc++;
    }
  }
  console.log(`  ✅ description提取: ${mfrFromDesc.toLocaleString()} 条`);
  totalFixed += mfrFromDesc;

  // ===== 2. FDA 510k API补充manufacturer_name =====
  console.log('\n=== 2. FDA 510k API补充manufacturer_name ===\n');
  let mfrFromFDA = 0;
  let fdaProcessed = 0;

  const { data: fdaNullMfr } = await supabase
    .from('ppe_products')
    .select('id, name, product_code')
    .is('manufacturer_name', null)
    .in('data_source', ['FDA 510(k) Database', 'FDA 510(k) Database / EUDAMED / NMPA']);

  for (const p of (fdaNullMfr || [])) {
    fdaProcessed++;
    let mfrName = null;

    const searchTerms = [];
    if (p.product_code) searchTerms.push(p.product_code);
    if (p.name && p.name.length > 3 && p.name !== 'Unknown') searchTerms.push(p.name.substring(0, 50));

    for (const term of searchTerms.slice(0, 2)) {
      try {
        const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=${encodeURIComponent(term)}&limit=3`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) continue;
        const data = await resp.json();
        if (data.results && data.results[0]) {
          mfrName = data.results[0].applicant || data.results[0].contact || null;
          if (mfrName) break;
        }
      } catch (e) { continue; }
    }

    if (mfrName) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: mfrName.substring(0, 200) })
        .eq('id', p.id);
      if (!error) mfrFromFDA++;
    }

    if (fdaProcessed % 50 === 0) {
      console.log(`  FDA处理: ${fdaProcessed}, 修复: ${mfrFromFDA}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`  ✅ FDA API补充: ${mfrFromFDA.toLocaleString()} 条 (处理${fdaProcessed})`);
  totalFixed += mfrFromFDA;

  // ===== 3. Health Canada MDALL API补充manufacturer_name =====
  console.log('\n=== 3. Health Canada MDALL API补充manufacturer_name ===\n');
  let mfrFromHC = 0;
  let hcProcessed = 0;

  const { data: hcNullMfr } = await supabase
    .from('ppe_products')
    .select('id, name, product_code, model')
    .is('manufacturer_name', null)
    .eq('data_source', 'Health Canada MDALL');

  for (const p of (hcNullMfr || [])) {
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

  const { data: nmpaNullMfr } = await supabase
    .from('ppe_products')
    .select('id, name, description')
    .is('manufacturer_name', null)
    .eq('data_source', 'NMPA');

  for (const p of (nmpaNullMfr || [])) {
    let mfrName = null;
    const desc = p.description || '';

    const cnPatterns = [
      /生产企业[：:]\s*(.+?)(?:\n|$)/,
      /制造商[：:]\s*(.+?)(?:\n|$)/,
      /Manufacturer:\s*(.+?)(?:\n|$)/i,
      /公司[：:]\s*(.+?)(?:\n|$)/,
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

  // ===== 5. 修复country_of_origin Unknown =====
  console.log('\n=== 5. 修复country_of_origin Unknown ===\n');
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
    'MFDS Open API': 'KR',
    'MFDS Known PPE Manufacturers': 'KR',
    'ANVISA Open Data': 'BR',
    'ANVISA Known PPE Manufacturers': 'BR',
    'Japan PPE Manufacturers Directory': 'JP',
    'Australia PPE Manufacturers Directory': 'AU',
    'China PPE Manufacturers Directory': 'CN',
    'Southeast Asia PPE Manufacturers Directory': 'MY',
    'India PPE Manufacturers Directory': 'IN',
  };

  const mfrToCountry = [
    { pattern: /3M/i, country: 'US' },
    { pattern: /Honeywell/i, country: 'US' },
    { pattern: /Ansell/i, country: 'AU' },
    { pattern: /Kimberly.?Clark/i, country: 'US' },
    { pattern: /Cardinal.?Health/i, country: 'US' },
    { pattern: /Medline/i, country: 'US' },
    { pattern: /Mölnlycke|molnlycke/i, country: 'SE' },
    { pattern: /DuPont/i, country: 'US' },
    { pattern: /Lakeland/i, country: 'US' },
    { pattern: /MSA/i, country: 'US' },
    { pattern: /Dräger|draeger/i, country: 'DE' },
    { pattern: /Bollé|bolle/i, country: 'FR' },
    { pattern: /JSP/i, country: 'GB' },
    { pattern: /Karam/i, country: 'IN' },
    { pattern: /Mallcom/i, country: 'IN' },
    { pattern: /Venus/i, country: 'IN' },
    { pattern: /Zhende/i, country: 'CN' },
    { pattern: /Winner/i, country: 'CN' },
    { pattern: /Blue.?Sail/i, country: 'CN' },
    { pattern: /Intco/i, country: 'CN' },
    { pattern: /Top.?Glove/i, country: 'MY' },
    { pattern: /Hartalega/i, country: 'MY' },
    { pattern: /Kossan/i, country: 'MY' },
    { pattern: /Supermax/i, country: 'MY' },
    { pattern: /Sri.?Trang/i, country: 'TH' },
    { pattern: /Alpha.?Solway/i, country: 'GB' },
    { pattern: /Moldex/i, country: 'DE' },
    { pattern: /Bullard/i, country: 'US' },
  ];

  for (const p of (unknownCountry || [])) {
    let country = sourceToCountry[p.data_source] || null;

    if (!country && p.manufacturer_name) {
      for (const rule of mfrToCountry) {
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

  // ===== 6. 清理"其他"分类中的非PPE产品 =====
  console.log('\n=== 6. 清理"其他"分类中的非PPE产品 ===\n');
  let nonPPERemoved = 0;

  const nonPPEPatterns = [
    /surgical instrument/i,
    /implant/i,
    /catheter/i,
    /stent/i,
    /pacemaker/i,
    /defibrillator/i,
    /endoscope/i,
    /laparoscop/i,
    /arthroscop/i,
    /prosth/i,
    /dialy/i,
    /hemodial/i,
    /infusion pump/i,
    /ventilator/i,
    /anesthes/i,
    /electrode/i,
    /ultrasound/i,
    /x-ray|xray/i,
    /ct scan|mri/i,
    /diagnostic/i,
    /monitor(ing)?\s*(system|device|equipment)/i,
    /syringe/i,
    /needle/i,
    /blood.*transfusion/i,
    /suture/i,
    /scalpel/i,
    /forceps/i,
    /retractor/i,
    /clamp/i,
    /curett/i,
    /dilat/i,
    /biopsy/i,
    /cauter/i,
    /laser.*surg/i,
    /nebulizer/i,
    /aspirat.*surg/i,
    /laryngoscop/i,
    /otoscope/i,
    /ophthalmoscop/i,
    /fusion system/i,
    /spinal.*system/i,
    /orthoped/i,
    /dental/i,
    /bone.*screw/i,
    /plate.*fix/i,
    /organizer.*surg/i,
    /transfer set/i,
    /scrub brush/i,
    /snare.*surg/i,
    /access blanket/i,
    /gonio/i,
    /light.*surg/i,
    /set-up/i,
    /tip assy/i,
    /prophy angle/i,
    /cervical scraper/i,
    /medication transfer/i,
    /fiber optic/i,
    /disposable.*electrical/i,
  ];

  const { data: otherProducts } = await supabase
    .from('ppe_products')
    .select('id, name, description')
    .eq('category', '其他');

  const idsToDelete = [];
  for (const p of (otherProducts || [])) {
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

  // ===== 7. 重新分类"其他"中的PPE产品 =====
  console.log('\n=== 7. 重新分类"其他"中的PPE产品 ===\n');
  let reclassified = 0;

  const { data: remainingOther } = await supabase
    .from('ppe_products')
    .select('id, name, description, subcategory')
    .eq('category', '其他');

  const reclassifyRules = [
    { pattern: /mask|respirat|n95|kn95|ffp|filtering face|p2|p3/i, category: '呼吸防护装备', sub: 'Mask/Respirator', risk: 'high' },
    { pattern: /glove|nitril|latex|surgical glove|exam.*glove/i, category: '手部防护装备', sub: 'Glove', risk: 'low' },
    { pattern: /gown|coverall|apron|isolat|protective cloth|suit|bouffant/i, category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
    { pattern: /goggle|shield|visor|spectacle|eye.*protect/i, category: '眼面部防护装备', sub: 'Face/Eye Protection', risk: 'low' },
    { pattern: /helmet|hard.?hat|bump.?cap/i, category: '头部防护装备', sub: 'Head Protection', risk: 'medium' },
    { pattern: /boot|shoe|foot|overshoe/i, category: '足部防护装备', sub: 'Foot Protection', risk: 'low' },
    { pattern: /cap|hood|bonnet|head.*cover/i, category: '头部防护装备', sub: 'Head Protection', risk: 'low' },
    { pattern: /vest|hi.?vis|reflective/i, category: '身体防护装备', sub: 'Hi-Vis Clothing', risk: 'low' },
    { pattern: /ear.?plug|ear.?muff|hearing/i, category: '其他', sub: 'Hearing Protection', risk: 'low' },
    { pattern: /fall|harness|lanyard/i, category: '其他', sub: 'Fall Protection', risk: 'high' },
    { pattern: /thermometer|temperature.*screen/i, category: '其他', sub: 'Temperature Screening', risk: 'low' },
    { pattern: /sanitiz|disinfect|hand.*wash|hand.*clean/i, category: '其他', sub: 'Hygiene Product', risk: 'low' },
    { pattern: /weld|torch|solder/i, category: '其他', sub: 'Welding Protection', risk: 'medium' },
    { pattern: /chemical|hazmat|gas.?mask|scba/i, category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
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
  console.log('\n=== 8. 修复subcategory为null的记录 ===\n');
  let subFixed = 0;

  const { data: nullSub } = await supabase
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

  for (const p of (nullSub || [])) {
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
  console.log('  优化结果汇总');
  console.log('============================================================\n');

  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: totalRegulations } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: unknownCountryCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', 'Unknown');
  const { count: otherCat } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  const { count: nullSubCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('subcategory', null);

  console.log(`  总修复: ${totalFixed.toLocaleString()} 条`);
  console.log(`  产品总数: ${totalProducts?.toLocaleString()}`);
  console.log(`  制造商总数: ${totalManufacturers?.toLocaleString()}`);
  console.log(`  法规/标准: ${totalRegulations?.toLocaleString()}`);
  console.log(`  manufacturer_name缺失: ${nullMfr?.toLocaleString()} (${totalProducts ? ((nullMfr || 0) / totalProducts * 100).toFixed(1) : 0}%)`);
  console.log(`  country_of_origin Unknown: ${unknownCountryCount?.toLocaleString()} (${totalProducts ? ((unknownCountryCount || 0) / totalProducts * 100).toFixed(1) : 0}%)`);
  console.log(`  "其他"分类: ${otherCat?.toLocaleString()} (${totalProducts ? ((otherCat || 0) / totalProducts * 100).toFixed(1) : 0}%)`);
  console.log(`  subcategory null: ${nullSubCount?.toLocaleString()}`);
}

main().catch(console.error);
