#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function analyzeDatabase() {
  console.log('============================================================');
  console.log('  MDLooker PPE 数据库现状分析');
  console.log('============================================================\n');

  // 1. 基础统计
  console.log('一、数据库基础统计');
  console.log('────────────────────────────────────────────────────');
  
  const { count: productCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  
  const { count: mfrCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  
  const { count: regCount } = await supabase
    .from('ppe_regulations')
    .select('*', { count: 'exact', head: true });

  console.log(`  ppe_products:     ${productCount?.toLocaleString() || 0} 条`);
  console.log(`  ppe_manufacturers: ${mfrCount?.toLocaleString() || 0} 条`);
  console.log(`  ppe_regulations:  ${regCount?.toLocaleString() || 0} 条`);
  console.log(`  总计:             ${((productCount || 0) + (mfrCount || 0) + (regCount || 0)).toLocaleString()} 条\n`);

  // 2. 数据来源分析
  console.log('二、数据来源分布（ppe_products）');
  console.log('────────────────────────────────────────────────────');
  
  const { data: sourceData } = await supabase
    .from('ppe_products')
    .select('data_source')
    .not('data_source', 'is', null);
  
  const sourceMap = {};
  sourceData?.forEach(p => {
    const source = p.data_source || 'Unknown';
    sourceMap[source] = (sourceMap[source] || 0) + 1;
  });
  
  const sortedSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1]);
  
  sortedSources.forEach(([source, count]) => {
    const pct = (count / (productCount || 1) * 100).toFixed(1);
    console.log(`  ${source.padEnd(25)}: ${count.toLocaleString().padStart(6)} (${pct}%)`);
  });
  console.log();

  // 3. NMPA数据专项分析
  console.log('三、NMPA数据专项分析');
  console.log('────────────────────────────────────────────────────');
  
  const { count: nmpaCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .ilike('data_source', '%NMPA%');
  
  console.log(`  NMPA相关产品总数: ${nmpaCount?.toLocaleString() || 0} 条`);
  console.log(`  占总产品比例: ${(nmpaCount / (productCount || 1) * 100).toFixed(2)}%`);
  
  // 获取NMPA数据样本
  const { data: nmpaSamples } = await supabase
    .from('ppe_products')
    .select('name, model, manufacturer_name, country_of_origin, category, subcategory')
    .ilike('data_source', '%NMPA%')
    .limit(10);
  
  console.log('\n  NMPA数据样本（前10条）:');
  nmpaSamples?.forEach((p, i) => {
    console.log(`    ${i+1}. ${p.name?.substring(0, 40) || 'N/A'} | ${p.manufacturer_name?.substring(0, 20) || 'N/A'} | ${p.country_of_origin || 'N/A'}`);
  });
  console.log();

  // 4. Local Authority数据专项分析
  console.log('四、Local Authority数据专项分析');
  console.log('────────────────────────────────────────────────────');
  
  const { count: localCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('data_source', 'Local Authority');
  
  console.log(`  Local Authority产品总数: ${localCount?.toLocaleString() || 0} 条`);
  console.log(`  占总产品比例: ${(localCount / (productCount || 1) * 100).toFixed(2)}%`);
  
  // 分析Local Authority数据的特征
  const { data: localSamples } = await supabase
    .from('ppe_products')
    .select('name, model, manufacturer_name, country_of_origin, category, subcategory, description')
    .eq('data_source', 'Local Authority')
    .limit(20);
  
  console.log('\n  Local Authority数据样本（前20条）:');
  localSamples?.forEach((p, i) => {
    console.log(`    ${i+1}. ${p.name?.substring(0, 35) || 'N/A'} | ${p.country_of_origin || 'N/A'} | ${p.category?.substring(0, 10) || 'N/A'}`);
  });
  
  // 分析Local Authority的国家分布
  const { data: localCountries } = await supabase
    .from('ppe_products')
    .select('country_of_origin')
    .eq('data_source', 'Local Authority')
    .not('country_of_origin', 'is', null);
  
  const countryMap = {};
  localCountries?.forEach(p => {
    const co = p.country_of_origin || 'Unknown';
    countryMap[co] = (countryMap[co] || 0) + 1;
  });
  
  console.log('\n  Local Authority数据国家分布:');
  Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([country, count]) => {
      console.log(`    ${country.padEnd(10)}: ${count.toLocaleString()} 条`);
    });
  console.log();

  // 5. 字段填充率分析
  console.log('五、字段填充率分析（ppe_products）');
  console.log('────────────────────────────────────────────────────');
  
  const fields = [
    'name', 'model', 'manufacturer_name', 'category', 'subcategory',
    'risk_level', 'country_of_origin', 'certifications', 'specifications',
    'data_source', 'related_standards', 'compliance_status'
  ];
  
  for (const field of fields) {
    const { count: filled } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .not(field, 'is', null);
    
    const pct = (filled / (productCount || 1) * 100).toFixed(1);
    console.log(`  ${field.padEnd(20)}: ${pct.padStart(6)}% (${filled?.toLocaleString()}/${productCount?.toLocaleString()})`);
  }
  console.log();

  // 6. 产品类别分布
  console.log('六、产品类别分布');
  console.log('────────────────────────────────────────────────────');
  
  const { data: catData } = await supabase
    .from('ppe_products')
    .select('category');
  
  const catMap = {};
  catData?.forEach(p => {
    const cat = p.category || '未分类';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  
  Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = (count / (productCount || 1) * 100).toFixed(1);
      console.log(`  ${cat.padEnd(15)}: ${count.toLocaleString().padStart(6)} (${pct}%)`);
    });
  console.log();

  // 7. 风险等级分布
  console.log('七、风险等级分布');
  console.log('────────────────────────────────────────────────────');
  
  const { count: highRisk } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('risk_level', 'high');
  
  const { count: medRisk } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('risk_level', 'medium');
  
  const { count: lowRisk } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('risk_level', 'low');
  
  const { count: nullRisk } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('risk_level', null);
  
  console.log(`  High (高风险):   ${highRisk?.toLocaleString().padStart(6)} (${(highRisk / (productCount || 1) * 100).toFixed(1)}%)`);
  console.log(`  Medium (中风险): ${medRisk?.toLocaleString().padStart(6)} (${(medRisk / (productCount || 1) * 100).toFixed(1)}%)`);
  console.log(`  Low (低风险):    ${lowRisk?.toLocaleString().padStart(6)} (${(lowRisk / (productCount || 1) * 100).toFixed(1)}%)`);
  console.log(`  Null (未分类):   ${nullRisk?.toLocaleString().padStart(6)} (${(nullRisk / (productCount || 1) * 100).toFixed(1)}%)\n`);

  // 8. 制造商分析
  console.log('八、制造商数据分析');
  console.log('────────────────────────────────────────────────────');
  
  const { count: mfrWithLegal } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
    .not('legal_representative', 'is', null);
  
  const { count: mfrWithWebsite } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
    .not('website', 'is', null);
  
  console.log(`  制造商总数:           ${mfrCount?.toLocaleString()} 条`);
  console.log(`  有法定代表人:         ${mfrWithLegal?.toLocaleString()} (${(mfrWithLegal / (mfrCount || 1) * 100).toFixed(1)}%)`);
  console.log(`  有网站信息:           ${mfrWithWebsite?.toLocaleString()} (${(mfrWithWebsite / (mfrCount || 1) * 100).toFixed(1)}%)\n`);

  console.log('============================================================');
  console.log('  分析完成');
  console.log('============================================================');
}

analyzeDatabase().catch(e => {
  console.error('分析失败:', e);
  process.exit(1);
});
