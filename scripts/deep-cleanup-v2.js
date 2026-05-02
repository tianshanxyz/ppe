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

async function deleteBatch(table, ids, label) {
  if (ids.length === 0) return 0;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const batch = ids.slice(i, i + 200);
    const { error } = await supabase.from(table).delete().in('id', batch);
    if (error) {
      console.error(`  Error deleting ${label} (batch ${i}):`, error.message);
    } else {
      deleted += batch.length;
    }
  }
  console.log(`  删除 ${label}: ${deleted} 条`);
  return deleted;
}

async function main() {
  console.log('========================================');
  console.log('  PPE 数据库二次深度清洗');
  console.log('  ' + new Date().toISOString());
  console.log('========================================\n');

  const { count: pBefore } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mBefore } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`清洗前: 产品=${pBefore?.toLocaleString()}, 制造商=${mBefore?.toLocaleString()}\n`);

  // === 步骤1: 重新检测产品重复 ===
  console.log('=== 步骤1: 二次产品去重 ===');
  const products = await fetchAll('ppe_products', 'id,name,model,category,subcategory,description,manufacturer_name,country_of_origin,product_code,risk_level,data_source,registration_authority,created_at');
  
  const productGroups = {};
  products.forEach(p => {
    const key = `${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}|${(p.product_code||'').toLowerCase().trim()}`;
    if (!productGroups[key]) productGroups[key] = [];
    productGroups[key].push(p);
  });

  const duplicateProductIds = [];
  let duplicateGroups = 0;
  Object.entries(productGroups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    duplicateGroups++;
    group.sort((a, b) => {
      const aScore = (a.description ? 1 : 0) + (a.model && !/^[A-Z]+-\d+-[a-z]/.test(a.model) ? 1 : 0) + (a.risk_level ? 1 : 0) + (a.registration_authority ? 1 : 0) + (a.data_source?.includes('FDA') ? 2 : 0) + (a.data_source?.includes('Health Canada') ? 2 : 0);
      const bScore = (b.description ? 1 : 0) + (b.model && !/^[A-Z]+-\d+-[a-z]/.test(b.model) ? 1 : 0) + (b.risk_level ? 1 : 0) + (b.registration_authority ? 1 : 0) + (b.data_source?.includes('FDA') ? 2 : 0) + (b.data_source?.includes('Health Canada') ? 2 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) {
      duplicateProductIds.push(group[i].id);
    }
  });
  console.log(`  重复产品组: ${duplicateGroups}`);
  await deleteBatch('ppe_products', duplicateProductIds, '重复产品');

  // === 步骤2: 删除剩余编造model号 ===
  console.log('\n=== 步骤2: 深度检测编造数据 ===');
  const currentProducts = await fetchAll('ppe_products', 'id,name,model,description,manufacturer_name,data_source');
  
  const fakeDataIds = currentProducts.filter(p => {
    if (!p.model) return false;
    // 更宽泛的编造模式检测
    if (/^[A-Z]{2,5}-\d{10,}/.test(p.model)) return true;
    if (/-[a-z]{5,}$/.test(p.model) && !/^[A-Z]{2,3}\d/.test(p.model)) return true;
    return false;
  }).map(p => p.id);
  
  await deleteBatch('ppe_products', fakeDataIds, '编造数据');

  // === 步骤3: 删除混合来源中的可疑数据 ===
  console.log('\n=== 步骤3: 清理混合来源数据 ===');
  const mixedSourceProducts = await fetchAll('ppe_products', 'id,name,model,description,manufacturer_name,data_source');
  
  const mixedSourceIds = mixedSourceProducts.filter(p => {
    const src = p.data_source || '';
    if (!src.includes('/')) return false;
    const parts = src.split(' / ');
    return parts.some(s => s.includes('Known PPE') || s.includes('Directory'));
  }).map(p => p.id);

  await deleteBatch('ppe_products', mixedSourceIds, '混合来源中的非权威数据');

  // === 步骤4: 制造商去重(先更新外键) ===
  console.log('\n=== 步骤4: 制造商去重(处理外键约束) ===');
  const manufacturers = await fetchAll('ppe_manufacturers', 'id,name,country,website,data_source,company_profile,contact_info,certifications');
  
  const mfrGroups = {};
  manufacturers.forEach(m => {
    const key = m.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (!mfrGroups[key]) mfrGroups[key] = [];
    mfrGroups[key].push(m);
  });

  const duplicateMfrGroups = Object.entries(mfrGroups).filter(([k, v]) => v.length > 1);
  console.log(`  重复制造商组: ${duplicateMfrGroups.length}`);

  let mfrMerged = 0;
  for (const [key, group] of duplicateMfrGroups) {
    group.sort((a, b) => {
      const aScore = (a.website ? 2 : 0) + (a.company_profile ? 1 : 0) + (a.contact_info ? 1 : 0) + (a.certifications ? 1 : 0) + (a.country ? 1 : 0);
      const bScore = (b.website ? 2 : 0) + (b.company_profile ? 1 : 0) + (b.contact_info ? 1 : 0) + (b.certifications ? 1 : 0) + (b.country ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return (b.data_source || '').length - (a.data_source || '').length;
    });

    const keepMfr = group[0];
    const removeMfrs = group.slice(1);

    for (const removeMfr of removeMfrs) {
      const { error: updateError } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: keepMfr.name })
        .eq('manufacturer_name', removeMfr.name);
      
      if (updateError) {
        console.error(`  Error updating products for ${removeMfr.name}:`, updateError.message);
        continue;
      }

      const { error: deleteError } = await supabase
        .from('ppe_manufacturers')
        .delete()
        .eq('id', removeMfr.id);

      if (deleteError) {
        console.error(`  Error deleting manufacturer ${removeMfr.name}:`, deleteError.message);
      } else {
        mfrMerged++;
      }
    }
  }
  console.log(`  合并重复制造商: ${mfrMerged} 条`);

  // === 步骤5: 删除孤立制造商 ===
  console.log('\n=== 步骤5: 删除孤立制造商(无关联产品) ===');
  const finalProducts = await fetchAll('ppe_products', 'manufacturer_name');
  const activeMfrNames = new Set(finalProducts.map(p => p.manufacturer_name).filter(Boolean).map(n => n.toLowerCase().trim()));
  
  const finalMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const orphanMfrIds = finalMfrs.filter(m => {
    if (!m.name) return true;
    return !activeMfrNames.has(m.name.toLowerCase().trim());
  }).map(m => m.id);

  console.log(`  孤立制造商: ${orphanMfrIds.length} 条`);
  await deleteBatch('ppe_manufacturers', orphanMfrIds, '孤立制造商');

  // === 步骤6: 验证数据权威性 ===
  console.log('\n=== 步骤6: 验证数据权威性 ===');
  const verifiedProducts = await fetchAll('ppe_products', 'id,name,data_source,registration_authority');
  
  const authoritativeSources = [
    'FDA 510(k) Database',
    'Health Canada MDALL',
    'NMPA',
    'FDA Registration Database',
    'FDA Classification Database',
    'FDA Recalls Database',
    'FDA Enforcement Reports',
    'FDA Adverse Events',
    'MHRA CMS'
  ];

  const unverifiedProducts = verifiedProducts.filter(p => {
    return !authoritativeSources.some(src => p.data_source?.includes(src));
  });
  
  const verifiedCount = verifiedProducts.length - unverifiedProducts.length;
  console.log(`  权威来源产品: ${verifiedCount} (${(verifiedCount/verifiedProducts.length*100).toFixed(1)}%)`);
  console.log(`  非权威来源产品: ${unverifiedProducts.length} (${(unverifiedProducts.length/verifiedProducts.length*100).toFixed(1)}%)`);

  // 非权威来源详情
  const unverifiedSourceStats = {};
  unverifiedProducts.forEach(p => {
    const src = p.data_source || 'Unknown';
    unverifiedSourceStats[src] = (unverifiedSourceStats[src] || 0) + 1;
  });
  console.log('  非权威来源详情:');
  Object.entries(unverifiedSourceStats).sort((a,b) => b[1]-a[1]).forEach(([src, cnt]) => {
    console.log(`    ${src}: ${cnt}`);
  });

  // 删除非权威来源的剩余数据
  if (unverifiedProducts.length > 0) {
    const unverifiedIds = unverifiedProducts.map(p => p.id);
    await deleteBatch('ppe_products', unverifiedIds, '非权威来源产品');
  }

  // === 最终统计 ===
  const { count: pAfter } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: rAfter } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log('\n========================================');
  console.log('  二次清洗完成');
  console.log('========================================');
  console.log(`产品: ${pBefore?.toLocaleString()} -> ${pAfter?.toLocaleString()} (删除 ${(pBefore - pAfter).toLocaleString()})`);
  console.log(`制造商: ${mBefore?.toLocaleString()} -> ${mAfter?.toLocaleString()} (删除 ${(mBefore - mAfter).toLocaleString()})`);
  console.log(`法规: ${rAfter?.toLocaleString()}`);
}

main().catch(console.error);
