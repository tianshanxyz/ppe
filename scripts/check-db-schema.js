#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
async function check() {
  const { data: cn1, count: cnt1 } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact' }).eq('country', 'CN').limit(5);
  console.log('CN制造商count:', cnt1);
  if (cn1 && cn1[0]) console.log('CN制造商sample:', { name: cn1[0].name, country: cn1[0].country, ip_information: cn1[0].ip_information });
  
  const { data: p1 } = await supabase.from('ppe_products').select('id,name,category,international_names').eq('category', '呼吸防护装备').limit(3);
  console.log('\n产品sample:', JSON.stringify(p1, null, 2));
  
  const { data: m1 } = await supabase.from('ppe_manufacturers').select('id,name,country,ip_information').limit(3);
  console.log('\n制造商sample:', JSON.stringify(m1, null, 2));
}
check();
