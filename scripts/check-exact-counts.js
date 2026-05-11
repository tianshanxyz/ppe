#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  for (const c of ['BR', 'AU', 'IN', 'JP', 'KR']) {
    const { count } = await s.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', c);
    console.log(c + ': ' + count);
  }
  const { count: fallCount } = await s.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '坠落防护装备');
  console.log('坠落防护: ' + fallCount);
  const { count: total } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('总计: ' + total);
}
check();
