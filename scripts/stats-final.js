#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  const all = [];
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products').select('data_source,country_of_origin,category').range(p*1000,(p+1)*1000-1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  const src = {}, ctr = {}, cat = {};
  all.forEach(r => {
    const s = r.data_source || 'Unknown'; src[s] = (src[s] || 0) + 1;
    const o = r.country_of_origin || 'Unknown'; ctr[o] = (ctr[o] || 0) + 1;
    const t = r.category || 'Unknown'; cat[t] = (cat[t] || 0) + 1;
  });

  console.log('Total:', all.length);
  console.log('\nBy Source:');
  Object.entries(src).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
  console.log('\nBy Country:');
  Object.entries(ctr).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
  console.log('\nBy Category:');
  Object.entries(cat).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
})();
