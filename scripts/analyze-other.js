#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function analyzeOther() {
  console.log('\n=== Analyze "其他" Category Products ===\n');

  const result = await supabase
    .from('ppe_products')
    .select('name, description, subcategory, model, product_code, source')
    .eq('category', '其他')
    .limit(100);

  const data = result.data || [];

  const namePatterns = {};
  const descPatterns = {};
  const sources = {};

  for (const p of data) {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();

    sources[p.source || 'unknown'] = (sources[p.source || 'unknown'] || 0) + 1;

    const words = name.split(/\s+/).filter(w => w.length > 2);
    for (const w of words) {
      namePatterns[w] = (namePatterns[w] || 0) + 1;
    }

    const descWords = desc.split(/\s+/).filter(w => w.length > 3);
    for (const w of descWords.slice(0, 10)) {
      descPatterns[w] = (descPatterns[w] || 0) + 1;
    }
  }

  console.log('Top name patterns:');
  Object.entries(namePatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\nTop description patterns:');
  Object.entries(descPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\nSources:');
  Object.entries(sources)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  console.log('\nSample products:');
  data.slice(0, 20).forEach(p => {
    console.log(`  Name: ${(p.name || '').substring(0, 80)}`);
    console.log(`  Desc: ${(p.description || '').substring(0, 80)}`);
    console.log(`  Sub: ${p.subcategory}, Code: ${p.product_code}, Source: ${p.source}`);
    console.log('');
  });
}

async function main() {
  await analyzeOther();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
