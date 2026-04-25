#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS = [
  'mask', 'respirator', 'n95', 'kn95', 'ffp', 'glove', 'gown', 'shield',
  'goggle', 'coverall', 'cap', 'hood', 'apron', 'isolation', 'protective',
  'surgical', 'cover', 'barrier', 'tyvek', 'hazmat', 'nitrile', 'latex',
  'vinyl', 'examination', 'bouffant', 'scrub', 'papr', 'face', 'head',
  'hand', 'body', 'foot', 'eye', 'filter', 'particulate', 'air-purifying',
  'surgical cap', 'shoe cover', 'boot cover', 'patient', 'surgeon',
  'procedure', 'disposable', 'sterile', 'non-sterile', 'cleanroom',
  'chemotherapy', 'impervious', 'fluid', 'splash', 'bloodborne',
];

async function deepClean() {
  console.log('\n=== Deep Clean Non-PPE Products ===\n');

  const { count: totalOther } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', '其他');

  console.log(`"其他" products: ${totalOther.toLocaleString()}`);

  const batchSize = 2000;
  let offset = 0;
  let toDelete = [];
  let toKeep = 0;

  while (offset < totalOther + batchSize) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, description, subcategory, model, product_code')
      .eq('category', '其他')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const text = [
        p.name || '',
        p.description || '',
        p.subcategory || '',
        p.model || '',
      ].join(' ').toLowerCase();

      const isPPE = PPE_KEYWORDS.some(kw => text.includes(kw));

      if (!isPPE) {
        toDelete.push(p.id);
      } else {
        toKeep++;
      }
    }

    offset += batchSize;
    if (offset % 10000 === 0) {
      console.log(`  Scanned ${offset}, toDelete: ${toDelete.length}, toKeep: ${toKeep}`);
    }
  }

  console.log(`\n  To delete: ${toDelete.length.toLocaleString()}`);
  console.log(`  To keep: ${toKeep.toLocaleString()}`);

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
    }

    if ((i + deleteBatch) % 5000 === 0 || i + deleteBatch >= toDelete.length) {
      console.log(`  Deleted ${deleted}/${toDelete.length}`);
    }
  }

  console.log(`  ✅ Deleted ${deleted.toLocaleString()} non-PPE products`);

  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: other } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log(`\n  Total products: ${total.toLocaleString()}`);
  console.log(`  Remaining "其他": ${other.toLocaleString()} (${(other / total * 100).toFixed(1)}%)`);
}

async function main() {
  await deepClean();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
