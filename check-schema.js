const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDU1NTksImV4cCI6MjA5MjA4MTU1OX0.2uWuP-DZQ3nGqan8Bw9Sa8v7eZI49dvgUgRU8Jgdy4w'
);

(async () => {
  const { data, error } = await supabase.from('ppe_manufacturers').select('*').limit(1);
  if (error) {
    console.log('ERROR:', JSON.stringify(error, null, 2));
    return;
  }
  if (data && data.length > 0) {
    console.log('COLUMNS:', Object.keys(data[0]).join(', '));
    console.log('SAMPLE:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('TABLE_EMPTY');
  }
  
  // Also try to query with company_name to confirm the error
  const { data: d2, error: e2 } = await supabase
    .from('ppe_manufacturers')
    .select('*')
    .order('company_name', { ascending: true })
    .limit(1);
  if (e2) {
    console.log('COMPANY_NAME_ORDER_ERROR:', e2.message);
  }
  
  // Try with name column
  const { data: d3, error: e3 } = await supabase
    .from('ppe_manufacturers')
    .select('*')
    .order('name', { ascending: true })
    .limit(1);
  if (e3) {
    console.log('NAME_ORDER_ERROR:', e3.message);
  } else {
    console.log('NAME_ORDER_SUCCESS: found', d3 ? d3.length : 0, 'records');
    if (d3 && d3.length > 0) {
      console.log('NAME_COLUMNS:', Object.keys(d3[0]).join(', '));
    }
  }
})();
