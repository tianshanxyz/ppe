#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PAGE_SIZE = 1000;
async function fetchAll(table, columns) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  return all;
}

async function main() {
  console.log('=== 精确去重 ===\n');

  const products = await fetchAll('ppe_products', 'id,name,model,category,subcategory,description,manufacturer_name,country_of_origin,product_code,risk_level,data_source,registration_authority,created_at');
  console.log(`当前产品数: ${products.length}`);

  // 分析重复模式
  const groups = {};
  products.forEach(p => {
    const key = `${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}|${(p.product_code||'').toLowerCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const dupGroups = Object.entries(groups).filter(([k, v]) => v.length > 1);
  console.log(`重复组: ${dupGroups.length}`);

  // 显示一些重复样例
  console.log('\n重复样例(前5组):');
  dupGroups.slice(0, 5).forEach(([key, group]) => {
    console.log(`  Key: "${key}"`);
    group.forEach(p => {
      console.log(`    id=${p.id.substring(0,8)} name="${p.name?.substring(0,40)}" code=${p.product_code} mfr=${p.manufacturer_name?.substring(0,20)} source=${p.data_source}`);
    });
  });

  // 执行去重
  const dupIds = [];
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    group.sort((a, b) => {
      const aScore = (a.description ? 2 : 0) + (a.product_code ? 1 : 0) + (a.risk_level ? 1 : 0) + (a.registration_authority ? 1 : 0) + (a.data_source?.includes('FDA') ? 2 : 0) + (a.data_source?.includes('Health Canada') ? 2 : 0);
      const bScore = (b.description ? 2 : 0) + (b.product_code ? 1 : 0) + (b.risk_level ? 1 : 0) + (b.registration_authority ? 1 : 0) + (b.data_source?.includes('FDA') ? 2 : 0) + (b.data_source?.includes('Health Canada') ? 2 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) dupIds.push(group[i].id);
  });

  console.log(`\n待删除重复记录: ${dupIds.length}`);
  
  let deleted = 0;
  for (let i = 0; i < dupIds.length; i += 500) {
    const batch = dupIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
    else console.error(`  Error:`, error.message);
  }
  console.log(`已删除: ${deleted}`);

  // 删除剩余2条非权威来源
  console.log('\n删除非权威来源...');
  const { data: mfdsData } = await supabase.from('ppe_products').select('id').eq('data_source', 'MFDS Known PPE Manufacturers');
  if (mfdsData && mfdsData.length > 0) {
    const ids = mfdsData.map(d => d.id);
    const { error } = await supabase.from('ppe_products').delete().in('id', ids);
    console.log(`  删除MFDS数据: ${!error ? ids.length : 'Error'}`);
  }

  // 删除孤立制造商
  console.log('\n删除孤立制造商...');
  const finalProducts = await fetchAll('ppe_products', 'manufacturer_name,manufacturer_id');
  const activeNames = new Set(finalProducts.map(p => p.manufacturer_name).filter(Boolean).map(n => n.toLowerCase().trim()));
  const activeIds = new Set(finalProducts.map(p => p.manufacturer_id).filter(Boolean));
  
  const mfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const orphanIds = mfrs.filter(m => {
    if (!m.name) return true;
    if (activeIds.has(m.id)) return false;
    return !activeNames.has(m.name.toLowerCase().trim());
  }).map(m => m.id);

  let delOrphans = 0;
  for (let i = 0; i < orphanIds.length; i += 500) {
    const batch = orphanIds.slice(i, i + 500);
    for (const id of batch) {
      await supabase.from('ppe_products').update({ manufacturer_id: null }).eq('manufacturer_id', id);
    }
    const { error } = await supabase.from('ppe_manufacturers').delete().in('id', batch);
    if (!error) delOrphans += batch.length;
  }
  console.log(`  删除孤立制造商: ${delOrphans}`);

  // 制造商去重
  console.log('\n制造商去重...');
  const currentMfrs = await fetchAll('ppe_manufacturers', 'id,name,country,website,company_profile');
  const mfrGroups = {};
  currentMfrs.forEach(m => {
    const key = m.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!mfrGroups[key]) mfrGroups[key] = [];
    mfrGroups[key].push(m);
  });

  let delDupMfrs = 0;
  for (const [key, group] of Object.entries(mfrGroups)) {
    if (group.length <= 1) continue;
    group.sort((a, b) => {
      const aScore = (a.website ? 2 : 0) + (a.company_profile ? 1 : 0) + (a.country ? 1 : 0);
      const bScore = (b.website ? 2 : 0) + (b.company_profile ? 1 : 0) + (b.country ? 1 : 0);
      return bScore - aScore;
    });
    const keep = group[0];
    const removeList = group.slice(1);
    for (const remove of removeList) {
      await supabase.from('ppe_products').update({ manufacturer_id: null }).eq('manufacturer_id', remove.id);
      await supabase.from('ppe_products').update({ manufacturer_name: keep.name }).eq('manufacturer_name', remove.name);
      const { error } = await supabase.from('ppe_manufacturers').delete().eq('id', remove.id);
      if (!error) delDupMfrs++;
    }
  }
  console.log(`  删除重复制造商: ${delDupMfrs}`);

  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`\n最终: 产品=${pAfter}, 制造商=${mAfter}`);
}

main().catch(console.error);
