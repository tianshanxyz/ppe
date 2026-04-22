#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const BASE = 'https://health-products.canada.ca/api/medical-devices';

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
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('protective clothing')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eyewear')) return '眼面部防护装备';
  if (t.includes('cap')) return '头部防护装备';
  if (t.includes('boot') || t.includes('shoe')) return '足部防护装备';
  return '其他';
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
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

async function collectDevicesByKeyword(keyword) {
  const url = `${BASE}/device/?device_name=${encodeURIComponent(keyword)}&state=active&type=json`;
  
  try {
    const data = await httpGet(url);
    const items = Array.isArray(data) ? data : (data.results || []);
    
    const ppeRecords = items
      .filter(item => isPPE(item.device_name || item.trade_name || ''))
      .map(item => ({
        name: item.device_name || item.trade_name || 'Unknown',
        model: item.device_identifier || item.device_id || '',
        category: categorize(item.device_name || item.trade_name || ''),
        subcategory: 'Health Canada MDALL',
        description: `Licence: ${item.original_licence_no || ''}, Class: ${item.appl_risk_class || ''}`,
        country_of_origin: 'CA',
        updated_at: new Date().toISOString(),
      }));

    const inserted = await insertBatch(ppeRecords);
    return { found: items.length, inserted };
  } catch (e) {
    console.log(`  ${keyword}: ${e.message}`);
    return { found: 0, inserted: 0 };
  }
}

async function collectLicencesByKeyword(keyword) {
  const url = `${BASE}/licence/?licence_name=${encodeURIComponent(keyword)}&state=active&type=json`;
  
  try {
    const data = await httpGet(url);
    const items = Array.isArray(data) ? data : (data.results || []);
    
    const ppeRecords = items
      .filter(item => isPPE(item.licence_name || ''))
      .map(item => ({
        name: item.licence_name || 'Unknown',
        model: item.original_licence_no || '',
        category: categorize(item.licence_name || ''),
        subcategory: 'Health Canada Licence',
        description: `Status: ${item.licence_status || ''}, Class: ${item.appl_risk_class || ''}, Type: ${item.licence_type_desc || ''}`,
        country_of_origin: 'CA',
        updated_at: new Date().toISOString(),
      }));

    const inserted = await insertBatch(ppeRecords);
    return { found: items.length, inserted };
  } catch (e) {
    console.log(`  ${keyword}: ${e.message}`);
    return { found: 0, inserted: 0 };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  Health Canada MDALL Collector');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  let grandTotal = 0;

  if (command === 'all' || command === 'devices') {
    console.log('\n📋 Collecting Devices by Keyword...');
    const keywords = [
      'glove', 'mask', 'respirator', 'gown', 'face shield', 'goggle',
      'surgical', 'isolation', 'protective', 'nitrile', 'n95',
      'coverall', 'examination', 'disposable', 'ppe', 'cap', 'boot'
    ];
    
    for (const keyword of keywords) {
      const result = await collectDevicesByKeyword(keyword);
      console.log(`  ${keyword}: found=${result.found}, inserted=${result.inserted}`);
      grandTotal += result.inserted;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (command === 'all' || command === 'licences') {
    console.log('\n📄 Collecting Licences by Keyword...');
    const keywords = [
      'glove', 'mask', 'respirator', 'gown', 'face shield', 'goggle',
      'surgical', 'isolation', 'protective', 'nitrile', 'n95',
      'coverall', 'examination', 'ppe'
    ];
    
    for (const keyword of keywords) {
      const result = await collectLicencesByKeyword(keyword);
      console.log(`  ${keyword}: found=${result.found}, inserted=${result.inserted}`);
      grandTotal += result.inserted;
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  GRAND TOTAL: ${grandTotal} records`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
