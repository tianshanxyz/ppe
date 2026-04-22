#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function analyze() {
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`Total: ${count}`);

  const batchSize = 5000;
  let offset = 0;
  const countries = {};
  const categories = {};
  const subcats = {};

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('country_of_origin, subcategory, category')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    data.forEach(r => {
      const c = r.country_of_origin || 'NULL';
      countries[c] = (countries[c] || 0) + 1;
      const cat = r.category || 'NULL';
      categories[cat] = (categories[cat] || 0) + 1;
      const sub = r.subcategory || 'NULL';
      subcats[sub] = (subcats[sub] || 0) + 1;
    });

    offset += batchSize;
  }

  console.log('\nCountry:');
  Object.entries(countries).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
    console.log(`  ${k}: ${v} (${(v/count*100).toFixed(1)}%)`);
  });

  console.log('\nCategory:');
  Object.entries(categories).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
    console.log(`  ${k}: ${v} (${(v/count*100).toFixed(1)}%)`);
  });

  console.log('\nSubcategory (top 20):');
  Object.entries(subcats).sort((a,b) => b[1]-a[1]).slice(0, 20).forEach(([k,v]) => {
    console.log(`  ${k}: ${v}`);
  });
}

analyze().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
