#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function main() {
  const searches = ['3M', '稳健', 'Honeywell', 'Ansell', '振德', 'DuPont', 'MSA', 'Drager', 'Uvex', 'Delta Plus'];
  for (const kw of searches) {
    const { data } = await supabase.from('ppe_manufacturers').select('name,country').ilike('name', `%${kw}%`).limit(5);
    console.log(`${kw}:`, data ? data.map(d => `${d.name} (${d.country})`) : 'none');
  }
}
main();
