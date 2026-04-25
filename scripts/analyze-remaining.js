#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function analyzeRemaining() {
  console.log('\n=== Analyze Remaining "其他" Products ===\n');

  const { data, error } = await supabase
    .from('ppe_products')
    .select('name, description, subcategory, model, product_code, country_of_origin')
    .eq('category', '其他')
    .limit(50);

  if (error || !data) { console.log('Error:', error?.message); return; }

  const sources = {};
  const countries = {};
  const productCodes = {};
  const nameWords = {};

  for (const p of data) {
    const src = 'unknown';
    sources[src] = (sources[src] || 0) + 1;

    const co = p.country_of_origin || 'unknown';
    countries[co] = (countries[co] || 0) + 1;

    const pc = p.product_code || p.model || 'unknown';
    productCodes[pc] = (productCodes[pc] || 0) + 1;

    const words = (p.name || '').split(/\s+/).filter(w => w.length > 3);
    for (const w of words.slice(0, 5)) {
      nameWords[w.toLowerCase()] = (nameWords[w.toLowerCase()] || 0) + 1;
    }
  }

  console.log('Sources:');
  Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\nCountries:');
  Object.entries(countries).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\nTop Product Codes:');
  Object.entries(productCodes).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\nTop Name Words:');
  Object.entries(nameWords).sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\nSample products:');
  data.slice(0, 15).forEach((p, i) => {
    console.log(`\n  ${i + 1}. Name: ${(p.name || '').substring(0, 80)}`);
    console.log(`     Desc: ${(p.description || '').substring(0, 80)}`);
    console.log(`     Code: ${p.product_code || p.model}, Sub: ${p.subcategory}, Country: ${p.country_of_origin}`);
  });

  const { count: totalOther } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  const { count: hasName } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他')
    .not('name', 'is', null)
    .neq('name', '');

  const { count: hasDesc } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他')
    .not('description', 'is', null)
    .neq('description', '');

  console.log(`\n\nField completeness for "其他" (${totalOther} total):`);
  console.log(`  Has name: ${hasName} (${(hasName / totalOther * 100).toFixed(1)}%)`);
  console.log(`  Has description: ${hasDesc} (${(hasDesc / totalOther * 100).toFixed(1)}%)`);
}

analyzeRemaining().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
