#!/usr/bin/env node

/**
 * 初始化 data_sources 表 - 直接插入版本
 */

const { createClient } = require('@supabase/supabase-js');

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

async function initDataSources() {
  log('\n========================================', 'blue');
  log('  Initialize Data Sources', 'blue');
  log('========================================\n', 'blue');

  // Get current product counts by analyzing the data
  const { data: products } = await supabase
    .from('ppe_products')
    .select('country_of_origin, category')
    .limit(30000);

  const sourceStats = {
    'local': 0,
    'china': 0,
    'eu': 0,
    'us': 0,
    'canada': 0,
    'australia': 0,
    'other': 0
  };

  const categoryStats = {};

  if (products) {
    products.forEach(p => {
      const country = p.country_of_origin || 'Unknown';
      if (country.includes('CN') || country.includes('China')) {
        sourceStats['china']++;
      } else if (country.includes('US') || country.includes('United')) {
        sourceStats['us']++;
      } else if (country.includes('EU') || country.includes('Germany') || country.includes('France') || country.includes('Italy')) {
        sourceStats['eu']++;
      } else if (country.includes('CA') || country.includes('Canada')) {
        sourceStats['canada']++;
      } else if (country.includes('AU') || country.includes('Australia')) {
        sourceStats['australia']++;
      } else if (country === 'Unknown' || !country) {
        sourceStats['local']++;
      } else {
        sourceStats['other']++;
      }

      const cat = p.category || '其他';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });
  }

  log('📊 Data Distribution Analysis:\n', 'cyan');
  log('   By Region:', 'white');
  for (const [region, count] of Object.entries(sourceStats)) {
    log(`      ${region}: ${count}`, 'white');
  }

  log('\n   By Category:', 'white');
  for (const [cat, count] of Object.entries(categoryStats).sort((a,b) => b[1] - a[1])) {
    log(`      ${cat}: ${count}`, 'white');
  }

  // Insert data sources records using insert (replace existing)
  const dataSources = [
    {
      name: 'local',
      display_name: 'Local Data Import',
      description: 'Data imported from local JSON files',
      record_count: sourceStats['local'],
      last_sync_at: new Date().toISOString(),
      status: 'active',
      sync_frequency: 'manual'
    },
    {
      name: 'china',
      display_name: 'China NMPA',
      description: 'China National Medical Products Administration data',
      record_count: sourceStats['china'],
      last_sync_at: '2026-04-14',
      status: 'active',
      sync_frequency: 'weekly'
    },
    {
      name: 'eu',
      display_name: 'EU EUDAMED',
      description: 'European Union Medical Device Database',
      record_count: sourceStats['eu'],
      last_sync_at: null,
      status: 'pending',
      sync_frequency: 'daily'
    },
    {
      name: 'us',
      display_name: 'US FDA',
      description: 'US Food and Drug Administration 510(k) data',
      record_count: sourceStats['us'],
      last_sync_at: null,
      status: 'pending',
      sync_frequency: 'daily'
    },
    {
      name: 'canada',
      display_name: 'Health Canada',
      description: 'Canada Medical Devices Active Licence Listing',
      record_count: sourceStats['canada'],
      last_sync_at: null,
      status: 'pending',
      sync_frequency: 'weekly'
    },
    {
      name: 'australia',
      display_name: 'TGA Australia',
      description: 'Therapeutic Goods Administration ARTG',
      record_count: sourceStats['australia'],
      last_sync_at: null,
      status: 'pending',
      sync_frequency: 'weekly'
    }
  ];

  log('\n📡 Inserting data sources records...\n', 'cyan');

  // First delete existing records
  await supabase.from('data_sources').delete();

  // Then insert new ones
  const { error } = await supabase
    .from('data_sources')
    .insert(dataSources);

  if (error) {
    log(`   ❌ Insert error: ${error.message}`, 'red');
  } else {
    log(`   ✅ All data sources inserted successfully`, 'green');
  }

  log('\n========================================', 'blue');
  log('  Initialization Complete', 'blue');
  log('========================================\n', 'blue');

  // Show final data sources
  const { data: finalSources } = await supabase
    .from('data_sources')
    .select('*');

  log('📊 Data Sources Status:\n', 'cyan');
  if (finalSources) {
    finalSources.forEach(ds => {
      log(`   ${ds.display_name}: ${ds.record_count} records (${ds.status})`, 'white');
    });
  }
}

initDataSources()
  .then(() => process.exit(0))
  .catch(e => {
    log(`\n❌ Error: ${e.message}`, 'red');
    process.exit(1);
  });
