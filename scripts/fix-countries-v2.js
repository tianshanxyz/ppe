#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fixCountries() {
  console.log('\n=== Fix Country of Origin ===\n');

  const updates = [
    { old: 'Unknown', new: 'US', desc_contains: 'United States' },
    { old: 'Unknown', new: 'CN', desc_contains: 'China' },
    { old: 'Unknown', new: 'DE', desc_contains: 'Germany' },
    { old: 'Unknown', new: 'JP', desc_contains: 'Japan' },
    { old: 'Unknown', new: 'GB', desc_contains: 'United Kingdom' },
    { old: 'Unknown', new: 'MY', desc_contains: 'Malaysia' },
    { old: 'Unknown', new: 'KR', desc_contains: 'South Korea' },
    { old: 'Unknown', new: 'AU', desc_contains: 'Australia' },
    { old: 'Unknown', new: 'FR', desc_contains: 'France' },
    { old: 'Unknown', new: 'IT', desc_contains: 'Italy' },
    { old: 'Unknown', new: 'IN', desc_contains: 'India' },
    { old: 'Unknown', new: 'TH', desc_contains: 'Thailand' },
    { old: 'Unknown', new: 'TW', desc_contains: 'Taiwan' },
    { old: 'Unknown', new: 'BR', desc_contains: 'Brazil' },
    { old: 'Unknown', new: 'MX', desc_contains: 'Mexico' },
    { old: 'Unknown', new: 'IE', desc_contains: 'Ireland' },
    { old: 'Unknown', new: 'SE', desc_contains: 'Sweden' },
    { old: 'Unknown', new: 'CH', desc_contains: 'Switzerland' },
    { old: 'Unknown', new: 'NL', desc_contains: 'Netherlands' },
    { old: 'Unknown', new: 'BE', desc_contains: 'Belgium' },
    { old: 'Unknown', new: 'ES', desc_contains: 'Spain' },
    { old: 'Unknown', new: 'IL', desc_contains: 'Israel' },
  ];

  let totalFixed = 0;

  for (const u of updates) {
    const { count } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('country_of_origin', u.old)
      .ilike('description', `%${u.desc_contains}%`);

    if (count > 0) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ country_of_origin: u.new })
        .eq('country_of_origin', u.old)
        .ilike('description', `%${u.desc_contains}%`);

      if (!error) {
        totalFixed += count;
        console.log(`  ✅ ${u.desc_contains} → ${u.new}: ${count} records`);
      } else {
        console.log(`  ❌ ${u.desc_contains}: ${error.message}`);
      }
    }
  }

  const { count: unknownCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('country_of_origin', 'Unknown');

  const { count: total } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });

  console.log(`\n  ✅ Total fixed: ${totalFixed}`);
  console.log(`  Remaining "Unknown": ${unknownCount.toLocaleString()} (${(unknownCount / total * 100).toFixed(1)}%)`);
}

async function main() {
  await fixCountries();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
