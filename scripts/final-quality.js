#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function dedupManufacturers() {
  console.log('\n=== Manufacturer Deduplication ===\n');

  const { data } = await supabase.from('ppe_manufacturers').select('id, name, country').order('id');
  if (!data || data.length === 0) {
    console.log('No manufacturers to dedup');
    return 0;
  }

  console.log(`Total manufacturers: ${data.length}`);

  const seen = new Map();
  const toDelete = [];

  for (const record of data) {
    const key = `${(record.name || '').toLowerCase().trim()}|${(record.country || '').toLowerCase().trim()}`;

    if (seen.has(key)) {
      toDelete.push(record.id);
    } else {
      seen.set(key, record.id);
    }
  }

  if (toDelete.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      const { error } = await supabase.from('ppe_manufacturers').delete().in('id', batch);
      if (error) {
        console.log(`  Error deleting batch: ${error.message}`);
      }
    }
    console.log(`  ✅ Removed ${toDelete.length} duplicate manufacturers`);
  } else {
    console.log('  No duplicates found');
  }

  return toDelete.length;
}

async function generateQualityReport() {
  console.log('\n' + '='.repeat(70));
  console.log('  PPE DATA QUALITY REPORT');
  console.log('  Generated: ' + new Date().toISOString());
  console.log('='.repeat(70));

  const { count: p } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: m } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: r } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log(`\n📊 DATABASE OVERVIEW`);
  console.log(`  Products:      ${p.toLocaleString()}`);
  console.log(`  Manufacturers: ${m.toLocaleString()}`);
  console.log(`  Regulations:   ${r.toLocaleString()}`);

  const { count: rlNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('risk_level', null);
  const { count: pcNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('product_code', null);
  const { count: mfrNull } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: catOther } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', '其他');

  console.log(`\n📋 FIELD COMPLETENESS`);
  console.log(`  risk_level:       ${((p - rlNull) / p * 100).toFixed(1)}% (${(p - rlNull).toLocaleString()}/${p.toLocaleString()})`);
  console.log(`  product_code:     ${((p - pcNull) / p * 100).toFixed(1)}% (${(p - pcNull).toLocaleString()}/${p.toLocaleString()})`);
  console.log(`  manufacturer_name:${((p - mfrNull) / p * 100).toFixed(1)}% (${(p - mfrNull).toLocaleString()}/${p.toLocaleString()})`);
  console.log(`  category(非其他): ${((p - catOther) / p * 100).toFixed(1)}% (${(p - catOther).toLocaleString()}/${p.toLocaleString()})`);

  const { count: rlHigh } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('risk_level', 'high');
  const { count: rlMed } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('risk_level', 'medium');
  const { count: rlLow } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('risk_level', 'low');

  console.log(`\n📈 RISK LEVEL DISTRIBUTION`);
  console.log(`  High:   ${rlHigh.toLocaleString()} (${(rlHigh / p * 100).toFixed(1)}%)`);
  console.log(`  Medium: ${rlMed.toLocaleString()} (${(rlMed / p * 100).toFixed(1)}%)`);
  console.log(`  Low:    ${rlLow.toLocaleString()} (${(rlLow / p * 100).toFixed(1)}%)`);
  console.log(`  Null:   ${rlNull.toLocaleString()} (${(rlNull / p * 100).toFixed(1)}%)`);

  const categories = ['呼吸防护装备', '手部防护装备', '身体防护装备', '眼面部防护装备', '头部防护装备', '足部防护装备', '其他'];
  console.log(`\n📦 CATEGORY DISTRIBUTION`);
  for (const cat of categories) {
    const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).eq('category', cat);
    console.log(`  ${cat}: ${count.toLocaleString()} (${(count / p * 100).toFixed(1)}%)`);
  }

  const { data: coData } = await supabase.from('ppe_products').select('country_of_origin').limit(50000);
  const coCounts = {};
  coData.forEach(r => {
    const co = r.country_of_origin || 'Unknown';
    coCounts[co] = (coCounts[co] || 0) + 1;
  });
  console.log(`\n🌍 COUNTRY DISTRIBUTION (sample)`);
  Object.entries(coCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    console.log(`  ${k}: ${v.toLocaleString()}`);
  });

  const { data: subData } = await supabase.from('ppe_products').select('subcategory').limit(50000);
  const subCounts = {};
  subData.forEach(r => {
    const sub = r.subcategory || 'NULL';
    subCounts[sub] = (subCounts[sub] || 0) + 1;
  });
  console.log(`\n🏷️  TOP SUBCATEGORIES`);
  Object.entries(subCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
    console.log(`  ${k}: ${v.toLocaleString()}`);
  });

  console.log(`\n📊 DATA SOURCES`);
  const { count: fda510k } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).like('subcategory', 'FDA 510k%');
  const { count: fdaClass } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).like('subcategory', 'FDA Classification%');
  const { count: fdaRecall } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).like('subcategory', 'FDA Recall%');
  const { count: fdaReg } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).like('subcategory', 'FDA Registration%');
  const { count: hcMdall } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).like('subcategory', '%Health Canada%');
  const { count: hcGlove } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).like('subcategory', '%手套%');
  const { count: hcMask } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).like('subcategory', '%口罩%');

  console.log(`  FDA 510k:         ${fda510k.toLocaleString()}`);
  console.log(`  FDA Classification:${fdaClass.toLocaleString()}`);
  console.log(`  FDA Recall:       ${fdaRecall.toLocaleString()}`);
  console.log(`  FDA Registration: ${fdaReg.toLocaleString()}`);
  console.log(`  Health Canada:    ${hcMdall.toLocaleString()}`);
  console.log(`  HC 手套:          ${hcGlove.toLocaleString()}`);
  console.log(`  HC 口罩:          ${hcMask.toLocaleString()}`);

  console.log(`\n⚠️  QUALITY ISSUES`);
  console.log(`  Missing risk_level:       ${rlNull.toLocaleString()} records`);
  console.log(`  Missing product_code:     ${pcNull.toLocaleString()} records`);
  console.log(`  Missing manufacturer_name:${mfrNull.toLocaleString()} records`);
  console.log(`  Uncategorized (其他):     ${catOther.toLocaleString()} records`);

  console.log('\n' + '='.repeat(70));
}

async function main() {
  const command = process.argv[2] || 'all';

  if (command === 'all' || command === 'dedup') {
    await dedupManufacturers();
  }

  if (command === 'all' || command === 'report') {
    await generateQualityReport();
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
