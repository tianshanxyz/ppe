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
console.log('FDA API Key configured:', !!API_KEY);

const PPE_KEYWORDS = [
  'glove', 'gloves', 'mask', 'respirator', 'ffp2', 'ffp3', 'n95', 'kn95',
  'gown', 'coverall', 'protective clothing', 'face shield', 'goggle',
  'shoe cover', 'boot cover', 'cap', 'head cover', 'ppe', 'examination',
  'surgical', 'isolation', 'nitrile', 'latex', 'vinyl', 'medical', 'protective'
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
    console.log('Fetching:', url.substring(0, 80) + '...');
    const req = https.get(url, { timeout: 30000 }, (res) => {
      console.log('  Response status:', res.statusCode);
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { 
          const parsed = JSON.parse(data); 
          console.log('  Got', parsed.results?.length || 0, 'records');
          resolve(parsed); 
        } 
        catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    });
    req.on('error', (e) => reject(new Error('Request error: ' + e.message)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function syncFDA() {
  console.log('\n=== FDA 510(k) Data Sync ===\n');
  
  const baseUrl = 'https://api.fda.gov/device/510k.json';
  const limit = 100;
  const maxRecords = 1000;
  let allResults = [];
  let skip = 0;

  try {
    while (allResults.length < maxRecords) {
      const url = `${baseUrl}?api_key=${API_KEY}&limit=${limit}&skip=${skip}&sort=decision_date:desc`;
      
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) {
        console.log('No more results');
        break;
      }

      const ppeRecords = data.results
        .filter(item => isPPE(item.device_name))
        .map(item => ({
          name: item.device_name || 'Unknown',
          model: item.product_code || item.k_number || '',
          category: categorize(item.device_name),
          subcategory: '',
          description: item.statement_or_summary || '',
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      console.log('  PPE filtered:', ppeRecords.length);
      allResults = [...allResults, ...ppeRecords];
      skip += limit;

      if (allResults.length >= maxRecords) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\nTotal PPE records: ${allResults.length}`);
    
    if (allResults.length > 0) {
      console.log('Inserting into database...');
      
      const batchSize = 100;
      for (let i = 0; i < allResults.length; i += batchSize) {
        const batch = allResults.slice(i, i + batchSize);
        
        const { error } = await supabase.from('ppe_products').insert(batch);
        
        if (error) {
          console.log('  Error:', error.message);
        } else {
          console.log(`  Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`);
        }
        
        await new Promise(r => setTimeout(r, 500));
      }
      
      console.log('\n✅ FDA sync complete!');
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

syncFDA();
