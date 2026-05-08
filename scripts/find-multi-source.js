#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== 寻找真正的多国注册案例 ===\n');
  
  // 获取所有中国产品
  const allCN = [];
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products')
      .select('manufacturer_name, name, data_source, product_code')
      .eq('country_of_origin', 'CN')
      .range(p*1000, (p+1)*1000-1);
    if (!data || data.length === 0) break;
    allCN.push(...data);
    if (data.length < 1000) break;
  }
  
  console.log(`总中国产品数: ${allCN.length}\n`);
  
  // 按制造商分组
  const byMfr = {};
  allCN.forEach(p => {
    const m = p.manufacturer_name;
    if (!byMfr[m]) byMfr[m] = [];
    byMfr[m].push(p);
  });
  
  // 找有多个数据来源的制造商
  console.log('=== 有多个数据来源的制造商 ===\n');
  let foundCases = 0;
  
  Object.entries(byMfr).forEach(([mfr, products]) => {
    const sources = [...new Set(products.map(p => p.data_source))];
    if (sources.length > 1 && foundCases < 5) {
      foundCases++;
      console.log(`\n制造商 ${foundCases}: "${mfr.substring(0, 50)}"`);
      console.log(`  产品数: ${products.length} | 来源: ${sources.join(', ')}`);
      
      // 按来源分组显示
      const bySource = {};
      products.forEach(p => {
        const s = p.data_source;
        if (!bySource[s]) bySource[s] = [];
        bySource[s].push(p);
      });
      
      Object.entries(bySource).forEach(([src, items]) => {
        console.log(`\n  【${src}】${items.length}条:`);
        items.slice(0, 2).forEach(p => {
          console.log(`    - ${p.name.substring(0, 45)}`);
          console.log(`      编号: ${p.product_code || 'N/A'}`);
        });
        if (items.length > 2) console.log(`    ... 还有 ${items.length - 2} 条`);
      });
    }
  });
  
  if (foundCases === 0) {
    console.log('未找到多国注册的制造商（数据去重已合并）');
  }
  
  // 统计有多少产品有多个来源
  console.log('\n=== 统计 ===');
  let multiSourceMfrs = 0;
  Object.values(byMfr).forEach(products => {
    const sources = [...new Set(products.map(p => p.data_source))];
    if (sources.length > 1) multiSourceMfrs++;
  });
  console.log(`有多个数据来源的制造商: ${multiSourceMfrs} / ${Object.keys(byMfr).length}`);
  
  // 按数据来源统计
  const sourceCount = {};
  allCN.forEach(p => {
    const s = p.data_source;
    sourceCount[s] = (sourceCount[s] || 0) + 1;
  });
  console.log('\n中国产品数据来源分布:');
  Object.entries(sourceCount).sort((a,b) => b[1]-a[1]).forEach(([s,c]) => {
    console.log(`  ${s}: ${c}`);
  });
})();
