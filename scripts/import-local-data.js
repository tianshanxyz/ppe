#!/usr/bin/env node

/**
 * 从本地JSON文件导入PPE数据
 * 
 * 读取 data/ 目录下的JSON文件并导入到Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const STATS = { inserted: 0, skipped: 0, errors: 0 };

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('ffp')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('clothing')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eye')) return '眼面部防护装备';
  if (t.includes('shoe') || t.includes('boot')) return '足部防护装备';
  if (t.includes('cap') || t.includes('head')) return '头部防护装备';
  return '其他';
}

async function importProducts(filePath, source) {
  log(`\n📂 Importing from: ${path.basename(filePath)}`, 'cyan');
  log(`   Source tag: ${source}\n`);
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  let data = JSON.parse(fileContent);
  
  if (!Array.isArray(data)) {
    log(`   ⚠️  File is not an array, skipping`, 'yellow');
    return;
  }
  
  log(`   📊 Total records in file: ${data.length}`);
  
  // Transform data to match database schema
  const records = data.map(item => {
    const name = item.product_name || item.name || item.productName || 'Unknown';
    return {
      name: name,
      model: item.product_code || item.model || item.productCode || '',
      category: item.product_category || item.category || categorize(name),
      subcategory: item.sub_category || item.subcategory || '',
      description: item.description || '',
      country_of_origin: item.manufacturer_country || item.country_of_origin || 'Unknown',
      updated_at: new Date().toISOString(),
    };
  }).filter(r => r.name && r.name !== 'Unknown');
  
  log(`   📋 Records after transform: ${records.length}`);
  
  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('ppe_products')
      .insert(batch);
    
    if (error) {
      log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} error: ${error.message}`, 'red');
      STATS.errors += batch.length;
    } else {
      STATS.inserted += batch.length;
      log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`, 'green');
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  log(`   ✅ Import complete: ${records.length} records`, 'green');
}

async function importManufacturers(filePath, source) {
  log(`\n📂 Importing manufacturers from: ${path.basename(filePath)}`, 'cyan');
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  let data = JSON.parse(fileContent);
  
  if (!Array.isArray(data)) {
    log(`   ⚠️  File is not an array, skipping`, 'yellow');
    return;
  }
  
  log(`   📊 Total records: ${data.length}`);
  
  const records = data.map(item => ({
    name: item.company_name || item.company_name_en || item.name || 'Unknown',
    country: item.country || 'Unknown',
    website: item.website || null,
    updated_at: new Date().toISOString(),
  })).filter(r => r.name && r.name !== 'Unknown');
  
  log(`   📋 Records after transform: ${records.length}`);
  
  const batchSize = 500;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('ppe_manufacturers')
      .insert(batch);
    
    if (error) {
      log(`   ❌ Batch error: ${error.message}`, 'red');
    } else {
      STATS.inserted += batch.length;
      log(`   ✅ Batch success: ${batch.length}`, 'green');
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
}

async function main() {
  log('\n========================================', 'blue');
  log('  MDLooker Local Data Import', 'blue');
  log('========================================\n', 'blue');
  
  const dataDir = path.join(__dirname, '..', 'data');
  
  // Import product files
  const productFiles = [
    { file: 'ppe_products_cleaned.json', source: 'cleaned' },
    { file: 'ppe_products_cleaned_v2.json', source: 'v2' },
    { file: 'ppe_products_cleaned_extended.json', source: 'extended' },
  ];
  
  for (const { file, source } of productFiles) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      try {
        await importProducts(filePath, source);
      } catch (e) {
        log(`   ❌ Error: ${e.message}`, 'red');
      }
    }
  }
  
  // Import manufacturer files
  const mfrFiles = [
    { file: 'ppe_manufacturers_cleaned.json', source: 'cleaned' },
    { file: 'ppe_manufacturers_cleaned_v2.json', source: 'v2' },
  ];
  
  for (const { file, source } of mfrFiles) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      try {
        await importManufacturers(filePath, source);
      } catch (e) {
        log(`   ❌ Error: ${e.message}`, 'red');
      }
    }
  }
  
  // Final stats
  log('\n========================================', 'blue');
  log('  Import Complete', 'blue');
  log('========================================\n', 'blue');
  log(`📥 Total inserted: ${STATS.inserted}`, 'green');
  log(`❌ Total errors: ${STATS.errors}`, STATS.errors > 0 ? 'red' : 'green');
  
  // Show current counts
  const { count: productCount } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  
  const { count: mfrCount } = await supabase
    .from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  
  log(`\n📊 Current database counts:`, 'cyan');
  log(`   ppe_products: ${productCount}`, 'white');
  log(`   ppe_manufacturers: ${mfrCount}`, 'white');
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    log(`\n❌ Fatal error: ${e.message}`, 'red');
    process.exit(1);
  });
