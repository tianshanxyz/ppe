const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');

(async () => {
  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log('Total PPE products:', count);
  
  const { data } = await supabase.from('ppe_products').select('country_of_origin').limit(32000);
  if (data) {
    const cn = data.filter(r => r.country_of_origin === 'CN' || r.country_of_origin === 'China').length;
    const us = data.filter(r => r.country_of_origin === 'US').length;
    const ca = data.filter(r => r.country_of_origin === 'Canada' || r.country_of_origin === 'CA').length;
    console.log('CN: ' + cn + ', US: ' + us + ', CA: ' + ca);
  }
})();
