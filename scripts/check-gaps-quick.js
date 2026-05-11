#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  const { count: pCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log('产品总数:', pCount);
  console.log('制造商总数:', mCount);

  const products = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products').select('country_of_origin,data_source,category').range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    products.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  const countryStats = {};
  const sourceStats = {};
  const catStats = {};
  products.forEach(p => {
    const c = p.country_of_origin || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
    const s = p.data_source || 'Unknown';
    sourceStats[s] = (sourceStats[s] || 0) + 1;
    const cat = p.category || 'Unknown';
    catStats[cat] = (catStats[cat] || 0) + 1;
  });

  console.log('\n国家分布(前15):');
  Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  console.log('\n数据来源分布(前15):');
  Object.entries(sourceStats).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  console.log('\n类别分布:');
  Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  const gapCountries = { BR: '巴西', AU: '澳大利亚', IN: '印度', JP: '日本', KR: '韩国' };
  console.log('\n缺口国家现状:');
  Object.entries(gapCountries).forEach(([code, name]) => {
    console.log('  ' + name + '(' + code + '): ' + (countryStats[code] || 0) + ' 条');
  });

  const fallProtection = products.filter(p => (p.category || '').includes('坠落'));
  console.log('\n坠落防护装备: ' + fallProtection.length + ' 条');
}

check().catch(console.error);
