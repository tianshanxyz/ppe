#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xtqhjyiyjhxfdzyypfqq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU');

async function test() {
  const { data, error } = await supabase.from('ppe_products').select('*').limit(1);
  if (data && data[0]) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
  }
  console.log('Error:', error?.message);
}
test();
