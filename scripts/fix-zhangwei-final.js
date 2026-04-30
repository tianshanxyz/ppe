const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fixAllZhangWei() {
  console.log('=== 批量修复 Zhang Wei (小批次) ===\n');
  
  let totalFixed = 0;
  const BATCH = 100;
  
  while (true) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select('id')
      .eq('legal_representative', 'Zhang Wei')
      .limit(BATCH);
    
    if (error) {
      console.log('Query error:', error.message);
      break;
    }
    
    if (!data || data.length === 0) {
      console.log('\n所有 Zhang Wei 记录已修复完毕！');
      break;
    }
    
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
      break;
    }
    
    totalFixed += ids.length;
    if (totalFixed % 1000 === 0) {
      console.log('  已修复: ' + totalFixed + ' 条...');
    }
  }
  
  console.log('\n共修复 Zhang Wei: ' + totalFixed + ' 条');
  
  const { count: zwCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).eq('legal_representative', 'Zhang Wei');
  console.log('Zhang Wei 残留: ' + zwCount);
}

fixAllZhangWei().catch(console.error);
