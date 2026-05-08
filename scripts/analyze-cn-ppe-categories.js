#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function main() {
  console.log('=== 中国PPE产品分类分析 ===\n');

  // 获取所有中国产品
  const { data: cnProducts, error } = await supabase
    .from('ppe_products')
    .select('name, category, data_source')
    .eq('country_of_origin', 'CN');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`中国PPE产品总数: ${cnProducts.length}\n`);

  // 按分类统计
  const categoryCount = {};
  cnProducts.forEach(p => {
    const cat = p.category || '未分类';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  console.log('=== 按分类统计 ===');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  // 按数据源统计
  const sourceCount = {};
  cnProducts.forEach(p => {
    const src = p.data_source || '未知';
    sourceCount[src] = (sourceCount[src] || 0) + 1;
  });

  console.log('\n=== 按数据源统计 ===');
  Object.entries(sourceCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([src, count]) => {
      console.log(`  ${src}: ${count}`);
    });

  // 检查工业PPE关键词覆盖情况
  const industrialKeywords = [
    '防尘', '防毒', '防化', '防酸碱', '防静电', '防电弧',
    '耐高温', '耐低温', '阻燃', '防辐射', '防切割', '防刺穿',
    '绝缘', '耐油', '耐磨', '安全带', '安全绳', '防坠',
    '焊接', '矿工', '消防'
  ];

  const specialtyKeywords = [
    '核防护', '航天', '军用', '防爆', '生化'
  ];

  console.log('\n=== 工业PPE关键词覆盖检查 ===');
  let industrialCount = 0;
  industrialKeywords.forEach(kw => {
    const count = cnProducts.filter(p => p.name && p.name.includes(kw)).length;
    if (count > 0) {
      console.log(`  ${kw}: ${count}`);
      industrialCount += count;
    }
  });
  console.log(`  工业PPE相关总计(去重前): ${industrialCount}`);

  console.log('\n=== 特种PPE关键词覆盖检查 ===');
  let specialtyCount = 0;
  specialtyKeywords.forEach(kw => {
    const count = cnProducts.filter(p => p.name && p.name.includes(kw)).length;
    if (count > 0) {
      console.log(`  ${kw}: ${count}`);
      specialtyCount += count;
    }
  });
  console.log(`  特种PPE相关总计(去重前): ${specialtyCount}`);

  // 检查可能遗漏的产品名称示例
  console.log('\n=== 中国PPE产品名称示例（前30个）===');
  cnProducts.slice(0, 30).forEach((p, i) => {
    console.log(`  ${i+1}. ${p.name}`);
  });
}

main().catch(console.error);
