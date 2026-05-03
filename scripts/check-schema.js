const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
(async () => {
  const { data: p1 } = await s.from('ppe_products').select('*').limit(1);
  console.log('=== ppe_products 字段 ===');
  if (p1 && p1[0]) Object.keys(p1[0]).forEach(k => console.log('  ' + k + ': ' + typeof p1[0][k] + (p1[0][k] ? '' : ' (NULL)')));
  
  const { data: m1 } = await s.from('ppe_manufacturers').select('*').limit(1);
  console.log('\n=== ppe_manufacturers 字段 ===');
  if (m1 && m1[0]) Object.keys(m1[0]).forEach(k => console.log('  ' + k + ': ' + typeof m1[0][k] + (m1[0][k] ? '' : ' (NULL)')));
  
  const { data: r1 } = await s.from('ppe_regulations').select('*').limit(1);
  console.log('\n=== ppe_regulations 字段 ===');
  if (r1 && r1[0]) Object.keys(r1[0]).forEach(k => console.log('  ' + k + ': ' + typeof r1[0][k] + (r1[0][k] ? '' : ' (NULL)')));
  
  const { count: pc } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mc } = await s.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: rc } = await s.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log('\n=== 数据量 ===');
  console.log('产品:', pc, '制造商:', mc, '法规:', rc);
  
  const all = [];
  let page = 0;
  while (true) {
    const { data } = await s.from('ppe_products').select('data_source').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  const srcStats = {};
  all.forEach(p => { const src = p.data_source || 'Unknown'; srcStats[src] = (srcStats[src]||0)+1; });
  console.log('\n=== 数据来源分布 ===');
  Object.entries(srcStats).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
  
  // 检查现有产品样例
  const { data: sample } = await s.from('ppe_products').select('id,name,manufacturer_name,product_code,country_of_origin,category,risk_level,data_source,registration_authority').limit(3);
  console.log('\n=== 产品样例 ===');
  console.log(JSON.stringify(sample, null, 2));
})();
