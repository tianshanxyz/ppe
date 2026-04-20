const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

const supabase = createClient(supabaseUrl, serviceKey);

async function analyzeData() {
  console.log('=== Detailed Data Analysis ===\n');
  
  // 1. Check table columns
  console.log('1. PPE Products Table Info:');
  const { data: sample, error } = await supabase
    .from('ppe_products')
    .select('*')
    .limit(1);
  
  if (sample && sample.length > 0) {
    console.log('   Available columns:', Object.keys(sample[0]).join(', '));
    console.log('   Sample record:', JSON.stringify(sample[0], null, 2).substring(0, 500));
  } else if (error) {
    console.log('   Error:', error.message);
  } else {
    console.log('   No records found');
  }
  
  // 2. Check ppe_manufacturers columns
  console.log('\n2. PPE Manufacturers Table Info:');
  const { data: mfrSample } = await supabase
    .from('ppe_manufacturers')
    .select('*')
    .limit(1);
  
  if (mfrSample && mfrSample.length > 0) {
    console.log('   Available columns:', Object.keys(mfrSample[0]).join(', '));
    console.log('   Sample record:', JSON.stringify(mfrSample[0], null, 2).substring(0, 500));
  }
  
  // 3. Count by what we can
  console.log('\n3. Data Summary:');
  const { count: productCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  console.log(`   ppe_products: ${productCount} rows`);
  
  const { count: mfrCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  console.log(`   ppe_manufacturers: ${mfrCount} rows`);
  
  // 4. Get some actual records
  console.log('\n4. Sample PPE Products:');
  const { data: products } = await supabase
    .from('ppe_products')
    .select('*')
    .limit(5);
  
  if (products) {
    products.forEach((p, i) => {
      console.log(`\n   [${i+1}] ${JSON.stringify(p).substring(0, 300)}...`);
    });
  }
  
  // 5. Sample Manufacturers  
  console.log('\n5. Sample Manufacturers:');
  const { data: mfrs } = await supabase
    .from('ppe_manufacturers')
    .select('*')
    .limit(5);
  
  if (mfrs) {
    mfrs.forEach((m, i) => {
      console.log(`\n   [${i+1}] ${JSON.stringify(m).substring(0, 300)}...`);
    });
  }
  
  console.log('\n=== Analysis Complete ===');
}

analyzeData()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
