#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS = [
  'glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 'goggle',
  'ppe', 'medical', 'surgical', 'disposable', 'isolation', 'nitrile', 'latex',
  'vinyl', 'n95', 'kn95', 'ffp2', 'ffp3', 'protective', 'examination'
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
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95') || t.includes('kn95') || t.includes('ffp')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield')) return '眼面部防护装备';
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
      if (res.statusCode >= 300 && res.statusCode < 400) {
        resolve({ redirect: res.headers.location, status: res.statusCode });
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ data, status: res.statusCode }));
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function insertBatch(records) {
  if (!records || records.length === 0) return 0;
  const { error } = await supabase.from('ppe_products').insert(records);
  if (error) {
    console.log(`  DB Error: ${error.message}`);
    return 0;
  }
  return records.length;
}

const DATA_SOURCES = [
  {
    name: 'OpenFDA Device Registration',
    baseUrl: 'https://api.fda.gov/device',
    endpoints: [
      '/registrationlisting.json?search=device_name:mask&limit=100',
      '/registrationlisting.json?search=device_name:glove&limit=100',
      '/registrationlisting.json?search=device_name:respirator&limit=100',
      '/registrationlisting.json?search=device_name:gown&limit=100',
    ]
  },
  {
    name: 'OpenFDA Device Clearances',
    baseUrl: 'https://api.fda.gov/device',
    endpoints: [
      '/510k.json?search=device_name:mask&limit=100',
      '/510k.json?search=device_name:glove&limit=100',
      '/510k.json?search=device_name:respirator&limit=100',
    ]
  },
  {
    name: 'OpenFDA Device Recalls',
    baseUrl: 'https://api.fda.gov/device',
    endpoints: [
      '/recall.json?search=product_description:mask&limit=100',
      '/recall.json?search=product_description:glove&limit=100',
    ]
  },
  {
    name: 'Health Canada Medical Devices',
    baseUrl: 'https://health-products.canada.ca',
    endpoints: [
      '/api/device/alleract/?page=1&size=100',
      '/api/device/classfour/?page=1&size=100',
    ]
  },
  {
    name: 'TGA Australia',
    baseUrl: 'https://search.tga.gov.au',
    endpoints: [
      '/search?text=mask&format=json',
      '/search?text=glove&format=json',
    ]
  }
];

async function testEndpoint(source, endpoint) {
  const url = source.baseUrl + endpoint;
  console.log(`\nTesting: ${source.name}`);
  console.log(`  URL: ${url}`);
  
  try {
    const result = await httpGet(url);
    console.log(`  Status: ${result.status}`);
    
    if (result.redirect) {
      console.log(`  Redirect: ${result.redirect}`);
      return { available: false, reason: 'Redirect' };
    }
    
    if (result.data) {
      try {
        const json = JSON.parse(result.data);
        const keys = Object.keys(json).slice(0, 5);
        console.log(`  ✅ Valid JSON, keys: ${keys.join(', ')}`);
        return { available: true, data: json, status: result.status };
      } catch {
        console.log(`  ⚠️  Not JSON (${result.data.length} bytes)`);
        return { available: false, reason: 'Not JSON' };
      }
    }
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
    return { available: false, reason: e.message };
  }
  
  return { available: false };
}

async function collectFromSource(source) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Collecting from: ${source.name}`);
  console.log('='.repeat(50));
  
  let totalInserted = 0;
  
  for (const endpoint of source.endpoints) {
    const result = await testEndpoint(source, endpoint);
    
    if (result.available && result.data) {
      try {
        let items = [];
        
        if (result.data.results) {
          items = result.data.results;
        } else if (result.data.registrations) {
          items = result.data.registrations;
        } else if (Array.isArray(result.data)) {
          items = result.data;
        }
        
        const ppeRecords = items
          .filter(item => {
            const name = item.device_name || item.product_description || item.device_name || item.name || '';
            return isPPE(name);
          })
          .map(item => ({
            name: item.device_name || item.product_description || item.name || 'Unknown',
            model: item.product_code || item.k_number || '',
            category: categorize(item.device_name || item.product_description || ''),
            subcategory: '',
            description: item.statement_or_summary || item.openfda?.description || '',
            country_of_origin: source.name.includes('Canada') ? 'CA' : 
                              source.name.includes('TGA') ? 'AU' : 'US',
            updated_at: new Date().toISOString(),
          }));

        if (ppeRecords.length > 0) {
          const inserted = await insertBatch(ppeRecords);
          totalInserted += inserted;
          console.log(`  ✅ Inserted ${inserted} PPE records`);
        }
      } catch (e) {
        console.log(`  Parse error: ${e.message}`);
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return totalInserted;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  Third-Party Data Sources Collector');
  console.log('='.repeat(60) + '\n');

  let totalRecords = 0;
  const results = [];

  for (const source of DATA_SOURCES) {
    const count = await collectFromSource(source);
    results.push({ source: source.name, count });
    totalRecords += count;
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Collection Summary');
  console.log('='.repeat(60));
  for (const r of results) {
    console.log(`  ${r.source}: ${r.count} records`);
  }
  console.log(`\n  TOTAL: ${totalRecords} records`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
