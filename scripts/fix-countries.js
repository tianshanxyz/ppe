#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fixCountries() {
  console.log('\n=== Bulk Fix Country of Origin ===\n');

  const batchSize = 5000;
  let offset = 0;
  let totalFixed = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`Total records: ${count}`);

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, country_of_origin, description, subcategory')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    const updates = [];

    for (const record of data) {
      let country = record.country_of_origin;
      
      if (country && country !== 'Unknown' && country.length === 2) continue;

      let newCountry = null;

      if (record.description) {
        const desc = record.description;
        const match = desc.match(/Country:\s*([A-Z]{2})/);
        if (match) newCountry = match[1];
      }

      if (!newCountry && record.subcategory) {
        const sub = record.subcategory.toLowerCase();
        if (sub.includes('health canada') || sub.includes('mdall') || sub.includes('licence')) newCountry = 'CA';
        else if (sub.includes('surgical mask') || sub.includes('isolation gown') || sub.includes('examination glove') || sub.includes('surgeon') || sub.includes('face shield') || sub.includes('protective goggle') || sub.includes('surgical cap') || sub.includes('surgical gown') || sub.includes('protective garment') || sub.includes('protective clothing') || sub.includes('respirator') || sub.includes('n95') || sub.includes('n99') || sub.includes('n100') || sub.includes('adverse event') || sub.includes('enforcement') || sub.includes('recall')) newCountry = 'US';
        else if (sub.includes('tga') || sub.includes('australia')) newCountry = 'AU';
        else if (sub.includes('eudamed') || sub.includes('eu')) newCountry = 'EU';
        else if (sub.includes('nmpa') || sub.includes('china')) newCountry = 'CN';
      }

      if (!newCountry && (country === 'Unknown' || !country)) {
        if (record.description && record.description.includes('Owner:')) {
          newCountry = 'US';
        }
      }

      if (newCountry && newCountry !== country) {
        updates.push({ id: record.id, country: newCountry });
      }
    }

    if (updates.length > 0) {
      for (const upd of updates) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ country_of_origin: upd.country })
          .eq('id', upd.id);
        if (!error) totalFixed++;
      }
      console.log(`  Offset ${offset}: Fixed ${updates.length} records`);
    }

    offset += batchSize;
  }

  console.log(`\n✅ Total fixed: ${totalFixed} records`);
}

fixCountries().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
