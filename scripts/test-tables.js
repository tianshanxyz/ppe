#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  const tables = [
    'ppe_products', 'ppe_manufacturers', 'ppe_regulations',
    'ppe_risk_data', 'ppe_risks', 'ppe_standards',
    'risk_data', 'ppe_incidents', 'ppe_recalls',
    'ppe_violations', 'ppe_injuries', 'ppe_statistics',
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (!error) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(`${table}: EXISTS (${count} rows)`);
    } else {
      console.log(`${table}: NOT EXISTS (${error.message.substring(0, 50)})`);
    }
  }

  const { data: cols } = await supabase.from('ppe_products').select('*').limit(1);
  if (cols && cols[0]) {
    console.log('\nppe_products columns:', Object.keys(cols[0]).join(', '));
  }
}

check().catch(console.error);
