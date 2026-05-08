#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function main() {
  console.log('========================================');
  console.log('全球PPE数据全覆盖分析报告');
  console.log('========================================');
  console.log(`分析时间: ${new Date().toISOString()}`);

  // ===== 1. 基础统计 =====
  console.log('\n========== 1. 基础统计 ==========');
  const products = await fetchAll('ppe_products', 'id,name,category,manufacturer_name,country_of_origin,risk_level,product_code,registration_number,registration_authority,data_source,specifications');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,website,contact_info,certifications,business_scope,established_date,company_profile,data_confidence_level');
  const regulations = await fetchAll('ppe_regulations', 'id,name,code,region');

  console.log(`产品总数: ${products.length.toLocaleString()}`);
  console.log(`制造商总数: ${manufacturers.length.toLocaleString()}`);
  console.log(`法规标准总数: ${regulations.length.toLocaleString()}`);

  // ===== 2. 产品分类覆盖分析 =====
  console.log('\n========== 2. 产品分类覆盖分析 ==========');
  const categoryMap = {};
  products.forEach(p => { categoryMap[p.category || '未分类'] = (categoryMap[p.category || '未分类'] || 0) + 1; });
  Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count.toLocaleString()} (${(count / products.length * 100).toFixed(1)}%)`);
  });

  // ===== 3. 数据来源覆盖分析 =====
  console.log('\n========== 3. 数据来源覆盖分析 ==========');
  const sourceMap = {};
  products.forEach(p => { sourceMap[p.data_source || 'Unknown'] = (sourceMap[p.data_source || 'Unknown'] || 0) + 1; });
  Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).forEach(([src, count]) => {
    console.log(`  ${src}: ${count.toLocaleString()} (${(count / products.length * 100).toFixed(1)}%)`);
  });

  // ===== 4. 国家/地区覆盖分析 =====
  console.log('\n========== 4. 国家/地区覆盖分析 ==========');
  const countryProductMap = {};
  products.forEach(p => { countryProductMap[p.country_of_origin || 'Unknown'] = (countryProductMap[p.country_of_origin || 'Unknown'] || 0) + 1; });
  const countryMfrMap = {};
  manufacturers.forEach(m => { countryMfrMap[m.country || 'Unknown'] = (countryMfrMap[m.country || 'Unknown'] || 0) + 1; });

  const allCountries = new Set([...Object.keys(countryProductMap), ...Object.keys(countryMfrMap)]);
  const countryData = [];
  allCountries.forEach(c => {
    countryData.push({ country: c, products: countryProductMap[c] || 0, manufacturers: countryMfrMap[c] || 0 });
  });
  countryData.sort((a, b) => b.products - a.products);
  countryData.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.country}: 产品${c.products.toLocaleString()}, 制造商${c.manufacturers.toLocaleString()}`);
  });

  // ===== 5. 注册机构覆盖分析 =====
  console.log('\n========== 5. 注册机构覆盖分析 ==========');
  const regAuthMap = {};
  products.forEach(p => {
    if (p.registration_authority) {
      regAuthMap[p.registration_authority] = (regAuthMap[p.registration_authority] || 0) + 1;
    }
  });
  Object.entries(regAuthMap).sort((a, b) => b[1] - a[1]).forEach(([auth, count]) => {
    console.log(`  ${auth}: ${count.toLocaleString()}`);
  });

  // ===== 6. 制造商信息完整度 =====
  console.log('\n========== 6. 制造商信息完整度 ==========');
  let mfrWithWebsite = 0, mfrWithContact = 0, mfrWithCert = 0, mfrWithBizScope = 0;
  let mfrWithEstDate = 0, mfrWithProfile = 0, mfrHighConf = 0, mfrMediumConf = 0, mfrLowConf = 0;
  manufacturers.forEach(m => {
    if (m.website) mfrWithWebsite++;
    if (m.contact_info) mfrWithContact++;
    if (m.certifications) mfrWithCert++;
    if (m.business_scope) mfrWithBizScope++;
    if (m.established_date) mfrWithEstDate++;
    if (m.company_profile) mfrWithProfile++;
    if (m.data_confidence_level === 'high') mfrHighConf++;
    else if (m.data_confidence_level === 'medium') mfrMediumConf++;
    else mfrLowConf++;
  });
  console.log(`  有网站: ${mfrWithWebsite} (${(mfrWithWebsite / manufacturers.length * 100).toFixed(1)}%)`);
  console.log(`  有联系方式: ${mfrWithContact} (${(mfrWithContact / manufacturers.length * 100).toFixed(1)}%)`);
  console.log(`  有认证信息: ${mfrWithCert} (${(mfrWithCert / manufacturers.length * 100).toFixed(1)}%)`);
  console.log(`  有经营范围: ${mfrWithBizScope} (${(mfrWithBizScope / manufacturers.length * 100).toFixed(1)}%)`);
  console.log(`  有成立日期: ${mfrWithEstDate} (${(mfrWithEstDate / manufacturers.length * 100).toFixed(1)}%)`);
  console.log(`  有公司简介: ${mfrWithProfile} (${(mfrWithProfile / manufacturers.length * 100).toFixed(1)}%)`);
  console.log(`  高可信度: ${mfrHighConf} (${(mfrHighConf / manufacturers.length * 100).toFixed(1)}%)`);
  console.log(`  中可信度: ${mfrMediumConf} (${(mfrMediumConf / manufacturers.length * 100).toFixed(1)}%)`);
  console.log(`  低可信度: ${mfrLowConf} (${(mfrLowConf / manufacturers.length * 100).toFixed(1)}%)`);

  // ===== 7. 产品字段完整度 =====
  console.log('\n========== 7. 产品字段完整度 ==========');
  const fields = ['name', 'category', 'manufacturer_name', 'country_of_origin', 'risk_level', 'product_code', 'registration_number', 'registration_authority', 'specifications'];
  fields.forEach(f => {
    const filled = products.filter(p => p[f]).length;
    console.log(`  ${f}: ${filled.toLocaleString()} (${(filled / products.length * 100).toFixed(1)}%)`);
  });

  // ===== 8. 法规标准覆盖分析 =====
  console.log('\n========== 8. 法规标准覆盖分析 ==========');
  const regRegionMap = {};
  regulations.forEach(r => { regRegionMap[r.region || 'Unknown'] = (regRegionMap[r.region || 'Unknown'] || 0) + 1; });
  Object.entries(regRegionMap).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
    console.log(`  ${region}: ${count}`);
  });

  // ===== 9. 全球PPE主要市场覆盖评估 =====
  console.log('\n========== 9. 全球PPE主要市场覆盖评估 ==========');
  const majorMarkets = [
    { name: '美国 (US)', code: 'US', expectedProducts: 50000, expectedMfrs: 2000 },
    { name: '中国 (CN)', code: 'CN', expectedProducts: 30000, expectedMfrs: 3000 },
    { name: '欧盟 (EU)', code: 'EU', expectedProducts: 20000, expectedMfrs: 1500 },
    { name: '日本 (JP)', code: 'JP', expectedProducts: 5000, expectedMfrs: 500 },
    { name: '韩国 (KR)', code: 'KR', expectedProducts: 3000, expectedMfrs: 300 },
    { name: '巴西 (BR)', code: 'BR', expectedProducts: 5000, expectedMfrs: 500 },
    { name: '加拿大 (CA)', code: 'CA', expectedProducts: 10000, expectedMfrs: 800 },
    { name: '澳大利亚 (AU)', code: 'AU', expectedProducts: 5000, expectedMfrs: 400 },
    { name: '印度 (IN)', code: 'IN', expectedProducts: 5000, expectedMfrs: 500 },
    { name: '英国 (GB)', code: 'GB', expectedProducts: 5000, expectedMfrs: 400 },
  ];

  majorMarkets.forEach(market => {
    const actualProducts = countryProductMap[market.code] || 0;
    const actualMfrs = countryMfrMap[market.code] || 0;
    const productCoverage = Math.min(100, (actualProducts / market.expectedProducts * 100)).toFixed(0);
    const mfrCoverage = Math.min(100, (actualMfrs / market.expectedMfrs * 100)).toFixed(0);
    const status = productCoverage >= 80 ? '✅' : productCoverage >= 40 ? '⚠️' : '❌';
    console.log(`  ${status} ${market.name}: 产品${actualProducts.toLocaleString()}/${market.expectedProducts.toLocaleString()} (${productCoverage}%), 制造商${actualMfrs}/${market.expectedMfrs} (${mfrCoverage}%)`);
  });

  // ===== 10. PPE细分品类覆盖评估 =====
  console.log('\n========== 10. PPE细分品类覆盖评估 ==========');
  const ppeCategories = [
    { name: '呼吸防护', keywords: ['呼吸防护', '口罩', '呼吸器', '防毒', 'N95', 'KN95', 'FFP'], expectedMin: 15000 },
    { name: '手部防护', keywords: ['手部防护', '手套'], expectedMin: 15000 },
    { name: '身体防护', keywords: ['身体防护', '防护服', '隔离衣', '手术衣'], expectedMin: 10000 },
    { name: '眼面部防护', keywords: ['眼面部防护', '护目镜', '面屏'], expectedMin: 3000 },
    { name: '头部防护', keywords: ['头部防护', '安全帽', '头盔'], expectedMin: 2000 },
    { name: '足部防护', keywords: ['足部防护', '防护鞋', '安全鞋'], expectedMin: 2000 },
    { name: '听觉防护', keywords: ['听觉防护', '耳塞', '耳罩'], expectedMin: 1000 },
    { name: '坠落防护', keywords: ['坠落', '安全带', '安全绳'], expectedMin: 1000 },
    { name: '躯干防护', keywords: ['躯干防护', '反光', '高可见'], expectedMin: 1000 },
  ];

  ppeCategories.forEach(cat => {
    const count = products.filter(p => cat.keywords.some(kw => (p.category || '').includes(kw) || (p.name || '').includes(kw))).length;
    const coverage = Math.min(100, (count / cat.expectedMin * 100)).toFixed(0);
    const status = coverage >= 80 ? '✅' : coverage >= 40 ? '⚠️' : '❌';
    console.log(`  ${status} ${cat.name}: ${count.toLocaleString()}/${cat.expectedMin.toLocaleString()} (${coverage}%)`);
  });

  // ===== 11. 缺失数据类型识别 =====
  console.log('\n========== 11. 缺失数据类型识别 ==========');
  const missingDataTypes = [];

  // 检查MAUDE不良事件数据
  const maudeProducts = products.filter(p => p.data_source && p.data_source.includes('MAUDE'));
  if (maudeProducts.length === 0) missingDataTypes.push({ type: 'FDA MAUDE不良事件', severity: '高', description: '无PPE相关不良事件数据' });

  // 检查510(k)完整数据
  const f510kProducts = products.filter(p => p.data_source && p.data_source.includes('510(k)'));
  if (f510kProducts.length < 10000) missingDataTypes.push({ type: 'FDA 510(k)完整数据', severity: '中', description: `当前仅${f510kProducts.length}条，预期50000+` });

  // 检查EUDAMED完整数据
  const eudamedProducts = products.filter(p => p.data_source && p.data_source.includes('EUDAMED'));
  if (eudamedProducts.length < 5000) missingDataTypes.push({ type: 'EUDAMED完整设备数据', severity: '高', description: `当前仅${eudamedProducts.length}条，需API注册获取完整数据` });

  // 检查巴西CAEPI数据
  const brProducts = products.filter(p => p.country_of_origin === 'BR');
  if (brProducts.length < 1000) missingDataTypes.push({ type: '巴西CAEPI数据', severity: '高', description: `当前仅${brProducts.length}条，官方CSV为空` });

  // 检查澳大利亚TGA数据
  const auProducts = products.filter(p => p.country_of_origin === 'AU');
  if (auProducts.length < 500) missingDataTypes.push({ type: '澳大利亚TGA数据', severity: '高', description: `当前仅${auProducts.length}条` });

  // 检查印度BIS数据
  const inProducts = products.filter(p => p.country_of_origin === 'IN');
  if (inProducts.length < 500) missingDataTypes.push({ type: '印度BIS数据', severity: '高', description: `当前仅${inProducts.length}条` });

  // 检查俄罗斯数据
  const ruProducts = products.filter(p => p.country_of_origin === 'RU');
  if (ruProducts.length < 100) missingDataTypes.push({ type: '俄罗斯EAEU数据', severity: '中', description: `当前仅${ruProducts.length}条` });

  // 检查东盟数据
  const aseanCodes = ['TH', 'VN', 'ID', 'PH', 'SG', 'MY'];
  const aseanProducts = products.filter(p => aseanCodes.includes(p.country_of_origin));
  if (aseanProducts.length < 500) missingDataTypes.push({ type: '东盟国家数据', severity: '中', description: `当前仅${aseanProducts.length}条` });

  // 检查坠落防护数据
  const fallProducts = products.filter(p => (p.category || '').includes('坠落') || (p.name || '').includes('安全带') || (p.name || '').includes('安全绳'));
  if (fallProducts.length < 100) missingDataTypes.push({ type: '坠落防护PPE数据', severity: '中', description: `当前仅${fallProducts.length}条` });

  // 检查风险数据
  missingDataTypes.push({ type: 'BLS职业伤害统计', severity: '中', description: '仅有示例数据，需从BLS官方获取' });
  missingDataTypes.push({ type: 'OSHA检查违规数据', severity: '中', description: '仅有示例数据，需从OSHA官方获取' });
  missingDataTypes.push({ type: 'PPE产品召回数据', severity: '中', description: '仅有示例数据，需从FDA/CPSC获取' });

  missingDataTypes.forEach((d, i) => {
    console.log(`  ${i + 1}. [${d.severity}] ${d.type}: ${d.description}`);
  });

  // ===== 12. 总结 =====
  console.log('\n========== 12. 全覆盖评估总结 ==========');
  const totalExpectedProducts = 150000;
  const coveragePercent = (products.length / totalExpectedProducts * 100).toFixed(1);
  console.log(`  产品覆盖率: ${products.length.toLocaleString()}/${totalExpectedProducts.toLocaleString()} (${coveragePercent}%)`);
  console.log(`  制造商总数: ${manufacturers.length.toLocaleString()}`);
  console.log(`  法规标准: ${regulations.length}`);
  console.log(`  数据来源数: ${Object.keys(sourceMap).length}`);
  console.log(`  覆盖国家/地区: ${allCountries.size}`);

  // Save report
  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, 'coverage_analysis_report.json');
  fs.writeFileSync(reportFile, JSON.stringify({
    analysis_time: new Date().toISOString(),
    summary: {
      total_products: products.length,
      total_manufacturers: manufacturers.length,
      total_regulations: regulations.length,
      coverage_percent: parseFloat(coveragePercent),
      countries_covered: allCountries.size,
      data_sources: Object.keys(sourceMap).length,
    },
    categories: categoryMap,
    sources: sourceMap,
    countries: countryData,
    missing_data: missingDataTypes,
  }, null, 2));
  console.log(`\n报告已保存: ${reportFile}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
