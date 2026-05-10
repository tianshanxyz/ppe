#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function check() {
  const { data: regs } = await supabase.from('ppe_regulations').select('*').limit(2);
  if (regs && regs[0]) {
    console.log('ppe_regulations columns:', Object.keys(regs[0]).join(', '));
    console.log('Sample:', JSON.stringify(regs[0], null, 2));
  }

  const { data: mfrs } = await supabase.from('ppe_manufacturers').select('*').limit(2);
  if (mfrs && mfrs[0]) {
    console.log('\nppe_manufacturers columns:', Object.keys(mfrs[0]).join(', '));
    console.log('Sample:', JSON.stringify(mfrs[0], null, 2));
  }
}

check().catch(console.error);
