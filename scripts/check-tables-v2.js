const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function checkTables() {
  console.log('=== Tables in Database ===\n');
  
  // Try to query from different possible table names
  const tables = ['data_sources', 'DataSources', 'data_sources_table', 'sync_status'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`[${table}]: Error - ${error.message}`);
      } else {
        console.log(`[${table}]: EXISTS - columns: ${data ? Object.keys(data[0] || {}).join(', ') : 'empty'}`);
      }
    } catch (e) {
      console.log(`[${table}]: ${e.message}`);
    }
  }
  
  // Get counts of all known tables
  console.log('\n=== Table Counts ===\n');
  
  const allTables = ['ppe_products', 'ppe_manufacturers', 'ppe_regulations', 'ppe_product_markets', 
                     'ppe_certification_bodies', 'ppe_competitors', 'companies', 'companies_enhanced'];
  
  for (const table of allTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`${table}: ${count || 0} rows`);
      }
    } catch (e) {
      console.log(`${table}: Error`);
    }
  }
}

checkTables().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
