#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function run() {
  const { data } = await s.from('ppe_products').select('id,name,manufacturer_name,product_code,risk_level,description,model,subcategory').limit(10);
  data.forEach(r => {
    console.log('---');
    console.log('ID:', r.id);
    console.log('Name:', r.name);
    console.log('Mfr:', JSON.stringify(r.manufacturer_name));
    console.log('PC:', JSON.stringify(r.product_code));
    console.log('RL:', JSON.stringify(r.risk_level));
    console.log('Model:', JSON.stringify(r.model));
    console.log('Sub:', r.subcategory);
    console.log('Desc:', r.description ? r.description.substring(0, 150) : 'NULL');
  });

  const { data: withMfr } = await s.from('ppe_products').select('id').not('manufacturer_name', 'eq', '').limit(5);
  console.log('\n\nRecords with non-empty manufacturer_name:', withMfr ? withMfr.length : 0);

  const { data: withMfr2 } = await s.from('ppe_products').select('id').neq('manufacturer_name', null).limit(5);
  console.log('Records with non-null manufacturer_name:', withMfr2 ? withMfr2.length : 0);

  const { data: withMfr3 } = await s.from('ppe_products').select('id,manufacturer_name').like('manufacturer_name', '%3M%').limit(5);
  console.log('Records with 3M in manufacturer_name:', withMfr3 ? withMfr3.length : 0);
  if (withMfr3) withMfr3.forEach(r => console.log('  ', r.manufacturer_name));
}

run().then(() => process.exit(0));
