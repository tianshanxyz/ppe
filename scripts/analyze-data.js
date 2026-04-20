const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';

const supabase = createClient(supabaseUrl, serviceKey);

async function analyzeData() {
  console.log('=== Detailed Data Analysis ===\n');
  
  // 1. Analyze ppe_products sources
  console.log('1. PPE Products by Source:');
  const { data: productSources } = await supabase
    .from('ppe_products')
    .select('source')
    .limit(50000);
  
  if (productSources) {
    const sourceCounts = {};
    productSources.forEach(r => {
      const s = r.source || 'unknown';
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });
    for (const [source, count] of Object.entries(sourceCounts)) {
      console.log(`   ${source}: ${count}`);
    }
  }
  
  // 2. Analyze ppe_products by market
  console.log('\n2. Products by Target Markets:');
  const { data: products } = await supabase
    .from('ppe_products')
    .select('target_markets, manufacturer_country, product_category')
    .limit(10000);
  
  if (products && products.length > 0) {
    const marketCounts = {};
    const countryCounts = {};
    const categoryCounts = {};
    
    products.forEach(p => {
      if (p.target_markets && Array.isArray(p.target_markets)) {
        p.target_markets.forEach(m => {
          marketCounts[m] = (marketCounts[m] || 0) + 1;
        });
      }
      if (p.manufacturer_country) {
        countryCounts[p.manufacturer_country] = (countryCounts[p.manufacturer_country] || 0) + 1;
      }
      if (p.product_category) {
        categoryCounts[p.product_category] = (categoryCounts[p.product_category] || 0) + 1;
      }
    });
    
    console.log('   Target Markets:');
    for (const [m, c] of Object.entries(marketCounts).sort((a,b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`      ${m}: ${c}`);
    }
    
    console.log('\n   Manufacturer Countries:');
    for (const [c, cnt] of Object.entries(countryCounts).sort((a,b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`      ${c}: ${cnt}`);
    }
    
    console.log('\n   Product Categories:');
    for (const [cat, cnt] of Object.entries(categoryCounts).sort((a,b) => b[1] - a[1])) {
      console.log(`      ${cat}: ${cnt}`);
    }
  }
  
  // 3. Sample products
  console.log('\n3. Sample Products:');
  const { data: samples } = await supabase
    .from('ppe_products')
    .select('product_name, product_code, source, manufacturer_name')
    .limit(5);
  
  if (samples) {
    samples.forEach(s => {
      console.log(`   - ${s.product_name?.substring(0, 50)}...`);
      console.log(`     Code: ${s.product_code}, Source: ${s.source}`);
      console.log(`     Manufacturer: ${s.manufacturer_name?.substring(0, 40)}`);
    });
  }
  
  // 4. Manufacturers
  console.log('\n4. Manufacturers Analysis:');
  const { count: mfrCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  console.log(`   Total: ${mfrCount}`);
  
  const { data: mfrSamples } = await supabase
    .from('ppe_manufacturers')
    .select('company_name, country')
    .limit(5);
  
  if (mfrSamples) {
    console.log('   Sample manufacturers:');
    mfrSamples.forEach(m => {
      console.log(`   - ${m.company_name} (${m.country})`);
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
