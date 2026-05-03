#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fetchAll(table, columns, batchSize = 1000) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * batchSize, (page + 1) * batchSize - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

async function analyze() {
  console.log('========================================');
  console.log('全球PPE数据覆盖情况全面核查');
  console.log('========================================');

  const products = await fetchAll('ppe_products', 'id,name,category,country_of_origin,data_source,manufacturer_name,product_code,risk_level,registration_authority');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,data_source');
  const regulations = await fetchAll('ppe_regulations', 'id,name,region');

  console.log(`\n=== 基本统计 ===`);
  console.log(`产品: ${products.length}`);
  console.log(`制造商: ${manufacturers.length}`);
  console.log(`法规: ${regulations.length}`);

  // Country distribution
  console.log(`\n=== 国家/地区分布 ===`);
  const countryStats = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
  });
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / products.length * 100).toFixed(1)}%)`);
  });

  // Data source distribution
  console.log(`\n=== 数据来源分布 ===`);
  const srcStats = {};
  products.forEach(p => {
    const s = p.data_source || 'Unknown';
    srcStats[s] = (srcStats[s] || 0) + 1;
  });
  Object.entries(srcStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / products.length * 100).toFixed(1)}%)`);
  });

  // Category distribution
  console.log(`\n=== 类别分布 ===`);
  const catStats = {};
  products.forEach(p => {
    const c = p.category || 'Unknown';
    catStats[c] = (catStats[c] || 0) + 1;
  });
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / products.length * 100).toFixed(1)}%)`);
  });

  // Field completeness
  console.log(`\n=== 字段完整性 ===`);
  const fields = ['name', 'category', 'manufacturer_name', 'product_code', 'country_of_origin', 'risk_level', 'data_source', 'registration_authority'];
  fields.forEach(f => {
    const filled = products.filter(p => p[f] && p[f] !== 'Unknown' && p[f] !== 'null' && p[f] !== '').length;
    console.log(`  ${f}: ${filled}/${products.length} (${(filled / products.length * 100).toFixed(1)}%)`);
  });

  // Risk level distribution
  console.log(`\n=== 风险等级分布 ===`);
  const riskStats = {};
  products.forEach(p => {
    const r = p.risk_level || 'Unknown';
    riskStats[r] = (riskStats[r] || 0) + 1;
  });
  Object.entries(riskStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v / products.length * 100).toFixed(1)}%)`);
  });

  // Global coverage assessment
  console.log(`\n=== 全球PPE数据覆盖评估 ===`);
  const globalRegions = {
    'US - 美国 (FDA)': { code: 'US', expected: '50000+' },
    'EU - 欧盟 (EUDAMED)': { code: 'EU', expected: '30000+' },
    'CN - 中国 (NMPA)': { code: 'CN', expected: '20000+' },
    'JP - 日本 (PMDA)': { code: 'JP', expected: '5000+' },
    'KR - 韩国 (MFDS)': { code: 'KR', expected: '3000+' },
    'CA - 加拿大 (Health Canada)': { code: 'CA', expected: '10000+' },
    'AU - 澳大利亚 (TGA)': { code: 'AU', expected: '5000+' },
    'GB - 英国 (MHRA)': { code: 'GB', expected: '5000+' },
    'BR - 巴西 (ANVISA)': { code: 'BR', expected: '5000+' },
    'IN - 印度 (CDSCO)': { code: 'IN', expected: '3000+' },
    'SA - 沙特 (SFDA)': { code: 'SA', expected: '1000+' },
    'PH - 菲律宾 (FDA)': { code: 'PH', expected: '500+' },
  };

  Object.entries(globalRegions).forEach(([name, info]) => {
    const count = products.filter(p => p.country_of_origin === info.code).length;
    const status = count > 100 ? '✅' : (count > 0 ? '⚠️' : '❌');
    console.log(`  ${status} ${name}: ${count} 条 (预期: ${info.expected})`);
  });

  // Sample "其他" category products
  console.log(`\n=== "其他"类别样本 (前20条) ===`);
  const otherProducts = products.filter(p => p.category === '其他');
  otherProducts.slice(0, 20).forEach(p => {
    console.log(`  ${p.name?.substring(0, 80)} | ${p.country_of_origin} | ${p.data_source}`);
  });

  // Manufacturer country distribution
  console.log(`\n=== 制造商国家分布 ===`);
  const mfrCountryStats = {};
  manufacturers.forEach(m => {
    const c = m.country || 'Unknown';
    mfrCountryStats[c] = (mfrCountryStats[c] || 0) + 1;
  });
  Object.entries(mfrCountryStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  // Regulations coverage
  console.log(`\n=== 法规覆盖 ===`);
  const regRegionStats = {};
  regulations.forEach(r => {
    const c = r.region || 'Unknown';
    regRegionStats[c] = (regRegionStats[c] || 0) + 1;
  });
  Object.entries(regRegionStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });
}

analyze().catch(console.error);
