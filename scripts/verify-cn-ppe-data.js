#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== 中国PPE数据完整性核实报告 ===\n');

  // 1. 总体统计
  console.log('1. 总体统计');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { count: totalCN } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('country_of_origin', 'CN');

  const { count: totalProducts } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });

  console.log(`   中国产品总数: ${totalCN} / ${totalProducts} (${((totalCN/totalProducts)*100).toFixed(1)}%)`);

  // 2. 按数据来源统计
  console.log('\n2. 中国PPE数据来源分布');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const sourceStats = {};
  for (let p = 0; ; p++) {
    const { data } = await supabase
      .from('ppe_products')
      .select('data_source, category, name')
      .eq('country_of_origin', 'CN')
      .range(p * 1000, (p + 1) * 1000 - 1);

    if (!data || data.length === 0) break;

    data.forEach(item => {
      const source = item.data_source || 'Unknown';
      if (!sourceStats[source]) {
        sourceStats[source] = { count: 0, categories: {} };
      }
      sourceStats[source].count++;

      const cat = item.category || 'Unknown';
      sourceStats[source].categories[cat] = (sourceStats[source].categories[cat] || 0) + 1;
    });

    if (data.length < 1000) break;
  }

  Object.entries(sourceStats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([source, info]) => {
      console.log(`   ${source}: ${info.count}条`);
      Object.entries(info.categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          console.log(`      - ${cat}: ${count}`);
        });
    });

  // 3. 产品名称关键词分析
  console.log('\n3. 产品名称关键词覆盖分析');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const keywords = {
    '医用防护口罩': 0,
    '医用外科口罩': 0,
    '一次性医用口罩': 0,
    '医用防护服': 0,
    '医用护目镜': 0,
    '医用面屏': 0,
    '医用防护面罩': 0,
    '医用隔离衣': 0,
    '医用手术衣': 0,
    '医用帽': 0,
    '医用手套': 0,
    '医用鞋套': 0,
    'KN95': 0,
    'N95': 0,
    'FFP': 0,
    '普通口罩': 0,
    '劳保': 0,
    '防护口罩': 0,
  };

  for (let p = 0; ; p++) {
    const { data } = await supabase
      .from('ppe_products')
      .select('name')
      .eq('country_of_origin', 'CN')
      .range(p * 1000, (p + 1) * 1000 - 1);

    if (!data || data.length === 0) break;

    data.forEach(item => {
      const name = (item.name || '').toLowerCase();
      Object.keys(keywords).forEach(kw => {
        if (name.includes(kw.toLowerCase())) {
          keywords[kw]++;
        }
      });
    });

    if (data.length < 1000) break;
  }

  Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .forEach(([kw, count]) => {
      const bar = '█'.repeat(Math.min(count / 10, 20));
      console.log(`   ${kw.padEnd(12)}: ${count.toString().padStart(4)} ${bar}`);
    });

  // 4. 检查是否有"普通劳动防护"类产品
  console.log('\n4. 产品类型覆盖检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const hasMedical = keywords['医用防护口罩'] + keywords['医用外科口罩'] + keywords['医用防护服'] > 0;
  const hasLabor = keywords['劳保'] > 0;
  const hasGeneralMask = keywords['普通口罩'] > 0;

  console.log(`   ✅ 医用PPE (医疗器械类): ${hasMedical ? '已覆盖' : '未覆盖'}`);
  console.log(`   ⚠️  普通劳动防护PPE: ${hasLabor ? '已覆盖' : '可能缺失'}`);
  console.log(`   ⚠️  普通民用口罩: ${hasGeneralMask ? '已覆盖' : '可能缺失'}`);

  // 5. 数据完整性评估
  console.log('\n5. 数据完整性评估');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { data: sampleProducts } = await supabase
    .from('ppe_products')
    .select('name, product_code, manufacturer_name, specification, description')
    .eq('country_of_origin', 'CN')
    .limit(5);

  console.log('   样本数据字段完整性:');
  if (sampleProducts) {
    sampleProducts.forEach((p, i) => {
      const fields = ['name', 'product_code', 'manufacturer_name', 'specification', 'description'];
      const filled = fields.filter(f => p[f] && p[f].length > 0).length;
      console.log(`   [${i+1}] ${p.name?.substring(0, 30) || 'N/A'}: ${filled}/${fields.length} 字段`);
    });
  }

  console.log('\n=== 核实完成 ===');
})();
