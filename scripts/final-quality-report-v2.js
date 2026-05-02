#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           PPE数据库最终数据质量报告                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalManufacturers } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: totalRegulations } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log('━━━ 一、数据库总体统计 ━━━\n');
  console.log(`  产品总数:       ${totalProducts?.toLocaleString()}`);
  console.log(`  制造商总数:     ${totalManufacturers?.toLocaleString()}`);
  console.log(`  法规/标准总数:  ${totalRegulations?.toLocaleString()}`);

  // ===== 字段完整性 =====
  console.log('\n━━━ 二、字段完整性分析 ━━━\n');

  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: unknownCountry } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', 'Unknown');
  const { count: nullCountry } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('country_of_origin', null);
  const { count: nullCategory } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('category', null);
  const { count: nullSub } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('subcategory', null);
  const { count: nullRisk } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('risk_level', null);
  const { count: nullName } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('name', null);
  const { count: nullProductCode } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: otherCat } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  const t = totalProducts || 1;
  const fields = [
    { name: 'name (产品名称)', missing: nullName || 0 },
    { name: 'category (分类)', missing: nullCategory || 0 },
    { name: 'subcategory (子分类)', missing: nullSub || 0 },
    { name: 'manufacturer_name (制造商)', missing: nullMfr || 0 },
    { name: 'country_of_origin (国家)', missing: (unknownCountry || 0) + (nullCountry || 0) },
    { name: 'risk_level (风险等级)', missing: nullRisk || 0 },
    { name: 'product_code (产品代码)', missing: nullProductCode || 0 },
  ];

  for (const f of fields) {
    const pct = (f.missing / t * 100).toFixed(1);
    const filled = ((1 - f.missing / t) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(parseFloat(filled) / 5)) + '░'.repeat(20 - Math.round(parseFloat(filled) / 5));
    console.log(`  ${f.name}:`);
    console.log(`    [${bar}] ${filled}% 填充 (${f.missing.toLocaleString()} 缺失, ${pct}%)`);
  }

  // ===== 分类分布 =====
  console.log('\n━━━ 三、产品分类分布 ━━━\n');

  const categories = ['呼吸防护装备', '手部防护装备', '身体防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '其他'];
  for (const cat of categories) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', cat);
    const pct = ((count || 0) / t * 100).toFixed(1);
    console.log(`  ${cat}: ${count?.toLocaleString()} (${pct}%)`);
  }

  // ===== 数据来源分布 =====
  console.log('\n━━━ 四、数据来源分布 ━━━\n');

  const { data: sourceData } = await supabase
    .from('ppe_products')
    .select('data_source');

  const sourceCounts = {};
  for (const p of (sourceData || [])) {
    const s = p.data_source || 'Unknown';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  for (const [source, count] of sortedSources) {
    const pct = (count / t * 100).toFixed(1);
    console.log(`  ${source}: ${count.toLocaleString()} (${pct}%)`);
  }

  // ===== 国家分布 =====
  console.log('\n━━━ 五、国家/地区分布 ━━━\n');

  const { data: countryData } = await supabase
    .from('ppe_products')
    .select('country_of_origin');

  const countryCounts = {};
  for (const p of (countryData || [])) {
    const c = p.country_of_origin || 'Unknown';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  }

  const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const countryNames = {
    US: '美国', CA: '加拿大', CN: '中国', GB: '英国', DE: '德国',
    JP: '日本', KR: '韩国', BR: '巴西', AU: '澳大利亚', IN: '印度',
    MY: '马来西亚', TH: '泰国', FR: '法国', IT: '意大利', ES: '西班牙',
    NL: '荷兰', SE: '瑞典', Unknown: '未知', SEA: '东南亚',
  };

  for (const [code, count] of sortedCountries) {
    const pct = (count / t * 100).toFixed(1);
    const name = countryNames[code] || code;
    console.log(`  ${name} (${code}): ${count.toLocaleString()} (${pct}%)`);
  }

  // ===== 风险等级分布 =====
  console.log('\n━━━ 六、风险等级分布 ━━━\n');

  const riskLevels = ['low', 'medium', 'high'];
  for (const risk of riskLevels) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('risk_level', risk);
    const pct = ((count || 0) / t * 100).toFixed(1);
    const label = { low: '低风险', medium: '中风险', high: '高风险' }[risk];
    console.log(`  ${label} (${risk}): ${count?.toLocaleString()} (${pct}%)`);
  }

  // ===== 优化历程 =====
  console.log('\n━━━ 七、数据质量优化历程 ━━━\n');
  console.log('  ┌─────────────────────────┬──────────┬──────────┬──────────┐');
  console.log('  │ 指标                     │ 优化前   │ 优化后   │ 改善     │');
  console.log('  ├─────────────────────────┼──────────┼──────────┼──────────┤');
  console.log(`  │ manufacturer_name缺失率  │ 36.1%    │ ${((nullMfr || 0) / t * 100).toFixed(1).padStart(7)}% │ ${((36.1 - (nullMfr || 0) / t * 100)).toFixed(1).padStart(7)}% │`);
  console.log(`  │ country Unknown率        │ 5.1%     │ ${((unknownCountry || 0) / t * 100).toFixed(1).padStart(7)}% │ ${((5.1 - (unknownCountry || 0) / t * 100)).toFixed(1).padStart(7)}% │`);
  console.log(`  │ "其他"分类占比           │ 46.8%    │ ${((otherCat || 0) / t * 100).toFixed(1).padStart(7)}% │ ${((46.8 - (otherCat || 0) / t * 100)).toFixed(1).padStart(7)}% │`);
  console.log('  └─────────────────────────┴──────────┴──────────┴──────────┘');

  // ===== 剩余待改进项 =====
  console.log('\n━━━ 八、剩余待改进项 ━━━\n');
  console.log(`  1. manufacturer_name仍有 ${(nullMfr || 0).toLocaleString()} 条缺失 (${((nullMfr || 0) / t * 100).toFixed(1)}%)`);
  console.log(`     - 主要来源: Health Canada MDALL, NMPA, FDA`);
  console.log(`     - 建议: 继续使用FDA/HC API补充，或手动补充`);
  console.log(`  2. country_of_origin仍有 ${((unknownCountry || 0) + (nullCountry || 0)).toLocaleString()} 条未知 (${(((unknownCountry || 0) + (nullCountry || 0)) / t * 100).toFixed(1)}%)`);
  console.log(`     - 主要来源: Health Canada MDALL`);
  console.log(`     - 建议: 根据制造商名称推断国家`);
  console.log(`  3. "其他"分类仍有 ${(otherCat || 0).toLocaleString()} 条 (${((otherCat || 0) / t * 100).toFixed(1)}%)`);
  console.log(`     - 建议: 进一步细化分类规则，或手动审核`);
  console.log(`  4. product_code仍有 ${(nullProductCode || 0).toLocaleString()} 条缺失 (${((nullProductCode || 0) / t * 100).toFixed(1)}%)`);
  console.log(`     - 建议: 通过FDA classification API补充`);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                   报告生成完毕                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
