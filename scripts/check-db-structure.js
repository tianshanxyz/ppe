#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== 检查多国注册关联案例 ===\n');
  
  // 找一个可能有多个来源的中国制造商
  const { data: mfrs } = await supabase.from('ppe_products')
    .select('manufacturer_name')
    .eq('country_of_origin', 'CN')
    .limit(1000);
  
  if (!mfrs || mfrs.length === 0) {
    console.log('没有找到中国制造商');
    return;
  }
  
  // 统计每个制造商的产品数
  const mfrCount = {};
  mfrs.forEach(r => {
    const m = r.manufacturer_name;
    mfrCount[m] = (mfrCount[m] || 0) + 1;
  });
  
  // 找产品最多的制造商
  const topMfrs = Object.entries(mfrCount)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 5);
  
  console.log('产品最多的中国制造商（前5）：');
  topMfrs.forEach(([m, c], i) => {
    console.log(`  ${i+1}. ${m.substring(0, 50)}: ${c}条`);
  });
  
  // 检查第一个制造商的产品来源分布
  const testMfr = topMfrs[0][0];
  console.log(`\n=== 检查制造商: "${testMfr.substring(0, 40)}" ===`);
  
  const { data: products } = await supabase.from('ppe_products')
    .select('name, data_source, product_code, country_of_origin')
    .eq('manufacturer_name', testMfr);
  
  if (products) {
    console.log(`该制造商共有 ${products.length} 条产品记录：\n`);
    
    // 按数据来源分组
    const bySource = {};
    products.forEach(p => {
      const s = p.data_source || 'Unknown';
      if (!bySource[s]) bySource[s] = [];
      bySource[s].push(p);
    });
    
    Object.entries(bySource).forEach(([source, items]) => {
      console.log(`【${source}】${items.length}条：`);
      items.slice(0, 3).forEach(p => {
        console.log(`  - ${p.name.substring(0, 50)} | ${p.product_code || '无编号'}`);
      });
      if (items.length > 3) console.log(`  ... 还有 ${items.length - 3} 条`);
      console.log('');
    });
    
    // 检查是否有相似名称的产品（可能是同一产品多国注册）
    console.log('=== 潜在的多国注册案例 ===');
    const nameMap = {};
    products.forEach(p => {
      // 简化名称用于匹配
      const simpleName = p.name
        .replace(/医用|医疗|一次性|使用|无菌|有菌/g, '')
        .replace(/\s+/g, '')
        .toLowerCase();
      if (!nameMap[simpleName]) nameMap[simpleName] = [];
      nameMap[simpleName].push(p);
    });
    
    let caseNum = 0;
    Object.entries(nameMap).forEach(([simpleName, items]) => {
      if (items.length > 1 && caseNum < 3) {
        const sources = [...new Set(items.map(i => i.data_source))];
        if (sources.length > 1) {
          caseNum++;
          console.log(`\n案例 ${caseNum}: "${items[0].name.substring(0, 40)}"`);
          items.forEach(p => {
            console.log(`  [${p.data_source}] ${p.product_code || '无编号'}`);
          });
        }
      }
    });
    
    if (caseNum === 0) {
      console.log('未找到明显的多国注册案例（该制造商可能只做单一市场）');
    }
  }
  
  console.log('\n=== 分析完成 ===');
})();
