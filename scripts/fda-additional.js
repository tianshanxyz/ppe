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

function categorize(text) {
  if (!text) return '其他';
  const t = text.toLowerCase();
  if (t.includes('glove') || t.includes('nitrile') || t.includes('latex')) return '手部防护装备';
  if (t.includes('mask') || t.includes('respirator') || t.includes('n95') || t.includes('ventilat')) return '呼吸防护装备';
  if (t.includes('gown') || t.includes('coverall') || t.includes('protective clothing') || t.includes('garment') || t.includes('apron')) return '身体防护装备';
  if (t.includes('goggle') || t.includes('face shield') || t.includes('eyewear')) return '眼面部防护装备';
  if (t.includes('cap') || t.includes('hood')) return '头部防护装备';
  return '其他';
}

async function collectAdverseEvents() {
  console.log('\n=== FDA Adverse Events (MAUDE) ===\n');
  let total = 0;

  const keywords = [
    'mask', 'respirator', 'glove', 'gown', 'face shield',
    'protective', 'ppe', 'n95', 'surgical', 'isolation',
    'nitrile', 'latex', 'disposable', 'coverall', 'goggle'
  ];

  for (const keyword of keywords) {
    const limit = 100;
    let skip = 0;

    for (let page = 0; page < 10; page++) {
      const url = `https://api.fda.gov/device/event.json?api_key=${FDA_KEY}&search=device.generic_name:${encodeURIComponent(keyword)}&limit=${limit}&skip=${skip}`;
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const devices = item.device || [];
          const mfrName = item.manufacturer_name || item.source_name || '';
          const mfrCountry = (item.country || 'US').substring(0, 2);

          for (const dev of devices) {
            const devName = dev.generic_name || dev.brand_name || keyword;
            const record = {
              name: devName.substring(0, 200),
              model: dev.product_code ? `${dev.product_code}_AE_${skip}` : `AE-${keyword}-${skip}`,
              category: categorize(devName),
              subcategory: 'FDA Adverse Event',
              description: `Event: ${item.event_type || ''}, Date: ${item.date_of_event || ''}, Report: ${item.mdr_report_key || ''}, Patient: ${item.patient_problems ? item.patient_problems.join(', ') : ''}`,
              manufacturer_name: mfrName,
              country_of_origin: mfrCountry,
              product_code: dev.product_code || '',
              product_category: devName,
              risk_level: item.event_type || '',
              updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('ppe_products').insert(record);
            if (!error) total++;
          }
        }

        skip += limit;
        await sleep(400);
      } catch (e) {
        break;
      }
    }

    console.log(`  ${keyword}: done`);
  }

  console.log(`\n  Total: ${total} adverse event records`);
  return total;
}

async function collectPMA() {
  console.log('\n=== FDA PMA (PreMarket Approval) ===\n');
  let total = 0;

  const keywords = ['mask', 'respirator', 'glove', 'gown', 'protective', 'ppe'];

  for (const keyword of keywords) {
    const url = `https://api.fda.gov/device/pma.json?api_key=${FDA_KEY}&search=${encodeURIComponent(keyword)}&limit=100`;
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) {
        console.log(`  ${keyword}: no results`);
        continue;
      }

      for (const item of data.results) {
        const record = {
          name: (item.generic_name || item.trade_name || keyword).substring(0, 200),
          model: `PMA-${item.pma_number || ''}`,
          category: categorize(item.generic_name || ''),
          subcategory: 'FDA PMA',
          description: `PMA: ${item.pma_number || ''}, Applicant: ${item.applicant || ''}, Decision: ${item.decision_code || ''}, Date: ${item.decision_date || ''}`,
          manufacturer_name: item.applicant || '',
          country_of_origin: 'US',
          product_code: item.product_code || '',
          product_category: item.generic_name || '',
          risk_level: 'Class III',
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('ppe_products').insert(record);
        if (!error) total++;
      }

      console.log(`  ${keyword}: ${data.results.length} items`);
      await sleep(400);
    } catch (e) {
      console.log(`  ${keyword}: ${e.message}`);
    }
  }

  console.log(`\n  Total: ${total} PMA records`);
  return total;
}

async function collectUDI() {
  console.log('\n=== FDA UDI (Unique Device Identification) ===\n');
  let total = 0;

  const ppeCodes = ['FXX', 'FXS', 'MSH', 'KZE', 'QKR', 'LYU', 'OEA', 'MSL', 'LIT', 'LZG', 'LZJ', 'KCC', 'JKA', 'NHF', 'MFA'];

  for (const code of ppeCodes) {
    const url = `https://api.fda.gov/device/udi.json?api_key=${FDA_KEY}&search=product_codes:${code}&limit=100`;
    try {
      const data = await fetchJson(url);
      if (!data.results || data.results.length === 0) continue;

      for (const item of data.results) {
        const mfrName = item.company_name || '';
        const mfrCountry = (item.country || 'US').substring(0, 2);

        if (mfrName) {
          await supabase.from('ppe_manufacturers').insert({ name: mfrName, country: mfrCountry, website: '' }).catch(() => {});
        }

        const record = {
          name: (item.device_name || item.brand_name || `PPE ${code}`).substring(0, 200),
          model: item.device_id || `UDI-${code}`,
          category: categorize(item.device_name || ''),
          subcategory: 'FDA UDI',
          description: `Brand: ${item.brand_name || ''}, Company: ${mfrName}, Version: ${item.version_number || ''}, DI: ${item.device_id || ''}`,
          manufacturer_name: mfrName,
          country_of_origin: mfrCountry,
          product_code: code,
          product_category: item.device_name || '',
          risk_level: '',
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('ppe_products').insert(record);
        if (!error) total++;
      }

      console.log(`  ${code}: ${data.results.length} items`);
      await sleep(400);
    } catch (e) {
      console.log(`  ${code}: ${e.message}`);
    }
  }

  console.log(`\n  Total: ${total} UDI records`);
  return total;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  PPE FDA Additional Endpoints Collection');
  console.log('='.repeat(60));

  const command = process.argv[2] || 'all';

  if (command === 'all' || command === 'adverse') {
    await collectAdverseEvents();
  }

  if (command === 'all' || command === 'pma') {
    await collectPMA();
  }

  if (command === 'all' || command === 'udi') {
    await collectUDI();
  }

  const { count: p } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: m } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  console.log(`\n  Database: ${p} products, ${m} manufacturers`);
  console.log('='.repeat(60) + '\n');

  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
