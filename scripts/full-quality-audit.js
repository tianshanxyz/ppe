#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PAGE_SIZE = 1000;

async function fetchAll(table, columns) {
  const all = [];
  let page = 0;
  let hasMore = true;
  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select(columns).range(from, to);
    if (error) { console.error(`Error fetching ${table}:`, error); break; }
    if (!data || data.length === 0) { hasMore = false; break; }
    all.push(...data);
    if (data.length < PAGE_SIZE) hasMore = false;
    page++;
  }
  return all;
}

async function main() {
  console.log('========================================');
  console.log('  PPE 数据库全面质量检查');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  // 1. 基本统计
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: totalRegulations } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log('=== 1. 基本统计 ===');
  console.log(`产品总数: ${totalProducts?.toLocaleString()}`);
  console.log(`制造商总数: ${totalManufacturers?.toLocaleString()}`);
  console.log(`法规总数: ${totalRegulations?.toLocaleString()}\n`);

  // 2. 产品数据质量分析
  console.log('=== 2. 产品数据质量分析 ===');
  const products = await fetchAll('ppe_products', 'id,name,model,category,subcategory,description,manufacturer_name,country_of_origin,product_code,risk_level,data_source,registration_authority');

  // 2.1 关键字段缺失
  const nullName = products.filter(p => !p.name || p.name.trim() === '').length;
  const nullMfr = products.filter(p => !p.manufacturer_name || p.manufacturer_name.trim() === '').length;
  const nullCategory = products.filter(p => !p.category || p.category.trim() === '').length;
  const nullCountry = products.filter(p => !p.country_of_origin || p.country_of_origin.trim() === '' || p.country_of_origin === 'Unknown').length;
  const nullProductCode = products.filter(p => !p.product_code || p.product_code.trim() === '').length;
  const nullRiskLevel = products.filter(p => !p.risk_level || p.risk_level.trim() === '').length;
  const nullDataSource = products.filter(p => !p.data_source || p.data_source.trim() === '').length;
  const nullDesc = products.filter(p => !p.description || p.description.trim() === '').length;

  console.log(`名称缺失: ${nullName} (${(nullName/products.length*100).toFixed(1)}%)`);
  console.log(`制造商缺失: ${nullMfr} (${(nullMfr/products.length*100).toFixed(1)}%)`);
  console.log(`分类缺失: ${nullCategory} (${(nullCategory/products.length*100).toFixed(1)}%)`);
  console.log(`国家缺失/Unknown: ${nullCountry} (${(nullCountry/products.length*100).toFixed(1)}%)`);
  console.log(`产品代码缺失: ${nullProductCode} (${(nullProductCode/products.length*100).toFixed(1)}%)`);
  console.log(`风险等级缺失: ${nullRiskLevel} (${(nullRiskLevel/products.length*100).toFixed(1)}%)`);
  console.log(`数据来源缺失: ${nullDataSource} (${(nullDataSource/products.length*100).toFixed(1)}%)`);
  console.log(`描述缺失: ${nullDesc} (${(nullDesc/products.length*100).toFixed(1)}%)\n`);

  // 2.2 可疑数据检测 - 编造的model号
  const suspiciousModels = products.filter(p => {
    if (!p.model) return false;
    // 检测包含随机字符串模式的model号 (如 BIS-1777641529325-hcosiy)
    return /^[A-Z]+-\d+-[a-z0-9]{5,}$/.test(p.model) || 
           /^NMPA-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^BIS-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^MFDS-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^ANVISA-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^MHRA-\d+-[a-z0-9]{5,}$/.test(p.model) ||
           /^TGA-\d+-[a-z0-9]{5,}$/.test(p.model);
  });
  console.log(`可疑model号(随机生成): ${suspiciousModels.length} (${(suspiciousModels.length/products.length*100).toFixed(1)}%)`);

  // 2.3 可疑数据来源
  const dataSourceStats = {};
  products.forEach(p => {
    const src = p.data_source || 'Unknown';
    dataSourceStats[src] = (dataSourceStats[src] || 0) + 1;
  });
  console.log('\n数据来源分布:');
  Object.entries(dataSourceStats).sort((a,b) => b[1]-a[1]).forEach(([src, cnt]) => {
    const isReliable = ['FDA 510(k) Database', 'Health Canada MDALL', 'NMPA'].includes(src);
    const marker = isReliable ? '✓' : '⚠';
    console.log(`  ${marker} ${src}: ${cnt} (${(cnt/products.length*100).toFixed(1)}%)`);
  });

  // 2.4 不可靠数据来源的产品
  const unreliableSources = products.filter(p => {
    const src = p.data_source || '';
    return src.includes('Directory') || src.includes('Known PPE') || src.includes('Manufacturers Directory');
  });
  console.log(`\n来自非权威来源的产品: ${unreliableSources.length} (${(unreliableSources.length/products.length*100).toFixed(1)}%)`);

  // 2.5 重复产品检测
  const nameMfrMap = {};
  products.forEach(p => {
    const key = `${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}`;
    if (!nameMfrMap[key]) nameMfrMap[key] = [];
    nameMfrMap[key].push(p);
  });
  const duplicates = Object.entries(nameMfrMap).filter(([k, v]) => v.length > 1);
  const duplicateRecords = duplicates.reduce((sum, [k, v]) => sum + v.length - 1, 0);
  console.log(`\n重复产品组数: ${duplicates.length}`);
  console.log(`重复产品记录数: ${duplicateRecords}`);

  // 2.6 分类分布
  const categoryStats = {};
  products.forEach(p => {
    const cat = p.category || 'Unknown';
    categoryStats[cat] = (categoryStats[cat] || 0) + 1;
  });
  console.log('\n分类分布:');
  Object.entries(categoryStats).sort((a,b) => b[1]-a[1]).forEach(([cat, cnt]) => {
    console.log(`  ${cat}: ${cnt} (${(cnt/products.length*100).toFixed(1)}%)`);
  });

  // 2.7 国家分布
  const countryStats = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
  });
  console.log('\n国家分布:');
  Object.entries(countryStats).sort((a,b) => b[1]-a[1]).forEach(([c, cnt]) => {
    console.log(`  ${c}: ${cnt} (${(cnt/products.length*100).toFixed(1)}%)`);
  });

  // 3. 制造商数据质量分析
  console.log('\n=== 3. 制造商数据质量分析 ===');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,address,website,data_source');

  const nullMfrName = manufacturers.filter(m => !m.name || m.name.trim() === '').length;
  const nullMfrCountry = manufacturers.filter(m => !m.country || m.country.trim() === '').length;
  const nullMfrAddress = manufacturers.filter(m => !m.address || m.address.trim() === '').length;
  const nullMfrWebsite = manufacturers.filter(m => !m.website || m.website.trim() === '').length;
  const nullMfrSource = manufacturers.filter(m => !m.data_source || m.data_source.trim() === '').length;

  console.log(`名称缺失: ${nullMfrName} (${(nullMfrName/manufacturers.length*100).toFixed(1)}%)`);
  console.log(`国家缺失: ${nullMfrCountry} (${(nullMfrCountry/manufacturers.length*100).toFixed(1)}%)`);
  console.log(`地址缺失: ${nullMfrAddress} (${(nullMfrAddress/manufacturers.length*100).toFixed(1)}%)`);
  console.log(`网站缺失: ${nullMfrWebsite} (${(nullMfrWebsite/manufacturers.length*100).toFixed(1)}%)`);
  console.log(`数据来源缺失: ${nullMfrSource} (${(nullMfrSource/manufacturers.length*100).toFixed(1)}%)`);

  // 可疑制造商名称
  const suspiciousMfrNames = manufacturers.filter(m => {
    if (!m.name) return false;
    return m.name.startsWith('●') || 
           m.name.includes('UNITED KINGDOM') && m.name.length > 100 ||
           m.name.includes('PHARMACY') ||
           m.name.match(/^\d/);
  });
  console.log(`可疑制造商名称: ${suspiciousMfrNames.length}`);

  // 重复制造商
  const mfrNameMap = {};
  manufacturers.forEach(m => {
    const key = m.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!mfrNameMap[key]) mfrNameMap[key] = [];
    mfrNameMap[key].push(m);
  });
  const duplicateMfrs = Object.entries(mfrNameMap).filter(([k, v]) => v.length > 1);
  const duplicateMfrRecords = duplicateMfrs.reduce((sum, [k, v]) => sum + v.length - 1, 0);
  console.log(`重复制造商组数: ${duplicateMfrs.length}`);
  console.log(`重复制造商记录数: ${duplicateMfrRecords}`);

  // 4. 法规数据质量分析
  console.log('\n=== 4. 法规数据质量分析 ===');
  const regulations = await fetchAll('ppe_regulations', 'id,name,code,region,description');

  const nullRegName = regulations.filter(r => !r.name || r.name.trim() === '').length;
  const nullRegCode = regulations.filter(r => !r.code || r.code.trim() === '').length;
  const nullRegRegion = regulations.filter(r => !r.region || r.region.trim() === '').length;
  const nullRegDesc = regulations.filter(r => !r.description || r.description.trim() === '').length;

  console.log(`名称缺失: ${nullRegName} (${(nullRegName/regulations.length*100).toFixed(1)}%)`);
  console.log(`代码缺失: ${nullRegCode} (${(nullRegCode/regulations.length*100).toFixed(1)}%)`);
  console.log(`地区缺失: ${nullRegRegion} (${(nullRegRegion/regulations.length*100).toFixed(1)}%)`);
  console.log(`描述缺失: ${nullRegDesc} (${(nullRegDesc/regulations.length*100).toFixed(1)}%)`);

  // 5. 问题汇总
  console.log('\n========================================');
  console.log('  数据质量问题汇总');
  console.log('========================================');
  console.log(`1. 可疑model号(编造): ${suspiciousModels.length}`);
  console.log(`2. 非权威来源产品: ${unreliableSources.length}`);
  console.log(`3. 重复产品记录: ${duplicateRecords}`);
  console.log(`4. 可疑制造商名称: ${suspiciousMfrNames.length}`);
  console.log(`5. 重复制造商记录: ${duplicateMfrRecords}`);
  console.log(`6. 关键字段缺失(产品): 名称${nullName}, 制造商${nullMfr}, 代码${nullProductCode}`);
  console.log(`7. 国家为Unknown: ${nullCountry}`);
  
  const totalIssues = suspiciousModels.length + unreliableSources.length + duplicateRecords + 
                      suspiciousMfrNames.length + duplicateMfrRecords;
  console.log(`\n总问题记录数: ${totalIssues}`);
  console.log(`数据质量评分: ${Math.max(0, 100 - (totalIssues / products.length * 100)).toFixed(1)}/100`);
}

main().catch(console.error);
