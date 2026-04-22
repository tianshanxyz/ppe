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
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95')) return '呼吸防护装备';
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
        'Accept': 'application/json, text/html, */*',
        ...options.headers
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve({ redirect: res.headers.location, status: res.statusCode });
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode, headers: res.headers }));
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

async function testTGAEndpoints() {
  console.log('\n🔍 Testing TGA Endpoints...\n');
  
  const endpoints = [
    'https://www.tga.gov.au/api/artg/search?term=mask',
    'https://www.tga.gov.au/api/artg/search?keyword=mask',
    'https://www.tga.gov.au/resources/australian-register-therapeutic-goods-artg?term=mask&format=json',
    'https://search.tga.gov.au/s/search.json?query=mask&collection=tga-artg',
    'https://www.tga.gov.au/sites/default/files/artg.json',
    'https://www.tga.gov.au/api/v1/artg?keyword=mask',
    'https://www.tga.gov.au/api/artg?keyword=mask',
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    try {
      const result = await httpGet(endpoint);
      console.log(`  Status: ${result.status}`);
      if (result.data) {
        try {
          const json = JSON.parse(result.data);
          const keys = Object.keys(json).slice(0, 5);
          console.log(`  ✅ Valid JSON, keys: ${keys.join(', ')}`);
          return { endpoint, data: json };
        } catch {
          console.log(`  ⚠️  Not JSON (${result.data.length} bytes)`);
        }
      }
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return null;
}

async function collectFromOpenData() {
  console.log('\n📊 Trying TGA Open Data Portal...\n');
  
  const endpoints = [
    'https://data.gov.au/data/api/3/action/package_search?q=tga+medical+device&rows=10',
    'https://data.gov.au/data/api/3/action/package_search?q=artg+therapeutic+goods&rows=10',
    'https://data.gov.au/data/api/3/action/package_search?q=australian+register+therapeutic+goods&rows=10',
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    try {
      const result = await httpGet(endpoint);
      if (result.data) {
        const json = JSON.parse(result.data);
        if (json.result && json.result.results) {
          console.log(`  ✅ Found ${json.result.results.length} datasets`);
          
          for (const dataset of json.result.results) {
            console.log(`  📦 ${dataset.title}`);
            if (dataset.resources) {
              for (const res of dataset.resources) {
                if (res.format === 'CSV' || res.format === 'JSON' || res.format === 'XLSX') {
                  console.log(`    → ${res.name} (${res.format}): ${res.url}`);
                }
              }
            }
          }
          return json.result.results;
        }
      }
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return null;
}

async function collectFromDataGovAu() {
  console.log('\n🇦🇺 Collecting from data.gov.au...\n');
  
  const searchTerms = ['medical device', 'ppe', 'surgical mask', 'glove', 'respirator'];
  let totalInserted = 0;
  
  for (const term of searchTerms) {
    const url = `https://data.gov.au/data/api/3/action/package_search?q=${encodeURIComponent(term)}&rows=20`;
    
    try {
      const result = await httpGet(url);
      if (result.data) {
        const json = JSON.parse(result.data);
        if (json.result && json.result.results) {
          for (const dataset of json.result.results) {
            if (dataset.resources) {
              for (const res of dataset.resources) {
                if ((res.format === 'CSV' || res.format === 'JSON') && res.url && res.url.startsWith('https')) {
                  console.log(`  Trying: ${res.name} (${res.format})`);
                  try {
                    const dlResult = await httpGet(res.url);
                    if (dlResult.data) {
                      try {
                        const data = JSON.parse(dlResult.data);
                        const items = Array.isArray(data) ? data : (data.result || data.records || []);
                        const ppeItems = items.filter(item => {
                          const name = item.product_name || item.device_name || item.name || item.trade_name || '';
                          return isPPE(name);
                        });
                        
                        if (ppeItems.length > 0) {
                          const records = ppeItems.map(item => ({
                            name: item.product_name || item.device_name || item.name || item.trade_name || 'Unknown',
                            model: item.product_code || item.artg_id || '',
                            category: categorize(item.product_name || item.device_name || item.name || ''),
                            subcategory: 'TGA Australia',
                            description: item.sponsor || item.manufacturer || '',
                            country_of_origin: 'AU',
                            updated_at: new Date().toISOString(),
                          }));
                          
                          const inserted = await insertBatch(records);
                          totalInserted += inserted;
                          console.log(`    ✅ Inserted ${inserted} records`);
                        }
                      } catch {
                        console.log(`    ⚠️  Could not parse as JSON`);
                      }
                    }
                  } catch (e) {
                    console.log(`    ❌ ${e.message}`);
                  }
                  await new Promise(r => setTimeout(r, 500));
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return totalInserted;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  TGA Australia Collector');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  let grandTotal = 0;

  if (command === 'all' || command === 'test') {
    await testTGAEndpoints();
  }

  if (command === 'all' || command === 'opendata') {
    await collectFromOpenData();
  }

  if (command === 'all' || command === 'datagov') {
    const count = await collectFromDataGovAu();
    grandTotal += count;
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
