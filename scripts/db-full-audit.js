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

async function main() {
  console.log('========================================');
  console.log('数据库全面审计 - 数据质量检查');
  console.log('========================================');
  console.log(`审计时间: ${new Date().toISOString()}\n`);

  const products = await fetchAll('ppe_products', 'id,name,category,manufacturer_name,country_of_origin,product_code,registration_number,data_source,specifications,risk_level,subcategory');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,website,contact_info,certifications,business_scope,established_date,company_profile,data_source,data_confidence_level');

  console.log(`产品总数: ${products.length}`);
  console.log(`制造商总数: ${manufacturers.length}\n`);

  // ===== 1. 公司名异常检测 =====
  console.log('========== 1. 公司名异常检测 ==========');
  const suspiciousMfrs = [];
  const mfrNameIssues = [];

  manufacturers.forEach(m => {
    const name = m.name || '';
    // 检测纯数字编号的公司名（批量生成的假名）
    if (/^\w+ \d{3,}$/.test(name)) {
      mfrNameIssues.push({ id: m.id, name, country: m.country, issue: '编号式公司名（疑似批量生成）' });
    }
    // 检测过短的公司名
    if (name.length < 3) {
      mfrNameIssues.push({ id: m.id, name, country: m.country, issue: '公司名过短' });
    }
    // 检测包含测试/示例的公司名
    if (/test|sample|demo|example|测试|示例|xxx|aaa|bbb/i.test(name)) {
      mfrNameIssues.push({ id: m.id, name, country: m.country, issue: '测试/示例公司名' });
    }
    // 检测Unknown公司名
    if (name === 'Unknown' || name === 'unknown' || name.trim() === '') {
      mfrNameIssues.push({ id: m.id, name, country: m.country, issue: '未知/空公司名' });
    }
  });

  // 产品中的公司名问题
  const productMfrIssues = [];
  const mfrNamesInProducts = new Map();
  products.forEach(p => {
    const name = p.manufacturer_name || '';
    if (!mfrNamesInProducts.has(name)) mfrNamesInProducts.set(name, []);
    mfrNamesInProducts.get(name).push(p.id);

    if (/^\w+ \d{3,}$/.test(name)) {
      productMfrIssues.push({ product_id: p.id, name: p.name, manufacturer_name: name, country: p.country_of_origin, issue: '编号式公司名' });
    }
    if (name === 'Unknown' || name === 'unknown' || name.trim() === '') {
      productMfrIssues.push({ product_id: p.id, name: p.name, manufacturer_name: name, country: p.country_of_origin, issue: '未知公司名' });
    }
    if (/test|sample|demo|example/i.test(name)) {
      productMfrIssues.push({ product_id: p.id, name: p.name, manufacturer_name: name, country: p.country_of_origin, issue: '测试公司名' });
    }
  });

  console.log(`  制造商表异常公司名: ${mfrNameIssues.length} 条`);
  mfrNameIssues.slice(0, 30).forEach(i => console.log(`    [${i.id}] "${i.name}" (${i.country}) - ${i.issue}`));
  if (mfrNameIssues.length > 30) console.log(`    ... 还有 ${mfrNameIssues.length - 30} 条`);

  console.log(`  产品表异常公司名: ${productMfrIssues.length} 条`);
  productMfrIssues.slice(0, 20).forEach(i => console.log(`    [${i.product_id}] "${i.manufacturer_name}" (${i.country}) - ${i.issue}`));
  if (productMfrIssues.length > 20) console.log(`    ... 还有 ${productMfrIssues.length - 20} 条`);

  // ===== 2. 产品名异常检测 =====
  console.log('\n========== 2. 产品名异常检测 ==========');
  const productNameIssues = [];

  products.forEach(p => {
    const name = p.name || '';
    // 检测编号式产品名
    if (/^\w+ \d{3,}$/.test(name.split(' ').slice(0, 2).join(' ')) && name.split(' ').length <= 3) {
      productNameIssues.push({ id: p.id, name, manufacturer_name: p.manufacturer_name, issue: '编号式产品名（疑似批量生成）' });
    }
    // 检测过短的产品名
    if (name.length < 5) {
      productNameIssues.push({ id: p.id, name, manufacturer_name: p.manufacturer_name, issue: '产品名过短' });
    }
    // 检测重复词
    const words = name.split(' ');
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (words.length > 2 && uniqueWords.size < words.length * 0.5) {
      productNameIssues.push({ id: p.id, name, manufacturer_name: p.manufacturer_name, issue: '产品名含大量重复词' });
    }
    // 检测测试/示例
    if (/test|sample|demo|example|测试|示例/i.test(name)) {
      productNameIssues.push({ id: p.id, name, manufacturer_name: p.manufacturer_name, issue: '测试/示例产品名' });
    }
    // 检测公司名+编号式产品名模式
    const mfrName = p.manufacturer_name || '';
    if (mfrName && name.startsWith(mfrName) && /^\w+ \d{3}/.test(mfrName)) {
      productNameIssues.push({ id: p.id, name, manufacturer_name: p.manufacturer_name, issue: '批量生成公司+产品名' });
    }
  });

  console.log(`  产品名异常: ${productNameIssues.length} 条`);
  productNameIssues.slice(0, 20).forEach(i => console.log(`    [${i.id}] "${i.name}" - ${i.issue}`));
  if (productNameIssues.length > 20) console.log(`    ... 还有 ${productNameIssues.length - 20} 条`);

  // ===== 3. 批量生成数据统计 =====
  console.log('\n========== 3. 批量生成数据统计 ==========');
  const generatedMfrs = new Set();
  const generatedProducts = [];

  products.forEach(p => {
    const mfrName = p.manufacturer_name || '';
    // 检测编号式公司名模式
    if (/^(AusSafe|OzPPE|AUSProtect|TGAReg|JPNProtect|PMDAReg|NihonGuard|TokyoSafe|KORProtect|MFDSReg|SeoulGuard|KoreaPPE|IndiaSafe|BharatPPE|HindSafe|ProIndia|JapanSafe|NihonPPE|TokyoGuard|OsakaSafe|KoreaSafe|KorPPE|SeoulGuard|BusanSafe|AusPPE|SafeAUS|OzSafety|AUSGuard|FallSafe|FallGuard) \d{3}$/.test(mfrName)) {
      generatedMfrs.add(mfrName);
      generatedProducts.push(p);
    }
  });

  console.log(`  批量生成公司数: ${generatedMfrs.size}`);
  console.log(`  批量生成产品数: ${generatedProducts.length}`);
  console.log(`  占总产品比例: ${((generatedProducts.length / products.length) * 100).toFixed(1)}%`);

  // 按国家统计批量生成数据
  const genByCountry = {};
  generatedProducts.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    genByCountry[c] = (genByCountry[c] || 0) + 1;
  });
  console.log('  批量生成数据按国家分布:');
  Object.entries(genByCountry).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
    console.log(`    ${c}: ${n} 条`);
  });

  // ===== 4. 重复数据检测 =====
  console.log('\n========== 4. 重复数据检测 ==========');
  const nameMfrKey = new Map();
  const duplicates = [];
  products.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}`;
    if (nameMfrKey.has(key)) {
      duplicates.push({ id1: nameMfrKey.get(key), id2: p.id, name: p.name, manufacturer: p.manufacturer_name });
    } else {
      nameMfrKey.set(key, p.id);
    }
  });
  console.log(`  重复产品: ${duplicates.length} 条`);
  duplicates.slice(0, 10).forEach(d => console.log(`    [${d.id1}] vs [${d.id2}] "${d.name}" by ${d.manufacturer}`));

  // ===== 5. 分类错误检测 =====
  console.log('\n========== 5. 分类错误检测 ==========');
  const categoryMismatches = [];
  products.forEach(p => {
    const name = (p.name || '').toLowerCase();
    const cat = p.category || '';
    let expectedCat = '';
    if (/respirat|mask|n95|ffp|scba|breathing|papr|filter|cartridge/i.test(name)) expectedCat = '呼吸防护装备';
    else if (/glove|hand|luva|gauntlet/i.test(name)) expectedCat = '手部防护装备';
    else if (/goggle|eye|face shield|visor|spectacle/i.test(name)) expectedCat = '眼面部防护装备';
    else if (/helmet|head|hard hat|bump cap/i.test(name)) expectedCat = '头部防护装备';
    else if (/boot|foot|shoe|footwear|wellington/i.test(name)) expectedCat = '足部防护装备';
    else if (/earplug|hearing|ear muff/i.test(name)) expectedCat = '听觉防护装备';
    else if (/fall|harness|lanyard|anchor|srl|lifeline/i.test(name)) expectedCat = '坠落防护装备';
    else if (/coverall|suit|body|gown|chemical suit|arc flash/i.test(name)) expectedCat = '身体防护装备';
    else if (/vest|jacket|coat|shirt|rainwear/i.test(name)) expectedCat = '躯干防护装备';

    if (expectedCat && cat !== expectedCat) {
      categoryMismatches.push({ id: p.id, name: p.name, currentCat: cat, expectedCat, manufacturer: p.manufacturer_name });
    }
  });
  console.log(`  分类不匹配: ${categoryMismatches.length} 条`);
  categoryMismatches.slice(0, 15).forEach(c => console.log(`    [${c.id}] "${c.name}" 当前:${c.currentCat} 应为:${c.expectedCat}`));

  // ===== 6. 数据完整性检测 =====
  console.log('\n========== 6. 数据完整性检测 ==========');
  let emptyName = 0, emptyCategory = 0, emptyMfr = 0, emptyCountry = 0, emptyRisk = 0, emptyRegAuth = 0, emptyDataSource = 0;
  products.forEach(p => {
    if (!p.name || p.name.trim() === '') emptyName++;
    if (!p.category || p.category.trim() === '') emptyCategory++;
    if (!p.manufacturer_name || p.manufacturer_name.trim() === '' || p.manufacturer_name === 'Unknown') emptyMfr++;
    if (!p.country_of_origin || p.country_of_origin.trim() === '') emptyCountry++;
    if (!p.risk_level || p.risk_level.trim() === '') emptyRisk++;
    if (!p.registration_authority || p.registration_authority.trim() === '') emptyRegAuth++;
    if (!p.data_source || p.data_source.trim() === '') emptyDataSource++;
  });
  console.log(`  空产品名: ${emptyName}`);
  console.log(`  空分类: ${emptyCategory}`);
  console.log(`  空公司名/Unknown: ${emptyMfr} (${((emptyMfr / products.length) * 100).toFixed(1)}%)`);
  console.log(`  空国家: ${emptyCountry}`);
  console.log(`  空风险等级: ${emptyRisk}`);
  console.log(`  空注册机构: ${emptyRegAuth}`);
  console.log(`  空数据来源: ${emptyDataSource}`);

  // ===== 7. 制造商信息完整性 =====
  console.log('\n========== 7. 制造商信息完整性 ==========');
  let mfrNoWebsite = 0, mfrNoContact = 0, mfrNoCert = 0, mfrNoScope = 0, mfrNoProfile = 0, mfrNoDate = 0;
  const trim = v => typeof v === 'string' ? v.trim() : (Array.isArray(v) ? v.join(',').trim() : '');
  manufacturers.forEach(m => {
    if (!m.website || trim(m.website) === '') mfrNoWebsite++;
    if (!m.contact_info || trim(m.contact_info) === '') mfrNoContact++;
    if (!m.certifications || trim(m.certifications) === '') mfrNoCert++;
    if (!m.business_scope || trim(m.business_scope) === '') mfrNoScope++;
    if (!m.company_profile || trim(m.company_profile) === '') mfrNoProfile++;
    if (!m.established_date || trim(m.established_date) === '') mfrNoDate++;
  });
  console.log(`  无网站: ${mfrNoWebsite}/${manufacturers.length} (${((mfrNoWebsite / manufacturers.length) * 100).toFixed(1)}%)`);
  console.log(`  无联系方式: ${mfrNoContact}/${manufacturers.length} (${((mfrNoContact / manufacturers.length) * 100).toFixed(1)}%)`);
  console.log(`  无认证信息: ${mfrNoCert}/${manufacturers.length} (${((mfrNoCert / manufacturers.length) * 100).toFixed(1)}%)`);
  console.log(`  无经营范围: ${mfrNoScope}/${manufacturers.length} (${((mfrNoScope / manufacturers.length) * 100).toFixed(1)}%)`);
  console.log(`  无公司简介: ${mfrNoProfile}/${manufacturers.length} (${((mfrNoProfile / manufacturers.length) * 100).toFixed(1)}%)`);
  console.log(`  无成立日期: ${mfrNoDate}/${manufacturers.length} (${((mfrNoDate / manufacturers.length) * 100).toFixed(1)}%)`);

  // ===== 8. 中国企业数据缺口分析 =====
  console.log('\n========== 8. 中国企业数据缺口分析 ==========');
  const cnProducts = products.filter(p => p.country_of_origin === 'CN');
  const cnMfrs = manufacturers.filter(m => m.country === 'CN');
  const cnMfrNames = new Set(cnMfrs.map(m => m.name));
  const cnProductMfrNames = new Set(cnProducts.map(p => p.manufacturer_name));

  console.log(`  中国产品数: ${cnProducts.length}`);
  console.log(`  中国制造商数: ${cnMfrs.length}`);
  console.log(`  产品中涉及的中国制造商: ${cnProductMfrNames.size}`);

  // 中国制造商信息完整性
  let cnNoWebsite = 0, cnNoContact = 0, cnNoCert = 0, cnNoScope = 0, cnNoProfile = 0;
  cnMfrs.forEach(m => {
    if (!m.website || trim(m.website) === '') cnNoWebsite++;
    if (!m.contact_info || trim(m.contact_info) === '') cnNoContact++;
    if (!m.certifications || trim(m.certifications) === '') cnNoCert++;
    if (!m.business_scope || trim(m.business_scope) === '') cnNoScope++;
    if (!m.company_profile || trim(m.company_profile) === '') cnNoProfile++;
  });
  console.log(`  中国制造商无网站: ${cnNoWebsite}/${cnMfrs.length} (${((cnNoWebsite / cnMfrs.length) * 100).toFixed(1)}%)`);
  console.log(`  中国制造商无联系方式: ${cnNoContact}/${cnMfrs.length} (${((cnNoContact / cnMfrs.length) * 100).toFixed(1)}%)`);
  console.log(`  中国制造商无认证信息: ${cnNoCert}/${cnMfrs.length} (${((cnNoCert / cnMfrs.length) * 100).toFixed(1)}%)`);
  console.log(`  中国制造商无经营范围: ${cnNoScope}/${cnMfrs.length} (${((cnNoScope / cnMfrs.length) * 100).toFixed(1)}%)`);
  console.log(`  中国制造商无公司简介: ${cnNoProfile}/${cnMfrs.length} (${((cnNoProfile / cnMfrs.length) * 100).toFixed(1)}%)`);

  // 列出信息最不完整的中国制造商
  const cnMfrCompleteness = cnMfrs.map(m => {
    let score = 0;
    if (m.website && m.website.trim()) score++;
    if (m.contact_info && m.contact_info.trim()) score++;
    if (m.certifications && m.certifications.trim()) score++;
    if (m.business_scope && m.business_scope.trim()) score++;
    if (m.company_profile && m.company_profile.trim()) score++;
    if (m.established_date && m.established_date.trim()) score++;
    return { name: m.name, score, total: 6 };
  }).sort((a, b) => a.score - b.score);

  console.log('\n  信息最不完整的中国制造商(前20):');
  cnMfrCompleteness.slice(0, 20).forEach(m => {
    console.log(`    "${m.name}" 完整度: ${m.score}/${m.total}`);
  });

  // ===== 9. 各国数据缺口总览 =====
  console.log('\n========== 9. 各国数据缺口总览 ==========');
  const countryStats = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    if (!countryStats[c]) countryStats[c] = { total: 0, withMfr: 0, withReg: 0, withSpec: 0, unknownMfr: 0 };
    countryStats[c].total++;
    if (p.manufacturer_name && p.manufacturer_name !== 'Unknown') countryStats[c].withMfr++;
    if (p.registration_number && p.registration_number.trim()) countryStats[c].withReg++;
    if (p.specifications && p.specifications.trim()) countryStats[c].withSpec++;
    if (!p.manufacturer_name || p.manufacturer_name === 'Unknown') countryStats[c].unknownMfr++;
  });

  const majorCountries = ['CN', 'US', 'EU', 'JP', 'KR', 'BR', 'AU', 'IN', 'GB', 'CA', 'DE', 'FR', 'IT'];
  majorCountries.forEach(c => {
    const s = countryStats[c] || { total: 0, withMfr: 0, withReg: 0, withSpec: 0, unknownMfr: 0 };
    const mfrPct = s.total > 0 ? ((s.withMfr / s.total) * 100).toFixed(1) : '0';
    const regPct = s.total > 0 ? ((s.withReg / s.total) * 100).toFixed(1) : '0';
    console.log(`  ${c}: ${s.total}条, 有制造商:${mfrPct}%, 有注册号:${regPct}%, Unknown制造商:${s.unknownMfr}`);
  });

  // ===== 10. 审计总结 =====
  console.log('\n========================================');
  console.log('审计总结');
  console.log('========================================');
  console.log(`  ❌ 编号式公司名(批量生成): ${generatedMfrs.size} 个公司, ${generatedProducts.length} 条产品`);
  console.log(`  ❌ 产品名异常: ${productNameIssues.length} 条`);
  console.log(`  ❌ 分类不匹配: ${categoryMismatches.length} 条`);
  console.log(`  ⚠️ 重复产品: ${duplicates.length} 条`);
  console.log(`  ⚠️ Unknown公司名产品: ${emptyMfr} 条`);
  console.log(`  ⚠️ 中国制造商信息不完整: ${cnNoProfile}/${cnMfrs.length} 无简介`);
  console.log(`\n  建议操作:`);
  console.log(`  1. 清理编号式批量生成数据或替换为真实公司名`);
  console.log(`  2. 修复分类不匹配的产品`);
  console.log(`  3. 补全中国制造商的企查查/信用代码信息`);
  console.log(`  4. 去重处理`);
}

main().catch(console.error);
