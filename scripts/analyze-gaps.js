#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('=== 分析缺失manufacturer_name的产品 ===\n');

  const { data: products } = await supabase
    .from('ppe_products')
    .select('id, name, description, data_source, category, product_code, country_of_origin')
    .is('manufacturer_name', null)
    .limit(5000);

  if (!products) { console.log('无数据'); return; }

  const sourceCounts = {};
  const categoryCounts = {};
  const countryCounts = {};
  const hasDesc = { yes: 0, no: 0 };
  const hasProductCode = { yes: 0, no: 0 };
  const descMfrPattern = { yes: 0, no: 0 };

  for (const p of products) {
    sourceCounts[p.data_source || 'null'] = (sourceCounts[p.data_source || 'null'] || 0) + 1;
    categoryCounts[p.category || 'null'] = (categoryCounts[p.category || 'null'] || 0) + 1;
    countryCounts[p.country_of_origin || 'null'] = (countryCounts[p.country_of_origin || 'null'] || 0) + 1;

    if (p.description && p.description.length > 10) hasDesc.yes++;
    else hasDesc.no++;

    if (p.product_code) hasProductCode.yes++;
    else hasProductCode.no++;

    if (p.description && /manufacturer|applicant|company|firm|owner|operator|contact:/i.test(p.description)) {
      descMfrPattern.yes++;
    } else {
      descMfrPattern.no++;
    }
  }

  console.log('数据来源分布:');
  Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / products.length * 100).toFixed(1)}%)`);
  });

  console.log('\n分类分布:');
  Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / products.length * 100).toFixed(1)}%)`);
  });

  console.log('\n国家分布:');
  Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  console.log(`\n有描述: ${hasDesc.yes}, 无描述: ${hasDesc.no}`);
  console.log(`有product_code: ${hasProductCode.yes}, 无: ${hasProductCode.no}`);
  console.log(`描述含制造商关键词: ${descMfrPattern.yes}, 不含: ${descMfrPattern.no}`);

  console.log('\n=== 分析Unknown country_of_origin的产品 ===\n');

  const { data: unknownCountry } = await supabase
    .from('ppe_products')
    .select('id, data_source, description')
    .eq('country_of_origin', 'Unknown')
    .limit(3000);

  if (unknownCountry) {
    const ucSource = {};
    for (const p of unknownCountry) {
      ucSource[p.data_source || 'null'] = (ucSource[p.data_source || 'null'] || 0) + 1;
    }
    console.log('Unknown country数据来源:');
    Object.entries(ucSource).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`  ${k}: ${v}`);
    });
  }

  console.log('\n=== 分析"其他"分类的产品 ===\n');

  const { data: otherProducts } = await supabase
    .from('ppe_products')
    .select('id, name, subcategory, description')
    .eq('category', '其他')
    .limit(5000);

  if (otherProducts) {
    const subCounts = {};
    const nameSamples = [];
    for (const p of otherProducts) {
      subCounts[p.subcategory || 'null'] = (subCounts[p.subcategory || 'null'] || 0) + 1;
      if (nameSamples.length < 30) nameSamples.push(p.name);
    }
    console.log('子分类分布:');
    Object.entries(subCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`  ${k}: ${v}`);
    });
    console.log('\n产品名称样本:');
    nameSamples.forEach(n => console.log(`  - ${n}`));
  }
}

main().catch(console.error);
