#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function fixRiskLevel() {
  console.log('\n=== Fix Risk Level (low/medium/high) ===\n');
  let fixed = 0;
  const batchSize = 5000;
  let offset = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, category, subcategory, description, risk_level, product_code, country_of_origin')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      if (r.risk_level !== null && r.risk_level !== undefined) continue;

      let risk = 'medium';
      const cat = (r.category || '').toLowerCase();
      const sub = (r.subcategory || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();

      if (cat.includes('呼吸') || sub.includes('respirator') || sub.includes('n95') || sub.includes('surgical mask')) {
        risk = 'high';
      } else if (cat.includes('手部') || sub.includes('glove') || sub.includes('手套')) {
        risk = 'low';
      } else if (cat.includes('身体') || sub.includes('gown') || sub.includes('protective')) {
        risk = 'medium';
      } else if (cat.includes('眼面') || sub.includes('shield') || sub.includes('goggle')) {
        risk = 'low';
      } else if (cat.includes('头部') || sub.includes('cap')) {
        risk = 'low';
      } else if (desc.includes('class iii') || desc.includes('class 3')) {
        risk = 'high';
      } else if (desc.includes('class i') || desc.includes('class 1')) {
        risk = 'low';
      } else {
        risk = 'medium';
      }

      const { error } = await supabase
        .from('ppe_products')
        .update({ risk_level: risk })
        .eq('id', r.id);
      if (!error) fixed++;
    }

    if (offset % 20000 === 0) {
      console.log(`  Offset ${offset}: Fixed ${fixed} records`);
    }
    offset += batchSize;
  }

  console.log(`\n  ✅ Fixed ${fixed} risk level records`);
}

async function fixCategory() {
  console.log('\n=== Fix Category ===\n');
  let fixed = 0;
  const batchSize = 5000;
  let offset = 0;

  const { count } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });

  while (offset < count) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, category, subcategory, name')
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const r of data) {
      if (r.category && r.category !== '其他') continue;

      const sub = (r.subcategory || '').toLowerCase();
      const name = (r.name || '').toLowerCase();
      let category = '';

      if (sub.includes('glove') || sub.includes('手套') || name.includes('glove') || name.includes('手套')) category = '手部防护装备';
      else if (sub.includes('mask') || sub.includes('respirator') || sub.includes('口罩') || sub.includes('呼吸') || name.includes('mask') || name.includes('respirator')) category = '呼吸防护装备';
      else if (sub.includes('gown') || sub.includes('protective garment') || sub.includes('防护服') || sub.includes('coverall') || name.includes('gown') || name.includes('coverall')) category = '身体防护装备';
      else if (sub.includes('shield') || sub.includes('goggle') || sub.includes('面罩') || name.includes('shield') || name.includes('goggle')) category = '眼面部防护装备';
      else if (sub.includes('cap') || sub.includes('hood') || sub.includes('帽') || name.includes('cap') || name.includes('hood')) category = '头部防护装备';
      else if (sub.includes('boot') || sub.includes('shoe') || sub.includes('鞋') || name.includes('boot') || name.includes('shoe cover')) category = '足部防护装备';

      if (category) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ category })
          .eq('id', r.id);
        if (!error) fixed++;
      }
    }

    offset += batchSize;
  }

  console.log(`\n  ✅ Fixed ${fixed} category records`);
}

async function main() {
  const command = process.argv[2] || 'all';

  if (command === 'all' || command === 'risk') {
    await fixRiskLevel();
  }

  if (command === 'all' || command === 'category') {
    await fixCategory();
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
