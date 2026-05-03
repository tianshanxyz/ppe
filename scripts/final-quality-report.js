const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchAll(table, columns, batchSize = 1000) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(page * batchSize, (page + 1) * batchSize - 1);
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
  console.log('PPE 数据库最终质量验证报告');
  console.log('========================================');
  console.log('生成时间:', new Date().toISOString());
  console.log('');

  // ===== 1. 数据量统计 =====
  console.log('1. 数据量统计');
  console.log('─'.repeat(50));
  const { count: productCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: regCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log(`  产品总数: ${productCount}`);
  console.log(`  制造商总数: ${mfrCount}`);
  console.log(`  法规总数: ${regCount}`);

  // ===== 2. 产品字段完整性 =====
  console.log('\n2. 产品字段完整性');
  console.log('─'.repeat(50));
  const products = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,country_of_origin,category,risk_level,description,registration_number,registration_authority,data_source,model,subcategory');

  const total = products.length;
  const fields = {
    '名称(name)': p => p.name && p.name.trim() !== '',
    '制造商(manufacturer_name)': p => p.manufacturer_name && p.manufacturer_name.trim() !== '' && p.manufacturer_name !== 'Unknown',
    '产品代码(product_code)': p => p.product_code && p.product_code.trim() !== '',
    '国家(country_of_origin)': p => p.country_of_origin && p.country_of_origin.trim() !== '' && p.country_of_origin !== 'Unknown',
    '类别(category)': p => p.category && p.category.trim() !== '' && p.category !== '其他',
    '风险等级(risk_level)': p => p.risk_level && p.risk_level.trim() !== '',
    '描述(description)': p => p.description && p.description.trim() !== '',
    '注册号(registration_number)': p => p.registration_number && p.registration_number.trim() !== '',
    '注册机构(registration_authority)': p => p.registration_authority && p.registration_authority.trim() !== '',
    '数据来源(data_source)': p => p.data_source && p.data_source.trim() !== '',
  };

  Object.entries(fields).forEach(([name, check]) => {
    const filled = products.filter(check).length;
    const pct = (filled / total * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(filled / total * 30)) + '░'.repeat(30 - Math.round(filled / total * 30));
    console.log(`  ${name}: ${bar} ${pct}% (${filled}/${total})`);
  });

  // ===== 3. 类别分布 =====
  console.log('\n3. 类别分布');
  console.log('─'.repeat(50));
  const catStats = {};
  products.forEach(p => {
    const cat = p.category || 'Unknown';
    catStats[cat] = (catStats[cat] || 0) + 1;
  });
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const pct = (v / total * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(v / total * 30)) + '░'.repeat(30 - Math.round(v / total * 30));
    console.log(`  ${k}: ${bar} ${pct}% (${v})`);
  });

  // ===== 4. 数据来源分布 =====
  console.log('\n4. 数据来源分布');
  console.log('─'.repeat(50));
  const srcStats = {};
  products.forEach(p => {
    const src = p.data_source || 'Unknown';
    srcStats[src] = (srcStats[src] || 0) + 1;
  });
  Object.entries(srcStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const pct = (v / total * 100).toFixed(1);
    console.log(`  ${k}: ${v} (${pct}%)`);
  });

  // ===== 5. 国家分布 =====
  console.log('\n5. 国家/地区分布');
  console.log('─'.repeat(50));
  const countryStats = {};
  const COUNTRY_NAMES = {
    'US': '美国', 'CN': '中国', 'CA': '加拿大', 'MY': '马来西亚', 'GB': '英国',
    'TW': '台湾', 'ID': '印尼', 'TH': '泰国', 'DE': '德国', 'KR': '韩国',
    'IN': '印度', 'FR': '法国', 'CH': '瑞士', 'AU': '澳大利亚', 'NZ': '新西兰',
    'VN': '越南', 'HK': '香港', 'IT': '意大利', 'ES': '西班牙', 'JP': '日本',
    'BR': '巴西', 'MX': '墨西哥', 'SE': '瑞典', 'IL': '以色列', 'IE': '爱尔兰',
    'NL': '荷兰', 'BE': '比利时', 'CZ': '捷克', 'SG': '新加坡', 'PH': '菲律宾',
    'PK': '巴基斯坦', 'BD': '孟加拉', 'LK': '斯里兰卡', 'ZA': '南非', 'PL': '波兰',
    'PT': '葡萄牙', 'DK': '丹麦', 'FI': '芬兰', 'NO': '挪威', 'AT': '奥地利',
  };
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
  });
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => {
    const name = COUNTRY_NAMES[k] || k;
    const pct = (v / total * 100).toFixed(1);
    console.log(`  ${name}(${k}): ${v} (${pct}%)`);
  });

  // ===== 6. 风险等级分布 =====
  console.log('\n6. 风险等级分布');
  console.log('─'.repeat(50));
  const riskStats = {};
  products.forEach(p => {
    const r = p.risk_level || 'Unknown';
    riskStats[r] = (riskStats[r] || 0) + 1;
  });
  Object.entries(riskStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const pct = (v / total * 100).toFixed(1);
    console.log(`  ${k}: ${v} (${pct}%)`);
  });

  // ===== 7. 注册机构分布 =====
  console.log('\n7. 注册机构分布');
  console.log('─'.repeat(50));
  const authStats = {};
  products.forEach(p => {
    const a = p.registration_authority || 'Unknown';
    authStats[a] = (authStats[a] || 0) + 1;
  });
  Object.entries(authStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const pct = (v / total * 100).toFixed(1);
    console.log(`  ${k}: ${v} (${pct}%)`);
  });

  // ===== 8. 重复检测 =====
  console.log('\n8. 重复检测');
  console.log('─'.repeat(50));
  const productGroups = {};
  products.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    if (!productGroups[key]) productGroups[key] = [];
    productGroups[key].push(p);
  });
  const duplicateGroups = Object.entries(productGroups).filter(([_, group]) => group.length > 1);
  const totalDuplicates = duplicateGroups.reduce((sum, [_, group]) => sum + group.length - 1, 0);
  console.log(`  唯一产品组: ${Object.keys(productGroups).length}`);
  console.log(`  重复组数: ${duplicateGroups.length}`);
  console.log(`  重复记录数: ${totalDuplicates}`);

  // ===== 9. 制造商统计 =====
  console.log('\n9. 制造商统计');
  console.log('─'.repeat(50));
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,data_source');
  const mfrCountryStats = {};
  manufacturers.forEach(m => {
    const c = m.country || 'Unknown';
    mfrCountryStats[c] = (mfrCountryStats[c] || 0) + 1;
  });
  console.log(`  制造商总数: ${manufacturers.length}`);
  console.log('  制造商国家分布:');
  Object.entries(mfrCountryStats).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    const name = COUNTRY_NAMES[k] || k;
    console.log(`    ${name}(${k}): ${v}`);
  });

  // ===== 10. 法规统计 =====
  console.log('\n10. 法规统计');
  console.log('─'.repeat(50));
  const regulations = await fetchAll('ppe_regulations', 'id,name,code,region');
  const regRegionStats = {};
  regulations.forEach(r => {
    const reg = r.region || 'Unknown';
    regRegionStats[reg] = (regRegionStats[reg] || 0) + 1;
  });
  console.log(`  法规总数: ${regulations.length}`);
  console.log('  法规地区分布:');
  Object.entries(regRegionStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`    ${k}: ${v}`);
  });

  // ===== 11. 数据质量评分 =====
  console.log('\n11. 数据质量评分');
  console.log('─'.repeat(50));

  const nameScore = products.filter(p => p.name && p.name.trim() !== '').length / total * 100;
  const mfrScore = products.filter(p => p.manufacturer_name && p.manufacturer_name.trim() !== '' && p.manufacturer_name !== 'Unknown').length / total * 100;
  const codeScore = products.filter(p => p.product_code && p.product_code.trim() !== '').length / total * 100;
  const countryScore = products.filter(p => p.country_of_origin && p.country_of_origin.trim() !== '' && p.country_of_origin !== 'Unknown').length / total * 100;
  const catScore = products.filter(p => p.category && p.category.trim() !== '' && p.category !== '其他').length / total * 100;
  const riskScore = products.filter(p => p.risk_level && p.risk_level.trim() !== '').length / total * 100;
  const descScore = products.filter(p => p.description && p.description.trim() !== '').length / total * 100;
  const regScore = products.filter(p => p.registration_authority && p.registration_authority.trim() !== '').length / total * 100;
  const sourceScore = products.filter(p => p.data_source && p.data_source.trim() !== '').length / total * 100;
  const dedupScore = (1 - totalDuplicates / total) * 100;

  const overallScore = (nameScore * 0.15 + mfrScore * 0.12 + codeScore * 0.10 + countryScore * 0.10 +
    catScore * 0.12 + riskScore * 0.08 + descScore * 0.08 + regScore * 0.08 +
    sourceScore * 0.07 + dedupScore * 0.10);

  console.log(`  名称完整性: ${nameScore.toFixed(1)}%`);
  console.log(`  制造商完整性: ${mfrScore.toFixed(1)}%`);
  console.log(`  产品代码完整性: ${codeScore.toFixed(1)}%`);
  console.log(`  国家完整性: ${countryScore.toFixed(1)}%`);
  console.log(`  分类准确性: ${catScore.toFixed(1)}%`);
  console.log(`  风险等级完整性: ${riskScore.toFixed(1)}%`);
  console.log(`  描述完整性: ${descScore.toFixed(1)}%`);
  console.log(`  注册机构完整性: ${regScore.toFixed(1)}%`);
  console.log(`  数据来源完整性: ${sourceScore.toFixed(1)}%`);
  console.log(`  去重率: ${dedupScore.toFixed(1)}%`);
  console.log('');
  console.log(`  ★ 综合数据质量评分: ${overallScore.toFixed(1)}/100`);

  // ===== 12. 改进建议 =====
  console.log('\n12. 改进建议');
  console.log('─'.repeat(50));
  if (catScore < 90) console.log(`  ⚠ 分类准确性(${catScore.toFixed(1)}%)偏低，"其他"类别仍需进一步细分`);
  if (descScore < 80) console.log(`  ⚠ 描述完整性(${descScore.toFixed(1)}%)偏低，建议从FDA API补充描述信息`);
  if (mfrScore < 90) console.log(`  ⚠ 制造商完整性(${mfrScore.toFixed(1)}%)偏低，建议从FDA 510k API补充制造商名称`);
  if (countryScore < 90) console.log(`  ⚠ 国家完整性(${countryScore.toFixed(1)}%)偏低，建议根据制造商信息补充国家数据`);
  if (totalDuplicates > 0) console.log(`  ⚠ 仍有${totalDuplicates}条重复记录，建议执行去重清理`);

  const missingRegions = [];
  if (!srcStats['TGA ARTG'] || srcStats['TGA ARTG'] < 100) missingRegions.push('澳大利亚TGA');
  if (!srcStats['EUDAMED'] || srcStats['EUDAMED'] < 100) missingRegions.push('欧盟EUDAMED');
  if (!srcStats['PMDA'] || srcStats['PMDA'] < 50) missingRegions.push('日本PMDA');
  if (!srcStats['ANVISA'] || srcStats['ANVISA'] < 50) missingRegions.push('巴西ANVISA');
  if (!srcStats['MFDS'] || srcStats['MFDS'] < 50) missingRegions.push('韩国MFDS');
  if (missingRegions.length > 0) {
    console.log(`  ⚠ 以下地区数据不足: ${missingRegions.join(', ')}，建议继续采集`);
  }

  console.log('\n========================================');
  console.log('质量验证报告生成完成');
  console.log('========================================');
}

main().catch(console.error);
