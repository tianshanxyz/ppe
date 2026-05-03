const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');
(async () => {
  const { count: p } = await s.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: m } = await s.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log('Products:', p, 'Manufacturers:', m);
  
  const all = [];
  let page = 0;
  while (true) {
    const { data } = await s.from('ppe_products').select('data_source').range(page*1000, (page+1)*1000-1);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  const srcStats = {};
  all.forEach(p => { const src = p.data_source || 'Unknown'; srcStats[src] = (srcStats[src]||0)+1; });
  console.log('\nData source distribution:');
  Object.entries(srcStats).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k + ': ' + v));
})();
