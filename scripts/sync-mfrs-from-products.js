#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== 从产品数据提取中国制造商 ===\n');

  // 1. 获取现有制造商
  const existingMfrs = new Map();
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_manufacturers')
      .select('name,country')
      .range(p*1000, (p+1)*1000-1);
    if (!data?.length) break;
    data.forEach(r => existingMfrs.set((r.name||'').toLowerCase().trim(), r.country));
    if (data.length < 1000) break;
  }
  console.log(`现有制造商: ${existingMfrs.size}`);

  // 2. 从产品数据中提取所有制造商
  const productMfrs = new Map();
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products')
      .select('manufacturer_name,category,data_source,country_of_origin')
      .range(p*1000, (p+1)*1000-1);
    if (!data?.length) break;
    data.forEach(r => {
      const name = (r.manufacturer_name || '').trim();
      if (!name || name === 'Unknown' || name === 'Health Canada Licensee') return;
      const key = name.toLowerCase().trim();
      if (!productMfrs.has(key)) {
        productMfrs.set(key, {
          name,
          categories: new Set(),
          dataSources: new Set(),
          countries: new Set(),
          productCount: 0
        });
      }
      const mfr = productMfrs.get(key);
      if (r.category) mfr.categories.add(r.category);
      if (r.data_source) mfr.dataSources.add(r.data_source);
      if (r.country_of_origin) mfr.countries.add(r.country_of_origin);
      mfr.productCount++;
    });
    if (data.length < 1000) break;
  }
  console.log(`产品中涉及的制造商: ${productMfrs.size}`);

  // 3. 找出缺失的制造商
  const missing = [];
  for (const [key, mfr] of productMfrs) {
    if (!existingMfrs.has(key)) {
      missing.push(mfr);
    }
  }
  console.log(`缺失的制造商: ${missing.length}`);

  // 4. 写入缺失的制造商
  let ins = 0, fail = 0;
  for (const mfr of missing) {
    const countries = Array.from(mfr.countries);
    const primaryCountry = countries.length === 1 ? countries[0] : 'Multi';

    const { error } = await supabase.from('ppe_manufacturers').insert({
      name: mfr.name.substring(0, 500),
      country: primaryCountry,
      data_source: Array.from(mfr.dataSources).join(','),
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: 'high',
      business_scope: Array.from(mfr.categories).join(','),
      certifications: [],
      company_profile: `产品数量: ${mfr.productCount} | 数据来源: ${Array.from(mfr.dataSources).join(',')} | 国家: ${countries.join(',')}`,
    });

    if (!error) ins++;
    else { fail++; if (fail <= 3) console.log(`  失败: ${mfr.name.substring(0,30)} - ${error.message}`); }
  }

  console.log(`\n新增制造商: ${ins}, 失败: ${fail}`);

  // 5. 统计中国制造商
  const { count: totalMfrs } = await supabase.from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  const { count: cnMfrs } = await supabase.from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
    .in('country', ['CN', 'Multi']);

  console.log(`\n总制造商: ${totalMfrs}, 中国相关: ${cnMfrs}`);

  // 6. 检查产品数据中哪些中国制造商没有对应制造商记录
  console.log('\n=== 产品数据覆盖检查 ===');
  let cnProductMfrs = 0, cnProductMfrsWithRecord = 0;
  for (const [key, mfr] of productMfrs) {
    if (mfr.countries.has('CN')) {
      cnProductMfrs++;
      if (existingMfrs.has(key) || missing.some(m => m.name.toLowerCase().trim() === key)) {
        cnProductMfrsWithRecord++;
      }
    }
  }
  console.log(`中国产品制造商: ${cnProductMfrs}`);
  console.log(`有制造商记录: ${cnProductMfrsWithRecord}`);
  console.log(`覆盖率: ${(cnProductMfrsWithRecord/cnProductMfrs*100).toFixed(1)}%`);

  console.log('\n=== 完成 ===');
})();
