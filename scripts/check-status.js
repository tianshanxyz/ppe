#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');
async function main() {
  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: nullMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: unknownCountry } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('country_of_origin', 'Unknown');
  const { count: otherCat } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  const { count: totalMfr } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: totalReg } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log('=== 当前数据库状态 ===');
  console.log('产品总数:', total?.toLocaleString());
  console.log('制造商总数:', totalMfr?.toLocaleString());
  console.log('法规/标准:', totalReg?.toLocaleString());
  console.log('manufacturer_name缺失:', nullMfr?.toLocaleString(), '(' + (total ? ((nullMfr||0)/total*100).toFixed(1) : 0) + '%)');
  console.log('country_of_origin Unknown:', unknownCountry?.toLocaleString(), '(' + (total ? ((unknownCountry||0)/total*100).toFixed(1) : 0) + '%)');
  console.log('其他分类:', otherCat?.toLocaleString(), '(' + (total ? ((otherCat||0)/total*100).toFixed(1) : 0) + '%)');
}
main();
