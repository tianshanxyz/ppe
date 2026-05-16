#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function main() {
  const { data, error } = await supabase.from('ppe_products')
    .select('name,data_source')
    .eq('category', '其他')
    .limit(100);
  
  const wordFreq = {};
  data.forEach(p => {
    const words = (p.name || '').toLowerCase().split(/[\s\-_,.\/()]+/).filter(w => w.length > 2);
    words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  });

  const sorted = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 50);
  console.log('高频词:');
  sorted.forEach(([word, count]) => console.log(`  ${word}: ${count}`));

  console.log('\n样本产品名:');
  data.slice(0, 30).forEach(p => console.log(`  ${p.name.substring(0, 80)} | ${p.data_source}`));

  const sources = {};
  data.forEach(p => { sources[p.data_source] = (sources[p.data_source] || 0) + 1; });
  console.log('\n数据来源分布:');
  Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`  ${s}: ${c}`));
}

main().catch(console.error);
