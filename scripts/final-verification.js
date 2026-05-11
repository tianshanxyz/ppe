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
  console.log('最终数据质量验证报告');
  console.log('========================================');
  console.log(`验证时间: ${new Date().toISOString()}\n`);

  const products = await fetchAll('ppe_products', 'id,name,category,manufacturer_name,country_of_origin,product_code,registration_number,data_source,risk_level,registration_authority');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,website,contact_info,certifications,business_scope,established_date,company_profile,data_source,data_confidence_level');

  console.log(`产品总数: ${products.length}`);
  console.log(`制造商总数: ${manufacturers.length}\n`);

  // ===== 1. 数据完整性 =====
  console.log('========== 1. 数据完整性 ==========');
  const total = products.length;
  let hasName = 0, hasCat = 0, hasMfr = 0, hasCountry = 0, hasRisk = 0, hasAuth = 0, hasSource = 0, hasRegNum = 0;
  products.forEach(p => {
    if (p.name && trim(p.name) !== '') hasName++;
    if (p.category && trim(p.category) !== '') hasCat++;
    if (p.manufacturer_name && trim(p.manufacturer_name) !== '' && p.manufacturer_name !== 'Unknown') hasMfr++;
    if (p.country_of_origin && trim(p.country_of_origin) !== '') hasCountry++;
    if (p.risk_level && trim(p.risk_level) !== '') hasRisk++;
    if (p.registration_authority && trim(p.registration_authority) !== '') hasAuth++;
    if (p.data_source && trim(p.data_source) !== '' && p.data_source !== 'Unknown') hasSource++;
    if (p.registration_number && trim(p.registration_number) !== '') hasRegNum++;
  });
  console.log(`  产品名: ${hasName}/${total} (${((hasName/total)*100).toFixed(1)}%)`);
  console.log(`  分类: ${hasCat}/${total} (${((hasCat/total)*100).toFixed(1)}%)`);
  console.log(`  制造商名: ${hasMfr}/${total} (${((hasMfr/total)*100).toFixed(1)}%)`);
  console.log(`  原产国: ${hasCountry}/${total} (${((hasCountry/total)*100).toFixed(1)}%)`);
  console.log(`  风险等级: ${hasRisk}/${total} (${((hasRisk/total)*100).toFixed(1)}%)`);
  console.log(`  注册机构: ${hasAuth}/${total} (${((hasAuth/total)*100).toFixed(1)}%)`);
  console.log(`  数据来源: ${hasSource}/${total} (${((hasSource/total)*100).toFixed(1)}%)`);
  console.log(`  注册号: ${hasRegNum}/${total} (${((hasRegNum/total)*100).toFixed(1)}%)`);

  // ===== 2. 制造商信息完整性 =====
  console.log('\n========== 2. 制造商信息完整性 ==========');
  const mfrTotal = manufacturers.length;
  let mfrHasWeb = 0, mfrHasContact = 0, mfrHasCert = 0, mfrHasScope = 0, mfrHasProfile = 0, mfrHasDate = 0;
  manufacturers.forEach(m => {
    if (m.website && trim(m.website) !== '') mfrHasWeb++;
    if (m.contact_info && trim(m.contact_info) !== '') mfrHasContact++;
    if (m.certifications && trim(m.certifications) !== '') mfrHasCert++;
    if (m.business_scope && trim(m.business_scope) !== '') mfrHasScope++;
    if (m.company_profile && trim(m.company_profile) !== '') mfrHasProfile++;
    if (m.established_date && trim(m.established_date) !== '') mfrHasDate++;
  });
  console.log(`  网站: ${mfrHasWeb}/${mfrTotal} (${((mfrHasWeb/mfrTotal)*100).toFixed(1)}%)`);
  console.log(`  联系方式: ${mfrHasContact}/${mfrTotal} (${((mfrHasContact/mfrTotal)*100).toFixed(1)}%)`);
  console.log(`  认证信息: ${mfrHasCert}/${mfrTotal} (${((mfrHasCert/mfrTotal)*100).toFixed(1)}%)`);
  console.log(`  经营范围: ${mfrHasScope}/${mfrTotal} (${((mfrHasScope/mfrTotal)*100).toFixed(1)}%)`);
  console.log(`  公司简介: ${mfrHasProfile}/${mfrTotal} (${((mfrHasProfile/mfrTotal)*100).toFixed(1)}%)`);
  console.log(`  成立日期: ${mfrHasDate}/${mfrTotal} (${((mfrHasDate/mfrTotal)*100).toFixed(1)}%)`);

  // ===== 3. 中国企业信息 =====
  console.log('\n========== 3. 中国企业信息 ==========');
  const cnMfrs = manufacturers.filter(m => m.country === 'CN');
  let cnWeb = 0, cnContact = 0, cnCert = 0, cnScope = 0, cnProfile = 0, cnDate = 0, cnHigh = 0;
  cnMfrs.forEach(m => {
    if (m.website && trim(m.website) !== '') cnWeb++;
    if (m.contact_info && trim(m.contact_info) !== '') cnContact++;
    if (m.certifications && trim(m.certifications) !== '') cnCert++;
    if (m.business_scope && trim(m.business_scope) !== '') cnScope++;
    if (m.company_profile && trim(m.company_profile) !== '') cnProfile++;
    if (m.established_date && trim(m.established_date) !== '') cnDate++;
    if (m.data_confidence_level === 'high') cnHigh++;
  });
  console.log(`  中国制造商: ${cnMfrs.length} 个`);
  console.log(`  网站: ${cnWeb} (${((cnWeb/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  联系方式: ${cnContact} (${((cnContact/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  认证信息: ${cnCert} (${((cnCert/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  经营范围: ${cnScope} (${((cnScope/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  公司简介: ${cnProfile} (${((cnProfile/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  成立日期: ${cnDate} (${((cnDate/cnMfrs.length)*100).toFixed(1)}%)`);
  console.log(`  高置信度: ${cnHigh} (${((cnHigh/cnMfrs.length)*100).toFixed(1)}%)`);

  // ===== 4. 按国家/地区分布 =====
  console.log('\n========== 4. 产品按国家/地区分布 ==========');
  const countryStats = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    if (!countryStats[c]) countryStats[c] = 0;
    countryStats[c]++;
  });
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([c, n]) => {
    console.log(`  ${c}: ${n} (${((n/total)*100).toFixed(1)}%)`);
  });

  // ===== 5. 按分类分布 =====
  console.log('\n========== 5. 产品按分类分布 ==========');
  const catStats = {};
  products.forEach(p => {
    const c = p.category || 'Unknown';
    if (!catStats[c]) catStats[c] = 0;
    catStats[c]++;
  });
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`  ${c}: ${n} (${((n/total)*100).toFixed(1)}%)`);
  });

  // ===== 6. 按数据来源分布 =====
  console.log('\n========== 6. 产品按数据来源分布 ==========');
  const sourceStats = {};
  products.forEach(p => {
    const s = p.data_source || 'Unknown';
    if (!sourceStats[s]) sourceStats[s] = 0;
    sourceStats[s]++;
  });
  Object.entries(sourceStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([s, n]) => {
    console.log(`  ${s}: ${n} (${((n/total)*100).toFixed(1)}%)`);
  });

  // ===== 7. 按注册机构分布 =====
  console.log('\n========== 7. 产品按注册机构分布 ==========');
  const authStats = {};
  products.forEach(p => {
    const a = p.registration_authority || 'Unknown';
    if (!authStats[a]) authStats[a] = 0;
    authStats[a]++;
  });
  Object.entries(authStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([a, n]) => {
    console.log(`  ${a}: ${n} (${((n/total)*100).toFixed(1)}%)`);
  });

  // ===== 8. 剩余问题 =====
  console.log('\n========== 8. 剩余问题 ==========');

  // 8.1 仍然空制造商名的产品
  const stillEmptyMfr = products.filter(p => !p.manufacturer_name || trim(p.manufacturer_name) === '' || p.manufacturer_name === 'Unknown');
  console.log(`  空制造商名产品: ${stillEmptyMfr.length} 条`);

  // 8.2 无注册机构
  const stillNoAuth = products.filter(p => !p.registration_authority || trim(p.registration_authority) === '');
  console.log(`  无注册机构产品: ${stillNoAuth.length} 条`);

  // 8.3 无风险等级
  const stillNoRisk = products.filter(p => !p.risk_level || trim(p.risk_level) === '');
  console.log(`  无风险等级产品: ${stillNoRisk.length} 条`);

  // 8.4 无数据来源
  const stillNoSource = products.filter(p => !p.data_source || trim(p.data_source) === '' || p.data_source === 'Unknown');
  console.log(`  无数据来源产品: ${stillNoSource.length} 条`);

  // ===== 9. 总体评分 =====
  console.log('\n========== 9. 总体数据质量评分 ==========');
  const completenessScore = (
    (hasName/total) * 15 +
    (hasCat/total) * 10 +
    (hasMfr/total) * 15 +
    (hasCountry/total) * 10 +
    (hasRisk/total) * 10 +
    (hasAuth/total) * 15 +
    (hasSource/total) * 10 +
    (hasRegNum/total) * 15
  );
  const mfrScore = (
    (mfrHasWeb/mfrTotal) * 20 +
    (mfrHasContact/mfrTotal) * 15 +
    (mfrHasCert/mfrTotal) * 15 +
    (mfrHasScope/mfrTotal) * 15 +
    (mfrHasProfile/mfrTotal) * 20 +
    (mfrHasDate/mfrTotal) * 15
  );
  const overallScore = completenessScore * 0.6 + mfrScore * 0.4;

  console.log(`  产品数据完整度: ${completenessScore.toFixed(1)}/100`);
  console.log(`  制造商信息完整度: ${mfrScore.toFixed(1)}/100`);
  console.log(`  综合数据质量评分: ${overallScore.toFixed(1)}/100`);

  console.log('\n========================================');
  console.log('验证完成');
  console.log('========================================');
}

main().catch(console.error);
