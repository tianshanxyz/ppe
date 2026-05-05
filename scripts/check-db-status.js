const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function main() {
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('总产品数:', count);

  const { data: sources } = await supabase.from('ppe_products').select('data_source');
  const sourceCount = {};
  sources.forEach(s => { const key = s.data_source || 'unknown'; sourceCount[key] = (sourceCount[key] || 0) + 1; });
  console.log('\n按数据源:');
  Object.entries(sourceCount).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));

  const { data: cats } = await supabase.from('ppe_products').select('category');
  const catCount = {};
  cats.forEach(c => { const key = c.category || 'unknown'; catCount[key] = (catCount[key] || 0) + 1; });
  console.log('\n按类别:');
  Object.entries(catCount).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));

  const { data: fda } = await supabase.from('ppe_products').select('category').ilike('data_source', '%FDA%');
  console.log('\nFDA数据:', fda.length, '条');
  const fdaCat = {};
  fda.forEach(s => { const key = s.category || 'unknown'; fdaCat[key] = (fdaCat[key] || 0) + 1; });
  Object.entries(fdaCat).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));

  const { data: cntByCountry } = await supabase.from('ppe_products').select('country_of_origin');
  const countryCount = {};
  cntByCountry.forEach(c => { const key = c.country_of_origin || 'unknown'; countryCount[key] = (countryCount[key] || 0) + 1; });
  console.log('\n按国家(前15):');
  Object.entries(countryCount).sort((a,b) => b[1]-a[1]).slice(0, 15).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
}
main();
