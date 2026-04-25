#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function batchFixRiskLevel() {
  console.log('\n=== Batch Fix Risk Level ===\n');

  const updates = [
    { filter: { category: '呼吸防护装备' }, value: 'high', label: '呼吸防护装备→high' },
    { filter: { category: '身体防护装备' }, value: 'medium', label: '身体防护装备→medium' },
    { filter: { category: '手部防护装备' }, value: 'low', label: '手部防护装备→low' },
    { filter: { category: '眼面部防护装备' }, value: 'low', label: '眼面部防护装备→low' },
    { filter: { category: '头部防护装备' }, value: 'low', label: '头部防护装备→low' },
    { filter: { category: '足部防护装备' }, value: 'low', label: '足部防护装备→low' },
    { filter: { category: '其他' }, value: 'medium', label: '其他→medium' },
  ];

  for (const u of updates) {
    const { count } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .is('risk_level', null)
      .match(u.filter);

    if (count > 0) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ risk_level: u.value })
        .is('risk_level', null)
        .match(u.filter);

      if (!error) {
        console.log(`  ✅ ${u.label}: ${count} records`);
      } else {
        console.log(`  ❌ ${u.label}: ${error.message}`);
      }
    } else {
      console.log(`  ⏭️  ${u.label}: 0 records (already fixed)`);
    }
  }

  const { count: remaining } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('risk_level', null);
  console.log(`\n  Remaining null risk_level: ${remaining}`);
}

async function batchFixProductCode() {
  console.log('\n=== Batch Fix Product Code from Model ===\n');
  let fixed = 0;
  const batchSize = 5000;
  let offset = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, model, product_code')
      .is('product_code', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      if (!r.model) continue;
      const parts = r.model.split('_');
      if (parts.length >= 1 && parts[0].length >= 2 && parts[0].length <= 5) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: parts[0] })
          .eq('id', r.id);
        if (!error) fixed++;
      }
    }

    offset += batchSize;
    if (fixed > 0 && offset % 20000 === 0) {
      console.log(`  Progress: ${fixed} fixed`);
    }
  }

  console.log(`\n  ✅ Fixed ${fixed} product code records`);

  const { count: remaining } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('product_code', null);
  console.log(`  Remaining null product_code: ${remaining}`);
}

async function batchFixManufacturer() {
  console.log('\n=== Batch Fix Manufacturer Name ===\n');
  let fixed = 0;
  const batchSize = 5000;
  let offset = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description, manufacturer_name')
      .is('manufacturer_name', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      if (!r.description) continue;

      let mfr = null;
      const applicantMatch = r.description.match(/Applicant:\s*([^|,\n]+)/);
      if (applicantMatch) {
        mfr = applicantMatch[1].trim();
      }

      if (!mfr) {
        const companyMatch = r.description.match(/Company:\s*([^|,\n]+)/);
        if (companyMatch) mfr = companyMatch[1].trim();
      }

      if (mfr && mfr.length > 0 && mfr.length < 200) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfr })
          .eq('id', r.id);
        if (!error) fixed++;
      }
    }

    offset += batchSize;
    if (offset % 20000 === 0) {
      console.log(`  Progress: ${fixed} fixed`);
    }
  }

  console.log(`\n  ✅ Fixed ${fixed} manufacturer records`);

  const { count: remaining } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null);
  console.log(`  Remaining null manufacturer_name: ${remaining}`);
}

async function fixCategory() {
  console.log('\n=== Fix Category ===\n');

  const categoryRules = [
    { subcategory: 'Surgical Mask', category: '呼吸防护装备' },
    { subcategory: 'Respirator', category: '呼吸防护装备' },
    { subcategory: 'Examination Glove', category: '手部防护装备' },
    { subcategory: 'Patient Examination Glove', category: '手部防护装备' },
    { subcategory: "Surgeon's Glove", category: '手部防护装备' },
    { subcategory: 'Surgical Gown', category: '身体防护装备' },
    { subcategory: 'Protective Garment', category: '身体防护装备' },
    { subcategory: 'Face Shield', category: '眼面部防护装备' },
    { subcategory: 'Protective Goggles', category: '眼面部防护装备' },
    { subcategory: 'Surgical Cap', category: '头部防护装备' },
    { subcategory: 'Isolation Gown', category: '身体防护装备' },
  ];

  for (const rule of categoryRules) {
    const { count } = await supabase
      .from('ppe_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', '其他')
      .eq('subcategory', rule.subcategory);

    if (count > 0) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ category: rule.category })
        .eq('category', '其他')
        .eq('subcategory', rule.subcategory);

      if (!error) {
        console.log(`  ✅ ${rule.subcategory} → ${rule.category}: ${count} records`);
      }
    }
  }
}

async function main() {
  const command = process.argv[2] || 'all';

  if (command === 'all' || command === 'risk') {
    await batchFixRiskLevel();
  }

  if (command === 'all' || command === 'pc') {
    await batchFixProductCode();
  }

  if (command === 'all' || command === 'mfr') {
    await batchFixManufacturer();
  }

  if (command === 'all' || command === 'cat') {
    await fixCategory();
  }

  const { count: p } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: m } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: r } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log(`\n  Database: ${p} products, ${m} manufacturers, ${r} regulations`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
