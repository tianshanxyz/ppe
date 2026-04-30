// 调试制造商处理
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

async function debugManufacturer() {
  console.log('=== 调试制造商处理 ===\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // 获取一条待处理的制造商
  const { data: batch, error } = await supabase
    .from('ppe_manufacturers')
    .select('id, name, country, website')
    .is('data_source', null)
    .limit(5);
  
  if (error) {
    console.error('获取失败:', error);
    return;
  }
  
  console.log('样本数据:');
  batch?.forEach((mfg, i) => {
    console.log(`\n${i+1}. ID: ${mfg.id}`);
    console.log(`   Name: ${mfg.name}`);
    console.log(`   Country: ${mfg.country}`);
    console.log(`   Website: ${mfg.website}`);
  });
  
  // 尝试更新一条
  if (batch && batch.length > 0) {
    const testMfg = batch[0];
    console.log(`\n尝试更新制造商 ${testMfg.id}...`);
    
    const updateData = {
      id: testMfg.id,
      name: testMfg.name || `Manufacturer_${testMfg.id.substring(0, 8)}`,
      established_date: '2010-01-01',
      registered_capital: '10 Million USD',
      data_source: 'Test',
      data_confidence_level: 'medium',
      last_verified: new Date().toISOString()
    };
    
    console.log('更新数据:', JSON.stringify(updateData, null, 2));
    
    const { error: updateError } = await supabase
      .from('ppe_manufacturers')
      .upsert(updateData, { onConflict: 'id' });
    
    if (updateError) {
      console.error('更新失败:', updateError);
    } else {
      console.log('更新成功！');
    }
  }
}

debugManufacturer().catch(console.error);
