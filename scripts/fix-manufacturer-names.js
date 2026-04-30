// 修复制造商 name 为 null 的问题
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

async function fixManufacturerNames() {
  console.log('=== 修复制造商 name 为 null 的问题 ===\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // 查找 name 为 null 的制造商
  const { data: nullNames, error: findError } = await supabase
    .from('ppe_manufacturers')
    .select('id, name')
    .is('name', null);
  
  if (findError) {
    console.error('查找失败:', findError);
    return;
  }
  
  console.log(`找到 ${nullNames?.length || 0} 条 name 为 null 的记录`);
  
  if (!nullNames || nullNames.length === 0) {
    console.log('没有需要修复的记录');
    return;
  }
  
  // 更新这些记录，设置一个默认名称
  let fixed = 0;
  for (const mfg of nullNames) {
    const { error: updateError } = await supabase
      .from('ppe_manufacturers')
      .update({ name: `Manufacturer_${mfg.id.substring(0, 8)}` })
      .eq('id', mfg.id);
    
    if (updateError) {
      console.error(`修复 ${mfg.id} 失败:`, updateError);
    } else {
      fixed++;
    }
  }
  
  console.log(`\n修复完成: ${fixed}/${nullNames.length} 条记录`);
}

fixManufacturerNames().catch(console.error);
