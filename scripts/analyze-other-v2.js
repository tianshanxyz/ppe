#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function analyze() {
  const { data, error } = await supabase
    .from('ppe_products')
    .select('*')
    .eq('category', '其他')
    .limit(5);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data returned');
    return;
  }

  console.log('Sample "其他" products:');
  data.forEach((p, i) => {
    console.log(`\n--- Product ${i + 1} ---`);
    for (const [key, value] of Object.entries(p)) {
      if (value !== null && value !== undefined) {
        console.log(`  ${key}: ${String(value).substring(0, 100)}`);
      }
    }
  });

  const { count: totalOther } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  const { count: hasName } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他')
    .not('name', 'is', null);

  const { count: hasDesc } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他')
    .not('description', 'is', null);

  const { count: hasModel } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他')
    .not('model', 'is', null);

  const { count: hasSub } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他')
    .not('subcategory', 'is', null);

  console.log(`\n\nField stats for "其他" (${totalOther} total):`);
  console.log(`  Has name: ${hasName} (${(hasName / totalOther * 100).toFixed(1)}%)`);
  console.log(`  Has description: ${hasDesc} (${(hasDesc / totalOther * 100).toFixed(1)}%)`);
  console.log(`  Has model: ${hasModel} (${(hasModel / totalOther * 100).toFixed(1)}%)`);
  console.log(`  Has subcategory: ${hasSub} (${(hasSub / totalOther * 100).toFixed(1)}%)`);
}

analyze().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
