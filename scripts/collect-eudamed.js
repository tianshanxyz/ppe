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
  'vinyl', 'n95', 'kn95', 'ffp2', 'ffp3', 'protective', 'examination', 'surgical'
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
  if (t.includes('shoe') || t.includes('boot')) return '足部防护装备';
  return '其他';
}

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers
      }
    }, (res) => {
      if (options.followRedirect !== false && (res.statusCode === 301 || res.statusCode === 302)) {
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

async function collectEUDAMED() {
  console.log('\n=== EUDAMED Data Collector ===\n');

  const endpoints = [
    'https://ec.europa.eu/tools/eudamed/api/devices/search?page=0&size=100',
    'https://ec.europa.eu/tools/eudamed/api/v1/devices',
    'https://webgate.ec.europa.eu/eudamed/api/v1/devices',
    'https://ec.europa.eu/tools/eudamed/public/devices-search',
    'https://ec.europa.eu/tools/eudamed/api/devices/registration',
  ];

  let availableEndpoint = null;

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    try {
      const result = await httpGet(endpoint, { followRedirect: false });
      console.log(`  Status: ${result.status}`);
      if (result.status === 200 && result.data) {
        try {
          JSON.parse(result.data);
          availableEndpoint = endpoint;
          console.log(`  ✅ Valid JSON endpoint found!`);
          break;
        } catch {}
      }
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
  }

  if (!availableEndpoint) {
    console.log('\n⚠️  No public EUDAMED API endpoint available.');
    console.log('EUDAMED requires EUDAMED registration account.');
    console.log('Consider using official CSV data exports instead.');
    return 0;
  }

  console.log('\n📥 Fetching from EUDAMED...');
  let totalInserted = 0;

  try {
    const result = await httpGet(availableEndpoint);
    const data = JSON.parse(result.data);

    if (data.results || data.entry || Array.isArray(data)) {
      const items = data.results || data.entry?.map(e => e.resource) || data;
      
      const ppeRecords = items
        .filter(item => {
          const name = item.deviceName || item.name || item.device_name || '';
          return isPPE(name);
        })
        .map(item => ({
          name: item.deviceName || item.name || item.device_name || 'Unknown',
          model: item.productCode || item.model || item.product_code || '',
          category: categorize(item.deviceName || item.name || ''),
          subcategory: '',
          description: item.description || item.statement || '',
          country_of_origin: item.country || 'EU',
          updated_at: new Date().toISOString(),
        }));

      console.log(`Found ${ppeRecords.length} PPE records`);
      
      if (ppeRecords.length > 0) {
        const inserted = await insertBatch(ppeRecords);
        totalInserted += inserted;
        console.log(`✅ Inserted ${inserted} records`);
      }
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  console.log(`\n📊 EUDAMED Collection: ${totalInserted} records`);
  return totalInserted;
}

collectEUDAMED().then(count => {
  console.log(`\n✅ Done: ${count} records collected`);
  process.exit(0);
}).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
