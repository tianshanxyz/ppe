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
  console.log('=== 深度去重 ===\n');

  // 1. 产品深度去重 - 使用更宽松的匹配
  console.log('步骤1: 产品深度去重');
  const products = await fetchAll('ppe_products', 'id,name,model,category,subcategory,description,manufacturer_name,country_of_origin,product_code,risk_level,data_source,registration_authority,created_at');
  
  // 按名称+制造商去重（不包含product_code，因为同一产品可能有不同代码）
  const groups = {};
  products.forEach(p => {
    const key = `${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const dupIds = [];
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    group.sort((a, b) => {
      const aScore = (a.description ? 2 : 0) + (a.product_code ? 1 : 0) + (a.risk_level ? 1 : 0) + (a.registration_authority ? 1 : 0) + (a.model && !/^\d+$/.test(a.model) ? 1 : 0);
      const bScore = (b.description ? 2 : 0) + (b.product_code ? 1 : 0) + (b.risk_level ? 1 : 0) + (b.registration_authority ? 1 : 0) + (b.model && !/^\d+$/.test(b.model) ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) dupIds.push(group[i].id);
  });

  let delProducts = 0;
  for (let i = 0; i < dupIds.length; i += 500) {
    const batch = dupIds.slice(i, i + 500);
    const { error } = await supabase.from('ppe_products').delete().in('id', batch);
    if (!error) delProducts += batch.length;
  }
  console.log(`  删除重复产品: ${delProducts}`);

  // 2. 制造商去重 - 先更新外键再删除
  console.log('\n步骤2: 制造商去重(更新外键)');
  const mfrs = await fetchAll('ppe_manufacturers', 'id,name,country,website,company_profile');
  const mfrGroups = {};
  mfrs.forEach(m => {
    const key = m.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!mfrGroups[key]) mfrGroups[key] = [];
    mfrGroups[key].push(m);
  });

  let mergedMfrs = 0;
  let delMfrs = 0;
  const dupMfrGroups = Object.entries(mfrGroups).filter(([k, v]) => v.length > 1);
  
  for (const [key, group] of dupMfrGroups) {
    group.sort((a, b) => {
      const aScore = (a.website ? 2 : 0) + (a.company_profile ? 1 : 0) + (a.country ? 1 : 0);
      const bScore = (b.website ? 2 : 0) + (b.company_profile ? 1 : 0) + (b.country ? 1 : 0);
      return bScore - aScore;
    });
    const keep = group[0];
    const removeList = group.slice(1);

    for (const remove of removeList) {
      // 更新产品表的manufacturer_id
      const { error: updErr } = await supabase
        .from('ppe_products')
        .update({ manufacturer_id: keep.id, manufacturer_name: keep.name })
        .eq('manufacturer_id', remove.id);
      
      // 也更新通过name关联的
      await supabase.from('ppe_products')
        .update({ manufacturer_name: keep.name })
        .eq('manufacturer_name', remove.name);

      if (updErr) {
        // 如果更新失败，尝试将manufacturer_id设为null再删除
        await supabase.from('ppe_products')
          .update({ manufacturer_id: null })
          .eq('manufacturer_id', remove.id);
      }

      const { error: delErr } = await supabase.from('ppe_manufacturers').delete().eq('id', remove.id);
      if (!delErr) {
        delMfrs++;
      }
      mergedMfrs++;
    }
  }
  console.log(`  处理重复制造商组: ${dupMfrGroups.length}`);
  console.log(`  成功删除: ${delMfrs}`);

  // 3. 删除孤立制造商
  console.log('\n步骤3: 删除孤立制造商');
  const finalProducts = await fetchAll('ppe_products', 'manufacturer_name,manufacturer_id');
  const activeNames = new Set(finalProducts.map(p => p.manufacturer_name).filter(Boolean).map(n => n.toLowerCase().trim()));
  const activeIds = new Set(finalProducts.map(p => p.manufacturer_id).filter(Boolean));
  
  const currentMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const orphanIds = currentMfrs.filter(m => {
    if (!m.name) return true;
    if (activeIds.has(m.id)) return false;
    return !activeNames.has(m.name.toLowerCase().trim());
  }).map(m => m.id);

  let delOrphans = 0;
  for (let i = 0; i < orphanIds.length; i += 500) {
    const batch = orphanIds.slice(i, i + 500);
    // 先将关联产品的manufacturer_id设为null
    for (const id of batch) {
      await supabase.from('ppe_products').update({ manufacturer_id: null }).eq('manufacturer_id', id);
    }
    const { error } = await supabase.from('ppe_manufacturers').delete().in('id', batch);
    if (!error) delOrphans += batch.length;
  }
  console.log(`  删除孤立制造商: ${delOrphans}`);

  // 最终统计
  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`\n最终: 产品=${pAfter}, 制造商=${mAfter}`);
}

main().catch(console.error);
