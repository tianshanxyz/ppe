#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const { count: beforeOther } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  console.log('删除"其他"分类产品:', beforeOther?.toLocaleString());

  let deleted = 0;
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('id')
      .eq('category', '其他')
      .range(page * 500, (page + 1) * 500 - 1);
    if (error || !data || data.length === 0) break;

    const ids = data.map(p => p.id);
    const { error: delError } = await supabase.from('ppe_products').delete().in('id', ids);
    if (!delError) deleted += ids.length;
    else console.log('删除错误:', delError.message);

    if (data.length < 500) break;
    page++;
    if (page % 10 === 0) console.log(`  已删除 ${deleted}`);
    await sleep(50);
  }

  console.log(`共删除: ${deleted}`);

  const { count: pc } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mc } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`\n当前: 产品=${pc?.toLocaleString()}, 制造商=${mc?.toLocaleString()}`);

  const categories = ['呼吸防护装备', '手部防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '听觉防护装备', '坠落防护装备', '身体防护装备', '躯干防护装备'];
  console.log('\n分类分布:');
  for (const cat of categories) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', cat);
    console.log(`  ${cat}: ${count?.toLocaleString()}`);
  }
}

main().catch(console.error);
