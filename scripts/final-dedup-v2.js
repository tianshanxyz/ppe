const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');
(async () => {
  // 使用小批次获取所有数据，避免重复
  const { count } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('Exact count from DB:', count);
  
  // 获取所有ID
  const allIds = new Set();
  let page = 0;
  while (true) {
    const { data } = await s.from('ppe_products').select('id').range(page*500, (page+1)*500-1);
    if (!data || data.length === 0) break;
    data.forEach(d => allIds.add(d.id));
    if (data.length < 500) break;
    page++;
  }
  console.log('Unique IDs via pagination:', allIds.size);
  
  // 检查重复
  const { data: sample } = await s.from('ppe_products').select('id,name,manufacturer_name,product_code').limit(500);
  const idCount = {};
  sample.forEach(p => { idCount[p.id] = (idCount[p.id] || 0) + 1; });
  const dupIds = Object.entries(idCount).filter(([id, cnt]) => cnt > 1);
  console.log('Duplicate IDs in first 500:', dupIds.length);
  
  // 获取所有产品用于去重
  const products = [];
  const seenIds = new Set();
  page = 0;
  while (true) {
    const { data } = await s.from('ppe_products').select('id,name,model,description,manufacturer_name,product_code,risk_level,data_source,registration_authority,created_at').range(page*500, (page+1)*500-1);
    if (!data || data.length === 0) break;
    data.forEach(p => { if (!seenIds.has(p.id)) { seenIds.add(p.id); products.push(p); } });
    if (data.length < 500) break;
    page++;
  }
  console.log('Unique products loaded:', products.length);
  
  // 去重
  const groups = {};
  products.forEach(p => {
    const key = (p.name||'').toLowerCase().trim() + '|' + (p.manufacturer_name||'').toLowerCase().trim() + '|' + (p.product_code||'').toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  
  const dupIdsToDelete = [];
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    group.sort((a, b) => {
      const aScore = (a.description ? 2 : 0) + (a.risk_level ? 1 : 0) + (a.registration_authority ? 1 : 0);
      const bScore = (b.description ? 2 : 0) + (b.risk_level ? 1 : 0) + (b.registration_authority ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) dupIdsToDelete.push(group[i].id);
  });
  
  console.log('Duplicates to delete:', dupIdsToDelete.length);
  
  let deleted = 0;
  for (let i = 0; i < dupIdsToDelete.length; i += 500) {
    const batch = dupIdsToDelete.slice(i, i + 500);
    const { error } = await s.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
    else console.error('Error:', error.message);
  }
  console.log('Deleted:', deleted);
  
  // 删除孤立制造商
  const activeMfrs = new Set(products.filter(p => !dupIdsToDelete.includes(p.id)).map(p => p.manufacturer_name).filter(Boolean).map(n => n.toLowerCase().trim()));
  const { data: allMfrs } = await s.from('ppe_manufacturers').select('id,name');
  const orphanIds = (allMfrs||[]).filter(m => !activeMfrs.has(m.name.toLowerCase().trim())).map(m => m.id);
  
  let delOrphans = 0;
  for (const id of orphanIds) {
    await s.from('ppe_products').update({ manufacturer_id: null }).eq('manufacturer_id', id);
    const { error } = await s.from('ppe_manufacturers').delete().eq('id', id);
    if (!error) delOrphans++;
  }
  console.log('Deleted orphan manufacturers:', delOrphans);
  
  const { count: pAfter } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await s.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log('Final: Products=' + pAfter + ', Manufacturers=' + mAfter);
})();
