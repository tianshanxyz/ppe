#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';
const BASE = 'https://api.fda.gov';

const PPE_PRODUCT_CODES = {
  'FXX': 'Surgical Mask',
  'FXS': 'Surgical Respirator',
  'MSH': 'Patient Examination Glove',
  'KZE': "Surgeon's Glove",
  'QKR': 'Examination Glove',
  'LYU': 'Surgical Gown',
  'OEA': 'Surgical Cap',
  'MSL': 'Respirator',
  'MSM': 'Respirator, Non-Powered',
  'JKA': 'Protective Garment',
  'JJC': 'Protective Garment, Surgical',
  'KIF': 'Surgical Mask, Respirator',
  'LIT': 'Face Shield',
  'LZG': 'Protective Goggles',
  'LXG': 'Protective Eyewear',
  'MFA': 'Medical Glove',
  'LZS': 'Surgical Gown, Level 4',
  'LZU': 'Surgical Gown, Level 2',
  'LZV': 'Surgical Gown, Level 1',
  'NHF': 'N95 Respirator',
  'NHL': 'N99 Respirator',
  'NHM': 'N100 Respirator',
  'NXF': 'Non-Powered Air-Purifying Respirator',
  'OEM': 'Surgical Mask, Anti-Fog',
  'LZJ': 'Isolation Gown',
  'KCC': 'Protective Clothing',
  'KCD': 'Protective Clothing, Surgical',
  'DSZ': 'Surgical Mask',
  'DYB': 'Protective Glove',
  'DYE': 'Examination Glove',
  'FXC': 'Surgical Respirator',
  'FXD': 'Surgical Respirator',
  'KZB': "Surgeon's Glove",
  'KZC': "Surgeon's Glove",
  'KZD': "Surgeon's Glove",
  'KZF': "Surgeon's Glove",
  'KZG': "Surgeon's Glove",
  'KZH': "Surgeon's Glove",
  'KZJ': "Surgeon's Glove",
  'KZL': "Surgeon's Glove",
  'KZM': "Surgeon's Glove",
  'KZN': "Surgeon's Glove",
  'KZP': "Surgeon's Glove",
  'KZR': "Surgeon's Glove",
  'KZT': "Surgeon's Glove",
  'KZU': "Surgeon's Glove",
  'KZV': "Surgeon's Glove",
  'KZW': "Surgeon's Glove",
  'KZX': "Surgeon's Glove",
  'KZY': "Surgeon's Glove",
  'MSK': 'Patient Examination Glove',
  'MSJ': 'Patient Examination Glove',
  'MSI': 'Patient Examination Glove',
  'MSL': 'Respirator',
  'MSM': 'Respirator, Non-Powered',
  'MSN': 'Respirator, Powered',
  'MSO': 'Respirator, Powered',
  'MSP': 'Respirator, Powered',
  'MSQ': 'Respirator, Air-Purifying',
  'MSR': 'Respirator, Atmosphere-Supplying',
  'LZA': 'Surgical Gown',
  'LZB': 'Surgical Gown',
  'LZC': 'Surgical Gown',
  'LZD': 'Surgical Gown',
  'LZE': 'Surgical Gown',
  'LZF': 'Surgical Gown',
  'LZG': 'Protective Goggles',
  'LZH': 'Protective Goggles',
  'LZI': 'Protective Goggles',
  'LZJ': 'Isolation Gown',
  'LZK': 'Isolation Gown',
  'LZL': 'Isolation Gown',
  'LZM': 'Isolation Gown',
  'LZN': 'Isolation Gown',
  'LZO': 'Isolation Gown',
  'LZP': 'Isolation Gown',
  'LZQ': 'Isolation Gown',
  'LZR': 'Isolation Gown',
  'LZS': 'Surgical Gown, Level 4',
  'LZT': 'Surgical Gown, Level 3',
  'LZU': 'Surgical Gown, Level 2',
  'LZV': 'Surgical Gown, Level 1',
  'LZW': 'Surgical Gown',
  'LZX': 'Surgical Gown',
  'LZY': 'Surgical Gown',
  'LZZ': 'Surgical Gown',
};

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95') || t.includes('n99') || t.includes('n100') || t.includes('air-purifying')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('protective clothing') || t.includes('protective garment')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eyewear')) return '眼面部防护装备';
  if (t.includes('cap')) return '头部防护装备';
  return '其他';
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
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

async function collect510kDeep(productCode, description) {
  const limit = 100;
  let skip = 0;
  let totalInserted = 0;
  const maxPages = 50;

  for (let page = 0; page < maxPages; page++) {
    const url = `${BASE}/device/510k.json?api_key=${API_KEY}&search=product_code:${productCode}&limit=${limit}&skip=${skip}`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) break;

      const records = data.results.map(item => ({
        name: item.device_name || description,
        model: (item.product_code || productCode) + '_' + (item.k_number || ''),
        category: categorize(description || item.device_name || ''),
        subcategory: description,
        description: `${item.statement_or_summary || ''} | Applicant: ${item.applicant || ''} | Date: ${item.decision_date || ''}`,
        country_of_origin: 'US',
        updated_at: new Date().toISOString(),
      }));

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      skip += limit;
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      if (e.message.includes('400') || e.message.includes('404')) break;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  return totalInserted;
}

async function collectRegistrationDeep(productCode, description) {
  const limit = 100;
  let skip = 0;
  let totalInserted = 0;
  const maxPages = 50;

  for (let page = 0; page < maxPages; page++) {
    const url = `${BASE}/device/registrationlisting.json?api_key=${API_KEY}&search=products.product_code:${productCode}&limit=${limit}&skip=${skip}`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) break;

      const records = data.results.map(item => {
        const products = item.products || [];
        const ppeProducts = products.filter(p => p.product_code === productCode);
        const productName = ppeProducts[0]?.product_name || description;
        
        return {
          name: productName,
          model: productCode,
          category: categorize(description || productName),
          subcategory: description,
          description: `Owner: ${item.owner_operator_name || ''}, Number: ${item.registration_number || ''}, Country: ${item.owner_operator_country || ''}`,
          country_of_origin: item.owner_operator_country || 'US',
          updated_at: new Date().toISOString(),
        };
      });

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      skip += limit;
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      if (e.message.includes('400') || e.message.includes('404')) break;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  return totalInserted;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  FDA Deep Collector - Extended Product Codes');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const command = args[0] || '510k';
  let grandTotal = 0;

  if (command === '510k') {
    console.log('\n🎯 Deep 510(k) Collection with Extended Codes...');
    for (const [code, desc] of Object.entries(PPE_PRODUCT_CODES)) {
      const count = await collect510kDeep(code, desc);
      if (count > 0) {
        console.log(`  ✅ ${code} (${desc}): ${count} records`);
        grandTotal += count;
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  if (command === 'registration') {
    console.log('\n🏭 Deep Registration Collection with Extended Codes...');
    for (const [code, desc] of Object.entries(PPE_PRODUCT_CODES)) {
      const count = await collectRegistrationDeep(code, desc);
      if (count > 0) {
        console.log(`  ✅ ${code} (${desc}): ${count} records`);
        grandTotal += count;
      }
      await new Promise(r => setTimeout(r, 300));
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
