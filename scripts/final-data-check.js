const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function finalCheck() {
  console.log('=== 最终数据状态 ===\n');
  
  const tables = ['ppe_products', 'ppe_manufacturers', 'ppe_regulations'];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(table + ': ' + (error ? 'ERROR - ' + error.message : count + ' records'));
  }
  
  console.log('\n=== 产品数据来源分布 (全量) ===');
  let allSources = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from('ppe_products').select('data_source').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allSources = allSources.concat(data);
    offset += 1000;
    process.stdout.write('\r  已读取: ' + allSources.length + ' 条...');
  }
  console.log('\n');
  const sourceDist = {};
  allSources.forEach(s => { const k = s.data_source || '(empty)'; sourceDist[k] = (sourceDist[k]||0)+1; });
  Object.entries(sourceDist).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v + ' (' + (v/allSources.length*100).toFixed(1) + '%)'));
  
  console.log('\n=== 产品置信度分布 (全量) ===');
  let allConf = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from('ppe_products').select('data_confidence_level').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allConf = allConf.concat(data);
    offset += 1000;
  }
  const confDist = {};
  allConf.forEach(c => { const k = c.data_confidence_level || '(empty)'; confDist[k] = (confDist[k]||0)+1; });
  Object.entries(confDist).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v + ' (' + (v/allConf.length*100).toFixed(1) + '%)'));
  
  console.log('\n=== 产品类别分布 (全量) ===');
  let allCats = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from('ppe_products').select('category').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allCats = allCats.concat(data);
    offset += 1000;
  }
  const catDist = {};
  allCats.forEach(c => { const k = c.category || '(empty)'; catDist[k] = (catDist[k]||0)+1; });
  Object.entries(catDist).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v + ' (' + (v/allCats.length*100).toFixed(1) + '%)'));
  
  console.log('\n=== 制造商法定代表人检查 (全量) ===');
  let allLegal = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from('ppe_manufacturers').select('legal_representative').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allLegal = allLegal.concat(data);
    offset += 1000;
  }
  const legalDist = {};
  let zhangWeiCount = 0;
  allLegal.forEach(c => {
    const k = c.legal_representative || '(empty)';
    legalDist[k] = (legalDist[k]||0)+1;
    if (k === 'Zhang Wei') zhangWeiCount++;
  });
  console.log('  Zhang Wei 数量: ' + zhangWeiCount + ' / ' + allLegal.length + ' (' + (zhangWeiCount/allLegal.length*100).toFixed(1) + '%)');
  console.log('  法定代表人分布 (前10):');
  Object.entries(legalDist).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v]) => console.log('    ' + k + ': ' + v));
}
finalCheck().catch(console.error);
