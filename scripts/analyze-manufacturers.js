#!/usr/bin/env node
/**
 * 分析制造商数据缺失情况
 */

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
  console.log('制造商数据缺失分析');
  console.log('========================================');

  const manufacturers = await fetchAll('ppe_manufacturers', '*');
  const products = await fetchAll('ppe_products', 'id,manufacturer_name,country_of_origin');

  console.log(`\n制造商总数: ${manufacturers.length}`);
  console.log(`产品总数: ${products.length}`);

  // 统计产品中的制造商名称
  const productMfrNames = new Set();
  products.forEach(p => {
    if (p.manufacturer_name) {
      productMfrNames.add(p.manufacturer_name.trim());
    }
  });
  console.log(`\n产品中的制造商名称数: ${productMfrNames.size}`);

  // 统计已存在的制造商
  const existingMfrNames = new Set();
  manufacturers.forEach(m => {
    if (m.name) {
      existingMfrNames.add(m.name.trim());
    }
  });
  console.log(`已入库的制造商数: ${existingMfrNames.size}`);

  // 找出缺失的制造商
  const missingMfrs = [];
  productMfrNames.forEach(name => {
    if (!existingMfrNames.has(name)) {
      missingMfrs.push(name);
    }
  });
  console.log(`\n缺失制造商数: ${missingMfrs.length}`);

  // 统计制造商字段完整度
  let withAddress = 0;
  let withWebsite = 0;
  let withContact = 0;
  let withCertifications = 0;

  manufacturers.forEach(m => {
    if (m.address && typeof m.address === 'string' && m.address.trim()) withAddress++;
    if (m.website && typeof m.website === 'string' && m.website.trim()) withWebsite++;
    if (m.contact_info && typeof m.contact_info === 'string' && m.contact_info.trim()) withContact++;
    if (m.certifications && typeof m.certifications === 'string' && m.certifications.trim()) withCertifications++;
  });

  console.log('\n制造商字段完整度:');
  console.log(`  有地址: ${withAddress} (${(withAddress/manufacturers.length*100).toFixed(1)}%)`);
  console.log(`  有网站: ${withWebsite} (${(withWebsite/manufacturers.length*100).toFixed(1)}%)`);
  console.log(`  有联系方式: ${withContact} (${(withContact/manufacturers.length*100).toFixed(1)}%)`);
  console.log(`  有认证信息: ${withCertifications} (${(withCertifications/manufacturers.length*100).toFixed(1)}%)`);

  // 按国家统计
  const countryMap = {};
  manufacturers.forEach(m => {
    const c = m.country || 'Unknown';
    countryMap[c] = (countryMap[c] || 0) + 1;
  });

  console.log('\n制造商国家分布TOP10:');
  Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([country, count], i) => {
      console.log(`  ${i+1}. ${country}: ${count}`);
    });

  // 输出部分缺失制造商示例
  console.log('\n缺失制造商示例 (前20个):');
  missingMfrs.slice(0, 20).forEach((name, i) => {
    console.log(`  ${i+1}. ${name}`);
  });

  // 保存缺失制造商列表
  const fs = require('fs');
  const path = require('path');
  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(reportDir, `missing_manufacturers_${timestamp}.json`);
  fs.writeFileSync(outputFile, JSON.stringify({
    analysis_time: new Date().toISOString(),
    total_product_manufacturers: productMfrNames.size,
    existing_manufacturers: existingMfrNames.size,
    missing_manufacturers: missingMfrs.length,
    missing_list: missingMfrs,
  }, null, 2));

  console.log(`\n缺失制造商列表已保存: ${outputFile}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
