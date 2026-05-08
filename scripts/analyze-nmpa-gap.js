#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== NMPA 数据差距分析 ===\n');
  
  // 1. 统计所有中国产品的数据来源分布
  console.log('1. 中国产品按数据来源分布：');
  const cnSources = {};
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products')
      .select('data_source')
      .eq('country_of_origin', 'CN')
      .range(p*1000, (p+1)*1000-1);
    if (!data || data.length === 0) break;
    data.forEach(r => {
      const s = r.data_source || 'Unknown';
      cnSources[s] = (cnSources[s] || 0) + 1;
    });
    if (data.length < 1000) break;
  }
  Object.entries(cnSources).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
    console.log(`   ${k}: ${v}`);
  });
  
  const totalCN = Object.values(cnSources).reduce((a,b) => a+b, 0);
  console.log(`   总计: ${totalCN}\n`);
  
  // 2. 统计 NMPA UDI Full 的产品分类分布
  console.log('2. NMPA UDI Full 产品分类分布：');
  const nmpaCats = {};
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products')
      .select('category')
      .eq('data_source', 'NMPA UDI Full')
      .range(p*1000, (p+1)*1000-1);
    if (!data || data.length === 0) break;
    data.forEach(r => {
      const c = r.category || 'Unknown';
      nmpaCats[c] = (nmpaCats[c] || 0) + 1;
    });
    if (data.length < 1000) break;
  }
  Object.entries(nmpaCats).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
    console.log(`   ${k}: ${v}`);
  });
  
  const totalNMPA = Object.values(nmpaCats).reduce((a,b) => a+b, 0);
  console.log(`   NMPA UDI Full 总计: ${totalNMPA}\n`);
  
  // 3. 查看一些被分类为"其他"的产品示例（如果有的话）
  console.log('3. NMPA 产品名称示例（随机抽样）：');
  const { data: samples } = await supabase.from('ppe_products')
    .select('name, category')
    .eq('data_source', 'NMPA UDI Full')
    .limit(20);
  
  if (samples) {
    samples.forEach((r, i) => {
      console.log(`   [${i+1}] [${r.category}] ${r.name.substring(0, 60)}`);
    });
  }
  
  // 4. 检查是否有"其他"分类的产品
  console.log('\n4. 检查 "其他" 分类的 NMPA 产品：');
  const { data: others } = await supabase.from('ppe_products')
    .select('name')
    .eq('data_source', 'NMPA UDI Full')
    .eq('category', '其他')
    .limit(10);
  
  if (others && others.length > 0) {
    console.log(`   找到 ${others.length} 条"其他"分类产品，示例：`);
    others.forEach((r, i) => {
      console.log(`   - ${r.name.substring(0, 60)}`);
    });
  } else {
    console.log('   没有"其他"分类的产品（说明被过滤掉了）');
  }
  
  console.log('\n=== 分析完成 ===');
})();
