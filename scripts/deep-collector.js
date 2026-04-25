#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const FDA_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject).on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function insertOne(table, record) {
  const { error } = await supabase.from(table).insert(record);
  return !error;
}

async function collectFDAClassification() {
  console.log('\n=== FDA Device Classification ===\n');
  let total = 0;

  const ppeCodes = ['FXX', 'FXS', 'MSH', 'KZE', 'QKR', 'LYU', 'OEA', 'MSL', 'MSM', 'JKA', 'JJC', 'KIF', 'LIT', 'LZG', 'LXG', 'MFA', 'LZS', 'LZU', 'LZV', 'NHF', 'NHL', 'NHM', 'NXF', 'OEM', 'LZJ', 'KCC', 'KCD'];

  for (const code of ppeCodes) {
    const url = `https://api.fda.gov/device/classification.json?api_key=${FDA_KEY}&search=product_code:${code}&limit=100`;
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      for (const item of data.results) {
        const mfrName = item.review_panel || '';
        const record = {
          name: item.device_name || `PPE Device ${code}`,
          model: item.product_code || code,
          category: categorize(item.device_name || ''),
          subcategory: `FDA Classification - ${item.review_panel || ''}`,
          description: `Class: ${item.device_class || ''}, Regulation: ${item.regulation_number || ''}, Medical Specialty: ${item.review_panel || ''}, Definition: ${item.definition || ''}`,
          manufacturer_name: '',
          country_of_origin: 'US',
          product_code: item.product_code || code,
          product_category: item.device_name || '',
          risk_level: item.device_class ? `Class ${item.device_class}` : '',
          updated_at: new Date().toISOString(),
        };

        const ok = await insertOne('ppe_products', record);
        if (ok) total++;
      }

      console.log(`  ${code}: ${data.results.length} items`);
      await sleep(400);
    } catch (e) {
      console.log(`  ${code}: ${e.message}`);
    }
  }

  console.log(`\n  Total: ${total} classification records`);
  return total;
}

async function collectFDAEnforcement() {
  console.log('\n=== FDA Enforcement Reports ===\n');
  let total = 0;

  const keywords = ['mask', 'respirator', 'glove', 'gown', 'face shield', 'protective', 'ppe', 'n95', 'surgical', 'isolation', 'nitrile'];

  for (const keyword of keywords) {
    const limit = 100;
    let skip = 0;

    for (let page = 0; page < 10; page++) {
      const url = `https://api.fda.gov/device/enforcement.json?api_key=${FDA_KEY}&search=product_description:${encodeURIComponent(keyword)}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const record = {
            name: (item.product_description || `PPE Enforcement ${keyword}`).substring(0, 200),
            model: `ENF-${item.recall_number || ''}`,
            category: '其他',
            subcategory: 'FDA Enforcement',
            description: `Recall: ${item.recall_number || ''}, Firm: ${item.recalling_firm || ''}, Reason: ${item.reason_for_recall || ''}, Classification: ${item.classification || ''}, Status: ${item.status || ''}`,
            manufacturer_name: item.recalling_firm || '',
            country_of_origin: 'US',
            product_code: '',
            product_category: keyword,
            risk_level: item.classification || '',
            updated_at: new Date().toISOString(),
          };

          const ok = await insertOne('ppe_products', record);
          if (ok) total++;
        }

        skip += limit;
        await sleep(400);
      } catch (e) {
        break;
      }
    }

    console.log(`  ${keyword}: done`);
  }

  console.log(`\n  Total: ${total} enforcement records`);
  return total;
}

async function collectFDACOVIDDevices() {
  console.log('\n=== FDA COVID-19 Related Devices ===\n');
  let total = 0;

  const url = `https://api.fda.gov/device/covid19serology.json?api_key=${FDA_KEY}&limit=100`;
  try {
    const data = await fetchJson(url);
    if (data.results) {
      for (const item of data.results) {
        const name = item.device_name || item.test_name || '';
        if (!isPPE(name)) continue;

        const record = {
          name: name.substring(0, 200),
          model: `COVID-${item.test_name || ''}`.substring(0, 100),
          category: categorize(name),
          subcategory: 'FDA COVID-19',
          description: `Sponsor: ${item.sponsor || ''}, Date: ${item.date || ''}`,
          manufacturer_name: item.sponsor || '',
          country_of_origin: 'US',
          product_code: '',
          product_category: name,
          risk_level: '',
          updated_at: new Date().toISOString(),
        };

        const ok = await insertOne('ppe_products', record);
        if (ok) total++;
      }
    }
  } catch (e) {
    console.log(`  COVID: ${e.message}`);
  }

  console.log(`  Total: ${total} COVID device records`);
  return total;
}

async function collectHealthCanadaDeep() {
  console.log('\n=== Health Canada Deep Collection ===\n');
  let totalProducts = 0;
  let totalMfrs = 0;

  const keywords = [
    'glove', 'mask', 'respirator', 'gown', 'face shield', 'goggle',
    'surgical', 'isolation', 'protective', 'nitrile', 'n95',
    'coverall', 'examination', 'disposable', 'ppe', 'cap', 'boot',
    'latex', 'vinyl', 'polyethylene', 'polypropylene', 'nonwoven',
    'surgical cap', 'shoe cover', 'bouffant', 'scrub', 'apron',
    'thermometer', 'sanitizer', 'disinfectant', 'ventilator'
  ];

  for (const keyword of keywords) {
    try {
      const url = `https://health-products.canada.ca/api/medical-devices/device/?device_name=${encodeURIComponent(keyword)}&state=active&type=json`;
      const data = await fetchJson(url);
      const items = Array.isArray(data) ? data : [];

      for (const item of items) {
        const mfrName = item.company_name || item.licence_name || '';
        if (mfrName) {
          const ok = await insertOne('ppe_manufacturers', { name: mfrName, country: 'CA', website: '' });
          if (ok) totalMfrs++;
        }

        const record = {
          name: item.device_name || item.trade_name || 'Unknown',
          model: item.device_identifier || '',
          category: categorizeHC(item.device_name || ''),
          subcategory: 'Health Canada MDALL',
          description: `Licence: ${item.original_licence_no || ''}, Class: ${item.appl_risk_class || ''}`,
          manufacturer_name: mfrName,
          country_of_origin: 'CA',
          product_code: item.device_identifier || '',
          product_category: item.device_name || '',
          risk_level: item.appl_risk_class ? `Class ${item.appl_risk_class}` : '',
          updated_at: new Date().toISOString(),
        };

        const ok = await insertOne('ppe_products', record);
        if (ok) totalProducts++;
      }

      if (items.length > 0) console.log(`  ${keyword}: ${items.length} items`);
      await sleep(300);
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }

  console.log(`\n  Total: ${totalProducts} products, ${totalMfrs} manufacturers`);
  return { products: totalProducts, manufacturers: totalMfrs };
}

function isPPE(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return t.includes('mask') || t.includes('respirator') || t.includes('glove') ||
    t.includes('gown') || t.includes('protective') || t.includes('ppe') ||
    t.includes('face shield') || t.includes('goggle') || t.includes('isolation') ||
    t.includes('surgical') || t.includes('coverall');
}

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('protective clothing') || t.includes('garment')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eyewear')) return '眼面部防护装备';
  if (t.includes('cap') || t.includes('hood')) return '头部防护装备';
  if (t.includes('boot') || t.includes('shoe')) return '足部防护装备';
  return '其他';
}

function categorizeHC(text) { return categorize(text); }

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE Deep Data Collection - Phase 2');
  console.log('='.repeat(60));

  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  if (command === 'all' || command === 'fda-class') {
    await collectFDAClassification();
  }

  if (command === 'all' || command === 'fda-enf') {
    await collectFDAEnforcement();
  }

  if (command === 'all' || command === 'fda-covid') {
    await collectFDACOVIDDevices();
  }

  if (command === 'all' || command === 'hc-deep') {
    await collectHealthCanadaDeep();
  }

  const { count: productCount } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: mfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  const { count: regCount } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(60));
  console.log(`  Database: ${productCount} products, ${mfrCount} manufacturers, ${regCount} regulations`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
