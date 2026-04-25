#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);
async function run() {
  const test = { name: 'Test Regulation', region: 'US' };
  const { data, error } = await s.from('ppe_regulations').insert(test).select();
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Data:', JSON.stringify(data[0], null, 2));
    await s.from('ppe_regulations').delete().eq('id', data[0].id);
  }
}
run().then(() => process.exit(0));
