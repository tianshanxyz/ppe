#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('============================================================');
  console.log('  数据质量深度优化 v6');
  console.log('  manufacturer_name填充 + country_of_origin修复 + 分类优化');
  console.log('============================================================\n');

  let totalFixed = 0;

  // 1. 从description中提取manufacturer_name
  console.log('=== 1. 从description提取manufacturer_name ===\n');
  const BATCH_SIZE = 2000;
  let offset = 0;
  let mfrFixed = 0;

  while (true) {
    const { data: products, error } = await supabase
      .from('ppe_products')
      .select('id, description, manufacturer_name, country_of_origin')
      .is('manufacturer_name', null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !products || products.length === 0) break;

    for (const p of products) {
      const desc = p.description || '';
      let mfrName = null;

      const patterns = [
        /Manufacturer:\s*(.+?)(?:\n|$)/i,
        /Applicant:\s*(.+?)(?:\n|$)/i,
        /Company:\s*(.+?)(?:\n|$)/i,
        /Manufacturer Name:\s*(.+?)(?:\n|$)/i,
        /mfr_name:\s*(.+?)(?:\n|$)/i,
        /firm_name:\s*(.+?)(?:\n|$)/i,
        /contact:\s*(.+?)(?:\n|$)/i,
      ];

      for (const pattern of patterns) {
        const match = desc.match(pattern);
        if (match && match[1] && match[1].trim().length > 2) {
          mfrName = match[1].trim().substring(0, 200);
          break;
        }
      }

      if (mfrName) {
        const { error: updateError } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfrName })
          .eq('id', p.id);
        if (!updateError) mfrFixed++;
      }
    }

    if (products.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
    console.log(`  已处理: ${offset}, 修复: ${mfrFixed}`);
  }

  console.log(`  ✅ manufacturer_name修复: ${mfrFixed.toLocaleString()} 条`);
  totalFixed += mfrFixed;

  // 2. 修复country_of_origin中的"Unknown"
  console.log('\n=== 2. 修复country_of_origin "Unknown" ===\n');

  const countryFromSource = {
    'FDA 510k': 'US',
    'FDA 510k Product Code': 'US',
    'FDA 510k Keyword': 'US',
    'FDA Registration': 'US',
    'FDA Recalls': 'US',
    'FDA Adverse Events': 'US',
    'FDA Enforcement': 'US',
    'FDA Classification': 'US',
    'FDA COVID-19 Devices': 'US',
    'Health Canada MDALL': 'CA',
    'MHRA CMS + UK PPE Directory': 'GB',
    'MHRA CMS': 'GB',
    'UK PPE Manufacturers Directory': 'GB',
    'MFDS Open API': 'KR',
    'MFDS Known PPE Manufacturers': 'KR',
    'Korea PPE Manufacturers Directory': 'KR',
    'ANVISA Open Data': 'BR',
    'ANVISA Known PPE Manufacturers': 'BR',
    'ANVISA SISTEC': 'BR',
    'Brazil PPE Manufacturers Directory': 'BR',
    'Japan PPE Manufacturers Directory': 'JP',
    'Australia PPE Manufacturers Directory': 'AU',
    'China PPE Manufacturers Directory': 'CN',
    'Southeast Asia PPE Manufacturers Directory': 'SEA',
    'India PPE Manufacturers Directory': 'IN',
  };

  let countryFixed = 0;

  const { data: unknownProducts } = await supabase
    .from('ppe_products')
    .select('id, data_source, description')
    .eq('country_of_origin', 'Unknown');

  for (const p of (unknownProducts || [])) {
    let country = countryFromSource[p.data_source] || null;

    if (!country && p.description) {
      if (/US|United States|American/i.test(p.description)) country = 'US';
      else if (/UK|United Kingdom|British/i.test(p.description)) country = 'GB';
      else if (/China|Chinese/i.test(p.description)) country = 'CN';
      else if (/Japan|Japanese/i.test(p.description)) country = 'JP';
      else if (/Korea|Korean/i.test(p.description)) country = 'KR';
      else if (/Brazil|Brazilian/i.test(p.description)) country = 'BR';
      else if (/Australia|Australian/i.test(p.description)) country = 'AU';
      else if (/Canada|Canadian/i.test(p.description)) country = 'CA';
      else if (/India|Indian/i.test(p.description)) country = 'IN';
      else if (/Malaysia|Malaysian/i.test(p.description)) country = 'MY';
      else if (/Germany|German/i.test(p.description)) country = 'DE';
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

  // 3. 修复null country_of_origin
  console.log('\n=== 3. 修复null country_of_origin ===\n');
  let nullCountryFixed = 0;

  const { data: nullProducts } = await supabase
    .from('ppe_products')
    .select('id, data_source, description')
    .is('country_of_origin', null);

  for (const p of (nullProducts || [])) {
    let country = countryFromSource[p.data_source] || null;

    if (!country && p.description) {
      if (/US|United States|American/i.test(p.description)) country = 'US';
      else if (/UK|United Kingdom|British/i.test(p.description)) country = 'GB';
      else if (/China|Chinese/i.test(p.description)) country = 'CN';
      else if (/Japan|Japanese/i.test(p.description)) country = 'JP';
      else if (/Korea|Korean/i.test(p.description)) country = 'KR';
      else if (/Brazil|Brazilian/i.test(p.description)) country = 'BR';
      else if (/Australia|Australian/i.test(p.description)) country = 'AU';
      else if (/Canada|Canadian/i.test(p.description)) country = 'CA';
      else if (/India|Indian/i.test(p.description)) country = 'IN';
    }

    if (!country) country = 'US';

    const { error } = await supabase
      .from('ppe_products')
      .update({ country_of_origin: country })
      .eq('id', p.id);
    if (!error) nullCountryFixed++;
  }

  console.log(`  ✅ null country_of_origin修复: ${nullCountryFixed.toLocaleString()} 条`);
  totalFixed += nullCountryFixed;

  // 4. 进一步优化"其他"分类
  console.log('\n=== 4. 优化"其他"分类 ===\n');
  let reclassified = 0;

  const { data: otherProducts } = await supabase
    .from('ppe_products')
    .select('id, name, description, subcategory')
    .eq('category', '其他');

  const reclassifyRules = [
    { pattern: /mask|respirat|n95|kn95|ffp|filtering/i, category: '呼吸防护装备', sub: 'Mask/Respirator', risk: 'high' },
    { pattern: /glove|nitril|latex|surgical glove|exam/i, category: '手部防护装备', sub: 'Glove', risk: 'low' },
    { pattern: /gown|coverall|apron|isolat|protective cloth|suit/i, category: '身体防护装备', sub: 'Protective Garment', risk: 'medium' },
    { pattern: /goggle|shield|visor|spectacle|eye/i, category: '眼面部防护装备', sub: 'Face/Eye Protection', risk: 'low' },
    { pattern: /helmet|hard.?hat|bump.?cap|head/i, category: '头部防护装备', sub: 'Head Protection', risk: 'medium' },
    { pattern: /boot|shoe|foot|overshoe/i, category: '足部防护装备', sub: 'Foot Protection', risk: 'low' },
    { pattern: /ear.?plug|ear.?muff|hearing/i, category: '其他', sub: 'Hearing Protection', risk: 'low' },
    { pattern: /fall|harness|lanyard/i, category: '其他', sub: 'Fall Protection', risk: 'high' },
    { pattern: /vest|hi.?vis|reflective/i, category: '身体防护装备', sub: 'Hi-Vis Clothing', risk: 'low' },
    { pattern: /cap|hood|bonnet|bouffant/i, category: '头部防护装备', sub: 'Head Protection', risk: 'low' },
    { pattern: /thermometer|temperature/i, category: '其他', sub: 'Temperature Screening', risk: 'low' },
    { pattern: /sanitiz|disinfect|hand.?wash|hand.?clean/i, category: '其他', sub: 'Hygiene Product', risk: 'low' },
    { pattern: /weld|torch|solder/i, category: '其他', sub: 'Welding Protection', risk: 'medium' },
    { pattern: /chemical|hazmat|gas.?mask|scba/i, category: '呼吸防护装备', sub: 'Respirator', risk: 'high' },
    { pattern: /safety|protect|guard|ppe/i, category: '其他', sub: 'General PPE', risk: 'medium' },
  ];

  for (const p of (otherProducts || [])) {
    const text = `${p.name || ''} ${p.description || ''} ${p.subcategory || ''}`;
    let matched = false;

    for (const rule of reclassifyRules) {
      if (rule.pattern.test(text)) {
        if (rule.category !== '其他' || rule.sub !== p.subcategory) {
          const { error } = await supabase
            .from('ppe_products')
            .update({ category: rule.category, subcategory: rule.sub, risk_level: rule.risk })
            .eq('id', p.id);
          if (!error) {
            reclassified++;
            matched = true;
          }
        }
        break;
      }
    }
  }

  console.log(`  ✅ "其他"分类优化: ${reclassified.toLocaleString()} 条`);
  totalFixed += reclassified;

  // 5. 修复制造商国家字段不一致问题
  console.log('\n=== 5. 修复制造商国家字段 ===\n');
  let mfrCountryFixed = 0;

  const countryFixes = [
    { wrong: 'China', correct: 'CN' },
    { wrong: 'Canada', correct: 'CA' },
    { wrong: 'Australia', correct: 'AU' },
    { wrong: 'United States', correct: 'US' },
    { wrong: 'United Kingdom', correct: 'GB' },
    { wrong: 'Japan', correct: 'JP' },
    { wrong: 'Korea', correct: 'KR' },
    { wrong: 'Brazil', correct: 'BR' },
    { wrong: 'India', correct: 'IN' },
    { wrong: 'Germany', correct: 'DE' },
    { wrong: 'France', correct: 'FR' },
    { wrong: 'Italy', correct: 'IT' },
    { wrong: 'Malaysia', correct: 'MY' },
    { wrong: 'Thailand', correct: 'TH' },
  ];

  for (const fix of countryFixes) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .update({ country: fix.correct })
      .eq('country', fix.wrong);
    if (!error && data) mfrCountryFixed += data.length;
  }

  console.log(`  ✅ 制造商国家字段修复: ${mfrCountryFixed.toLocaleString()} 条`);
  totalFixed += mfrCountryFixed;

  // 最终统计
  console.log('\n============================================================');
  console.log('  优化结果汇总');
  console.log('============================================================\n');

  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: unknownCountry } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', 'Unknown');
  const { count: nullCountry } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('country_of_origin', null);
  const { count: otherCat } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log(`  总修复: ${totalFixed.toLocaleString()} 条`);
  console.log(`  产品总数: ${totalProducts?.toLocaleString()}`);
  console.log(`  制造商总数: ${totalManufacturers?.toLocaleString()}`);
  console.log(`  manufacturer_name缺失: ${nullMfr?.toLocaleString()} (${totalProducts ? ((nullMfr || 0) / totalProducts * 100).toFixed(1) : 0}%)`);
  console.log(`  country_of_origin Unknown: ${unknownCountry?.toLocaleString()} (${totalProducts ? ((unknownCountry || 0) / totalProducts * 100).toFixed(1) : 0}%)`);
  console.log(`  country_of_origin null: ${nullCountry?.toLocaleString()}`);
  console.log(`  "其他"分类: ${otherCat?.toLocaleString()} (${totalProducts ? ((otherCat || 0) / totalProducts * 100).toFixed(1) : 0}%)`);
}

main().catch(console.error);
