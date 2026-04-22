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
  'QKR': 'Non-Powdered Patient Examiner Glove',
  'LYU': 'Surgical Gown',
  'OEA': 'Surgical Cap',
  'OEC': 'Surgical Mask',
  'MSL': 'Respirator',
  'MSM': 'Respirator, Non-Powered',
  'JKA': 'Protective Garment',
  'JJC': 'Protective Garment, Surgical',
  'KIF': 'Surgical Mask, Respirator',
  'QKR': 'Examination Glove',
  'QUC': 'Examination Glove, Non-Powdered',
  'LIT': 'Face Shield',
  'LZG': 'Protective Goggles',
  'LXG': 'Protective Eyewear',
  'MFA': 'Medical Glove',
  'LZS': 'Surgical Gown, Level 4',
  'LZT': 'Surgical Gown, Level 3',
  'LZU': 'Surgical Gown, Level 2',
  'LZV': 'Surgical Gown, Level 1',
  'NHF': 'N95 Respirator',
  'NHL': 'N99 Respirator',
  'NHM': 'N100 Respirator',
  'NXF': 'Non-Powered Air-Purifying Respirator',
  'OEM': 'Surgical Mask, Anti-Fog',
  'OEN': 'Surgical Mask, Fluid Resistant',
  'LZJ': 'Isolation Gown',
  'KCC': 'Protective Clothing',
  'KCD': 'Protective Clothing, Surgical',
};

const PPE_KEYWORDS = [
  'glove', 'mask', 'respirator', 'gown', 'coverall', 'face shield',
  'goggle', 'ppe', 'surgical', 'disposable', 'isolation', 'nitrile',
  'latex', 'vinyl', 'n95', 'kn95', 'ffp2', 'ffp3', 'protective',
  'examination', 'medical', 'cap', 'boot', 'shoe', 'examination'
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
  if (t.includes('gown') || t.includes('coverall') || t.includes('protective clothing')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eyewear')) return '眼面部防护装备';
  if (t.includes('cap') || t.includes('head')) return '头部防护装备';
  if (t.includes('shoe') || t.includes('boot')) return '足部防护装备';
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

async function collect510kByProductCode(productCode, description) {
  const limit = 100;
  let skip = 0;
  let totalInserted = 0;
  const maxPages = 20;

  for (let page = 0; page < maxPages; page++) {
    const url = `${BASE}/device/510k.json?api_key=${API_KEY}&search=product_code:${productCode}&limit=${limit}&skip=${skip}`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) break;

      const records = data.results.map(item => ({
        name: item.device_name || description,
        model: (item.product_code || productCode) + '_' + (item.k_number || ''),
        category: categorize(item.device_name || description),
        subcategory: description,
        description: item.statement_or_summary || item.statement_summary || '',
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

async function collect510kByKeyword(keyword) {
  const limit = 100;
  let skip = 0;
  let totalInserted = 0;
  const maxPages = 30;

  for (let page = 0; page < maxPages; page++) {
    const url = `${BASE}/device/510k.json?api_key=${API_KEY}&search=device_name:${encodeURIComponent(keyword)}&limit=${limit}&skip=${skip}`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) break;

      const records = data.results
        .filter(item => isPPE(item.device_name))
        .map(item => ({
          name: item.device_name || 'Unknown',
          model: (item.product_code || '') + '_' + (item.k_number || ''),
          category: categorize(item.device_name || ''),
          subcategory: '',
          description: item.statement_or_summary || item.statement_summary || '',
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

async function collectClassification() {
  console.log('\n📋 FDA Device Classification...');
  let totalInserted = 0;

  for (const [code, desc] of Object.entries(PPE_PRODUCT_CODES)) {
    const url = `${BASE}/device/classification.json?api_key=${API_KEY}&search=product_code:${code}&limit=100`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      const records = data.results.map(item => ({
        name: item.device_name || desc,
        model: item.product_code || code,
        category: categorize(item.device_name || desc),
        subcategory: desc,
        description: item.device_class ? `Class ${item.device_class} - ${item.definition || ''}` : (item.definition || ''),
        country_of_origin: 'US',
        updated_at: new Date().toISOString(),
      }));

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      console.log(`  ${code} (${desc}): ${inserted} records`);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`  ${code}: ${e.message}`);
    }
  }
  
  return totalInserted;
}

async function collectRecalls() {
  console.log('\n⚠️ FDA Device Recalls...');
  let totalInserted = 0;
  const keywords = ['mask', 'glove', 'gown', 'respirator', 'ppe', 'protective', 'face shield', 'surgical'];

  for (const keyword of keywords) {
    const url = `${BASE}/device/recall.json?api_key=${API_KEY}&search=product_description:${encodeURIComponent(keyword)}&limit=100`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      const records = data.results
        .filter(item => isPPE(item.product_description || ''))
        .map(item => ({
          name: item.product_description || 'Unknown',
          model: item.product_code || item.recall_number || '',
          category: categorize(item.product_description || ''),
          subcategory: 'Recall',
          description: item.reason_for_recall || item.classification || '',
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      console.log(`  ${keyword}: ${inserted} records`);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }
  
  return totalInserted;
}

async function collectAdverseEvents() {
  console.log('\n🏥 FDA Adverse Events...');
  let totalInserted = 0;
  const keywords = ['mask', 'glove', 'gown', 'respirator'];

  for (const keyword of keywords) {
    const url = `${BASE}/device/event.json?api_key=${API_KEY}&search=device.generic_name:${encodeURIComponent(keyword)}&limit=100`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      const records = data.results
        .filter(item => {
          const name = item.device?.[0]?.generic_name || item.device?.[0]?.brand_name || '';
          return isPPE(name);
        })
        .map(item => ({
          name: item.device?.[0]?.generic_name || item.device?.[0]?.brand_name || 'Unknown',
          model: item.device?.[0]?.product_code || '',
          category: categorize(item.device?.[0]?.generic_name || ''),
          subcategory: 'Adverse Event',
          description: item.event_type || item.report_source_code || '',
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      console.log(`  ${keyword}: ${inserted} records`);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }
  
  return totalInserted;
}

async function collectPMA() {
  console.log('\n🔬 FDA Pre-Market Approval (PMA)...');
  let totalInserted = 0;
  const keywords = ['mask', 'respirator', 'glove', 'protective'];

  for (const keyword of keywords) {
    const url = `${BASE}/device/pma.json?api_key=${API_KEY}&search=generic_name:${encodeURIComponent(keyword)}&limit=100`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      const records = data.results
        .filter(item => isPPE(item.generic_name || item.trade_name || ''))
        .map(item => ({
          name: item.generic_name || item.trade_name || 'Unknown',
          model: item.product_code || item.pma_number || '',
          category: categorize(item.generic_name || item.trade_name || ''),
          subcategory: 'PMA',
          description: item.supplement_number ? `Supplement ${item.supplement_number}` : '',
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      console.log(`  ${keyword}: ${inserted} records`);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }
  
  return totalInserted;
}

async function collectRegistration() {
  console.log('\n🏭 FDA Device Registration & Listing...');
  let totalInserted = 0;

  for (const [code, desc] of Object.entries(PPE_PRODUCT_CODES)) {
    const url = `${BASE}/device/registrationlisting.json?api_key=${API_KEY}&search=products.product_code:${code}&limit=100`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      const records = data.results.map(item => {
        const products = item.products || [];
        const ppeProducts = products.filter(p => p.product_code === code);
        const productName = ppeProducts[0]?.product_name || desc;
        
        return {
          name: productName,
          model: code,
          category: categorize(productName),
          subcategory: desc,
          description: `Owner: ${item.owner_operator_name || 'Unknown'}, Number: ${item.registration_number || ''}`,
          country_of_origin: item.owner_operator_country || 'US',
          updated_at: new Date().toISOString(),
        };
      });

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      console.log(`  ${code} (${desc}): ${inserted} records`);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`  ${code}: ${e.message}`);
    }
  }
  
  return totalInserted;
}

async function collectEnforcement() {
  console.log('\n🚨 FDA Enforcement Reports...');
  let totalInserted = 0;
  const keywords = ['mask', 'glove', 'gown', 'respirator', 'ppe', 'protective'];

  for (const keyword of keywords) {
    const url = `${BASE}/device/enforcement.json?api_key=${API_KEY}&search=product_description:${encodeURIComponent(keyword)}&limit=100`;
    
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      const records = data.results
        .filter(item => isPPE(item.product_description || ''))
        .map(item => ({
          name: item.product_description || 'Unknown',
          model: item.product_code || '',
          category: categorize(item.product_description || ''),
          subcategory: 'Enforcement',
          description: item.reason_for_recall || item.classification || '',
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      console.log(`  ${keyword}: ${inserted} records`);
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }
  
  return totalInserted;
}

async function collectCOVID19() {
  console.log('\n🦠 FDA COVID-19 Related Devices...');
  let totalInserted = 0;
  
  const url = `${BASE}/device/covid19serology.json?api_key=${API_KEY}&limit=100`;
  
  try {
    const data = await fetchJson(url);
    if (data.results && data.results.length > 0) {
      const records = data.results
        .filter(item => isPPE(item.device_name || item.manufacturer || ''))
        .map(item => ({
          name: item.device_name || 'Unknown',
          model: item.product_code || '',
          category: categorize(item.device_name || ''),
          subcategory: 'COVID-19',
          description: item.manufacturer || '',
          country_of_origin: 'US',
          updated_at: new Date().toISOString(),
        }));

      const inserted = await insertBatch(records);
      totalInserted += inserted;
      console.log(`  COVID-19: ${inserted} records`);
    }
  } catch (e) {
    console.log(`  COVID-19: ${e.message}`);
  }
  
  return totalInserted;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  FDA Comprehensive Multi-Endpoint Collector');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  let grandTotal = 0;
  const results = [];

  if (command === 'all' || command === '510k-codes') {
    console.log('\n🎯 FDA 510(k) by Product Code...');
    let total = 0;
    for (const [code, desc] of Object.entries(PPE_PRODUCT_CODES)) {
      const count = await collect510kByProductCode(code, desc);
      total += count;
      if (count > 0) console.log(`  ✅ ${code} (${desc}): ${count} records`);
      await new Promise(r => setTimeout(r, 300));
    }
    results.push({ source: '510k-ProductCode', count: total });
    grandTotal += total;
  }

  if (command === 'all' || command === '510k-keywords') {
    console.log('\n🔍 FDA 510(k) by Keyword...');
    let total = 0;
    for (const keyword of ['mask', 'glove', 'gown', 'respirator', 'face shield', 'protective', 'surgical', 'isolation', 'n95', 'nitrile', 'disposable']) {
      const count = await collect510kByKeyword(keyword);
      total += count;
      if (count > 0) console.log(`  ✅ ${keyword}: ${count} records`);
      await new Promise(r => setTimeout(r, 300));
    }
    results.push({ source: '510k-Keyword', count: total });
    grandTotal += total;
  }

  if (command === 'all' || command === 'classification') {
    const count = await collectClassification();
    results.push({ source: 'Classification', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'recalls') {
    const count = await collectRecalls();
    results.push({ source: 'Recalls', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'events') {
    const count = await collectAdverseEvents();
    results.push({ source: 'AdverseEvents', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'pma') {
    const count = await collectPMA();
    results.push({ source: 'PMA', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'registration') {
    const count = await collectRegistration();
    results.push({ source: 'Registration', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'enforcement') {
    const count = await collectEnforcement();
    results.push({ source: 'Enforcement', count });
    grandTotal += count;
  }

  if (command === 'all' || command === 'covid19') {
    const count = await collectCOVID19();
    results.push({ source: 'COVID19', count });
    grandTotal += count;
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Collection Summary');
  console.log('='.repeat(60));
  for (const r of results) {
    console.log(`  ${r.source}: ${r.count} records`);
  }
  console.log(`\n  GRAND TOTAL: ${grandTotal} records`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
