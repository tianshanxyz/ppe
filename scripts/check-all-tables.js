#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
async function run() {
  const tables = [
    'ppe_products', 'ppe_manufacturers', 'ppe_regulations',
    'ppe_products_enhanced', 'ppe_manufacturers_enhanced',
    'data_sync_status', 'product_manufacturer_relations',
    'data_change_history', 'companies', 'companies_enhanced',
    'ppe_certification_bodies', 'ppe_competitors', 'data_collection_logs'
  ];
  for (const t of tables) {
    const { count, error } = await s.from(t).select('*', { count: 'exact', head: true });
    if (error) console.log(t + ': NOT FOUND');
    else console.log(t + ': ' + count + ' rows');
  }
  
  const { data: sample } = await s.from('ppe_products').select('*').limit(3);
  if (sample && sample.length > 0) {
    console.log('\nppe_products columns: ' + Object.keys(sample[0]).join(', '));
  }
  
  const { data: mfr } = await s.from('ppe_manufacturers').select('*').limit(3);
  if (mfr && mfr.length > 0) {
    console.log('ppe_manufacturers columns: ' + Object.keys(mfr[0]).join(', '));
  }
  
  const { data: reg } = await s.from('ppe_regulations').select('*').limit(3);
  if (reg && reg.length > 0) {
    console.log('ppe_regulations columns: ' + Object.keys(reg[0]).join(', '));
  }
}
run().then(() => process.exit(0));
