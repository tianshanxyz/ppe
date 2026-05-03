const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');
(async () => {
  const all = [];
  let page = 0;
  while (true) {
    const { data } = await s.from('ppe_products').select('id,name,model,description,manufacturer_name,product_code,risk_level,data_source,registration_authority,created_at').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  const idSet = new Set();
  const unique = [];
  all.forEach(p => { if (!idSet.has(p.id)) { idSet.add(p.id); unique.push(p); } });
  console.log('Unique products:', unique.length);

  const groups = {};
  unique.forEach(p => {
    const key = (p.name||'').toLowerCase().trim() + '|' + (p.manufacturer_name||'').toLowerCase().trim() + '|' + (p.product_code||'').toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const dupIds = [];
  Object.entries(groups).forEach(([key, group]) => {
    if (group.length <= 1) return;
    group.sort((a, b) => {
      const aScore = (a.description ? 2 : 0) + (a.risk_level ? 1 : 0) + (a.registration_authority ? 1 : 0);
      const bScore = (b.description ? 2 : 0) + (b.risk_level ? 1 : 0) + (b.registration_authority ? 1 : 0);
      if (bScore !== aScore) return bScore - aScore;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    for (let i = 1; i < group.length; i++) dupIds.push(group[i].id);
  });

  console.log('Deleting duplicates:', dupIds.length);
  let deleted = 0;
  for (let i = 0; i < dupIds.length; i += 500) {
    const batch = dupIds.slice(i, i + 500);
    const { error } = await s.from('ppe_products').delete().in('id', batch);
    if (!error) deleted += batch.length;
    else console.error('Error:', error.message);
  }
  console.log('Deleted:', deleted);

  // 删除孤立制造商
  const products = [];
  page = 0;
  while (true) {
    const { data } = await s.from('ppe_products').select('manufacturer_name,manufacturer_id').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    products.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  const activeNames = new Set(products.map(p => p.manufacturer_name).filter(Boolean).map(n => n.toLowerCase().trim()));
  const activeIds = new Set(products.map(p => p.manufacturer_id).filter(Boolean));
  const mfrs = [];
  page = 0;
  while (true) {
    const { data } = await s.from('ppe_manufacturers').select('id,name').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    mfrs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
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
  console.log('Deleted orphan manufacturers:', delOrphans);

  const { count: pAfter } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mAfter } = await s.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log('Final: Products=' + pAfter + ', Manufacturers=' + mAfter);
})();
