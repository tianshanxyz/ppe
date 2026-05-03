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
    if (error) { console.error(`Error fetching ${table}:`, error.message); break; }
    if (!data || data.length === 0) { hasMore = false; break; }
    all.push(...data);
    if (data.length < PAGE_SIZE) hasMore = false;
    page++;
  }
  return all;
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PPE 数据库当前状态与质量分析报告          ║');
  console.log('║   ' + new Date().toISOString() + '   ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 1. 基本统计
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: totalRegulations } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  一、基本统计');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  产品总数:     ${totalProducts?.toLocaleString()}`);
  console.log(`  制造商总数:   ${totalManufacturers?.toLocaleString()}`);
  console.log(`  法规总数:     ${totalRegulations?.toLocaleString()}\n`);

  // 2. 产品数据质量
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  二、产品数据质量');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const products = await fetchAll('ppe_products', 'id,name,model,category,subcategory,description,manufacturer_name,country_of_origin,product_code,risk_level,data_source,registration_authority,data_source_url,last_verified,data_confidence_level');

  // 2.1 字段完整性
  const fields = ['name', 'manufacturer_name', 'category', 'country_of_origin', 'product_code', 'risk_level', 'data_source', 'description', 'model', 'registration_authority', 'data_source_url', 'last_verified', 'data_confidence_level'];
  console.log('\n  字段完整性:');
  fields.forEach(f => {
    const missing = products.filter(p => !p[f] || (typeof p[f] === 'string' && p[f].trim() === '')).length;
    const pct = (missing / products.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((1 - missing / products.length) * 20));
    const empty = '░'.repeat(20 - bar.length);
    console.log(`    ${f.padEnd(25)} ${bar}${empty} ${(100 - parseFloat(pct)).toFixed(1)}% (缺失 ${missing})`);
  });

  // 2.2 数据来源权威性
  console.log('\n  数据来源分布:');
  const sourceStats = {};
  products.forEach(p => {
    const src = p.data_source || 'Unknown';
    sourceStats[src] = (sourceStats[src] || 0) + 1;
  });
  const authoritativeSources = ['FDA 510(k) Database', 'Health Canada MDALL', 'NMPA', 'FDA Registration Database', 'FDA Classification Database', 'FDA Recalls Database', 'FDA Enforcement Reports', 'FDA Adverse Events', 'MHRA CMS'];
  let authoritativeCount = 0;
  Object.entries(sourceStats).sort((a, b) => b[1] - a[1]).forEach(([src, cnt]) => {
    const isAuth = authoritativeSources.some(a => src.includes(a));
    const marker = isAuth ? '✓ 权威' : '⚠ 非权威';
    console.log(`    ${marker} ${src}: ${cnt} (${(cnt / products.length * 100).toFixed(1)}%)`);
    if (isAuth) authoritativeCount += cnt;
  });
  console.log(`\n    权威来源占比: ${(authoritativeCount / products.length * 100).toFixed(1)}%`);

  // 2.3 重复检测
  console.log('\n  重复产品检测:');
  const productGroups = {};
  products.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    if (!productGroups[key]) productGroups[key] = [];
    productGroups[key].push(p);
  });
  const dupGroups = Object.entries(productGroups).filter(([k, v]) => v.length > 1);
  const dupRecords = dupGroups.reduce((sum, [k, v]) => sum + v.length - 1, 0);
  console.log(`    重复组数: ${dupGroups.length}`);
  console.log(`    重复记录数: ${dupRecords} (${(dupRecords / products.length * 100).toFixed(1)}%)`);

  // 2.4 可疑数据检测
  console.log('\n  可疑数据检测:');
  const fakeModels = products.filter(p => p.model && /^[A-Z]{2,5}-\d{10,}/.test(p.model));
  console.log(`    编造model号: ${fakeModels.length}`);

  const unknownCountry = products.filter(p => p.country_of_origin === 'Unknown' || !p.country_of_origin);
  console.log(`    国家未知: ${unknownCountry.length}`);

  const noMfr = products.filter(p => !p.manufacturer_name || p.manufacturer_name.trim() === '');
  console.log(`    无制造商: ${noMfr.length}`);

  // 2.5 分类分布
  console.log('\n  分类分布:');
  const catStats = {};
  products.forEach(p => { const c = p.category || 'Unknown'; catStats[c] = (catStats[c] || 0) + 1; });
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([cat, cnt]) => {
    console.log(`    ${cat}: ${cnt} (${(cnt / products.length * 100).toFixed(1)}%)`);
  });

  // 2.6 国家分布
  console.log('\n  国家分布 (Top 15):');
  const countryStats = {};
  products.forEach(p => { const c = p.country_of_origin || 'Unknown'; countryStats[c] = (countryStats[c] || 0) + 1; });
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([c, cnt]) => {
    console.log(`    ${c}: ${cnt} (${(cnt / products.length * 100).toFixed(1)}%)`);
  });

  // 3. 制造商数据质量
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  三、制造商数据质量');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,website,data_source,company_profile,contact_info,certifications');

  const mfrFields = ['name', 'country', 'website', 'company_profile', 'contact_info', 'certifications', 'data_source'];
  console.log('\n  字段完整性:');
  mfrFields.forEach(f => {
    const missing = manufacturers.filter(m => !m[f] || (typeof m[f] === 'string' && m[f].trim() === '')).length;
    const pct = (missing / manufacturers.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((1 - missing / manufacturers.length) * 20));
    const empty = '░'.repeat(20 - bar.length);
    console.log(`    ${f.padEnd(25)} ${bar}${empty} ${(100 - parseFloat(pct)).toFixed(1)}% (缺失 ${missing})`);
  });

  // 重复制造商
  const mfrGroups = {};
  manufacturers.forEach(m => {
    const key = m.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!mfrGroups[key]) mfrGroups[key] = [];
    mfrGroups[key].push(m);
  });
  const dupMfrGroups = Object.entries(mfrGroups).filter(([k, v]) => v.length > 1);
  const dupMfrRecords = dupMfrGroups.reduce((sum, [k, v]) => sum + v.length - 1, 0);
  console.log(`\n  重复制造商组: ${dupMfrGroups.length}`);
  console.log(`  重复制造商记录: ${dupMfrRecords}`);

  // 孤立制造商
  const activeMfrNames = new Set(products.map(p => p.manufacturer_name).filter(Boolean).map(n => n.toLowerCase().trim()));
  const orphanMfrs = manufacturers.filter(m => !activeMfrNames.has(m.name.toLowerCase().trim()));
  console.log(`  孤立制造商(无关联产品): ${orphanMfrs.length}`);

  // 4. 法规数据质量
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  四、法规数据质量');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const regulations = await fetchAll('ppe_regulations', 'id,name,code,region,description');

  const regFields = ['name', 'code', 'region', 'description'];
  console.log('\n  字段完整性:');
  regFields.forEach(f => {
    const missing = regulations.filter(r => !r[f] || (typeof r[f] === 'string' && r[f].trim() === '')).length;
    const pct = (missing / regulations.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((1 - missing / regulations.length) * 20));
    const empty = '░'.repeat(20 - bar.length);
    console.log(`    ${f.padEnd(25)} ${bar}${empty} ${(100 - parseFloat(pct)).toFixed(1)}% (缺失 ${missing})`);
  });

  // 5. 综合质量评分
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  五、综合质量评分');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const nameScore = (1 - products.filter(p => !p.name).length / products.length) * 100;
  const mfrScore = (1 - products.filter(p => !p.manufacturer_name).length / products.length) * 100;
  const catScore = (1 - products.filter(p => !p.category).length / products.length) * 100;
  const countryScore = (1 - products.filter(p => !p.country_of_origin || p.country_of_origin === 'Unknown').length / products.length) * 100;
  const codeScore = (1 - products.filter(p => !p.product_code).length / products.length) * 100;
  const riskScore = (1 - products.filter(p => !p.risk_level).length / products.length) * 100;
  const sourceScore = (authoritativeCount / products.length) * 100;
  const dupScore = Math.max(0, 100 - dupRecords / products.length * 100);
  const fakeScore = Math.max(0, 100 - fakeModels.length / products.length * 100);

  const overallScore = (nameScore * 0.15 + mfrScore * 0.15 + catScore * 0.1 + countryScore * 0.1 +
    codeScore * 0.1 + riskScore * 0.05 + sourceScore * 0.15 + dupScore * 0.1 + fakeScore * 0.1);

  console.log(`\n  字段完整性:`);
  console.log(`    产品名称:     ${nameScore.toFixed(1)}/100`);
  console.log(`    制造商名称:   ${mfrScore.toFixed(1)}/100`);
  console.log(`    产品分类:     ${catScore.toFixed(1)}/100`);
  console.log(`    国家信息:     ${countryScore.toFixed(1)}/100`);
  console.log(`    产品代码:     ${codeScore.toFixed(1)}/100`);
  console.log(`    风险等级:     ${riskScore.toFixed(1)}/100`);
  console.log(`\n  数据权威性:`);
  console.log(`    权威来源占比: ${sourceScore.toFixed(1)}/100`);
  console.log(`\n  数据唯一性:`);
  console.log(`    重复率评分:   ${dupScore.toFixed(1)}/100`);
  console.log(`    编造数据评分: ${fakeScore.toFixed(1)}/100`);

  console.log(`\n  ╔══════════════════════════════════╗`);
  console.log(`  ║  综合质量评分: ${overallScore.toFixed(1)}/100        ║`);
  console.log(`  ╚══════════════════════════════════╝`);

  // 6. 待改进项
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  六、待改进项');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const issues = [];
  if (dupRecords > 0) issues.push(`重复产品记录: ${dupRecords} 条需去重`);
  if (dupMfrRecords > 0) issues.push(`重复制造商记录: ${dupMfrRecords} 条需合并`);
  if (orphanMfrs.length > 0) issues.push(`孤立制造商: ${orphanMfrs.length} 条无关联产品`);
  if (fakeModels.length > 0) issues.push(`编造model号: ${fakeModels.length} 条需删除`);
  if (noMfr.length > 0) issues.push(`无制造商产品: ${noMfr.length} 条需补充`);
  if (unknownCountry.length > 0) issues.push(`国家未知产品: ${unknownCountry.length} 条需修复`);
  if (sourceScore < 100) issues.push(`非权威来源产品: ${products.length - authoritativeCount} 条需审核`);

  if (issues.length === 0) {
    console.log('    ✓ 无待改进项，数据质量良好！');
  } else {
    issues.forEach((issue, i) => console.log(`    ${i + 1}. ${issue}`));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  报告结束');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
