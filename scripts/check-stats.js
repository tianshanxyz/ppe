#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrTotal } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  const { data: allData } = await supabase.from('ppe_products').select('data_source,country_of_origin');
  const sourceCounts = {};
  const countryCounts = {};
  allData.forEach(d => {
    sourceCounts[d.data_source] = (sourceCounts[d.data_source] || 0) + 1;
    countryCounts[d.country_of_origin] = (countryCounts[d.country_of_origin] || 0) + 1;
  });

  console.log('=== 数据库最终统计 ===');
  console.log('总产品数:', total);
  console.log('总制造商数:', mfrTotal);
  console.log('\n按数据源:');
  Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
  console.log('\n按国家:');
  Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
}
check();
