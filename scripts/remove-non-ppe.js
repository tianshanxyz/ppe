#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_CODES = new Set([
  'FXX', 'FXS', 'MSH', 'KZE', 'QKR', 'LYU', 'OEA', 'MSL',
  'LIT', 'LZG', 'LZJ', 'KCC', 'JKA', 'NHF', 'MFA', 'KIF',
  'MSM', 'LXG', 'LZS', 'LZU', 'LZV', 'NHL', 'NHM', 'NXF',
  'OEM', 'OEN', 'OEO', 'OEP', 'OEQ', 'OER', 'OES', 'OET',
  'OEY', 'OEZ', 'OFA', 'OFB', 'OFC', 'OFD', 'OFE', 'OFF',
  'OFG', 'OFH', 'OFI', 'OFJ', 'OFK', 'OFL', 'OFM', 'OFN',
  'OFO', 'OFP', 'OFQ', 'OFR', 'OFS', 'OFT', 'OFU', 'OFV',
  'OFW', 'OFX', 'OFY', 'OFZ', 'OGA', 'OGB', 'OGC', 'OGD',
  'OGE', 'OGF', 'OGG', 'OGH', 'OGI', 'OGJ', 'OGK', 'OGL',
  'OGM', 'OGN', 'OGO', 'OGP', 'OGQ', 'OGR', 'OGS', 'OGT',
  'OGU', 'OGV', 'OGW', 'OGX', 'OGY', 'OGZ', 'OHA', 'OHB',
  'OHC', 'OHD', 'OHE', 'OHF', 'OHG', 'OHH', 'OHI', 'OHJ',
  'OHK', 'OHL', 'OHM', 'OHN', 'OHO', 'OHP', 'OHQ', 'OHR',
  'OHS', 'OHT', 'OHU', 'OHV', 'OHW', 'OHX', 'OHY', 'OHZ',
]);

const PPE_NAME_KEYWORDS = [
  'mask', 'respirator', 'n95', 'kn95', 'ffp2', 'ffp3',
  'glove', 'gown', 'shield', 'goggle', 'coverall', 'cap',
  'hood', 'apron', 'protective', 'isolation', 'surgical',
  'face shield', 'shoe cover', 'boot cover', 'head cover',
  'bouffant', 'scrub', 'barrier', 'tyvek', 'hazmat',
  'nitrile', 'latex', 'vinyl', 'examination',
];

async function removeNonPPE() {
  console.log('\n=== Remove Non-PPE Products from Database ===\n');

  const { count: totalBefore } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });

  console.log(`Total products before cleanup: ${totalBefore.toLocaleString()}`);

  const batchSize = 2000;
  let offset = 0;
  let toDelete = [];

  while (offset < totalBefore) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, product_code, model, description, category, subcategory')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const isPPECategorized = p.category && p.category !== '其他';
      if (isPPECategorized) continue;

      const code = (p.product_code || p.model || '').toUpperCase();
      const isPPECode = PPE_CODES.has(code);

      const text = [
        p.name || '',
        p.description || '',
        p.subcategory || '',
      ].join(' ').toLowerCase();

      const hasPPEKeyword = PPE_NAME_KEYWORDS.some(kw => text.includes(kw));

      if (!isPPECode && !hasPPEKeyword) {
        toDelete.push(p.id);
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  Scanned ${offset}/${totalBefore}, found ${toDelete.length} non-PPE`);
    }
  }

  console.log(`\n  Found ${toDelete.length} non-PPE products to remove`);

  let deleted = 0;
  const deleteBatch = 500;
  for (let i = 0; i < toDelete.length; i += deleteBatch) {
    const batch = toDelete.slice(i, i + deleteBatch);
    const { error } = await supabase
      .from('ppe_products')
      .delete()
      .in('id', batch);

    if (!error) {
      deleted += batch.length;
    } else {
      console.log(`  Delete error: ${error.message}`);
    }

    if ((i + deleteBatch) % 10000 === 0) {
      console.log(`  Deleted ${deleted}/${toDelete.length}`);
    }
  }

  console.log(`  ✅ Deleted ${deleted} non-PPE products`);

  const { count: totalAfter } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });

  const { count: otherAfter } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`\n  Products after cleanup: ${totalAfter.toLocaleString()}`);
  console.log(`  Remaining "其他": ${otherAfter.toLocaleString()} (${(otherAfter / totalAfter * 100).toFixed(1)}%)`);
}

async function main() {
  await removeNonPPE();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
