#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function main() {
  const { data } = await supabase.from('ppe_products')
    .select('name,data_source')
    .eq('category', '其他')
    .limit(200);
  
  console.log('=== "其他"分类产品样本 ===');
  data.slice(0, 50).forEach(p => console.log(`  ${p.name.substring(0, 100)}`));

  const sources = {};
  data.forEach(p => { sources[p.data_source] = (sources[p.data_source] || 0) + 1; });
  console.log('\n数据来源分布:');
  Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`  ${s}: ${c}`));

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  console.log(`\n其他分类总数: ${count}`);
}

main().catch(console.error);
