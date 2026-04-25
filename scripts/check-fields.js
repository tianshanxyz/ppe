#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function run() {
  const { data: sample } = await s.from('ppe_products').select('id,risk_level,category,subcategory,country_of_origin').limit(5);
  sample.forEach(r => {
    console.log('RL:', JSON.stringify(r.risk_level), 'Cat:', r.category, 'Sub:', r.subcategory, 'CO:', r.country_of_origin);
  });

  const { count: c1 } = await s.from('ppe_products').select('*', { count: 'exact', head: true }).is('risk_level', null);
  const { count: c2 } = await s.from('ppe_products').select('*', { count: 'exact', head: true }).eq('risk_level', '');
  console.log('Null risk_level:', c1, 'Empty risk_level:', c2);

  const { count: c3 } = await s.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: c4 } = await s.from('ppe_products').select('*', { count: 'exact', head: true }).eq('product_code', '');
  console.log('Null product_code:', c3, 'Empty product_code:', c4);

  const { count: c5 } = await s.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: c6 } = await s.from('ppe_products').select('*', { count: 'exact', head: true }).eq('manufacturer_name', '');
  console.log('Null manufacturer_name:', c5, 'Empty manufacturer_name:', c6);

  const { count: total } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('Total products:', total);
}

run().then(() => process.exit(0));
