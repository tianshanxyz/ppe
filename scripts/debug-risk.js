#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function run() {
  const { data } = await s.from('ppe_products').select('id, category, subcategory, country_of_origin, risk_level').is('risk_level', null).limit(5);
  console.log('Sample null risk_level records:');
  data.forEach(r => {
    console.log(`  Cat: ${r.category}, Sub: ${r.subcategory}, CO: ${r.country_of_origin}`);
  });

  let fixed = 0;
  for (const r of data) {
    let risk = '';
    const cat = (r.category || '').toLowerCase();
    const sub = (r.subcategory || '').toLowerCase();
    const co = (r.country_of_origin || '').toUpperCase();

    if (co === 'US') {
      risk = 'Class II';
    } else if (co === 'CA') {
      risk = 'Class II';
    } else if (co === 'EU') {
      risk = 'Category II';
    } else {
      if (cat.includes('呼吸') || sub.includes('mask') || sub.includes('respirator')) risk = 'Class II';
      else if (cat.includes('手部') || sub.includes('glove')) risk = 'Class I';
      else risk = 'Class II';
    }

    if (risk) {
      const { error } = await s.from('ppe_products').update({ risk_level: risk }).eq('id', r.id);
      if (!error) {
        fixed++;
        console.log(`  Fixed ID ${r.id}: ${risk}`);
      } else {
        console.log(`  Error ID ${r.id}: ${error.message}`);
      }
    }
  }

  console.log(`Fixed: ${fixed}`);
}

run().then(() => process.exit(0));
