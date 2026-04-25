#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function analyzeFields() {
  console.log('\n=== Field Analysis ===\n');

  const batchSize = 5000;
  let offset = 0;
  const stats = {
    mfrEmpty: 0, mfrFilled: 0,
    pcEmpty: 0, pcFilled: 0,
    rlEmpty: 0, rlFilled: 0,
    descEmpty: 0, descFilled: 0,
    modelEmpty: 0, modelFilled: 0,
    total: 0,
    mfrInDesc: 0,
    pcInDesc: 0,
    sampleEmptyMfr: [],
    sampleEmptyPc: [],
  };

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, name, model, category, subcategory, description, manufacturer_name, product_code, risk_level, country_of_origin')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      stats.total++;
      
      if (!r.manufacturer_name || r.manufacturer_name.trim() === '') {
        stats.mfrEmpty++;
        if (r.description && r.description.includes('Applicant:')) {
          stats.mfrInDesc++;
          if (stats.sampleEmptyMfr.length < 5) {
            stats.sampleEmptyMfr.push({ id: r.id, desc: r.description.substring(0, 100) });
          }
        }
      } else {
        stats.mfrFilled++;
      }

      if (!r.product_code || r.product_code.trim() === '') {
        stats.pcEmpty++;
        if (r.model && r.model.includes('_')) {
          stats.pcInDesc++;
        }
      } else {
        stats.pcFilled++;
      }

      if (!r.risk_level || r.risk_level.trim() === '') {
        stats.rlEmpty++;
      } else {
        stats.rlFilled++;
      }

      if (!r.description || r.description.trim() === '') {
        stats.descEmpty++;
      } else {
        stats.descFilled++;
      }

      if (!r.model || r.model.trim() === '') {
        stats.modelEmpty++;
      } else {
        stats.modelFilled++;
      }
    }

    offset += batchSize;
  }

  console.log(`Total records: ${stats.total}`);
  console.log(`\nManufacturer Name:`);
  console.log(`  Filled: ${stats.mfrFilled} (${(stats.mfrFilled/stats.total*100).toFixed(1)}%)`);
  console.log(`  Empty: ${stats.mfrEmpty} (${(stats.mfrEmpty/stats.total*100).toFixed(1)}%)`);
  console.log(`  Extractable from description: ${stats.mfrInDesc}`);

  console.log(`\nProduct Code:`);
  console.log(`  Filled: ${stats.pcFilled} (${(stats.pcFilled/stats.total*100).toFixed(1)}%)`);
  console.log(`  Empty: ${stats.pcEmpty} (${(stats.pcEmpty/stats.total*100).toFixed(1)}%)`);
  console.log(`  Extractable from model: ${stats.pcInDesc}`);

  console.log(`\nRisk Level:`);
  console.log(`  Filled: ${stats.rlFilled} (${(stats.rlFilled/stats.total*100).toFixed(1)}%)`);
  console.log(`  Empty: ${stats.rlEmpty} (${(stats.rlEmpty/stats.total*100).toFixed(1)}%)`);

  console.log(`\nDescription:`);
  console.log(`  Filled: ${stats.descFilled} (${(stats.descFilled/stats.total*100).toFixed(1)}%)`);
  console.log(`  Empty: ${stats.descEmpty} (${(stats.descEmpty/stats.total*100).toFixed(1)}%)`);

  console.log(`\nModel:`);
  console.log(`  Filled: ${stats.modelFilled} (${(stats.modelFilled/stats.total*100).toFixed(1)}%)`);
  console.log(`  Empty: ${stats.modelEmpty} (${(stats.modelEmpty/stats.total*100).toFixed(1)}%)`);

  if (stats.sampleEmptyMfr.length > 0) {
    console.log('\nSample empty manufacturer records with Applicant in desc:');
    stats.sampleEmptyMfr.forEach(s => console.log(`  ID ${s.id}: ${s.desc}...`));
  }
}

async function fixManufacturerFromDesc() {
  console.log('\n=== Fix Manufacturer from Description ===\n');
  let fixed = 0;
  const batchSize = 5000;
  let offset = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description, manufacturer_name')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      if (r.manufacturer_name && r.manufacturer_name.trim() !== '') continue;
      if (!r.description) continue;

      let mfr = null;

      const applicantMatch = r.description.match(/Applicant:\s*([^|,\n]+)/);
      if (applicantMatch) {
        mfr = applicantMatch[1].trim();
      }

      const companyMatch = r.description.match(/Company:\s*([^|,\n]+)/);
      if (!mfr && companyMatch) {
        mfr = companyMatch[1].trim();
      }

      const mfrMatch = r.description.match(/Manufacturer:\s*([^|,\n]+)/);
      if (!mfr && mfrMatch) {
        mfr = mfrMatch[1].trim();
      }

      if (mfr && mfr.length > 0 && mfr.length < 200) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfr })
          .eq('id', r.id);
        if (!error) fixed++;
      }
    }

    console.log(`  Offset ${offset}: Fixed ${fixed} records`);
    offset += batchSize;
  }

  console.log(`\n  ✅ Fixed ${fixed} manufacturer records`);
}

async function fixProductCodeFromModel() {
  console.log('\n=== Fix Product Code from Model ===\n');
  let fixed = 0;
  const batchSize = 5000;
  let offset = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, model, product_code')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      if (r.product_code && r.product_code.trim() !== '') continue;
      if (!r.model) continue;

      const parts = r.model.split('_');
      if (parts.length >= 1 && parts[0].length >= 2 && parts[0].length <= 5) {
        const code = parts[0];
        const { error } = await supabase
          .from('ppe_products')
          .update({ product_code: code })
          .eq('id', r.id);
        if (!error) fixed++;
      }
    }

    console.log(`  Offset ${offset}: Fixed ${fixed} records`);
    offset += batchSize;
  }

  console.log(`\n  ✅ Fixed ${fixed} product code records`);
}

async function fixRiskLevelFromSubcategory() {
  console.log('\n=== Fix Risk Level from Subcategory ===\n');
  let fixed = 0;
  const batchSize = 5000;
  let offset = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, subcategory, description, risk_level')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      if (r.risk_level && r.risk_level.trim() !== '') continue;

      let risk = '';
      const sub = (r.subcategory || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();

      if (sub.includes('fda 510k') || sub.includes('fda classification') || sub.includes('fda registration')) {
        if (desc.includes('class i') || desc.includes('class 1')) risk = 'Class I';
        else if (desc.includes('class ii') || desc.includes('class 2')) risk = 'Class II';
        else if (desc.includes('class iii') || desc.includes('class 3')) risk = 'Class III';
        else risk = 'Class II';
      } else if (sub.includes('fda recall') || sub.includes('fda enforcement')) {
        risk = 'Class II/III';
      } else if (sub.includes('fda adverse') || sub.includes('fda pma')) {
        risk = 'Class III';
      } else if (sub.includes('health canada') || sub.includes('mdall')) {
        if (desc.includes('class i') || desc.includes('class 1')) risk = 'Class I';
        else if (desc.includes('class ii') || desc.includes('class 2')) risk = 'Class II';
        else if (desc.includes('class iii') || desc.includes('class 3')) risk = 'Class III';
        else if (desc.includes('class iv') || desc.includes('class 4')) risk = 'Class IV';
        else risk = 'Class II';
      } else if (sub.includes('eudamed') || sub.includes('eu')) {
        if (desc.includes('category i') || desc.includes('cat i')) risk = 'Category I';
        else if (desc.includes('category ii') || desc.includes('cat ii')) risk = 'Category II';
        else if (desc.includes('category iii') || desc.includes('cat iii')) risk = 'Category III';
        else risk = 'Category II';
      }

      if (risk) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ risk_level: risk })
          .eq('id', r.id);
        if (!error) fixed++;
      }
    }

    console.log(`  Offset ${offset}: Fixed ${fixed} records`);
    offset += batchSize;
  }

  console.log(`\n  ✅ Fixed ${fixed} risk level records`);
}

async function main() {
  const command = process.argv[2] || 'all';

  if (command === 'all' || command === 'analyze') {
    await analyzeFields();
  }

  if (command === 'all' || command === 'fix-mfr') {
    await fixManufacturerFromDesc();
  }

  if (command === 'all' || command === 'fix-pc') {
    await fixProductCodeFromModel();
  }

  if (command === 'all' || command === 'fix-rl') {
    await fixRiskLevelFromSubcategory();
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
