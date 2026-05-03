const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');
(async () => {
  const all = [];
  let page = 0;
  while (true) {
    const { data } = await s.from('ppe_products').select('id,name,manufacturer_name,product_code').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  const idSet = new Set();
  const unique = [];
  all.forEach(p => { if (!idSet.has(p.id)) { idSet.add(p.id); unique.push(p); } });
  console.log('Total rows:', all.length, 'Unique IDs:', unique.length);
  const groups = {};
  unique.forEach(p => {
    const key = (p.name||'').toLowerCase().trim() + '|' + (p.manufacturer_name||'').toLowerCase().trim() + '|' + (p.product_code||'').toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  const dups = Object.entries(groups).filter(([k,v]) => v.length > 1);
  const dupRecords = dups.reduce((s,[k,v]) => s + v.length - 1, 0);
  console.log('Duplicate groups:', dups.length, 'Duplicate records:', dupRecords);
  console.log('Clean products:', unique.length - dupRecords);
})();
