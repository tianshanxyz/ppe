#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function cleanup() {
  console.log('清理垃圾数据...');

  const { data: pgData, error: pgErr } = await supabase.from('ppe_products')
    .delete()
    .like('data_source', 'Pure Global AI%');
  console.log('删除Pure Global AI数据:', pgData?.length || 0, pgErr?.message || '');

  const { data: addrData, error: addrErr } = await supabase.from('ppe_products')
    .delete()
    .like('name', '%Town Square%');
  console.log('删除地址数据:', addrData?.length || 0);

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('清理后产品总数:', count);
}

cleanup().catch(console.error);
