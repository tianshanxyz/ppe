const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fixBadCategories() {
  console.log('=== 修复编码异常的类别 ===\n');
  
  const validCategories = ['手部防护装备', '身体防护装备', '呼吸防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '其他'];
  
  let allProducts = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from('ppe_products').select('id, category, name').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    offset += 1000;
  }
  
  const badCategories = allProducts.filter(p => p.category && !validCategories.includes(p.category));
  console.log('编码异常的类别记录: ' + badCategories.length + ' 条');
  
  for (const product of badCategories) {
    console.log('  ID: ' + product.id + ', 类别: "' + product.category + '", 名称: ' + (product.name || '(empty)'));
    const { error } = await supabase.from('ppe_products').update({ category: '其他' }).eq('id', product.id);
    if (error) {
      console.log('    Error: ' + error.message);
    } else {
      console.log('    已修复为 "其他"');
    }
  }
  
  console.log('\n=== 最终验证 ===');
  const { count: pCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: rCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  const { count: zwCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).eq('legal_representative', 'Zhang Wei');
  
  console.log('ppe_products: ' + pCount);
  console.log('ppe_manufacturers: ' + mCount);
  console.log('ppe_regulations: ' + rCount);
  console.log('Zhang Wei 残留: ' + zwCount);
}

fixBadCategories().catch(console.error);
