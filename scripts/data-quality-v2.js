#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function dedupProducts() {
  console.log('\n=== Product Deduplication ===\n');

  const batchSize = 5000;
  let offset = 0;
  const seen = new Map();
  let totalDuplicates = 0;
  let totalProcessed = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`Total products: ${count}`);

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, model, category, subcategory, manufacturer_name, country_of_origin, product_code')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const record of data) {
      totalProcessed++;
      const key = `${(record.name || '').toLowerCase().trim()}|${(record.model || '').toLowerCase().trim()}|${(record.manufacturer_name || '').toLowerCase().trim()}`;
      
      if (seen.has(key)) {
        const existingId = seen.get(key);
        const { error } = await supabase.from('ppe_products').delete().eq('id', record.id);
        if (!error) {
          totalDuplicates++;
          if (totalDuplicates % 100 === 0) {
            console.log(`  Removed ${totalDuplicates} duplicates so far...`);
          }
        }
      } else {
        seen.set(key, record.id);
      }
    }

    offset += batchSize;
    console.log(`  Processed ${totalProcessed}/${count}, duplicates: ${totalDuplicates}`);
  }

  console.log(`\n  ✅ Removed ${totalDuplicates} duplicate products`);
  return totalDuplicates;
}

async function dedupManufacturers() {
  console.log('\n=== Manufacturer Deduplication ===\n');

  const { data } = await supabase.from('ppe_manufacturers').select('*');
  if (!data || data.length === 0) {
    console.log('No manufacturers to dedup');
    return 0;
  }

  console.log(`Total manufacturers: ${data.length}`);

  const seen = new Map();
  let totalDuplicates = 0;

  for (const record of data) {
    const key = `${(record.name || '').toLowerCase().trim()}|${(record.country || '').toLowerCase().trim()}`;
    
    if (seen.has(key)) {
      const { error } = await supabase.from('ppe_manufacturers').delete().eq('id', record.id);
      if (!error) totalDuplicates++;
    } else {
      seen.set(key, record.id);
    }
  }

  console.log(`  ✅ Removed ${totalDuplicates} duplicate manufacturers`);
  return totalDuplicates;
}

async function fixCountryOfOrigin() {
  console.log('\n=== Fix Country of Origin ===\n');

  const batchSize = 5000;
  let offset = 0;
  let totalFixed = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, country_of_origin, subcategory, description, manufacturer_name')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const record of data) {
      if (record.country_of_origin && record.country_of_origin !== 'Unknown' && record.country_of_origin.length === 2) continue;

      let country = null;

      if (record.subcategory) {
        const sub = record.subcategory.toLowerCase();
        if (sub.includes('health canada') || sub.includes('mdall')) country = 'CA';
        else if (sub.includes('fda') || sub.includes('510k') || sub.includes('classification') || sub.includes('recall') || sub.includes('enforcement') || sub.includes('registration') || sub.includes('surgical mask') || sub.includes('isolation gown') || sub.includes('examination glove') || sub.includes('surgeon') || sub.includes('face shield') || sub.includes('protective goggle') || sub.includes('surgical cap') || sub.includes('surgical gown') || sub.includes('protective garment') || sub.includes('protective clothing') || sub.includes('respirator') || sub.includes('n95') || sub.includes('adverse event')) country = 'US';
        else if (sub.includes('tga') || sub.includes('australia')) country = 'AU';
        else if (sub.includes('eudamed') || sub.includes('eu')) country = 'EU';
        else if (sub.includes('nmpa') || sub.includes('china')) country = 'CN';
      }

      if (!country && record.description) {
        const desc = record.description.toLowerCase();
        if (desc.includes('health canada') || desc.includes('mdall') || desc.includes('licence no')) country = 'CA';
        else if (desc.includes('fda') || desc.includes('510(k)') || desc.includes('k-number')) country = 'US';
      }

      if (!country && record.manufacturer_name) {
        const mfr = record.manufacturer_name.toLowerCase();
        if (mfr.includes('inc') || mfr.includes('corp') || mfr.includes('llc') || mfr.includes('ltd')) country = 'US';
        else if (mfr.includes('gmbh') || mfr.includes('ag')) country = 'DE';
        else if (mfr.includes('s.a.') || mfr.includes('s.r.l')) country = 'EU';
        else if (mfr.includes('ltd.') || mfr.includes('co., ltd')) country = 'CN';
      }

      if (country) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ country_of_origin: country })
          .eq('id', record.id);
        if (!error) totalFixed++;
      }
    }

    console.log(`  Offset ${offset}: Fixed ${totalFixed} records`);
    offset += batchSize;
  }

  console.log(`\n  ✅ Fixed ${totalFixed} country records`);
  return totalFixed;
}

async function qualityReport() {
  console.log('\n=== Data Quality Report ===\n');

  const { count: productCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: regCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log(`Products: ${productCount}`);
  console.log(`Manufacturers: ${mfrCount}`);
  console.log(`Regulations: ${regCount}`);

  const batchSize = 5000;
  let offset = 0;
  let nullName = 0, nullCategory = 0, nullCountry = 0, nullMfr = 0, hasMfr = 0, hasProductCode = 0, hasRiskLevel = 0;

  while (offset < productCount) {
    const { data } = await supabase
      .from('ppe_products')
      .select('name, category, country_of_origin, manufacturer_name, product_code, risk_level')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      if (!r.name || r.name === 'Unknown') nullName++;
      if (!r.category || r.category === '其他') nullCategory++;
      if (!r.country_of_origin || r.country_of_origin === 'Unknown') nullCountry++;
      if (!r.manufacturer_name) nullMfr++;
      else hasMfr++;
      if (r.product_code) hasProductCode++;
      if (r.risk_level) hasRiskLevel++;
    }

    offset += batchSize;
  }

  console.log('\nProduct Quality:');
  console.log(`  Name filled: ${((productCount - nullName) / productCount * 100).toFixed(1)}%`);
  console.log(`  Category filled: ${((productCount - nullCategory) / productCount * 100).toFixed(1)}%`);
  console.log(`  Country filled: ${((productCount - nullCountry) / productCount * 100).toFixed(1)}%`);
  console.log(`  Manufacturer filled: ${(hasMfr / productCount * 100).toFixed(1)}%`);
  console.log(`  Product code filled: ${(hasProductCode / productCount * 100).toFixed(1)}%`);
  console.log(`  Risk level filled: ${(hasRiskLevel / productCount * 100).toFixed(1)}%`);
}

async function main() {
  const command = process.argv[2] || 'all';

  if (command === 'all' || command === 'dedup') {
    await dedupProducts();
    await dedupManufacturers();
  }

  if (command === 'all' || command === 'fix') {
    await fixCountryOfOrigin();
  }

  if (command === 'all' || command === 'report') {
    await qualityReport();
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
