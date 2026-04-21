#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS = ['glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 'goggle', 'ppe', 'medical', 'surgical', 'disposable', 'isolation', 'nitrile', 'latex', 'vinyl', 'n95', 'kn95', 'ffp2', 'ffp3', 'protective', 'examination'];

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

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function crawlEUDAMED() {
  console.log('\n=== EUDAMED Crawler ===\n');
  
  const urls = [
    'https://ec.europa.eu/tools/eudamed/public/devices-search',
    'https://ec.europa.eu/tools/eudamed/api/devices/search',
    'https://eurl.ec.europa.eu/public/devices-search',
  ];

  for (const url of urls) {
    console.log(`Trying: ${url}`);
    try {
      const result = await fetchUrl(url);
      console.log(`  Status: ${result.status}`);
      console.log(`  Content-Type: ${result.headers['content-type']}`);
      console.log(`  Location: ${result.headers['location'] || 'N/A'}`);
      console.log(`  Data preview: ${result.data.substring(0, 200)}`);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
    console.log('');
  }

  console.log('Testing alternative EUDAMED API endpoints...');
  
  const apiUrls = [
    'https://ec.europa.eu/tools/eudamed/api/v1/devices',
    'https://ec.europa.eu/tools/eudamed/api/v1/devices/search',
    'https://webgate.ec.europa.eu/eudamed/public/device-search',
    'https://webgate.ec.europa.eu/eudamed/api/v1/devices',
  ];

  for (const url of apiUrls) {
    console.log(`\nTrying API: ${url}`);
    try {
      const result = await fetchUrl(url);
      console.log(`  Status: ${result.status}`);
      if (result.status === 200 && result.data) {
        try {
          const json = JSON.parse(result.data);
          console.log(`  ✅ Valid JSON response`);
          console.log(`  Keys: ${Object.keys(json).slice(0, 5).join(', ')}`);
        } catch {
          console.log(`  HTML response`);
        }
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }

  console.log('\n\nNote: EUDAMED public API requires special access.');
  console.log('Consider using official data download or manual import.\n');
  
  process.exit(0);
}

crawlEUDAMED();
