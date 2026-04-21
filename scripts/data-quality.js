#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const LOG_TABLE = 'data_collection_logs';

async function log(level, source, message, details = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    details
  };
  console.log(`[${level}] ${source}: ${message}`, details || '');
  
  try {
    await supabase.from(LOG_TABLE).insert({
      ...entry,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.log('Log write error (non-fatal):', e.message);
  }
}

async function getStats() {
  console.log('\n=== Data Quality Statistics ===\n');
  
  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  console.log(`Total records: ${total}`);
  
  const { data: samples } = await supabase.from('ppe_products').select('*').limit(1000);
  
  if (samples && samples.length > 0) {
    const withName = samples.filter(r => r.name && r.name !== 'Unknown').length;
    const withCategory = samples.filter(r => r.category && r.category !== '其他').length;
    const withModel = samples.filter(r => r.model && r.model !== '').length;
    const withCountry = samples.filter(r => r.country_of_origin).length;
    
    console.log(`\nField completeness (sample of ${samples.length}):`);
    console.log(`  - Name filled: ${withName} (${(withName/samples.length*100).toFixed(1)}%)`);
    console.log(`  - Category filled: ${withCategory} (${(withCategory/samples.length*100).toFixed(1)}%)`);
    console.log(`  - Model filled: ${withModel} (${(withModel/samples.length*100).toFixed(1)}%)`);
    console.log(`  - Country filled: ${withCountry} (${(withCountry/samples.length*100).toFixed(1)}%)`);
    
    const countries = {};
    samples.forEach(r => {
      const c = r.country_of_origin || 'Unknown';
      countries[c] = (countries[c] || 0) + 1;
    });
    console.log(`\nCountry distribution (sample):`);
    Object.entries(countries).sort((a,b) => b[1]-a[1]).slice(0, 10).forEach(([k,v]) => {
      console.log(`  ${k}: ${v}`);
    });
  }
  
  return { total };
}

async function findDuplicates() {
  console.log('\n=== Duplicate Detection ===\n');
  
  const { data: all } = await supabase.from('ppe_products').select('id, name, model');
  
  if (!all) return;
  
  const seen = new Map();
  const duplicates = [];
  
  all.forEach(r => {
    const key = `${r.name}|${r.model}`.toLowerCase();
    if (seen.has(key)) {
      duplicates.push({ id: r.id, duplicateOf: seen.get(key) });
    } else {
      seen.set(key, r.id);
    }
  });
  
  console.log(`Found ${duplicates.length} potential duplicates`);
  
  if (duplicates.length > 0) {
    console.log('\nSample duplicates:');
    duplicates.slice(0, 5).forEach(d => {
      console.log(`  ID ${d.id} duplicates ${d.duplicateOf}`);
    });
  }
  
  return duplicates.length;
}

async function removeDuplicates() {
  console.log('\n=== Duplicate Removal ===\n');
  
  const { data: all } = await supabase.from('ppe_products').select('id, name, model');
  if (!all) return 0;
  
  const seen = new Set();
  const toDelete = [];
  
  all.forEach(r => {
    const key = `${r.name}|${r.model}`.toLowerCase();
    if (seen.has(key)) {
      toDelete.push(r.id);
    } else {
      seen.add(key);
    }
  });
  
  console.log(`Removing ${toDelete.length} duplicate records...`);
  
  if (toDelete.length > 0) {
    const batchSize = 500;
    let deleted = 0;
    
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      const { error } = await supabase.from('ppe_products').delete().in('id', batch);
      
      if (error) {
        console.log(`Delete error: ${error.message}`);
      } else {
        deleted += batch.length;
        console.log(`Deleted batch: ${deleted}/${toDelete.length}`);
      }
      
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`\n✅ Removed ${deleted} duplicates`);
    return deleted;
  }
  
  return 0;
}

async function updateLogs() {
  console.log('\n=== Collection Log Summary ===\n');
  
  try {
    const { data: logs } = await supabase
      .from(LOG_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (logs && logs.length > 0) {
      console.log('Recent collection activities:');
      logs.slice(0, 10).forEach(l => {
        console.log(`  [${l.level}] ${l.source}: ${l.message} (${l.records_collected || 0} records)`);
      });
    }
  } catch (e) {
    console.log('Log table not available or empty');
  }
}

async function validateData() {
  console.log('\n=== Data Validation ===\n');
  
  const { data: invalid } = await supabase
    .from('ppe_products')
    .select('id, name')
    .or('name.is.null,name.eq.Unknown')
    .limit(10);
  
  if (invalid && invalid.length > 0) {
    console.log(`Found ${invalid.length} records with invalid names`);
    
    const ids = invalid.map(r => r.id);
    await supabase.from('ppe_products').delete().in('id', ids);
    console.log(`Deleted ${ids.length} invalid records`);
  } else {
    console.log('No invalid records found');
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE Data Quality Control System');
  console.log('='.repeat(60) + '\n');
  
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  switch (command) {
    case 'stats':
      await getStats();
      break;
    case 'duplicates':
      await findDuplicates();
      break;
    case 'dedup':
    case 'remove-duplicates':
      await removeDuplicates();
      break;
    case 'validate':
      await validateData();
      break;
    case 'logs':
      await updateLogs();
      break;
    case 'all':
    default:
      await getStats();
      await findDuplicates();
      await validateData();
      await updateLogs();
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
