#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('Total products:', total);

  const { data: sources } = await supabase.from('ppe_products').select('data_source');
  const sourceCounts = {};
  sources.forEach(d => {
    const s = d.data_source || '(null)';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });
  console.log('\nBy data source:');
  Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  const { data: countries } = await supabase.from('ppe_products').select('country_of_origin');
  const countryCounts = {};
  countries.forEach(d => {
    const c = d.country_of_origin || '(null)';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  console.log('\nBy country (top 20):');
  Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

  const { data: jpProducts } = await supabase.from('ppe_products').select('name,manufacturer_name,data_source').eq('country_of_origin', 'JP').limit(10);
  console.log('\nJP products sample:');
  jpProducts.forEach(p => console.log('  ' + (p.name || '').substring(0, 50) + ' | ' + (p.manufacturer_name || '').substring(0, 30) + ' | ' + p.data_source));

  const { data: eudamedProducts } = await supabase.from('ppe_products').select('name,manufacturer_name,country_of_origin').eq('data_source', 'EUDAMED API').limit(5);
  console.log('\nEUDAMED API products sample:');
  eudamedProducts.forEach(p => console.log('  ' + (p.name || '').substring(0, 50) + ' | ' + (p.manufacturer_name || '').substring(0, 30) + ' | ' + p.country_of_origin));
}

check();
