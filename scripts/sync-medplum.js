#!/usr/bin/env node

const https = require('https');
const querystring = require('querystring');
const { createClient } = require('@supabase/supabase-js');

const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = '8e009a1e-d51f-44d2-b5a0-a852712255c3';
const MEDPLUM_CLIENT_SECRET = '205a1c68105113ad0ddaf921181d6a220fba3a80c6cc1ede06ca64f38d88f268';

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS = [
  'glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 
  'goggle', 'ppe', 'medical', 'surgical', 'disposable', 'isolation',
  'nitrile', 'latex', 'vinyl', 'n95', 'kn95', 'ffp2', 'ffp3',
  'protective', 'examination', 'hospital', 'device'
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
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eye')) return '眼面部防护装备';
  if (t.includes('shoe') || t.includes('boot')) return '足部防护装备';
  return '其他';
}

function fetchJson(url, accessToken) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { 
      timeout: 30000,
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }, (res) => {
      if (res.statusCode !== 200) { 
        reject(new Error(`HTTP ${res.statusCode}`)); 
        return; 
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { 
        try { resolve(JSON.parse(data)); } 
        catch (e) { reject(e); } 
      });
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = querystring.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    }, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(result)); }
        catch { resolve(result); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getAccessToken() {
  console.log('🔐 Getting Medplum access token...');
  const url = `${MEDPLUM_BASE_URL}/oauth2/token`;
  const body = {
    grant_type: 'client_credentials',
    client_id: MEDPLUM_CLIENT_ID,
    client_secret: MEDPLUM_CLIENT_SECRET
  };
  
  try {
    const tokenData = await postJson(url, body);
    console.log('✅ Got access token');
    return tokenData.access_token;
  } catch (e) {
    console.log('❌ Token error:', e.message);
    return null;
  }
}

async function getAllDevices(accessToken, maxTotal = 500) {
  const devices = [];
  let offset = 0;
  const batchSize = 100;
  
  while (devices.length < maxTotal) {
    const url = `${MEDPLUM_BASE_URL}/fhir/R4/Device?_offset=${offset}&_count=${batchSize}`;
    console.log(`Fetching devices ${offset} to ${offset + batchSize}...`);
    
    try {
      const data = await fetchJson(url, accessToken);
      
      if (!data.entry || data.entry.length === 0) {
        console.log('No more devices');
        break;
      }
      
      devices.push(...data.entry.map(e => e.resource));
      console.log(`  Got ${data.entry.length} devices (total: ${devices.length})`);
      
      offset += batchSize;
      await new Promise(r => setTimeout(r, 500));
      
    } catch (e) {
      console.log(`  Error: ${e.message}`);
      break;
    }
  }
  
  return devices;
}

async function syncMedplum() {
  console.log('\n=== Medplum Data Sync ===\n');
  
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.log('❌ Cannot proceed without access token');
    process.exit(1);
  }

  console.log('\n📥 Fetching all devices from Medplum...');
  const allDevices = await getAllDevices(accessToken, 500);
  console.log(`\n📊 Total devices fetched: ${allDevices.length}`);
  
  const ppeDevices = allDevices.filter(device => {
    const name = device.deviceName?.[0]?.name || device.identifier?.[0]?.value || '';
    return isPPE(name);
  });
  
  console.log(`🔍 PPE devices identified: ${ppeDevices.length}`);
  
  const ppeRecords = ppeDevices.map(device => ({
    name: device.deviceName?.[0]?.name || device.identifier?.[0]?.value || 'Unknown',
    model: device.identifier?.[0]?.value || '',
    category: categorize(device.deviceName?.[0]?.name || ''),
    subcategory: '',
    description: device.description || '',
    country_of_origin: device.country || 'Unknown',
    updated_at: new Date().toISOString(),
  }));

  console.log(`\n💾 Inserting ${ppeRecords.length} records to database...`);
  
  if (ppeRecords.length > 0) {
    const batchSize = 500;
    let totalInserted = 0;
    
    for (let i = 0; i < ppeRecords.length; i += batchSize) {
      const batch = ppeRecords.slice(i, i + batchSize);
      const { error } = await supabase.from('ppe_products').insert(batch);
      
      if (error) {
        console.log(`  Batch ${Math.floor(i/batchSize)+1} Error: ${error.message}`);
      } else {
        totalInserted += batch.length;
        console.log(`  ✅ Batch ${Math.floor(i/batchSize)+1}: ${batch.length} records`);
      }
      
      await new Promise(r => setTimeout(r, 300));
    }
    
    console.log(`\n✅ Medplum sync complete! Total inserted: ${totalInserted}`);
  } else {
    console.log('\n⚠️ No PPE devices found');
  }
  
  process.exit(0);
}

syncMedplum();
