#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove') || t.includes('手套')) return '手部防护装备';
  if (t.includes('mask') || t.includes('口罩') || t.includes('respirator') || t.includes('呼吸')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('防护服') || t.includes('coverall')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('护目镜') || t.includes('face shield') || t.includes('面罩')) return '眼面部防护装备';
  if (t.includes('shoe') || t.includes('鞋套') || t.includes('boot')) return '足部防护装备';
  if (t.includes('cap') || t.includes('帽子') || t.includes('head')) return '头部防护装备';
  return '其他';
}

async function importProducts() {
  const dataDir = path.join(__dirname, '..', 'data');
  const productFiles = [
    'ppe_products_extracted.json',
    'ppe_products_extracted_v2.json',
    'ppe_products_extracted_extended.json',
  ];
  
  let totalInserted = 0;
  
  for (const file of productFiles) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) continue;
    
    const stat = fs.statSync(filePath);
    if (stat.size < 100) continue; // Skip empty files
    
    console.log(`\n📥 Importing ${file}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;
    try { data = JSON.parse(content); } 
    catch { console.log('  Skip: Invalid JSON'); continue; }
    
    if (!Array.isArray(data)) {
      if (data.results) data = data.results;
      else if (data.data) data = data.data;
      else continue;
    }
    
    const records = data.map(item => {
      const name = item.product_name || item.name || item.productName || 'Unknown';
      return {
        name: name,
        model: item.product_code || item.model || item.productCode || '',
        category: item.category || item.product_category || categorize(name),
        subcategory: item.sub_category || item.subcategory || '',
        description: item.description || '',
        country_of_origin: item.country_of_origin || item.manufacturer_country || 'Unknown',
        updated_at: new Date().toISOString(),
      };
    }).filter(r => r.name && r.name !== 'Unknown');
    
    console.log(`  Records: ${records.length}`);
    
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase.from('ppe_products').insert(batch);
      if (error) {
        console.log(`  Error: ${error.message}`);
      } else {
        totalInserted += batch.length;
        console.log(`  ✅ Batch ${Math.floor(i/batchSize)+1}: ${batch.length} records`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  console.log(`\n✅ Total inserted: ${totalInserted}`);
}

async function importManufacturers() {
  const dataDir = path.join(__dirname, '..', 'data');
  const mfrFiles = [
    'ppe_manufacturers_extracted.json',
    'ppe_manufacturers_extracted_extended.json',
    'ppe_manufacturers_extracted_v2.json',
  ];
  
  let totalInserted = 0;
  
  for (const file of mfrFiles) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) continue;
    
    const stat = fs.statSync(filePath);
    if (stat.size < 100) continue;
    
    console.log(`\n📥 Importing ${file}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;
    try { data = JSON.parse(content); } 
    catch { continue; }
    
    if (!Array.isArray(data)) continue;
    
    const records = data.map(item => ({
      name: item.company_name || item.name || item.companyName || 'Unknown',
      country: item.country || 'Unknown',
      website: item.website || null,
      updated_at: new Date().toISOString(),
    })).filter(r => r.name && r.name !== 'Unknown');
    
    console.log(`  Records: ${records.length}`);
    
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase.from('ppe_manufacturers').insert(batch);
      if (error) {
        console.log(`  Error: ${error.message}`);
      } else {
        totalInserted += batch.length;
        console.log(`  ✅ Batch success`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  console.log(`\n✅ Manufacturers inserted: ${totalInserted}`);
}

(async () => {
  console.log('\n=== Local Data Import ===\n');
  await importProducts();
  await importManufacturers();
  process.exit(0);
})();
