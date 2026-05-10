#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  const { data: products } = await supabase.from('ppe_products').select('id').limit(1);
  console.log('Products table accessible:', products ? 'yes' : 'no');

  const { data: risk } = await supabase.from('ppe_risk_data').select('id').limit(1);
  console.log('Risk data table accessible:', risk ? 'yes' : 'no');

  const { error: insertErr } = await supabase.from('ppe_products').insert({
    name: 'DUP_TEST',
    category: 'test',
    manufacturer_name: 'DUP_TEST_MFR',
    country_of_origin: 'XX',
    data_source: 'DUP_TEST_SRC',
    specifications: '{}',
  }).select();
  console.log('Insert test (no conflict):', insertErr ? `Error: ${insertErr.message}` : 'OK');

  const { error: dupErr } = await supabase.from('ppe_products').insert({
    name: 'DUP_TEST',
    category: 'test',
    manufacturer_name: 'DUP_TEST_MFR',
    country_of_origin: 'XX',
    data_source: 'DUP_TEST_SRC',
    specifications: '{}',
  }).select();
  console.log('Insert test (duplicate):', dupErr ? `Error code: ${dupErr.code}, msg: ${dupErr.message}` : 'OK (no constraint)');

  await supabase.from('ppe_products').delete().eq('name', 'DUP_TEST');

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('Total products:', count);
}

check().catch(console.error);
