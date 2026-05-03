#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  const { count: pc } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mc } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  const { data: pgData } = await supabase.from('ppe_products')
    .select('id,name,product_code,country_of_origin,data_source')
    .like('data_source', 'Pure Global AI%')
    .limit(10);

  const { data: countryData } = await supabase.from('ppe_products').select('country_of_origin');
  const cs = {};
  countryData.forEach(p => { cs[p.country_of_origin || 'Unknown'] = (cs[p.country_of_origin || 'Unknown'] || 0) + 1; });

  const { data: catData } = await supabase.from('ppe_products').select('category');
  const cats = {};
  catData.forEach(p => { cats[p.category || 'Unknown'] = (cats[p.category || 'Unknown'] || 0) + 1; });

  console.log('=== 数据库状态 ===');
  console.log('产品总数:', pc);
  console.log('制造商总数:', mc);
  console.log('Pure Global AI产品:', pgData?.length || 0);
  if (pgData && pgData.length > 0) {
    pgData.forEach(p => console.log('  -', p.name?.substring(0, 60), '|', p.product_code, '|', p.country_of_origin, '|', p.data_source));
  }
  console.log('\n国家分布(前10):');
  Object.entries(cs).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log('  ' + k + ':', v));
  console.log('\n类别分布:');
  Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ':', v));
}
check();
