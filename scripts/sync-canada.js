#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const PPE_KEYWORDS = ['glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield', 'goggle', 'ppe', 'examination', 'surgical', 'nitrile', 'latex', 'vinyl', 'medical', 'protective', 'disposable', 'isolation'];

function isPPE(name) {
  if (!name) return false;
  const t = name.toLowerCase();
  return PPE_KEYWORDS.some(k => t.includes(k));
}

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield')) return '眼面部防护装备';
  return '其他';
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function syncCanada() {
  console.log('\n=== Health Canada Data Sync ===\n');
  
  const baseUrl = 'https://health-products.canada.ca/api/device/alleract/?';
  let totalInserted = 0;
  let page = 1;

  try {
    while (totalInserted < 5000) {
      const url = `${baseUrl}page=${page}&size=500`;
      console.log(`Fetching page ${page}...`);
      
      try {
        const data = await fetchJson(url);
        
        if (!data || !data.content || data.content.length === 0) {
          console.log('No more data');
          break;
        }

        const ppeRecords = data.content
          .filter(item => isPPE(item.device_name) || isPPE(item.licence_number))
          .map(item => ({
            name: item.device_name || 'Unknown',
            model: item.licence_number || '',
            category: categorize(item.device_name),
            subcategory: '',
            description: `${item.manufacturer_name || ''} - ${item.licence_name || ''}`.trim(),
            country_of_origin: 'Canada',
            updated_at: new Date().toISOString(),
          }));

        if (ppeRecords.length > 0) {
          const { error } = await supabase.from('ppe_products').insert(ppeRecords);
          if (error) {
            console.log(`Error: ${error.message}`);
          } else {
            totalInserted += ppeRecords.length;
            console.log(`Page ${page}: Got ${data.content.length}, PPE: ${ppeRecords.length}, Total: ${totalInserted}`);
          }
        } else {
          console.log(`Page ${page}: Got ${data.content.length}, PPE: 0`);
        }

        page++;
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (e) {
        console.log(`Error: ${e.message}`);
        break;
      }
    }
    
    console.log(`\n✅ Health Canada sync complete! Total: ${totalInserted}`);
  } catch (e) {
    console.error('Fatal error:', e.message);
  }
  
  process.exit(0);
}

syncCanada();
