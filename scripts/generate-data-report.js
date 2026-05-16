#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const trim = v => typeof v === 'string' ? v.trim() : (Array.isArray(v) ? v.join(',').trim() : '');

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
  console.log('PPE数据库全面数据报告');
  console.log('========================================');
  console.log(`生成时间: ${new Date().toISOString()}\n`);

  // ===== 1. 基础统计 =====
  console.log('========== 一、基础统计 ==========');
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalMfrs } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`产品总数: ${totalProducts.toLocaleString()}`);
  console.log(`制造商总数: ${totalMfrs.toLocaleString()}`);

  // ===== 2. 产品分类分布 =====
  console.log('\n========== 二、产品分类分布 ==========');
  const products = await fetchAll('ppe_products', 'id,category,subcategory');
  const catStats = {};
  products.forEach(p => {
    const c = p.category || 'Unknown';
    if (!catStats[c]) catStats[c] = { count: 0, en: p.subcategory || '' };
    catStats[c].count++;
  });
  Object.entries(catStats).sort((a, b) => b[1].count - a[1].count).forEach(([c, info]) => {
    const pct = ((info.count / totalProducts) * 100).toFixed(1);
    console.log(`  ${c}${info.en ? ' (' + info.en + ')' : ''}: ${info.count.toLocaleString()} (${pct}%)`);
  });

  // ===== 3. 产品数据完整性 =====
  console.log('\n========== 三、产品数据完整性 ==========');
  const fullProducts = await fetchAll('ppe_products', 'id,name,category,manufacturer_name,country_of_origin,risk_level,registration_authority,data_source,subcategory,specifications');
  let hasName = 0, hasMfr = 0, hasCountry = 0, hasRisk = 0, hasAuth = 0, hasSource = 0, hasEnCat = 0, hasEnName = 0;
  fullProducts.forEach(p => {
    if (p.name && trim(p.name) !== '') hasName++;
    if (p.manufacturer_name && trim(p.manufacturer_name) !== '' && p.manufacturer_name !== 'Unknown') hasMfr++;
    if (p.country_of_origin && trim(p.country_of_origin) !== '') hasCountry++;
    if (p.risk_level && trim(p.risk_level) !== '') hasRisk++;
    if (p.registration_authority && trim(p.registration_authority) !== '') hasAuth++;
    if (p.data_source && trim(p.data_source) !== '' && p.data_source !== 'Unknown') hasSource++;
    if (p.subcategory && trim(p.subcategory) !== '') hasEnCat++;
    if (p.specifications && typeof p.specifications === 'string' && p.specifications.includes('EN:')) hasEnName++;
  });
  console.log(`  产品名: ${hasName}/${totalProducts} (${((hasName/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  制造商名: ${hasMfr}/${totalProducts} (${((hasMfr/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  原产国: ${hasCountry}/${totalProducts} (${((hasCountry/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  风险等级: ${hasRisk}/${totalProducts} (${((hasRisk/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  注册机构: ${hasAuth}/${totalProducts} (${((hasAuth/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  数据来源: ${hasSource}/${totalProducts} (${((hasSource/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  英文分类: ${hasEnCat}/${totalProducts} (${((hasEnCat/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  英文名称: ${hasEnName}/${totalProducts} (${((hasEnName/totalProducts)*100).toFixed(1)}%)`);

  // ===== 4. 按国家/地区分布 =====
  console.log('\n========== 四、产品按国家/地区分布 ==========');
  const countryStats = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
  });
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([c, n]) => {
    console.log(`  ${c}: ${n.toLocaleString()} (${((n/totalProducts)*100).toFixed(1)}%)`);
  });

  // ===== 5. 制造商统计 =====
  console.log('\n========== 五、制造商统计 ==========');
  const mfrs = await fetchAll('ppe_manufacturers', 'id,name,country,website,contact_info,certifications,business_scope,company_profile');
  const mfrByCountry = {};
  mfrs.forEach(m => {
    const c = m.country || 'Unknown';
    if (!mfrByCountry[c]) mfrByCountry[c] = 0;
    mfrByCountry[c]++;
  });
  Object.entries(mfrByCountry).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`  ${c}: ${n.toLocaleString()}`);
  });

  // ===== 6. 制造商信息完整性 =====
  console.log('\n========== 六、制造商信息完整性 ==========');
  let mfrHasWeb = 0, mfrHasContact = 0, mfrHasCert = 0, mfrHasScope = 0, mfrHasProfile = 0, mfrHasEn = 0;
  mfrs.forEach(m => {
    if (m.website && trim(m.website) !== '') mfrHasWeb++;
    if (m.contact_info && trim(m.contact_info) !== '') mfrHasContact++;
    if (m.certifications && trim(m.certifications) !== '') mfrHasCert++;
    if (m.business_scope && trim(m.business_scope) !== '') mfrHasScope++;
    if (m.company_profile && trim(m.company_profile) !== '') mfrHasProfile++;
    if (m.contact_info && typeof m.contact_info === 'string' && m.contact_info.includes('EN:')) mfrHasEn++;
  });
  console.log(`  网站: ${mfrHasWeb}/${totalMfrs} (${((mfrHasWeb/totalMfrs)*100).toFixed(1)}%)`);
  console.log(`  联系方式: ${mfrHasContact}/${totalMfrs} (${((mfrHasContact/totalMfrs)*100).toFixed(1)}%)`);
  console.log(`  认证信息: ${mfrHasCert}/${totalMfrs} (${((mfrHasCert/totalMfrs)*100).toFixed(1)}%)`);
  console.log(`  经营范围: ${mfrHasScope}/${totalMfrs} (${((mfrHasScope/totalMfrs)*100).toFixed(1)}%)`);
  console.log(`  公司简介: ${mfrHasProfile}/${totalMfrs} (${((mfrHasProfile/totalMfrs)*100).toFixed(1)}%)`);
  console.log(`  英文名: ${mfrHasEn}/${totalMfrs} (${((mfrHasEn/totalMfrs)*100).toFixed(1)}%)`);

  // ===== 7. 中国企业详情 =====
  console.log('\n========== 七、中国企业详情 ==========');
  const cnMfrs = mfrs.filter(m => m.country === 'CN');
  console.log(`中国制造商总数: ${cnMfrs.length}`);
  let cnWeb = 0, cnContact = 0, cnCert = 0, cnScope = 0, cnProfile = 0, cnEn = 0;
  cnMfrs.forEach(m => {
    if (m.website && trim(m.website) !== '') cnWeb++;
    if (m.contact_info && trim(m.contact_info) !== '') cnContact++;
    if (m.certifications && trim(m.certifications) !== '') cnCert++;
    if (m.business_scope && trim(m.business_scope) !== '') cnScope++;
    if (m.company_profile && trim(m.company_profile) !== '') cnProfile++;
    if (m.contact_info && typeof m.contact_info === 'string' && m.contact_info.includes('EN:')) cnEn++;
  });
  console.log(`  有网站: ${cnWeb}/${cnMfrs.length} (${((cnWeb/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  有联系方式: ${cnContact}/${cnMfrs.length} (${((cnContact/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  有认证信息: ${cnCert}/${cnMfrs.length} (${((cnCert/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  有经营范围: ${cnScope}/${cnMfrs.length} (${((cnScope/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  有公司简介: ${cnProfile}/${cnMfrs.length} (${((cnProfile/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  有英文名: ${cnEn}/${cnMfrs.length} (${((cnEn/cnMfrs.length)*100).toFixed(1)}%)`);

  // ===== 8. 按数据来源分布 =====
  console.log('\n========== 八、产品按数据来源分布 ==========');
  const sourceStats = {};
  fullProducts.forEach(p => {
    const s = p.data_source || 'Unknown';
    sourceStats[s] = (sourceStats[s] || 0) + 1;
  });
  Object.entries(sourceStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([s, n]) => {
    console.log(`  ${s}: ${n.toLocaleString()} (${((n/totalProducts)*100).toFixed(1)}%)`);
  });

  // ===== 9. 按注册机构分布 =====
  console.log('\n========== 九、产品按注册机构分布 ==========');
  const authStats = {};
  fullProducts.forEach(p => {
    const a = p.registration_authority || 'Unknown';
    authStats[a] = (authStats[a] || 0) + 1;
  });
  Object.entries(authStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([a, n]) => {
    console.log(`  ${a}: ${n.toLocaleString()} (${((n/totalProducts)*100).toFixed(1)}%)`);
  });

  // ===== 10. 数据质量评分 =====
  console.log('\n========== 十、数据质量评分 ==========');
  const completenessScore = (
    (hasName/totalProducts) * 10 +
    (hasMfr/totalProducts) * 15 +
    (hasCountry/totalProducts) * 10 +
    (hasRisk/totalProducts) * 10 +
    (hasAuth/totalProducts) * 15 +
    (hasSource/totalProducts) * 10 +
    (hasEnCat/totalProducts) * 15 +
    (hasEnName/totalProducts) * 15
  );
  const mfrScore = (
    (mfrHasWeb/totalMfrs) * 15 +
    (mfrHasContact/totalMfrs) * 15 +
    (mfrHasCert/totalMfrs) * 15 +
    (mfrHasScope/totalMfrs) * 15 +
    (mfrHasProfile/totalMfrs) * 20 +
    (mfrHasEn/totalMfrs) * 20
  );
  const overallScore = completenessScore * 0.6 + mfrScore * 0.4;

  console.log(`  产品数据完整度: ${completenessScore.toFixed(1)}/100`);
  console.log(`  制造商信息完整度: ${mfrScore.toFixed(1)}/100`);
  console.log(`  综合数据质量评分: ${overallScore.toFixed(1)}/100`);

  // ===== 11. 主要问题汇总 =====
  console.log('\n========== 十一、主要问题汇总 ==========');
  const noMfrProducts = fullProducts.filter(p => !p.manufacturer_name || p.manufacturer_name === 'Unknown').length;
  const noAuthProducts = fullProducts.filter(p => !p.registration_authority).length;
  const noSourceProducts = fullProducts.filter(p => !p.data_source || p.data_source === 'Unknown').length;
  const noWebMfrs = mfrs.filter(m => !m.website).length;
  const noContactMfrs = mfrs.filter(m => !m.contact_info).length;

  console.log(`  无制造商名产品: ${noMfrProducts} 条 (${((noMfrProducts/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  无注册机构产品: ${noAuthProducts} 条 (${((noAuthProducts/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  无数据来源产品: ${noSourceProducts} 条 (${((noSourceProducts/totalProducts)*100).toFixed(1)}%)`);
  console.log(`  无网站制造商: ${noWebMfrs} 个 (${((noWebMfrs/totalMfrs)*100).toFixed(1)}%)`);
  console.log(`  无联系方式制造商: ${noContactMfrs} 个 (${((noContactMfrs/totalMfrs)*100).toFixed(1)}%)`);

  console.log('\n========================================');
  console.log('报告生成完成');
  console.log('========================================');
}

main().catch(console.error);
