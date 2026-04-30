#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function updateDataSource() {
  console.log('============================================================');
  console.log('  更新 Local Authority 数据来源标识');
  console.log('============================================================\n');

  // 1. 统计更新前的数据
  console.log('一、更新前统计');
  console.log('────────────────────────────────────────────────────');
  
  const { count: localCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('data_source', 'Local Authority');
  
  const { count: hcCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('data_source', 'Health Canada MDALL');
  
  console.log(`  Local Authority:     ${localCount?.toLocaleString()} 条`);
  console.log(`  Health Canada MDALL: ${hcCount?.toLocaleString()} 条\n`);

  // 2. 执行更新
  console.log('二、执行更新');
  console.log('────────────────────────────────────────────────────');
  
  const { data, error } = await supabase
    .from('ppe_products')
    .update({ data_source: 'Health Canada MDALL' })
    .eq('data_source', 'Local Authority')
    .select();

  if (error) {
    console.log(`  ❌ 更新失败: ${error.message}\n`);
    return;
  }

  const updatedCount = data?.length || 0;
  console.log(`  ✅ 成功更新 ${updatedCount.toLocaleString()} 条记录\n`);

  // 3. 统计更新后的数据
  console.log('三、更新后统计');
  console.log('────────────────────────────────────────────────────');
  
  const { count: localCountAfter } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('data_source', 'Local Authority');
  
  const { count: hcCountAfter } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('data_source', 'Health Canada MDALL');
  
  console.log(`  Local Authority:     ${localCountAfter?.toLocaleString()} 条`);
  console.log(`  Health Canada MDALL: ${hcCountAfter?.toLocaleString()} 条\n`);

  // 4. 显示最新的数据来源分布
  console.log('四、最新数据来源分布');
  console.log('────────────────────────────────────────────────────');
  
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
    console.log(`  ${source.padEnd(30)}: ${count.toLocaleString().padStart(6)} 条`);
  });

  console.log('\n============================================================');
  console.log('  任务完成');
  console.log('============================================================');
}

updateDataSource().catch(e => {
  console.error('执行失败:', e);
  process.exit(1);
});
