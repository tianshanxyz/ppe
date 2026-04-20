const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDU1NTksImV4cCI6MjA5MjA4MTU1OX0.2uWuP-DZQ3nGqan8Bw9Sa8v7eZI49dvgUgRU8Jgdy4w'
);

async function checkData() {
  console.log('=== Supabase Database Status Check ===\n');
  
  // Check ppe_products table
  const { count: productCount, error: productError } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  
  console.log('ppe_products table:');
  console.log('  Count:', productCount || 0);
  if (productError) console.log('  Error:', productError.message);
  
  // Check sample data from ppe_products
  const { data: productSample } = await supabase
    .from('ppe_products')
    .select('source, product_name')
    .limit(10);
  
  if (productSample && productSample.length > 0) {
    console.log('  Sample sources:', [...new Set(productSample.map(p => p.source))]);
  }
  
  // Check ppe_manufacturers
  const { count: mfrCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  
  console.log('\nppe_manufacturers table:');
  console.log('  Count:', mfrCount || 0);
  
  // Check regulations
  const { count: regCount } = await supabase
    .from('regulations')
    .select('*', { count: 'exact', head: true });
  
  console.log('\nregulations table:');
  console.log('  Count:', regCount || 0);
  
  // Check companies
  const { count: compCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });
  
  console.log('\ncompanies table:');
  console.log('  Count:', compCount || 0);
  
  // Check data_sources
  const { data: dataSources } = await supabase
    .from('data_sources')
    .select('name, record_count, last_sync_at');
  
  console.log('\ndata_sources table:');
  if (dataSources && dataSources.length > 0) {
    dataSources.forEach(ds => {
      console.log(`  ${ds.name}: ${ds.record_count} records, last sync: ${ds.last_sync_at || 'never'}`);
    });
  } else {
    console.log('  No records');
  }
  
  console.log('\n=== Check Complete ===');
}

checkData().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
