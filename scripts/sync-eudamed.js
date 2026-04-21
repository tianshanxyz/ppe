#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS = ['glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 'goggle', 'ppe', 'examination', 'surgical', 'nitrile', 'latex', 'vinyl', 'medical', 'protective', 'disposable', 'isolation', 'ffp2', 'ffp3', 'n95', 'kn95'];

function isPPE(name) {
  if (!name) return false;
  const t = name.toLowerCase();
  return PPE_KEYWORDS.some(k => t.includes(k));
}

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('ffp')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eye')) return '眼面部防护装备';
  return '其他';
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          resolve({ redirect: redirectUrl });
          return;
        }
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function syncEUDAMED() {
  console.log('\n=== EUDAMED Data Sync ===\n');
  
  const urls = [
    'https://ec.europa.eu/tools/eudamed/api/devices/search?page=0&size=100',
    'https://ec.europa.eu/tools/eudamed/api/devices/registration?page=0&size=100',
    'https://eurl.ec.europa.eu/eudamed/public/device-search'
  ];

  let totalInserted = 0;

  for (const baseUrl of urls) {
    console.log(`Trying: ${baseUrl}`);
    try {
      const data = await fetchJson(baseUrl);
      console.log('Response type:', typeof data);
      if (data.redirect) {
        console.log('Redirect to:', data.redirect);
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  console.log('\nNote: EUDAMED API requires authentication or special access.');
  console.log('Alternative: Use web scraping or manual data import.\n');
  
  console.log('Trying alternative public endpoints...');
  
  try {
    const altUrl = 'https://data.europa.eu/api/hubods/search?type=medical-device';
    console.log(`Fetching from: ${altUrl}`);
    const data = await fetchJson(altUrl);
    console.log('Data received');
  } catch(e) {
    console.log('Alternative also failed:', e.message);
  }

  console.log('\n✅ EUDAMED: Manual data import required');
  process.exit(0);
}

syncEUDAMED();
