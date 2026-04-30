#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');

async function main() {
  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrs } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: regs } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  const { count: pcNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOther } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');
  const { count: riskNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('risk_level', null);

  console.log('=== 当前数据库状态 ===');
  console.log('产品总数:', total.toLocaleString());
  console.log('制造商总数:', mfrs.toLocaleString());
  console.log('法规/标准:', regs.toLocaleString());
  console.log('');
  console.log('product_code完整率:', ((total - pcNull) / total * 100).toFixed(1) + '%', '(' + (total - pcNull).toLocaleString() + '/' + total.toLocaleString() + ')');
  console.log('manufacturer_name完整率:', ((total - mfrNull) / total * 100).toFixed(1) + '%', '(' + (total - mfrNull).toLocaleString() + '/' + total.toLocaleString() + ')');
  console.log('category(非其他):', ((total - catOther) / total * 100).toFixed(1) + '%', '(' + (total - catOther).toLocaleString() + '/' + total.toLocaleString() + ')');
  console.log('risk_level完整率:', ((total - riskNull) / total * 100).toFixed(1) + '%', '(' + (total - riskNull).toLocaleString() + '/' + total.toLocaleString() + ')');

  const categories = ['呼吸防护装备', '手部防护装备', '身体防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '其他'];
  console.log('');
  console.log('=== 类别分布 ===');
  for (const cat of categories) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', cat);
    console.log(cat + ':', count.toLocaleString(), '(' + (count / total * 100).toFixed(1) + '%)');
  }

  console.log('');
  console.log('=== 国家分布 (Top 10) ===');
  const { data: countryData } = await supabase.from('ppe_products').select('country_of_origin').not('country_of_origin', 'is', null).limit(50000);
  const countryCounts = {};
  for (const p of (countryData || [])) {
    const c = p.country_of_origin || 'Unknown';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  }
  const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [country, count] of sortedCountries) {
    console.log(country + ':', count.toLocaleString(), '(' + (count / total * 100).toFixed(1) + '%)');
  }
}

main();
