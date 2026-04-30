#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateDataSourceBatch() {
  console.log('============================================================');
  console.log('  批量更新 Local Authority 数据来源标识');
  console.log('============================================================\n');

  const batchSize = 500;
  let totalUpdated = 0;
  let hasMore = true;

  console.log('开始批量更新...\n');

  while (hasMore) {
    // 获取一批需要更新的记录ID
    const { data: records, error: fetchError } = await supabase
      .from('ppe_products')
      .select('id')
      .eq('data_source', 'Local Authority')
      .limit(batchSize);

    if (fetchError) {
      console.log(`  ❌ 获取记录失败: ${fetchError.message}`);
      break;
    }

    if (!records || records.length === 0) {
      hasMore = false;
      break;
    }

    const ids = records.map(r => r.id);

    // 批量更新这一批记录
    const { error: updateError } = await supabase
      .from('ppe_products')
      .update({ data_source: 'Health Canada MDALL' })
      .in('id', ids);

    if (updateError) {
      console.log(`  ❌ 更新失败: ${updateError.message}`);
      // 继续处理下一批
    } else {
      totalUpdated += ids.length;
      console.log(`  ✅ 已更新 ${totalUpdated.toLocaleString()} 条记录`);
    }

    // 如果获取的记录数小于批次大小，说明已经处理完所有记录
    if (records.length < batchSize) {
      hasMore = false;
    }

    // 短暂延迟，避免请求过快
    await sleep(100);
  }

  console.log(`\n  ✅ 总计更新 ${totalUpdated.toLocaleString()} 条记录\n`);

  // 显示最新的数据来源分布
  console.log('最新数据来源分布:');
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

updateDataSourceBatch().catch(e => {
  console.error('执行失败:', e);
  process.exit(1);
});
