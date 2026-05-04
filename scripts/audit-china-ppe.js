#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function audit() {
  // 1. Overall stats
  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrTotal } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log('========================================');
  console.log('PPE数据库全面审计报告');
  console.log('========================================');
  console.log(`总产品数: ${total}`);
  console.log(`总制造商数: ${mfrTotal}`);

  // 2. China-related: by country_of_origin = CN
  const { data: cnProducts, count: cnCount } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: false })
    .eq('country_of_origin', 'CN');
  console.log(`\n=== 中国(CN)产品: ${cnCount}条 ===`);

  // 3. China by data_source
  const { data: allCn } = await supabase.from('ppe_products')
    .select('data_source, category, risk_level, name, manufacturer_name, product_code')
    .eq('country_of_origin', 'CN');

  const cnSourceCounts = {};
  const cnCategoryCounts = {};
  const cnRiskCounts = {};
  (allCn || []).forEach(p => {
    cnSourceCounts[p.data_source || '(null)'] = (cnSourceCounts[p.data_source || '(null)'] || 0) + 1;
    cnCategoryCounts[p.category || '(null)'] = (cnCategoryCounts[p.category || '(null)'] || 0) + 1;
    cnRiskCounts[p.risk_level || '(null)'] = (cnRiskCounts[p.risk_level || '(null)'] || 0) + 1;
  });

  console.log('\n中国产品 - 按数据源:');
  Object.entries(cnSourceCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n中国产品 - 按类别:');
  Object.entries(cnCategoryCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\n中国产品 - 按风险等级:');
  Object.entries(cnRiskCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // 4. Sample China products
  console.log('\n中国产品样本 (20条):');
  (allCn || []).slice(0, 20).forEach(p => {
    console.log(`  ${(p.name || '').substring(0, 60)} | ${p.category} | ${(p.manufacturer_name || '').substring(0, 35)} | ${p.data_source}`);
  });

  // 5. China manufacturers
  const { data: cnManufacturers } = await supabase.from('ppe_manufacturers')
    .select('*')
    .eq('country', 'CN');
  console.log(`\n=== 中国制造商: ${(cnManufacturers || []).length}家 ===`);
  (cnManufacturers || []).slice(0, 15).forEach(m => {
    console.log(`  ${(m.name || '').substring(0, 50)} | ${m.data_source} | 置信度:${m.data_confidence_level}`);
  });

  // 6. NMPA-specific
  const { data: nmpaProducts } = await supabase.from('ppe_products')
    .select('name, category, manufacturer_name, country_of_origin, risk_level, product_code')
    .or('data_source.eq.NMPA,data_source.eq.NMPA China')
    .limit(50);
  console.log(`\n=== NMPA数据源产品: ${(nmpaProducts || []).length}条 ===`);
  (nmpaProducts || []).forEach(p => {
    console.log(`  ${(p.name || '').substring(0, 60)} | ${p.category} | ${(p.manufacturer_name || '').substring(0, 30)} | ${p.country_of_origin}`);
  });

  // 7. NMPA but non-China
  const { data: nmpaNonChina } = await supabase.from('ppe_products')
    .select('name, country_of_origin')
    .or('data_source.eq.NMPA,data_source.eq.NMPA China')
    .neq('country_of_origin', 'CN')
    .limit(20);
  console.log(`\n=== NMPA数据源但非中国产品: ${(nmpaNonChina || []).length}条 ===`);
  (nmpaNonChina || []).forEach(p => {
    console.log(`  ${(p.name || '').substring(0, 50)} | ${p.country_of_origin}`);
  });

  // 8. All categories
  const { data: allCategories } = await supabase.from('ppe_products').select('category');
  const globalCatCounts = {};
  (allCategories || []).forEach(p => { globalCatCounts[p.category] = (globalCatCounts[p.category] || 0) + 1; });
  console.log('\n全数据库 - 按类别:');
  Object.entries(globalCatCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // 9. All countries
  const { data: allCountries } = await supabase.from('ppe_products').select('country_of_origin');
  const countryMap = {};
  (allCountries || []).forEach(p => { countryMap[p.country_of_origin] = (countryMap[p.country_of_origin] || 0) + 1; });
  console.log('\n全数据库 - 按国家 (Top 25):');
  Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // 10. All data sources
  const { data: allSources } = await supabase.from('ppe_products').select('data_source');
  const sourceMap = {};
  (allSources || []).forEach(p => { sourceMap[p.data_source] = (sourceMap[p.data_source] || 0) + 1; });
  console.log('\n全数据库 - 按数据源:');
  Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // 11. Data confidence levels
  const { data: confLevels } = await supabase.from('ppe_products').select('data_confidence_level');
  const confMap = {};
  (confLevels || []).forEach(p => { confMap[p.data_confidence_level] = (confMap[p.data_confidence_level] || 0) + 1; });
  console.log('\n全数据库 - 按置信度:');
  Object.entries(confMap).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

audit().catch(console.error);
