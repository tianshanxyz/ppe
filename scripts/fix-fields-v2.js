#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_CODES_3LETTER = new Set([
  'MSH', 'FXX', 'FXS', 'MSL', 'LYU', 'OEA', 'KZE', 'QKR',
  'NHF', 'NHL', 'NHM', 'NXF', 'KCC', 'JKA', 'LIT', 'MFA',
  'KIF', 'MSM', 'LXG', 'LZS', 'LZU', 'LZV', 'LZG', 'LZJ',
  'OEM', 'OEN', 'KZT', 'KZU', 'KZV', 'KZW',
  'LZC', 'LZD', 'LZE', 'LZF', 'LZH', 'LZI', 'LZK', 'LZL',
  'LZM', 'LZN', 'LZO', 'LZP', 'LZQ', 'LZR', 'LZS', 'LZT',
  'LZW', 'LZX', 'LZY', 'LZZ',
  'FYA', 'FYB', 'FYC', 'FYD', 'FYE', 'FYF', 'FYG', 'FYH',
  'FYI', 'FYJ', 'FYK', 'FYL', 'FYM', 'FYN',
  'FZA', 'FZB', 'FZC', 'FZD',
  'OEO', 'OEP', 'OEQ', 'OER', 'OES', 'OET', 'OEY', 'OEZ',
  'OFA', 'OFB', 'OFC', 'OFD', 'OFE', 'OFF', 'OFG', 'OFH',
  'OFI', 'OFJ', 'OFK', 'OFL', 'OFM', 'OFN', 'OFO', 'OFP',
  'OFQ', 'OFR', 'OFS', 'OFT', 'OFU', 'OFV', 'OFW', 'OFX',
  'OFY', 'OFZ',
  'OGA', 'OGB', 'OGC', 'OGD', 'OGE', 'OGF', 'OGG', 'OGH',
  'OGI', 'OGJ', 'OGK', 'OGL', 'OGM', 'OGN', 'OGO', 'OGP',
  'OGQ', 'OGR', 'OGS', 'OGT', 'OGU', 'OGV', 'OGW', 'OGX',
  'OGY', 'OGZ',
  'OHA', 'OHB', 'OHC', 'OHD', 'OHE', 'OHF', 'OHG', 'OHH',
  'OHI', 'OHJ', 'OHK', 'OHL', 'OHM', 'OHN', 'OHO', 'OHP',
  'OHQ', 'OHR', 'OHS', 'OHT', 'OHU', 'OHV', 'OHW', 'OHX',
  'OHY', 'OHZ',
  'LZA', 'LZB', 'LXC', 'LXD', 'LXE', 'LXF', 'LXH', 'LXI',
  'LXJ', 'LXK', 'LXL', 'LXM', 'LXN', 'LXO', 'LXP', 'LXQ',
  'LXR', 'LXS', 'LXT', 'LXU', 'LXV', 'LXW', 'LXX', 'LXY', 'LXZ',
]);

async function fixProductCodeFromModel() {
  console.log('\n=== Fix Product Code from Model Field ===\n');
  let fixed = 0;
  const batchSize = 5000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null);

  console.log(`Products without product_code: ${count.toLocaleString()}`);

  while (offset < count + batchSize) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, model')
      .is('product_code', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const model = (p.model || '').trim().toUpperCase();
      if (model.length === 3 && PPE_CODES_3LETTER.has(model)) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: model })
          .eq('id', p.id);
        if (!error) fixed++;
      }
    }

    offset += batchSize;
    if (offset % 20000 === 0) {
      console.log(`  Offset ${offset}: fixed ${fixed}`);
    }
  }

  console.log(`  ✅ Fixed ${fixed} product codes from model field`);
}

async function fixCountryOfOrigin() {
  console.log('\n=== Fix Country of Origin ===\n');
  let fixed = 0;

  const countryMap = [
    { pattern: 'CA', value: 'CA' },
    { pattern: 'Canada', value: 'CA' },
    { pattern: 'US', value: 'US' },
    { pattern: 'USA', value: 'US' },
    { pattern: 'United States', value: 'US' },
    { pattern: 'CN', value: 'CN' },
    { pattern: 'China', value: 'CN' },
    { pattern: 'DE', value: 'DE' },
    { pattern: 'Germany', value: 'DE' },
    { pattern: 'JP', value: 'JP' },
    { pattern: 'Japan', value: 'JP' },
    { pattern: 'GB', value: 'GB' },
    { pattern: 'UK', value: 'GB' },
    { pattern: 'MY', value: 'MY' },
    { pattern: 'Malaysia', value: 'MY' },
    { pattern: 'KR', value: 'KR' },
    { pattern: 'South Korea', value: 'KR' },
    { pattern: 'AU', value: 'AU' },
    { pattern: 'Australia', value: 'AU' },
    { pattern: 'FR', value: 'FR' },
    { pattern: 'France', value: 'FR' },
    { pattern: 'IT', value: 'IT' },
    { pattern: 'Italy', value: 'IT' },
    { pattern: 'IN', value: 'IN' },
    { pattern: 'India', value: 'IN' },
    { pattern: 'TH', value: 'TH' },
    { pattern: 'Thailand', value: 'TH' },
    { pattern: 'TW', value: 'TW' },
    { pattern: 'Taiwan', value: 'TW' },
  ];

  const { count: unknownCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('country_of_origin', 'Unknown');

  console.log(`Products with country "Unknown": ${unknownCount.toLocaleString()}`);

  const { data: sample } = await supabase
    .from('ppe_products')
    .select('id, country_of_origin, description')
    .eq('country_of_origin', 'Unknown')
    .limit(20);

  for (const p of (sample || [])) {
    const desc = p.description || '';
    for (const cm of countryMap) {
      if (desc.includes(cm.pattern)) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ country_of_origin: cm.value })
          .eq('id', p.id);
        if (!error) fixed++;
        break;
      }
    }
  }

  console.log(`  ✅ Fixed ${fixed} country records (sample)`);
}

async function main() {
  const command = process.argv[2] || 'all';

  if (command === 'all' || command === 'pc') {
    await fixProductCodeFromModel();
  }

  if (command === 'all' || command === 'country') {
    await fixCountryOfOrigin();
  }

  const { count: p } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: pcNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);

  console.log(`\n  Database: ${p.toLocaleString()} products`);
  console.log(`  Missing product_code: ${pcNull.toLocaleString()} (${(pcNull / p * 100).toFixed(1)}%)`);
  console.log(`  Missing manufacturer_name: ${mfrNull.toLocaleString()} (${(mfrNull / p * 100).toFixed(1)}%)`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
