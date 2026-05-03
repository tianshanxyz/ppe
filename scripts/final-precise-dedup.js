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
  console.log('=== 最终精确去重 ===\n');

  const products = await fetchAll('ppe_products', 'id,name,model,category,subcategory,description,manufacturer_name,country_of_origin,product_code,risk_level,data_source,registration_authority,created_at');
  console.log(`当前产品数: ${products.length}`);

  // 先去重ID（Supabase可能返回重复行）
  const seenIds = new Set();
  const uniqueProducts = products.filter(p => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });
  console.log(`唯一ID产品数: ${uniqueProducts.length}`);

  // 按name+manufacturer_name+product_code分组
  const groups = {};
  uniqueProducts.forEach(p => {
    const key = `${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}|${(p.product_code||'').toLowerCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const dupGroups = Object.entries(groups).filter(([k, v]) => v.length > 1);
  console.log(`真实重复组: ${dupGroups.length}`);

  const dupIds = [];
  dupGroups.forEach(([key, group]) => {
    group.sort((a, b) => {
      const aScore = (a.description ? 2 : 0) + (a.product_code ? 1 : 0) + (a.risk_level ? 1 : 0) + (a.registration_authority ? 1 : 0) + (a.data_source?.includes('FDA') ? 2 : 0) + (a.data_source?.includes('Health Canada') ? 2 : 0);
      const bScore = (b.description ? 2 : 0) + (b.product_code ? 1 : 0) + (b.risk_level ? 1 : 0) + (b.registration_authority ? 1 : 0) + (b.data_source?.includes('FDA') ? 2 : 0) + (b.data_source?.includes('Health Canada') ? 2 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) dupIds.push(group[i].id);
  });

  console.log(`待删除重复记录: ${dupIds.length}`);

  let deleted = 0;
  for (let i = 0; i < dupIds.length; i += 500) {
    const batch = dupIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
    else console.error(`  Error:`, error.message);
  }
  console.log(`已删除: ${deleted}`);

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

  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`\n最终: 产品=${pAfter}, 制造商=${mAfter}`);
}

main().catch(console.error);
