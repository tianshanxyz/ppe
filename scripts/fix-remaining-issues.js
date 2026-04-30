const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fixZhangWei() {
  console.log('=== 修复 Zhang Wei 虚假法定代表人 ===\n');
  
  let offset = 0;
  let totalFixed = 0;
  const BATCH = 500;
  
  while (true) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select('id, name, country, legal_representative')
      .eq('legal_representative', 'Zhang Wei')
      .range(offset, offset + BATCH - 1);
    
    if (error) {
      console.log('Error:', error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    const ids = data.map(d => d.id);
    
    const { error: updateError } = await supabase
      .from('ppe_manufacturers')
      .update({ 
        legal_representative: null,
        data_confidence_level: 'low'
      })
      .in('id', ids);
    
    if (updateError) {
      console.log('Update error:', updateError.message);
    } else {
      totalFixed += ids.length;
      console.log('  已修复: ' + totalFixed + ' 条...');
    }
    
    offset += BATCH;
  }
  
  console.log('\n共修复 ' + totalFixed + ' 条 Zhang Wei 记录');
  
  console.log('\n=== 修复类别不一致问题 ===\n');
  
  const categoryMappings = [
    { old: '呼吸防护', new: '呼吸防护装备' },
    { old: '手部防护', new: '手部防护装备' },
    { old: '身体防护', new: '身体防护装备' },
    { old: '眼面防护', new: '眼面部防护装备' },
    { old: '其他防护', new: '其他' },
  ];
  
  for (const mapping of categoryMappings) {
    const { count } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', mapping.old);
    
    if (count && count > 0) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ category: mapping.new })
        .eq('category', mapping.old);
      
      if (error) {
        console.log('  ' + mapping.old + ' -> ' + mapping.new + ': ERROR - ' + error.message);
      } else {
        console.log('  ' + mapping.old + ' -> ' + mapping.new + ': ' + count + ' 条已更新');
      }
    }
  }
  
  console.log('\n=== 最终验证 ===\n');
  
  const { count: pCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: rCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  
  console.log('ppe_products: ' + pCount + ' records');
  console.log('ppe_manufacturers: ' + mCount + ' records');
  console.log('ppe_regulations: ' + rCount + ' records');
  
  const { count: zwCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).eq('legal_representative', 'Zhang Wei');
  console.log('\nZhang Wei 残留: ' + zwCount + ' 条');
}

fixZhangWei().catch(console.error);
