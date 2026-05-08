const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fetchAll(select) {
  const all = [];
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products').select(select).range(p*1000, (p+1)*1000-1);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

async function main() {
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('总产品数:', count);

  const all = await fetchAll('data_source,category,country_of_origin');
  console.log(`实际获取: ${all.length}条`);

  // By data_source
  const src = {};
  all.forEach(s => { const k = s.data_source || 'unknown'; src[k] = (src[k]||0)+1; });
  console.log('\n按数据源:');
  Object.entries(src).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

  // By category
  const cat = {};
  all.forEach(s => { const k = s.category || 'unknown'; cat[k] = (cat[k]||0)+1; });
  console.log('\n按类别:');
  Object.entries(cat).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

  // By country top 15
  const cty = {};
  all.forEach(s => { const k = s.country_of_origin || 'unknown'; cty[k] = (cty[k]||0)+1; });
  console.log('\n按国家(前15):');
  Object.entries(cty).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

  // Manufacturers
  const { count: mCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log('\n总制造商:', mCount);
}
main();
