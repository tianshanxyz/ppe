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
  let hasMore = true;
  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase.from(table).select(columns).range(from, to);
    if (error) { console.error(`Error fetching ${table}:`, error.message); break; }
    if (!data || data.length === 0) { hasMore = false; break; }
    all.push(...data);
    if (data.length < PAGE_SIZE) hasMore = false;
    page++;
  }
  return all;
}

async function main() {
  console.log('========================================');
  console.log('  制造商去重(正确处理外键)');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  const { count: mBefore } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`清洗前制造商: ${mBefore?.toLocaleString()}\n`);

  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,website,data_source,company_profile,contact_info,certifications');
  console.log(`获取制造商: ${manufacturers.length}`);

  const mfrGroups = {};
  manufacturers.forEach(m => {
    const key = m.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!mfrGroups[key]) mfrGroups[key] = [];
    mfrGroups[key].push(m);
  });

  const duplicateGroups = Object.entries(mfrGroups).filter(([k, v]) => v.length > 1);
  console.log(`重复制造商组: ${duplicateGroups.length}\n`);

  let merged = 0;
  let errors = 0;

  for (const [key, group] of duplicateGroups) {
    group.sort((a, b) => {
      const aScore = (a.website ? 2 : 0) + (a.company_profile ? 1 : 0) + (a.contact_info ? 1 : 0) + (a.certifications ? 1 : 0) + (a.country ? 1 : 0);
      const bScore = (b.website ? 2 : 0) + (b.company_profile ? 1 : 0) + (b.contact_info ? 1 : 0) + (b.certifications ? 1 : 0) + (b.country ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return (b.data_source || '').length - (a.data_source || '').length;
    });

    const keepMfr = group[0];
    const removeMfrs = group.slice(1);

    for (const removeMfr of removeMfrs) {
      // 步骤1: 更新产品表的manufacturer_id和manufacturer_name
      const { error: updateIdError } = await supabase
        .from('ppe_products')
        .update({ manufacturer_id: keepMfr.id, manufacturer_name: keepMfr.name })
        .eq('manufacturer_id', removeMfr.id);

      if (updateIdError) {
        console.error(`  Error updating manufacturer_id for ${removeMfr.name}:`, updateIdError.message);
        errors++;
        continue;
      }

      // 也更新通过manufacturer_name关联的产品
      const { error: updateNameError } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: keepMfr.name })
        .eq('manufacturer_name', removeMfr.name);

      if (updateNameError) {
        console.error(`  Error updating manufacturer_name for ${removeMfr.name}:`, updateNameError.message);
      }

      // 步骤2: 删除重复制造商
      const { error: deleteError } = await supabase
        .from('ppe_manufacturers')
        .delete()
        .eq('id', removeMfr.id);

      if (deleteError) {
        console.error(`  Error deleting manufacturer ${removeMfr.name}:`, deleteError.message);
        errors++;
      } else {
        merged++;
        if (merged % 500 === 0) {
          console.log(`  已合并: ${merged} 条...`);
        }
      }
    }
  }

  console.log(`\n合并完成: ${merged} 条, 错误: ${errors}`);

  // 删除孤立制造商
  console.log('\n=== 删除孤立制造商 ===');
  const finalProducts = await fetchAll('ppe_products', 'manufacturer_name,manufacturer_id');
  const activeMfrNames = new Set(finalProducts.map(p => p.manufacturer_name).filter(Boolean).map(n => n.toLowerCase().trim()));
  const activeMfrIds = new Set(finalProducts.map(p => p.manufacturer_id).filter(Boolean));
  
  const finalMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const orphanMfrIds = finalMfrs.filter(m => {
    if (!m.name) return true;
    if (activeMfrIds.has(m.id)) return false;
    return !activeMfrNames.has(m.name.toLowerCase().trim());
  }).map(m => m.id);

  console.log(`孤立制造商: ${orphanMfrIds.length}`);

  let orphanDeleted = 0;
  for (let i = 0; i < orphanMfrIds.length; i += 200) {
    const batch = orphanMfrIds.slice(i, i + 200);
    const { error } = await supabase.from('ppe_manufacturers').delete().in('id', batch);
    if (error) {
      console.error(`  Error deleting orphans:`, error.message);
    } else {
      orphanDeleted += batch.length;
    }
  }
  console.log(`删除孤立制造商: ${orphanDeleted}`);

  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`\n制造商: ${mBefore?.toLocaleString()} -> ${mAfter?.toLocaleString()} (删除 ${(mBefore - mAfter).toLocaleString()})`);
}

main().catch(console.error);
