#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrTotal } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  console.log('=== 数据库最终统计 ===');
  console.log('总产品数:', total);
  console.log('总制造商数:', mfrTotal);

  const allData = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from('ppe_products').select('data_source,country_of_origin').range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allData.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  const sourceCounts = {};
  const countryCounts = {};
  allData.forEach(d => {
    sourceCounts[d.data_source || '(null)'] = (sourceCounts[d.data_source || '(null)'] || 0) + 1;
    countryCounts[d.country_of_origin || '(null)'] = (countryCounts[d.country_of_origin || '(null)'] || 0) + 1;
  });

  console.log('\n按数据源:');
  Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  console.log('\n按国家 (前20):');
  Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  const { data: jpData } = await supabase.from('ppe_products').select('name,manufacturer_name,data_source,country_of_origin')
    .or('country_of_origin.eq.JP,data_source.eq.PMDA Japan')
    .limit(20);
  console.log('\nJP/PMDA产品:');
  (jpData || []).forEach(p => console.log('  ' + (p.name || '').substring(0, 50) + ' | ' + p.country_of_origin + ' | ' + p.data_source));

  const { data: maskData } = await supabase.from('ppe_products').select('name,manufacturer_name,data_source,country_of_origin')
    .ilike('name', '%マスク%')
    .limit(10);
  console.log('\n含マスク的产品:');
  (maskData || []).forEach(p => console.log('  ' + (p.name || '').substring(0, 50) + ' | ' + p.country_of_origin + ' | ' + p.data_source));

  const { data: gloveData } = await supabase.from('ppe_products').select('name,manufacturer_name,data_source,country_of_origin')
    .ilike('name', '%手袋%')
    .limit(10);
  console.log('\n含手袋的产品:');
  (gloveData || []).forEach(p => console.log('  ' + (p.name || '').substring(0, 50) + ' | ' + p.country_of_origin + ' | ' + p.data_source));
}

check();
