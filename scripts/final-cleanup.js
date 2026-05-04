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
  console.log('清理"其他"类别中的非PPE产品...');

  const otherProducts = await fetchAll('ppe_products', 'id,name,category');
  const otherItems = otherProducts.filter(p => p.category === '其他');
  console.log(`"其他"类别: ${otherItems.length} 条`);

  const nonPPEPatterns = [
    /restraint/i,
    /lancet/i,
    /safety strap/i,
    /safety cable/i,
    /safety lead/i,
    /positioning strap/i,
    /wheelchair belt/i,
    /incubator strap/i,
    /protective sheet/i,
    /patient safety/i,
    /protection pack/i,
    /safety kit/i,
    /safety lancet/i,
  ];

  const nonPPEIds = [];
  for (const p of otherItems) {
    const name = (p.name || '').toLowerCase();
    if (nonPPEPatterns.some(pattern => pattern.test(name))) {
      nonPPEIds.push(p.id);
    }
  }

  console.log(`非PPE产品: ${nonPPEIds.length} 条`);

  let deleted = 0;
  for (let i = 0; i < nonPPEIds.length; i += 500) {
    const batch = nonPPEIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
  }
  console.log(`已删除: ${deleted} 条`);

  // Reclassify remaining "其他" items
  const remainingOther = await fetchAll('ppe_products', 'id,name,category');
  const remainingOtherItems = remainingOther.filter(p => p.category === '其他');
  console.log(`\n剩余"其他": ${remainingOtherItems.length} 条`);

  remainingOtherItems.forEach(p => {
    console.log(`  ${p.name?.substring(0, 80)}`);
  });

  // Final stats
  const { count: pc } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`\n最终产品数: ${pc}`);
}

main().catch(console.error);
