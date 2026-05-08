#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function main() {
  const { data, error } = await supabase
    .from('ppe_manufacturers')
    .select('id,name')
    .ilike('name', '%3M%')
    .limit(1);

  if (error || !data || data.length === 0) {
    console.log('No match:', error);
    return;
  }

  const mfr = data[0];
  console.log('Updating:', mfr.id, mfr.name);

  const updateData = {
    website: 'https://www.3m.com',
    address: '3M Center, St. Paul, MN 55144, USA',
    company_profile: JSON.stringify({ name_en: '3M Company', established: '1902' }),
    data_confidence_level: 'high',
    last_verified: new Date().toISOString().split('T')[0],
  };

  const { data: updated, error: updateErr } = await supabase
    .from('ppe_manufacturers')
    .update(updateData)
    .eq('id', mfr.id)
    .select();

  console.log('Result:', { updated: updated?.length, error: updateErr });
}
main();
