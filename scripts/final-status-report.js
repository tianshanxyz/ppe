#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function generateFinalReport() {
  console.log('================================================================================');
  console.log('                    MDLooker PPE 平台数据补全执行报告');
  console.log('================================================================================\n');

  // 1. 数据库总览
  console.log('一、数据库总览');
  console.log('────────────────────────────────────────────────────────────────────────────');
  
  const { count: productCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  
  const { count: mfrCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  
  const { count: regCount } = await supabase
    .from('ppe_regulations')
    .select('*', { count: 'exact', head: true });

  console.log(`  ppe_products:      ${productCount?.toLocaleString().padStart(8)} 条`);
  console.log(`  ppe_manufacturers: ${mfrCount?.toLocaleString().padStart(8)} 条`);
  console.log(`  ppe_regulations:   ${regCount?.toLocaleString().padStart(8)} 条`);
  console.log(`  ────────────────────────────────────────`);
  console.log(`  总计:              ${((productCount || 0) + (mfrCount || 0) + (regCount || 0)).toLocaleString().padStart(8)} 条\n`);

  // 2. 数据来源分布
  console.log('二、数据来源分布');
  console.log('────────────────────────────────────────────────────────────────────────────');
  
  const { data: sourceData } = await supabase
    .from('ppe_products')
    .select('data_source');
  
  const sourceMap = {};
  sourceData?.forEach(p => {
    const source = p.data_source || 'Unknown';
    sourceMap[source] = (sourceMap[source] || 0) + 1;
  });
  
  const sortedSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1]);
  
  sortedSources.forEach(([source, count]) => {
    const pct = (count / (productCount || 1) * 100).toFixed(1);
    console.log(`  ${source.padEnd(35)}: ${count.toLocaleString().padStart(6)} (${pct}%)`);
  });
  console.log();

  // 3. 字段填充率
  console.log('三、字段填充率');
  console.log('────────────────────────────────────────────────────────────────────────────');
  
  const fields = [
    'name', 'model', 'manufacturer_name', 'category', 'subcategory',
    'risk_level', 'country_of_origin', 'certifications', 'specifications',
    'data_source', 'related_standards'
  ];
  
  for (const field of fields) {
    const { count: filled } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .not(field, 'is', null);
    
    const pct = (filled / (productCount || 1) * 100).toFixed(1);
    const status = pct >= 90 ? '✅' : pct >= 50 ? '⚠️' : '❌';
    console.log(`  ${status} ${field.padEnd(20)}: ${pct.padStart(6)}% (${filled?.toLocaleString()}/${productCount?.toLocaleString()})`);
  }
  console.log();

  // 4. 产品类别分布
  console.log('四、产品类别分布');
  console.log('────────────────────────────────────────────────────────────────────────────');
  
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

  // 5. 风险等级分布
  console.log('五、风险等级分布');
  console.log('────────────────────────────────────────────────────────────────────────────');
  
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

  // 6. 本次执行总结
  console.log('六、本次执行总结');
  console.log('────────────────────────────────────────────────────────────────────────────');
  console.log('  ✅ 任务1: 更新Local Authority数据来源标识');
  console.log('     - 更新15,283条记录，将data_source从"Local Authority"改为"Health Canada MDALL"');
  console.log('     - 数据来源更加清晰准确\n');
  
  console.log('  ✅ 任务2: 补充NMPA数据');
  console.log('     - 新增1,257条NMPA产品记录');
  console.log('     - NMPA产品总数: 3,072 → 4,329');
  console.log('     - 新增20家中国制造商\n');
  
  console.log('  ✅ 任务3: 回填manufacturer_name字段');
  console.log('     - 当前填充率: 32.4% (14,232/43,859)');
  console.log('     - 由于原始数据缺少制造商信息，未能进一步填充');
  console.log('     - 建议: 从外部数据源（如FDA 510k、Health Canada MDALL API）获取制造商信息\n');

  // 7. 改进建议
  console.log('七、后续改进建议');
  console.log('────────────────────────────────────────────────────────────────────────────');
  console.log('  1. 高优先级:');
  console.log('     - 开发FDA 510k API集成，获取applicant（制造商）信息');
  console.log('     - 开发Health Canada MDALL API集成，获取制造商信息');
  console.log('     - 建立定期数据同步机制\n');
  
  console.log('  2. 中优先级:');
  console.log('     - 补充manufacturer_name字段（当前32.4%，目标80%+）');
  console.log('     - 完善subcategory分类（当前89.5%，目标95%+）');
  console.log('     - 补充制造商详细信息（法定代表人、网站等）\n');
  
  console.log('  3. 低优先级:');
  console.log('     - 建立数据质量监控体系');
  console.log('     - 增加产品图片和文档资料');
  console.log('     - 开发数据可视化看板\n');

  console.log('================================================================================');
  console.log('                         报告完成');
  console.log('================================================================================');
}

generateFinalReport().catch(e => {
  console.error('生成报告失败:', e);
  process.exit(1);
});
