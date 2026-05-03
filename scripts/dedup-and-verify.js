const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');

async function fetchAll(table, columns) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await s.from(table).select(columns).range(page*1000, (page+1)*1000-1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  return all;
}

(async () => {
  console.log('=== 数据去重与质量验证 ===\n');
  
  const { count: pBefore } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mBefore } = await s.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`清洗前: 产品=${pBefore}, 制造商=${mBefore}\n`);

  // 1. 产品去重
  console.log('Step 1: 产品去重');
  const products = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code,registration_number,description,risk_level,data_source,created_at');
  
  const idSet = new Set();
  const unique = [];
  products.forEach(p => { if (!idSet.has(p.id)) { idSet.add(p.id); unique.push(p); } });
  console.log(`  总行数: ${products.length}, 唯一ID: ${unique.length}`);
  
  const groups = {};
  unique.forEach(p => {
    const key = `${(p.name||'').toLowerCase().trim()}|${(p.manufacturer_name||'').toLowerCase().trim()}|${(p.product_code||'').toLowerCase().trim()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  
  const dupIds = [];
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    group.sort((a, b) => {
      const aScore = (a.description ? 2 : 0) + (a.risk_level ? 1 : 0) + (a.data_source?.includes('FDA') ? 2 : 0);
      const bScore = (b.description ? 2 : 0) + (b.risk_level ? 1 : 0) + (b.data_source?.includes('FDA') ? 2 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) dupIds.push(group[i].id);
  });
  
  let delProducts = 0;
  for (let i = 0; i < dupIds.length; i += 500) {
    const batch = dupIds.slice(i, i + 500);
    const { error } = await s.from('ppe_products').delete().in('id', batch);
    if (!error) delProducts += batch.length;
  }
  console.log(`  删除重复产品: ${delProducts}`);

  // 2. 删除"其他"类别中的非PPE产品
  console.log('\nStep 2: 清理非PPE产品');
  const currentProducts = await fetchAll('ppe_products', 'id,name,category,description');
  const nonPPEKeywords = [/dental/i, /implant/i, /catheter/i, /stent/i, /pacemaker/i, /wheelchair/i, /x-ray/i, /ultrasound/i, /mri/i, /dialysis/i, /syringe\b/i, /thermometer/i, /stethoscope/i, /blood pressure/i, /insulin pump/i];
  const nonPPEIds = currentProducts.filter(p => {
    if (p.category !== '其他') return false;
    const text = `${p.name} ${p.description || ''}`;
    return nonPPEKeywords.some(kw => kw.test(text));
  }).map(p => p.id);
  
  let delNonPPE = 0;
  for (let i = 0; i < nonPPEIds.length; i += 500) {
    const batch = nonPPEIds.slice(i, i + 500);
    const { error } = await s.from('ppe_products').delete().in('id', batch);
    if (!error) delNonPPE += batch.length;
  }
  console.log(`  删除非PPE产品: ${delNonPPE}`);

  // 3. 删除孤立制造商
  console.log('\nStep 3: 删除孤立制造商');
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
  for (const id of orphanIds) {
    await s.from('ppe_products').update({ manufacturer_id: null }).eq('manufacturer_id', id);
    const { error } = await s.from('ppe_manufacturers').delete().eq('id', id);
    if (!error) delOrphans++;
  }
  console.log(`  删除孤立制造商: ${delOrphans}`);

  // 4. 制造商去重
  console.log('\nStep 4: 制造商去重');
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
      await s.from('ppe_products').update({ manufacturer_id: null }).eq('manufacturer_id', remove.id);
      await s.from('ppe_products').update({ manufacturer_name: keep.name }).eq('manufacturer_name', remove.name);
      const { error } = await s.from('ppe_manufacturers').delete().eq('id', remove.id);
      if (!error) delDupMfrs++;
    }
  }
  console.log(`  删除重复制造商: ${delDupMfrs}`);

  // 最终统计
  const { count: pAfter } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await s.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  
  console.log('\n========================================');
  console.log('  数据去重与质量验证完成');
  console.log('========================================');
  console.log(`产品: ${pBefore} -> ${pAfter} (删除 ${pBefore - pAfter})`);
  console.log(`制造商: ${mBefore} -> ${mAfter} (删除 ${mBefore - mAfter})`);
  console.log(`\n删除明细:`);
  console.log(`  重复产品: ${delProducts}`);
  console.log(`  非PPE产品: ${delNonPPE}`);
  console.log(`  孤立制造商: ${delOrphans}`);
  console.log(`  重复制造商: ${delDupMfrs}`);

  // 数据来源分布
  const srcProducts = await fetchAll('ppe_products', 'data_source');
  const srcStats = {};
  srcProducts.forEach(p => { const src = p.data_source || 'Unknown'; srcStats[src] = (srcStats[src]||0)+1; });
  console.log(`\n数据来源分布:`);
  Object.entries(srcStats).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  
  // 分类分布
  const catProducts = await fetchAll('ppe_products', 'category');
  const catStats = {};
  catProducts.forEach(p => { const c = p.category || 'Unknown'; catStats[c] = (catStats[c]||0)+1; });
  console.log(`\n分类分布:`);
  Object.entries(catStats).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v} (${(v/catProducts.length*100).toFixed(1)}%)`));
})();
