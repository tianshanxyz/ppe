#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS = [
  'glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield',
  'goggle', 'ppe', 'surgical', 'isolation', 'nitrile', 'latex',
  'n95', 'kn95', 'protective', 'examination', 'cap', 'boot', 'disposable'
];

function isPPE(name) {
  if (!name) return false;
  const t = name.toLowerCase();
  return PPE_KEYWORDS.some(k => t.includes(k));
}

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95') || t.includes('filtering facepiece')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('protective clothing')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eyewear')) return '眼面部防护装备';
  if (t.includes('cap')) return '头部防护装备';
  return '其他';
}

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        ...options.headers
      }
    }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode }));
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function insertBatch(records) {
  if (!records || records.length === 0) return 0;
  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from('ppe_products').insert(batch);
    if (error) {
      console.log(`    DB Error: ${error.message}`);
    } else {
      inserted += batch.length;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return inserted;
}

async function collectNIOSHCEL() {
  console.log('\n🇺🇸 NIOSH Certified Equipment List (CEL)...');
  let totalInserted = 0;

  const endpoints = [
    'https://healthdata.gov/resource/6bx2-txvx.json?$limit=5000',
    'https://healthdata.gov/resource/6bx2-txvx.json?$limit=5000&$offset=5000',
    'https://healthdata.gov/resource/6bx2-txvx.json?$limit=5000&$offset=10000',
    'https://healthdata.gov/resource/6bx2-txvx.json?$limit=5000&$offset=15000',
  ];

  for (const endpoint of endpoints) {
    console.log(`  Fetching: ${endpoint}`);
    try {
      const result = await httpGet(endpoint);
      const items = JSON.parse(result.data);
      
      if (!items || items.length === 0) {
        console.log('  No more results');
        break;
      }

      const ppeRecords = items
        .filter(item => {
          const name = item.approved_respirator || item.respirator_name || item.device_name || '';
          return isPPE(name) || item.tc_approval_number;
        })
        .map(item => ({
          name: item.approved_respirator || item.respirator_name || item.device_name || 'NIOSH Approved Respirator',
          model: item.tc_approval_number || item.approval_number || '',
          category: '呼吸防护装备',
          subcategory: 'NIOSH CEL',
          description: `Manufacturer: ${item.manufacturer_name || ''}, Filter: ${item.filter_class || ''}`,
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      const inserted = await insertBatch(ppeRecords);
      totalInserted += inserted;
      console.log(`  ✅ Got ${items.length} items, inserted ${inserted} PPE records`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      break;
    }
  }

  return totalInserted;
}

async function collectDataGovPPE() {
  console.log('\n📊 Data.gov PPE Datasets...');
  let totalInserted = 0;

  const datasets = [
    'https://catalog.data.gov/dataset/washington-state-distribution-of-personal-protective-equipment-ppe',
    'https://data.wa.gov/resource/5fb9-yqgi.json?$limit=5000',
  ];

  for (const endpoint of datasets) {
    if (!endpoint.includes('.json')) continue;
    
    console.log(`  Fetching: ${endpoint}`);
    try {
      const result = await httpGet(endpoint);
      const items = JSON.parse(result.data);
      
      if (!items || items.length === 0) continue;

      const ppeRecords = items
        .filter(item => {
          const name = item.product_type || item.item_description || item.product_name || '';
          return isPPE(name);
        })
        .map(item => ({
          name: item.product_type || item.item_description || item.product_name || 'Unknown',
          model: item.product_code || '',
          category: categorize(item.product_type || item.item_description || ''),
          subcategory: 'Data.gov PPE',
          description: `Source: Washington State, Vendor: ${item.vendor || ''}`,
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      const inserted = await insertBatch(ppeRecords);
      totalInserted += inserted;
      console.log(`  ✅ Inserted ${inserted} records`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
  }

  return totalInserted;
}

async function collectHealthDataGov() {
  console.log('\n🏥 HealthData.gov Medical Device Datasets...');
  let totalInserted = 0;

  const endpoints = [
    {
      name: 'FDA 510k',
      url: 'https://healthdata.gov/resource/4r3i-teiz.json?$limit=5000&device_name=mask',
    },
    {
      name: 'FDA 510k Gloves',
      url: 'https://healthdata.gov/resource/4r3i-teiz.json?$limit=5000&device_name=glove',
    },
    {
      name: 'FDA Device Classification',
      url: 'https://healthdata.gov/resource/5xu5-q5ue.json?$limit=5000',
    },
    {
      name: 'FDA Registration Listing',
      url: 'https://healthdata.gov/resource/rz8y-4hb5.json?$limit=5000',
    },
  ];

  for (const ds of endpoints) {
    console.log(`  Fetching: ${ds.name}`);
    try {
      const result = await httpGet(ds.url);
      const items = JSON.parse(result.data);
      
      if (!items || items.length === 0) {
        console.log(`  No results`);
        continue;
      }

      const ppeRecords = items
        .filter(item => {
          const name = item.device_name || item.product_description || item.product_name || '';
          return isPPE(name);
        })
        .map(item => ({
          name: item.device_name || item.product_description || item.product_name || 'Unknown',
          model: item.product_code || item.k_number || '',
          category: categorize(item.device_name || item.product_description || ''),
          subcategory: `HealthData.gov - ${ds.name}`,
          description: item.statement_or_summary || item.review_panel || '',
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      const inserted = await insertBatch(ppeRecords);
      totalInserted += inserted;
      console.log(`  ✅ Got ${items.length} items, inserted ${inserted} PPE records`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
  }

  return totalInserted;
}

async function collectOpenCanadaPPE() {
  console.log('\n🇨🇦 Open Canada PPE Statistics...');
  let totalInserted = 0;

  const endpoints = [
    'https://open.canada.ca/data/api/3/action/package_show?id=d5bd0d70-da21-4b67-8d24-8ebf3297b090',
  ];

  for (const endpoint of endpoints) {
    console.log(`  Fetching: ${endpoint}`);
    try {
      const result = await httpGet(endpoint);
      const data = JSON.parse(result.data);
      
      if (data.result && data.result.resources) {
        for (const res of data.result.resources) {
          if (res.format === 'CSV' && res.url && res.url.startsWith('https')) {
            console.log(`    Found CSV: ${res.name}`);
          }
        }
      }
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
  }

  return totalInserted;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  Global Open Data PPE Collector');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  let grandTotal = 0;
  const results = [];

  if (command === 'all' || command === 'niosh') {
    const count = await collectNIOSHCEL();
    results.push({ source: 'NIOSH CEL', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'datagov') {
    const count = await collectDataGovPPE();
    results.push({ source: 'Data.gov PPE', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'healthdata') {
    const count = await collectHealthDataGov();
    results.push({ source: 'HealthData.gov', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'opencanada') {
    const count = await collectOpenCanadaPPE();
    results.push({ source: 'Open Canada', count });
    grandTotal += count;
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Collection Summary');
  console.log('='.repeat(60));
  for (const r of results) {
    console.log(`  ${r.source}: ${r.count} records`);
  }
  console.log(`\n  GRAND TOTAL: ${grandTotal} records`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
