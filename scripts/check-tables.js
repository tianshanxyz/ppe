const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkAndInitTables() {
  console.log('=== Database Initialization Check ===\n');
  
  // 1. Check if tables exist by trying to query them
  const tables = [
    'ppe_products',
    'ppe_manufacturers', 
    'ppe_regulations',
    'ppe_product_markets',
    'ppe_certification_bodies',
    'ppe_competitors',
    'companies',
    'companies_enhanced',
    'regulations',
    'data_sources',
    'fda_510k',
    'fda_pma'
  ];
  
  console.log('Checking existing tables:\n');
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`[MISSING] ${table}`);
        } else {
          console.log(`[ERROR] ${table}: ${error.message}`);
        }
      } else {
        console.log(`[EXISTS] ${table} (${count || 0} rows)`);
      }
    } catch (e) {
      console.log(`[MISSING] ${table}`);
    }
  }
  
  console.log('\n=== Initialization Complete ===');
}

checkAndInitTables()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
