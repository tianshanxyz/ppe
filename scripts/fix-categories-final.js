const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fixCategories() {
  console.log('=== 修复类别不一致问题 ===\n');
  
  const fixes = [
    { old: '医疗防护装备', new: '其他' },
  ];
  
  for (const fix of fixes) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', fix.old);
    if (count && count > 0) {
      const { error } = await supabase.from('ppe_products').update({ category: fix.new }).eq('category', fix.old);
      console.log(fix.old + ' -> ' + fix.new + ': ' + count + ' 条 ' + (error ? 'ERROR' : 'OK'));
    }
  }
  
  console.log('\n=== 最终类别分布 ===\n');
  
  let allCats = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from('ppe_products').select('category').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allCats = allCats.concat(data);
    offset += 1000;
  }
  
  const catDist = {};
  allCats.forEach(c => { const k = c.category || '(empty)'; catDist[k] = (catDist[k]||0)+1; });
  Object.entries(catDist).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v + ' (' + (v/allCats.length*100).toFixed(1) + '%)'));
  
  console.log('\n=== 数据核验完成 ===');
  console.log('ppe_products: ' + allCats.length + ' records');
  
  const { count: mCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: rCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log('ppe_manufacturers: ' + mCount + ' records');
  console.log('ppe_regulations: ' + rCount + ' records');
}

fixCategories().catch(console.error);
