#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
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
  console.log('生成PPE数据下载完整报告');
  console.log('========================================');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  // Fetch all data
  const products = await fetchAll('ppe_products', '*');
  const manufacturers = await fetchAll('ppe_manufacturers', '*');
  const regulations = await fetchAll('ppe_regulations', '*');

  console.log(`产品数: ${products.length}`);
  console.log(`制造商数: ${manufacturers.length}`);
  console.log(`法规数: ${regulations.length}`);

  // Data source analysis
  const sourceMap = {};
  products.forEach(p => {
    const src = p.data_source || 'Unknown';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });

  // Country analysis
  const countryMap = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    countryMap[c] = (countryMap[c] || 0) + 1;
  });

  // Category analysis
  const categoryMap = {};
  products.forEach(p => {
    const cat = p.category || 'Unknown';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  // Risk level analysis
  const riskMap = {};
  products.forEach(p => {
    const r = p.risk_level || 'Unknown';
    riskMap[r] = (riskMap[r] || 0) + 1;
  });

  // Generate report
  const report = {
    download_time: new Date().toISOString(),
    statistics: {
      total_products: products.length,
      total_manufacturers: manufacturers.length,
      total_regulations: regulations.length,
    },
    data_sources: Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, percentage: (count / products.length * 100).toFixed(2) + '%' })),
    countries: Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count, percentage: (count / products.length * 100).toFixed(2) + '%' })),
    categories: Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, percentage: (count / products.length * 100).toFixed(2) + '%' })),
    risk_levels: Object.entries(riskMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, percentage: (count / products.length * 100).toFixed(2) + '%' })),
    field_completeness: {
      name: { filled: products.filter(p => p.name).length, total: products.length },
      category: { filled: products.filter(p => p.category).length, total: products.length },
      manufacturer_name: { filled: products.filter(p => p.manufacturer_name).length, total: products.length },
      country_of_origin: { filled: products.filter(p => p.country_of_origin).length, total: products.length },
      risk_level: { filled: products.filter(p => p.risk_level).length, total: products.length },
      product_code: { filled: products.filter(p => p.product_code).length, total: products.length },
      registration_number: { filled: products.filter(p => p.registration_number).length, total: products.length },
    },
    notes: [
      'FDA数据通过openFDA API获取，覆盖510(k)、Classification、Recall、Adverse Events等端点',
      'NMPA数据基于中国主要PPE制造商和产品生成',
      '巴西CAEPI数据通过gov.br官方CSV获取（当前数据源为空文件，使用备用制造商数据）',
      '日韩数据通过collect-jp-br-kr.js采集',
      'EUDAMED公开API需要注册，当前使用欧盟主要制造商补充数据',
      '法规标准数据已存在于数据库中（640条）',
      '风险数据为结构化示例数据，实际数据需从BLS/OSHA官方获取',
    ],
  };

  const reportFile = path.join(reportDir, `download_report_${timestamp}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');

  // Also generate field mapping
  const fieldMapping = {
    ppe_products: {
      id: 'UUID主键',
      name: '产品名称',
      model: '型号',
      category: '产品分类（呼吸/手部/身体/眼面部/头部/足部/躯干/听觉/其他）',
      subcategory: '子分类',
      description: '产品描述',
      manufacturer_name: '制造商名称',
      manufacturer_id: '制造商UUID外键',
      country_of_origin: '原产国（ISO 3166-1 alpha-2）',
      product_code: '产品代码',
      risk_level: '风险等级（low/medium/high）',
      registration_number: '注册证号',
      registration_authority: '注册机构',
      registration_date: '注册日期',
      expiry_date: '有效期至',
      status: '状态',
      certifications: '认证信息（JSON）',
      specifications: '规格参数（JSON）',
      data_source: '数据来源',
      data_source_url: '数据源URL',
      last_verified: '最后验证日期',
      data_confidence_level: '数据可信度（low/medium/high）',
      created_at: '创建时间',
      updated_at: '更新时间',
    },
    ppe_manufacturers: {
      id: 'UUID主键',
      name: '制造商名称',
      country: '国家',
      address: '地址',
      website: '网站',
      contact_info: '联系信息（JSON）',
      certifications: '认证信息（JSON）',
      data_source: '数据来源',
      company_profile: '公司简介',
      created_at: '创建时间',
      updated_at: '更新时间',
    },
    ppe_regulations: {
      id: 'UUID主键',
      name: '法规/标准名称',
      code: '法规/标准编号',
      region: '适用地区',
      description: '描述',
      effective_date: '生效日期',
      document_url: '文档URL',
      created_at: '创建时间',
    },
  };

  const mappingFile = path.join(reportDir, 'field_mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(fieldMapping, null, 2), 'utf-8');

  // Print summary
  console.log('\n========================================');
  console.log('报告生成完成');
  console.log('========================================');
  console.log(`报告文件: ${reportFile}`);
  console.log(`字段映射: ${mappingFile}`);
  console.log('\n数据统计:');
  console.log(`  产品总数: ${products.length.toLocaleString()}`);
  console.log(`  制造商总数: ${manufacturers.length.toLocaleString()}`);
  console.log(`  法规总数: ${regulations.length.toLocaleString()}`);
  console.log('\n数据来源TOP10:');
  Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, count], i) => {
      console.log(`  ${i + 1}. ${name}: ${count.toLocaleString()} (${(count / products.length * 100).toFixed(1)}%)`);
    });
  console.log('\n国家/地区TOP10:');
  Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, count], i) => {
      console.log(`  ${i + 1}. ${name}: ${count.toLocaleString()} (${(count / products.length * 100).toFixed(1)}%)`);
    });
  console.log('\n产品分类:');
  Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`  ${name}: ${count.toLocaleString()} (${(count / products.length * 100).toFixed(1)}%)`);
    });
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
