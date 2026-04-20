#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

const envConfig = {};
fs.readFileSync(__dirname + '/../.env.local', 'utf-8')
  .split('\n')
  .forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) envConfig[match[1].trim()] = match[2].trim();
  });

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  envConfig.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const API_KEY = envConfig.FDA_API_KEY;
console.log('FDA API Key:', API_KEY ? 'configured' : 'MISSING');

const PPE_KEYWORDS = [
  'glove', 'gloves', 'mask', 'respirator', 'ffp2', 'ffp3', 'n95', 'kn95',
  'gown', 'coverall', 'protective clothing', 'face shield', 'goggle',
  'shoe cover', 'boot cover', 'cap', 'head cover', 'ppe', 'examination',
  'surgical', 'isolation', 'nitrile', 'latex', 'vinyl', 'medical', 'protective',
  'exam', 'disposable', 'isolation', 'sterile', 'non-sterile'
];

function isPPE(deviceName) {
  if (!deviceName) return false;
  const text = deviceName.toLowerCase();
  return PPE_KEYWORDS.some(k => text.includes(k));
}

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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { reject(new Error('JSON parse error')); }
      });
    });
    req.on('error', (e) => reject(new Error('Request error: ' + e.message)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function syncFDA() {
  console.log('\n=== FDA 510(k) Sync (Streaming Mode) ===\n');
  
  const baseUrl = 'https://api.fda.gov/device/510k.json';
  const limit = 500;
  const maxRecords = 10000;
  let totalInserted = 0;
  let skip = 0;
  let pageCount = 0;

  while (totalInserted < maxRecords) {
    const url = `${baseUrl}?api_key=${API_KEY}&limit=${limit}&skip=${skip}&sort=decision_date:desc`;
    
    try {
      const data = await fetchJson(url);
      
      if (!data.results || data.results.length === 0) {
        console.log('No more results');
        break;
      }

      const ppeRecords = data.results
        .filter(item => isPPE(item.device_name))
        .map(item => ({
          name: item.device_name || 'Unknown',
          model: (item.product_code || '') + '_' + (item.k_number || ''),
          category: categorize(item.device_name),
          subcategory: '',
          description: item.statement_or_summary || item.statement_summary || '',
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      if (ppeRecords.length > 0) {
        const { error } = await supabase.from('ppe_products').insert(ppeRecords);
        
        if (error) {
          console.log(`Page ${pageCount + 1}: Error - ${error.message}`);
        } else {
          totalInserted += ppeRecords.length;
          console.log(`Page ${pageCount + 1}: Fetched ${data.results.length}, PPE: ${ppeRecords.length}, Inserted: ${totalInserted}/${maxRecords}`);
        }
      } else {
        console.log(`Page ${pageCount + 1}: Fetched ${data.results.length}, PPE: 0`);
      }

      pageCount++;
      skip += limit;
      
      await new Promise(r => setTimeout(r, 500));
      
    } catch (e) {
      console.log(`Error: ${e.message}, retrying...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n✅ FDA sync complete! Total inserted: ${totalInserted}`);
  process.exit(0);
}

syncFDA();
