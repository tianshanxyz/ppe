const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function testInsert() {
  console.log('Testing database insert...');
  
  const testRecord = [{
    name: 'Test FDA Product - N95 Respirator',
    model: 'TEST001',
    category: '呼吸防护装备',
    subcategory: 'N95',
    description: 'Test record for FDA sync',
    country_of_origin: 'US',
    updated_at: new Date().toISOString(),
  }];
  
  const { error, data } = await supabase.from('ppe_products').insert(testRecord);
  
  if (error) {
    console.log('Insert error:', error.message);
    console.log('Error details:', JSON.stringify(error));
  } else {
    console.log('Insert success!');
    console.log('Data:', data);
  }
  
  process.exit(error ? 1 : 0);
}

testInsert();
