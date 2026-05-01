#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('============================================================');
  console.log('  PPE全球数据库 - 最终数据质量报告');
  console.log('  生成时间: ' + new Date().toISOString());
  console.log('============================================================\n');

  // 1. 总体统计
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: totalRegulations } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  一、数据库总体统计');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`  PPE产品总数:     ${totalProducts?.toLocaleString() || 0}`);
  console.log(`  制造商总数:      ${totalManufacturers?.toLocaleString() || 0}`);
  console.log(`  法规/标准总数:   ${totalRegulations?.toLocaleString() || 0}`);

  // 2. 产品分类分布
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  二、产品分类分布');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const categories = ['呼吸防护装备', '手部防护装备', '身体防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '其他'];
  for (const cat of categories) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', cat);
    const pct = totalProducts ? ((count || 0) / totalProducts * 100).toFixed(1) : 0;
    console.log(`  ${cat}: ${(count || 0).toLocaleString()} (${pct}%)`);
  }

  // 3. 风险等级分布
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  三、风险等级分布');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const risk of ['low', 'medium', 'high']) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('risk_level', risk);
    const pct = totalProducts ? ((count || 0) / totalProducts * 100).toFixed(1) : 0;
    const label = risk === 'low' ? '低风险' : risk === 'medium' ? '中风险' : '高风险';
    console.log(`  ${label} (${risk}): ${(count || 0).toLocaleString()} (${pct}%)`);
  }

  // 4. 原产国分布 (Top 20)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  四、原产国分布 (Top 20)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const countryMap = {
    'US': '美国', 'CN': '中国', 'GB': '英国', 'JP': '日本', 'AU': '澳大利亚',
    'KR': '韩国', 'BR': '巴西', 'DE': '德国', 'MY': '马来西亚', 'TH': '泰国',
    'IN': '印度', 'PH': '菲律宾', 'ID': '印度尼西亚', 'VN': '越南', 'SG': '新加坡',
    'FR': '法国', 'IT': '意大利', 'CA': '加拿大', 'MX': '墨西哥', 'IE': '爱尔兰',
  };

  const { data: countryData } = await supabase
    .from('ppe_products')
    .select('country_of_origin');

  const countryCounts = {};
  for (const row of (countryData || [])) {
    const c = row.country_of_origin || 'Unknown';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  }

  const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < Math.min(20, sortedCountries.length); i++) {
    const [code, count] = sortedCountries[i];
    const pct = totalProducts ? (count / totalProducts * 100).toFixed(1) : 0;
    const name = countryMap[code] || code;
    console.log(`  ${name} (${code}): ${count.toLocaleString()} (${pct}%)`);
  }

  // 5. 数据来源分布
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  五、数据来源分布');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data: sourceData } = await supabase
    .from('ppe_products')
    .select('data_source');

  const sourceCounts = {};
  for (const row of (sourceData || [])) {
    const s = row.data_source || 'Unknown';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  for (const [source, count] of sortedSources) {
    const pct = totalProducts ? (count / totalProducts * 100).toFixed(1) : 0;
    console.log(`  ${source}: ${count.toLocaleString()} (${pct}%)`);
  }

  // 6. 注册机构分布
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  六、注册机构分布');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data: authData } = await supabase
    .from('ppe_products')
    .select('registration_authority');

  const authCounts = {};
  for (const row of (authData || [])) {
    const a = row.registration_authority || 'Unknown';
    authCounts[a] = (authCounts[a] || 0) + 1;
  }

  const sortedAuth = Object.entries(authCounts).sort((a, b) => b[1] - a[1]);
  for (const [auth, count] of sortedAuth) {
    const pct = totalProducts ? (count / totalProducts * 100).toFixed(1) : 0;
    console.log(`  ${auth}: ${count.toLocaleString()} (${pct}%)`);
  }

  // 7. 数据质量评估
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  七、数据质量评估');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const fields = ['name', 'category', 'subcategory', 'risk_level', 'manufacturer_name', 'country_of_origin', 'product_code', 'model', 'description', 'certifications', 'registration_authority', 'data_source'];
  for (const field of fields) {
    const { count: filled } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).not(field, 'is', null);
    const { count: notEmpty } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).neq(field, '');
    const effectiveCount = Math.max(filled || 0, notEmpty || 0);
    const pct = totalProducts ? (effectiveCount / totalProducts * 100).toFixed(1) : 0;
    console.log(`  ${field}: ${effectiveCount.toLocaleString()}/${totalProducts?.toLocaleString()} (${pct}%)`);
  }

  // 8. 制造商数据质量
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  八、制造商数据质量');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const mfrFields = ['name', 'country', 'website'];
  for (const field of mfrFields) {
    const { count: filled } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).not(field, 'is', null);
    const { count: notEmpty } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).neq(field, '');
    const effectiveCount = Math.max(filled || 0, notEmpty || 0);
    const pct = totalManufacturers ? (effectiveCount / totalManufacturers * 100).toFixed(1) : 0;
    console.log(`  ${field}: ${effectiveCount.toLocaleString()}/${totalManufacturers?.toLocaleString()} (${pct}%)`);
  }

  // 9. 制造商国家分布
  console.log('\n  制造商国家分布 (Top 15):');
  const { data: mfrCountryData } = await supabase.from('ppe_manufacturers').select('country');
  const mfrCountryCounts = {};
  for (const row of (mfrCountryData || [])) {
    const c = row.country || 'Unknown';
    mfrCountryCounts[c] = (mfrCountryCounts[c] || 0) + 1;
  }
  const sortedMfrCountries = Object.entries(mfrCountryCounts).sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < Math.min(15, sortedMfrCountries.length); i++) {
    const [code, count] = sortedMfrCountries[i];
    const pct = totalManufacturers ? (count / totalManufacturers * 100).toFixed(1) : 0;
    const name = countryMap[code] || code;
    console.log(`    ${name} (${code}): ${count.toLocaleString()} (${pct}%)`);
  }

  // 10. 法规/标准分布
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  九、法规/标准分布');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data: regRegionData } = await supabase.from('ppe_regulations').select('region');
  const regRegionCounts = {};
  for (const row of (regRegionData || [])) {
    const r = row.region || 'Unknown';
    regRegionCounts[r] = (regRegionCounts[r] || 0) + 1;
  }
  const sortedRegRegions = Object.entries(regRegionCounts).sort((a, b) => b[1] - a[1]);
  for (const [region, count] of sortedRegRegions) {
    const pct = totalRegulations ? (count / totalRegulations * 100).toFixed(1) : 0;
    console.log(`  ${region}: ${count.toLocaleString()} (${pct}%)`);
  }

  // 11. 数据采集来源汇总
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  十、数据采集来源汇总');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sourceSummary = [
    { source: 'FDA (510k, Registration, Recalls, Adverse Events, Enforcement)', region: 'US', type: 'API' },
    { source: 'Health Canada MDALL', region: 'CA', type: 'API' },
    { source: 'UK MHRA CMS', region: 'GB', type: 'XLSX Download' },
    { source: 'Korea MFDS', region: 'KR', type: 'Known Manufacturers' },
    { source: 'Brazil ANVISA', region: 'BR', type: 'Known Manufacturers' },
    { source: 'Japan PMDA', region: 'JP', type: 'Known Manufacturers' },
    { source: 'Australia TGA', region: 'AU', type: 'Known Manufacturers' },
    { source: 'China NMPA', region: 'CN', type: 'Known Manufacturers' },
    { source: 'Southeast Asia (MY/TH/PH/ID/VN/SG)', region: 'SEA', type: 'Known Manufacturers' },
    { source: 'India BIS', region: 'IN', type: 'Known Manufacturers' },
    { source: 'EU Regulations (EN Standards)', region: 'EU', type: 'Standards Database' },
    { source: 'ISO Standards', region: 'Global', type: 'Standards Database' },
    { source: 'Global Market Data', region: 'Global', type: 'Market Research' },
  ];

  for (const s of sourceSummary) {
    console.log(`  [${s.region}] ${s.source} (${s.type})`);
  }

  // 12. 改进建议
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  十一、数据质量改进建议');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { count: nullCountry } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('country_of_origin', null);
  const { count: emptyCountry } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', '');
  const { count: unknownCountry } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', 'Unknown');
  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: emptyMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('manufacturer_name', '');
  const { count: otherCat } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log(`  1. country_of_origin缺失: null=${nullCountry || 0}, 空=${emptyCountry || 0}, Unknown=${unknownCountry || 0}`);
  console.log(`  2. manufacturer_name缺失: null=${nullMfr || 0}, 空=${emptyMfr || 0}`);
  console.log(`  3. "其他"分类产品: ${otherCat || 0} (${totalProducts ? ((otherCat || 0) / totalProducts * 100).toFixed(1) : 0}%)`);
  console.log('');
  console.log('  建议优先改进:');
  console.log('  - 申请Korea MFDS API serviceKey以获取韩国官方PPE数据');
  console.log('  - 开发EUDAMED自动化爬虫以获取欧盟PPE注册数据');
  console.log('  - 接入NMPA官方数据库API以获取中国医疗器械注册数据');
  console.log('  - 完善product_code字段，从FDA API补充更多产品编码');
  console.log('  - 增加制造商website字段数据，提升制造商信息完整性');

  console.log('\n============================================================');
  console.log('  报告结束');
  console.log('============================================================\n');
}

main().catch(console.error);
