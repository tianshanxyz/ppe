#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function test() {
  const testProduct = {
    name: 'Test Safety Helmet',
    category: '头部防护装备',
    manufacturer_name: 'Test Company JP',
    country_of_origin: 'JP',
    risk_level: 'medium',
    product_code: '',
    registration_number: 'JP-TEST-001',
    registration_authority: 'PMDA',
    data_source: 'Test Source JP',
    last_verified: '2026-05-09',
    data_confidence_level: 'medium',
    specifications: '{}',
  };

  const { data, error } = await supabase.from('ppe_products').insert(testProduct).select();
  if (error) {
    console.log('Insert error:', JSON.stringify({ code: error.code, message: error.message, details: error.details }));
  } else {
    console.log('Insert success, id:', data[0]?.id);
    await supabase.from('ppe_products').delete().eq('id', data[0].id);
    console.log('Cleanup done');
  }

  const { data: sample } = await supabase.from('ppe_products').select('id,name,manufacturer_name,data_source').limit(3);
  console.log('Sample data:', JSON.stringify(sample));

  const { data: upsertTest } = await supabase.from('ppe_products').upsert(testProduct, {
    onConflict: 'name,manufacturer_name,data_source',
  }).select();
  if (upsertTest) {
    console.log('Upsert success, id:', upsertTest[0]?.id);
    await supabase.from('ppe_products').delete().eq('id', upsertTest[0].id);
  }

  const { error: upsertError } = await supabase.from('ppe_products').upsert(testProduct, {
    onConflict: 'name,manufacturer_name,data_source',
  });
  if (upsertError) {
    console.log('Upsert error:', JSON.stringify({ code: upsertError.code, message: upsertError.message }));
  }
}

test().catch(console.error);
