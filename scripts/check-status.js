#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  let totalProducts = 0;
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('id,category,data_source,country_of_origin')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    totalProducts += data.length;
    if (data.length < 1000) break;
    page++;
  }

  const { count: mfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  console.log('========================================');
  console.log('MDLooker PPE 数据恢复状态');
  console.log('========================================');
  console.log(`产品总数: ${totalProducts.toLocaleString()}`);
  console.log(`制造商总数: ${mfrCount?.toLocaleString()}`);

  const categories = ['呼吸防护装备', '手部防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '听觉防护装备', '坠落防护装备', '身体防护装备', '躯干防护装备'];
  console.log('\n分类分布:');
  for (const cat of categories) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', cat);
    const pct = ((count / totalProducts) * 100).toFixed(1);
    console.log(`  ${cat}: ${count?.toLocaleString()} (${pct}%)`);
  }

  const sources = {};
  let srcPage = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('data_source')
      .range(srcPage * 1000, (srcPage + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => { sources[p.data_source] = (sources[p.data_source] || 0) + 1; });
    if (data.length < 1000) break;
    srcPage++;
  }
  console.log('\n数据来源分布:');
  Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => {
    console.log(`  ${s}: ${c.toLocaleString()} (${((c / totalProducts) * 100).toFixed(1)}%)`);
  });

  const countries = {};
  let ctPage = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products')
      .select('country_of_origin')
      .range(ctPage * 1000, (ctPage + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => { countries[p.country_of_origin] = (countries[p.country_of_origin] || 0) + 1; });
    if (data.length < 1000) break;
    ctPage++;
  }
  console.log('\n国家/地区分布:');
  Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([c, n]) => {
    console.log(`  ${c}: ${n.toLocaleString()}`);
  });
}

main().catch(console.error);
